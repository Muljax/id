package ssh

import (
	"bufio"
	"errors"
	"fmt"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/muljax/cli/pkg/auth"
	"github.com/muljax/cli/pkg/client"
	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func newSetupCmd(getCfg ConfigGetter) *cobra.Command {
	var hosts string

	cmd := &cobra.Command{
		Use:   "setup",
		Short: "Initial setup: generate local key, authenticate, issue certificate, and configure OpenSSH",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()

			ui.Header("Muljax SSH Setup")

			reader := bufio.NewReader(os.Stdin)

			// 1. Resolve target endpoint
			if !cmd.Root().PersistentFlags().Changed("endpoint") && ui.IsTerminal(os.Stdin) {
				defaultEp := cfg.Endpoint
				if defaultEp == "" {
					defaultEp = config.DefaultEndpoint
				}
				fmt.Printf("\n%s Specify target Muljax ID API endpoint.\n", ui.InfoIcon())
				fmt.Printf("  Target endpoint [%s]: ", ui.Cyan(defaultEp))
				input, _ := reader.ReadString('\n')
				input = strings.TrimSpace(input)
				if input != "" {
					if !strings.HasPrefix(input, "http://") && !strings.HasPrefix(input, "https://") {
						if strings.HasPrefix(input, "localhost") || strings.HasPrefix(input, "127.0.0.1") {
							input = "http://" + input
						} else {
							input = "https://" + input
						}
					}
					cfg.Endpoint = strings.TrimRight(input, "/")
					_ = cfg.Save()
				}
			}

			// 2. Resolve host pattern
			hostPattern := strings.TrimSpace(hosts)
			if hostPattern == "" {
				if cfg.HostPattern != "" {
					hostPattern = cfg.HostPattern
				} else if ui.IsTerminal(os.Stdin) {
					// Derive a suggestion from endpoint if possible
					suggestedHost := config.DefaultHostPattern
					if u, err := url.Parse(cfg.Endpoint); err == nil && u.Hostname() != "" {
						h := u.Hostname()
						if h != "localhost" && h != "127.0.0.1" {
							parts := strings.Split(h, ".")
							if len(parts) >= 2 {
								domain := strings.Join(parts[len(parts)-2:], ".")
								suggestedHost = fmt.Sprintf("*.%s,*.internal", domain)
							}
						}
					}

					fmt.Printf("\n%s Specify target host pattern for OpenSSH Match scoping.\n", ui.InfoIcon())
					fmt.Printf("  (e.g., %s to match internal servers without affecting github.com or personal hosts)\n", ui.Cyan("*.internal,*.corp.example.com"))
					fmt.Printf("  Host pattern [%s]: ", ui.Dim(suggestedHost))

					input, _ := reader.ReadString('\n')
					input = strings.TrimSpace(input)
					if input != "" {
						hostPattern = input
					} else {
						hostPattern = suggestedHost
					}
				} else {
					hostPattern = config.DefaultHostPattern
				}
			}
			cfg.HostPattern = hostPattern
			_ = cfg.Save()

			fmt.Println()
			ui.KeyValue("Target Endpoint", ui.Cyan(cfg.Endpoint))
			ui.KeyValue("Host Scoping", ui.Cyan(hostPattern))
			fmt.Println()

			// 1. Ensure local key pair
			privPath, pubPath, certPath, err := sshutil.GetDefaultPaths(cfg.KeyName)
			if err != nil {
				return err
			}

			pubKey, err := sshutil.EnsureKeyPair(privPath, pubPath)
			if err != nil {
				return fmt.Errorf("failed to configure local SSH key: %w", err)
			}
			ui.Step(fmt.Sprintf("Local SSH key verified: %s", ui.Dim(privPath)))

			// 2. Authenticate if not already logged in
			apiClient := client.New(cfg)
			_, err = apiClient.GetValidAccessToken()
			if err != nil {
				ui.StepInfo("No active session found. Launching browser authentication...")
				if _, err := auth.Login(cfg); err != nil {
					var oauthErr *auth.OAuthError
					if errors.As(err, &oauthErr) {
						ui.StepError(fmt.Sprintf("Authentication failed: %s", oauthErr.FriendlyMessage()))
						return oauthErr
					}
					return fmt.Errorf("authentication failed: %w", err)
				}
				ui.Step("Authentication successful")
			} else {
				ui.Step("Active Muljax session verified")
			}

			// 3. Ensure public key is registered with account
			ui.StepInfo("Registering SSH public key with account...")
			savedKeyID, err := apiClient.EnsureSavedKey("", pubKey)
			if err != nil {
				ui.StepWarn(fmt.Sprintf("Could not register saved key (%v), proceeding with ad-hoc key", err))
			} else {
				ui.Step(fmt.Sprintf("Public key registered with account (ID: %s)", ui.Cyan(savedKeyID)))
			}

			// 4. Issue certificate
			ui.StepInfo("Requesting signed SSH certificate from CA...")
			issued, err := apiClient.IssueCertificate(savedKeyID, pubKey, 28800, nil)
			if err != nil {
				return fmt.Errorf("failed to issue certificate: %w", err)
			}

			if err := saveCertWithMeta(certPath, issued, cfg.Endpoint, savedKeyID); err != nil {
				return fmt.Errorf("failed to save certificate: %w", err)
			}

			ui.Step(fmt.Sprintf("Certificate saved: %s", ui.Dim(certPath)))
			fmt.Printf("    %-14s %s\n", ui.Dim("Key ID:"), ui.Bold(issued.KeyID))
			fmt.Printf("    %-14s %s\n", ui.Dim("Serial:"), ui.Cyan(issued.Serial))
			fmt.Printf("    %-14s %s\n", ui.Dim("Principals:"), strings.Join(issued.Principals, ", "))
			fmt.Printf("    %-14s %s %s %s\n", ui.Dim("Validity:"),
				time.Unix(issued.ValidAfter, 0).Format("02 Jan 15:04"),
				ui.ArrowIcon(),
				time.Unix(issued.ValidBefore, 0).Format("02 Jan 15:04 MST"))

			// 5. Configure ~/.ssh/config
			if err := sshutil.ConfigureSSH(privPath, hostPattern); err != nil {
				return fmt.Errorf("failed to configure ~/.ssh/config: %w", err)
			}
			ui.Step(fmt.Sprintf("Configured ~/.ssh/config with transparent renewal hook (scoped to %s)", ui.Cyan(hostPattern)))

			fmt.Printf("\n%s Setup complete! You can now use standard OpenSSH directly:\n", ui.Green("✓"))
			fmt.Printf("  %s\n\n", ui.Cyan("ssh user@your-server"))
			return nil
		},
	}

	cmd.Flags().StringVar(&hosts, "hosts", "", "host pattern for OpenSSH Match scoping (e.g. '*.corp.com,*.internal')")
	return cmd
}
