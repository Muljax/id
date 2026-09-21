package ssh

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/muljax/cli/pkg/auth"
	"github.com/muljax/cli/pkg/client"
	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func newLoginCmd(getCfg ConfigGetter) *cobra.Command {
	return &cobra.Command{
		Use:   "login",
		Short: "Authenticate to Muljax and refresh the local SSH certificate",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()

			if _, err := auth.Login(cfg); err != nil {
				var oauthErr *auth.OAuthError
				if errors.As(err, &oauthErr) {
					ui.StepError(fmt.Sprintf("Authentication failed: %s", oauthErr.FriendlyMessage()))
					return oauthErr
				}
				return err
			}
			ui.Step(fmt.Sprintf("Successfully authenticated with %s", ui.Cyan(cfg.Endpoint)))

			// Issue certificate
			privPath, pubPath, certPath, err := sshutil.GetDefaultPaths(cfg.KeyName)
			if err != nil {
				return err
			}

			pubKey, err := sshutil.EnsureKeyPair(privPath, pubPath)
			if err != nil {
				return err
			}

			apiClient := client.New(cfg)
			savedKeyID, err := apiClient.EnsureSavedKey("", pubKey)
			if err != nil {
				ui.StepWarn(fmt.Sprintf("Could not register saved key (%v), proceeding with ad-hoc key", err))
			}

			issued, err := apiClient.IssueCertificate(savedKeyID, pubKey, 28800, nil)
			if err != nil {
				return fmt.Errorf("failed to issue certificate: %w", err)
			}

			if err := saveCertWithMeta(certPath, issued, cfg.Endpoint, savedKeyID); err != nil {
				return err
			}

			validUntil := time.Unix(issued.ValidBefore, 0).Format("02 Jan 15:04 MST")
			ui.Step(fmt.Sprintf("SSH certificate refreshed %s (valid until %s)",
				ui.BadgeSuccess("VALID"),
				ui.Bold(validUntil),
			))
			return nil
		},
	}
}

func newCertCmd(getCfg ConfigGetter) *cobra.Command {
	var renew bool
	var ttlHours int

	cmd := &cobra.Command{
		Use:   "cert",
		Short: "Manage or inspect the local SSH certificate",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()
			privPath, pubPath, certPath, err := sshutil.GetDefaultPaths(cfg.KeyName)
			if err != nil {
				return err
			}
			resolveEndpoint(cfg, certPath)

			if renew {
				pubKey, err := sshutil.EnsureKeyPair(privPath, pubPath)
				if err != nil {
					return err
				}

				apiClient := client.New(cfg)
				meta, _ := sshutil.LoadCertMetadata(certPath)
				var savedKeyID string
				if meta != nil && meta.SavedKeyID != "" {
					savedKeyID = meta.SavedKeyID
				} else {
					savedKeyID, _ = apiClient.EnsureSavedKey("", pubKey)
				}

				issued, err := apiClient.IssueCertificate(savedKeyID, pubKey, ttlHours*3600, nil)
				if err != nil {
					return err
				}

				if err := saveCertWithMeta(certPath, issued, cfg.Endpoint, savedKeyID); err != nil {
					return err
				}

				ui.Step(fmt.Sprintf("Certificate renewed: %s", ui.Dim(certPath)))
				ui.KeyValue("Key ID", ui.Bold(issued.KeyID))
				ui.KeyValue("Serial", ui.Cyan(issued.Serial))
				ui.KeyValue("Principals", strings.Join(issued.Principals, ", "))
				ui.KeyValue("Valid Until", ui.Bold(time.Unix(issued.ValidBefore, 0).Format("02 Jan 15:04 MST")))
				return nil
			}

			// View existing certificate
			cert, err := sshutil.ReadCertificate(certPath)
			if err != nil {
				return fmt.Errorf("no valid certificate found at %s (use --renew to obtain one): %w", certPath, err)
			}

			meta, _ := sshutil.LoadCertMetadata(certPath)
			isRevoked := meta != nil && meta.IsRevoked
			ui.Header("Muljax SSH Certificate")
			printCertDetails(cert, isRevoked)
			return nil
		},
	}

	cmd.Flags().BoolVarP(&renew, "renew", "r", false, "force immediate issuance/renewal of certificate")
	cmd.Flags().IntVar(&ttlHours, "ttl", 8, "requested validity duration in hours")
	return cmd
}
