package ssh

import (
	"fmt"
	"strings"

	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func newHookCmd(getCfg ConfigGetter) *cobra.Command {
	var hosts string

	cmd := &cobra.Command{
		Use:   "hook",
		Short: "Add or update Muljax configuration block in ~/.ssh/config",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()
			privPath, pubPath, _, err := sshutil.GetDefaultPaths(cfg.KeyName)
			if err != nil {
				return err
			}

			if _, err := sshutil.EnsureKeyPair(privPath, pubPath); err != nil {
				return fmt.Errorf("failed to configure local SSH key: %w", err)
			}

			hostPattern := strings.TrimSpace(hosts)
			if hostPattern != "" {
				cfg.HostPattern = hostPattern
				_ = cfg.Save()
			} else if cfg.HostPattern != "" {
				hostPattern = cfg.HostPattern
			} else if existing := sshutil.GetConfiguredHostPattern(); existing != "" {
				hostPattern = existing
			} else {
				hostPattern = config.DefaultHostPattern
			}

			if err := sshutil.ConfigureSSH(privPath, hostPattern); err != nil {
				return fmt.Errorf("failed to configure ~/.ssh/config: %w", err)
			}
			ui.Step(fmt.Sprintf("Successfully configured ~/.ssh/config with transparent renewal hook (scoped to %s)", ui.Cyan(hostPattern)))
			return nil
		},
	}

	cmd.Flags().StringVar(&hosts, "hosts", "", "host pattern for OpenSSH Match scoping (e.g. '*.corp.com,*.internal')")
	return cmd
}
