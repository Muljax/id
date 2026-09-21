package ssh

import (
	"fmt"
	"strings"
	"time"

	"github.com/muljax/cli/pkg/client"
	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
	"golang.org/x/crypto/ssh"
)

type ConfigGetter func() *config.Config

func NewSSHCmd(getCfg ConfigGetter) *cobra.Command {
	sshCmd := &cobra.Command{
		Use:   "ssh",
		Short: "SSH Certificate Authority and client integration",
	}

	sshCmd.AddCommand(newSetupCmd(getCfg))
	sshCmd.AddCommand(newLoginCmd(getCfg))
	sshCmd.AddCommand(newCertCmd(getCfg))
	sshCmd.AddCommand(newEnsureCertCmd(getCfg))
	sshCmd.AddCommand(newStatusCmd(getCfg))
	sshCmd.AddCommand(newServerCmd(getCfg))
	sshCmd.AddCommand(newHookCmd(getCfg))
	sshCmd.AddCommand(newUnhookCmd())

	return sshCmd
}

func resolveEndpoint(cfg *config.Config, certPath string) {
	if cfg.Endpoint == config.DefaultEndpoint || cfg.Endpoint == "" {
		if meta, err := sshutil.LoadCertMetadata(certPath); err == nil && meta.Endpoint != "" {
			cfg.Endpoint = meta.Endpoint
		}
	}
}

func saveCertWithMeta(certPath string, issued *client.IssueCertResponse, endpoint string, savedKeyID string) error {
	if err := sshutil.SaveCertificate(certPath, issued.Certificate); err != nil {
		return err
	}
	return sshutil.SaveCertMetadata(certPath, &sshutil.CertMetadata{
		SavedKeyID:    savedKeyID,
		Endpoint:      endpoint,
		Serial:        issued.Serial,
		KeyID:         issued.KeyID,
		Principals:    issued.Principals,
		ValidAfter:    issued.ValidAfter,
		ValidBefore:   issued.ValidBefore,
		Fingerprint:   issued.Fingerprint,
		CaFingerprint: issued.CaFingerprint,
	})
}

func printCertDetails(cert *ssh.Certificate, isRevoked bool) {
	now := time.Now()
	validAfter := time.Unix(int64(cert.ValidAfter), 0)
	validBefore := time.Unix(int64(cert.ValidBefore), 0)

	var statusBadge string
	if isRevoked {
		statusBadge = ui.BadgeDanger("REVOKED")
	} else if now.Before(validAfter) {
		statusBadge = fmt.Sprintf("%s (starts %s)", ui.BadgeWarning("NOT YET ACTIVE"), validAfter.Format("15:04 MST"))
	} else if now.After(validBefore) {
		statusBadge = fmt.Sprintf("%s (expired %s ago)", ui.BadgeDanger("EXPIRED"), time.Since(validBefore).Round(time.Second))
	} else {
		rem := validBefore.Sub(now).Round(time.Second)
		if rem < 30*time.Minute {
			statusBadge = fmt.Sprintf("%s (expires in %v)", ui.BadgeWarning("EXPIRING SOON"), rem)
		} else {
			statusBadge = fmt.Sprintf("%s (expires in %v)", ui.BadgeSuccess("VALID"), rem)
		}
	}

	ui.KeyValue("Status", statusBadge)
	ui.KeyValue("Key ID", ui.Bold(cert.KeyId))
	ui.KeyValue("Serial", fmt.Sprintf("%s %s", ui.Cyan(fmt.Sprintf("%d", cert.Serial)), ui.Dim(fmt.Sprintf("(0x%x)", cert.Serial))))
	ui.KeyValue("Principals", strings.Join(cert.ValidPrincipals, ", "))
	ui.KeyValue("Validity", fmt.Sprintf("%s %s %s",
		validAfter.Format("02 Jan 15:04"),
		ui.ArrowIcon(),
		validBefore.Format("02 Jan 15:04 MST"),
	))

	exts := make([]string, 0, len(cert.Extensions))
	for k := range cert.Extensions {
		clean := strings.TrimPrefix(k, "permit-")
		exts = append(exts, clean)
	}
	ui.KeyValue("Extensions", ui.Dim(strings.Join(exts, ", ")))
}
