package ssh

import (
	"errors"
	"fmt"
	"time"

	"github.com/muljax/cli/pkg/auth"
	"github.com/muljax/cli/pkg/client"
	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func newEnsureCertCmd(getCfg ConfigGetter) *cobra.Command {
	var quiet bool
	var forceCheck bool

	cmd := &cobra.Command{
		Use:   "ensure-cert",
		Short: "Pre-flight validity check and transparent auto-renewal hook for OpenSSH Match exec",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()
			privPath, pubPath, certPath, err := sshutil.GetDefaultPaths(cfg.KeyName)
			if err != nil {
				if !quiet {
					ui.StepError(fmt.Sprintf("Path error: %v", err))
				}
				return nil
			}
			resolveEndpoint(cfg, certPath)

			var regenReason string
			var currentSerial string

			cert, err := sshutil.ReadCertificate(certPath)
			if err != nil {
				regenReason = "certificate is missing or corrupted"
			} else {
				currentSerial = fmt.Sprintf("%d", cert.Serial)
				now := time.Now()
				validBefore := time.Unix(int64(cert.ValidBefore), 0)

				if now.After(validBefore) {
					regenReason = fmt.Sprintf("certificate expired %s ago", time.Since(validBefore).Round(time.Second))
				} else if now.Add(30 * time.Minute).After(validBefore) {
					regenReason = fmt.Sprintf("certificate expiring soon (%s remaining, below 30m threshold)", validBefore.Sub(now).Round(time.Second))
				} else {
					// Time is valid; check revocation list if needed or if cache bust forced
					meta, _ := sshutil.LoadCertMetadata(certPath)
					nowUnix := now.Unix()
					needsRevocationCheck := forceCheck || meta == nil || meta.IsRevoked || (nowUnix-meta.LastRevocationCheckAt > 300)

					if needsRevocationCheck {
						if forceCheck && !quiet {
							ui.StepInfo("Cache bust: querying live revocation list from CA...")
						}
						apiClient := client.New(cfg)
						isRevoked, revLine, revErr := apiClient.CheckRevocation(currentSerial)
						if revErr == nil {
							if isRevoked {
								_ = sshutil.UpdateCertRevocationStatus(certPath, true, revLine)
								if revLine > 0 {
									regenReason = fmt.Sprintf("certificate serial %s is listed on line %d of CA revocation list", currentSerial, revLine)
								} else {
									regenReason = fmt.Sprintf("certificate serial %s is listed on CA revocation list", currentSerial)
								}
							} else {
								_ = sshutil.UpdateCertRevocationStatus(certPath, false, 0)
							}
						} else if meta != nil && meta.IsRevoked {
							regenReason = fmt.Sprintf("certificate serial %s is marked revoked", currentSerial)
						}
					} else if meta != nil && meta.IsRevoked {
						regenReason = fmt.Sprintf("certificate serial %s is marked revoked", currentSerial)
					}
				}
			}

			// If no renewal reason was triggered, the certificate is healthy!
			if regenReason == "" && cert != nil {
				if !quiet {
					now := time.Now()
					validBefore := time.Unix(int64(cert.ValidBefore), 0)
					rem := validBefore.Sub(now).Round(time.Second)
					ui.Step(fmt.Sprintf("Certificate is %s (%s remaining, serial %s)",
						ui.BadgeSuccess("VALID"),
						ui.Bold(rem.String()),
						ui.Cyan(currentSerial),
					))
					ui.StepInfo("Decision: leaving existing certificate alone.")
				}
				return nil
			}

			// Regeneration needed
			if !quiet {
				ui.StepWarn(fmt.Sprintf("Action required: %s", regenReason))
				ui.StepInfo(fmt.Sprintf("Decision: regenerating certificate via %s...", ui.Cyan(cfg.Endpoint)))
			}

			pubKey, err := sshutil.EnsureKeyPair(privPath, pubPath)
			if err != nil {
				if !quiet {
					ui.StepError(fmt.Sprintf("Key error: %v", err))
				}
				return nil
			}

			apiClient := client.New(cfg)
			meta, _ := sshutil.LoadCertMetadata(certPath)
			var savedKeyID string
			if meta != nil && meta.SavedKeyID != "" {
				savedKeyID = meta.SavedKeyID
			} else {
				savedKeyID, _ = apiClient.EnsureSavedKey("", pubKey)
			}

			issued, err := apiClient.IssueCertificate(savedKeyID, pubKey, 28800, nil)
			if err != nil {
				if !quiet {
					var oauthErr *auth.OAuthError
					if errors.As(err, &oauthErr) {
						ui.StepWarn(fmt.Sprintf("Certificate auto-renewal failed: %s", oauthErr.FriendlyMessage()))
					} else {
						ui.StepWarn(fmt.Sprintf("Certificate auto-renewal failed: %v", err))
					}
				}
				return nil
			}

			if err := saveCertWithMeta(certPath, issued, cfg.Endpoint, savedKeyID); err != nil {
				if !quiet {
					ui.StepError(fmt.Sprintf("Failed to save certificate: %v", err))
				}
				return nil
			}

			if !quiet {
				ui.Step(fmt.Sprintf("New certificate issued %s (serial %s, valid until %s)",
					ui.BadgeSuccess("ACTIVE"),
					ui.Cyan(issued.Serial),
					ui.Bold(time.Unix(issued.ValidBefore, 0).Format("02 Jan 15:04 MST")),
				))
			}

			return nil
		},
	}

	cmd.Flags().BoolVarP(&quiet, "quiet", "q", false, "suppress non-error output (for ssh Match exec)")
	cmd.Flags().BoolVarP(&forceCheck, "force-check", "f", false, "bypass cache and force a live revocation check against CA")
	return cmd
}
