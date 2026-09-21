package ssh

import (
	"fmt"

	"github.com/muljax/cli/pkg/client"
	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func newServerCmd(getCfg ConfigGetter) *cobra.Command {
	serverCmd := &cobra.Command{
		Use:   "server",
		Short: "Target server configuration commands",
	}

	serverCmd.AddCommand(&cobra.Command{
		Use:   "setup",
		Short: "Output server-side OpenSSH daemon configuration for Muljax CA",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()
			privPath, _, certPath, _ := sshutil.GetDefaultPaths(cfg.KeyName)
			_ = privPath
			resolveEndpoint(cfg, certPath)

			apiClient := client.New(cfg)

			caPubKey, err := apiClient.GetCaPublicKey()
			if err != nil {
				return fmt.Errorf("failed to retrieve CA public key from %s: %w", cfg.Endpoint, err)
			}

			ui.Header("Target Server Configuration Instructions")

			fmt.Printf("\n%s\n", ui.Bold("1. Place the Muljax CA public key in /etc/ssh/muljax_ca.pub:"))
			fmt.Println(ui.Dim("----------------------------------------------------------------------"))
			fmt.Println(ui.Cyan(caPubKey))
			fmt.Println(ui.Dim("----------------------------------------------------------------------"))

			fmt.Printf("\n%s\n", ui.Bold("2. Add the following lines to /etc/ssh/sshd_config:"))
			fmt.Println(ui.Dim("----------------------------------------------------------------------"))
			fmt.Println("TrustedUserCAKeys /etc/ssh/muljax_ca.pub")
			fmt.Println("AuthorizedPrincipalsFile /etc/ssh/auth_principals/%u")
			fmt.Println(ui.Dim("----------------------------------------------------------------------"))

			fmt.Printf("\n%s\n", ui.Bold("3. Configure authorized principals in /etc/ssh/auth_principals/<user>:"))
			fmt.Println("   Example for /etc/ssh/auth_principals/ubuntu:")
			fmt.Println(ui.Dim("     admin"))
			fmt.Println(ui.Dim("     ubuntu"))

			fmt.Printf("\n%s\n", ui.Bold("4. Reload sshd:"))
			fmt.Printf("   %s\n\n", ui.Cyan("sudo sshd -t && sudo systemctl reload sshd"))
			return nil
		},
	})

	return serverCmd
}
