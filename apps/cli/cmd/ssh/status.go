package ssh

import (
	"fmt"

	"github.com/muljax/cli/pkg/client"
	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func newStatusCmd(getCfg ConfigGetter) *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Display detailed status of local SSH identity and certificate",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()
			privPath, pubPath, certPath, err := sshutil.GetDefaultPaths(cfg.KeyName)
			if err != nil {
				return err
			}
			resolveEndpoint(cfg, certPath)

			ui.Header("Muljax SSH Status")
			ui.KeyValue("Endpoint", ui.Cyan(cfg.Endpoint))
			hostPattern := sshutil.GetConfiguredHostPattern()
			if hostPattern == "" && cfg.HostPattern != "" {
				hostPattern = cfg.HostPattern
			}
			if hostPattern != "" {
				ui.KeyValue("Host Scoping", ui.Cyan(hostPattern))
			}
			ui.KeyValue("Private Key", ui.Dim(privPath))
			ui.KeyValue("Public Key", ui.Dim(pubPath))
			ui.KeyValue("Certificate", ui.Dim(certPath))
			fmt.Println()

			cert, err := sshutil.ReadCertificate(certPath)
			if err != nil {
				ui.StepWarn("Certificate Missing or Invalid")
				fmt.Println("  Run 'muljax ssh setup' or 'muljax ssh login' to obtain a certificate.")
				return nil
			}

			meta, _ := sshutil.LoadCertMetadata(certPath)

			// Query CA revocation list
			apiClient := client.New(cfg)
			serialStr := fmt.Sprintf("%d", cert.Serial)
			isRevoked, revLine, revErr := apiClient.CheckRevocation(serialStr)

			if revErr == nil {
				_ = sshutil.UpdateCertRevocationStatus(certPath, isRevoked, revLine)
			} else if meta != nil && meta.IsRevoked {
				isRevoked = true
				revLine = meta.RevocationLine
			}

			printCertDetails(cert, isRevoked)

			if revErr != nil {
				ui.KeyValue("Revocation", fmt.Sprintf("%s (could not check: %v)", ui.BadgeWarning("UNKNOWN"), revErr))
			} else if isRevoked {
				lineInfo := ""
				if revLine > 0 {
					lineInfo = fmt.Sprintf("line %d of ", revLine)
				}
				ui.KeyValue("Revocation", fmt.Sprintf("Listed on %sCA revoked-keys list at %s", lineInfo, ui.Cyan(cfg.Endpoint)))
			} else {
				ui.KeyValue("Revocation", fmt.Sprintf("Not listed in CA revoked-keys list at %s", ui.Dim(cfg.Endpoint)))
			}

			return nil
		},
	}
}
