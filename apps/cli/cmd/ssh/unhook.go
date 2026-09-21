package ssh

import (
	"fmt"

	"github.com/muljax/cli/pkg/sshutil"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func newUnhookCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "unhook",
		Short: "Remove Muljax configuration block from ~/.ssh/config",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := sshutil.RemoveSSHConfig(); err != nil {
				return fmt.Errorf("failed to remove SSH config: %w", err)
			}
			ui.Step("Successfully removed Muljax block from ~/.ssh/config")
			return nil
		},
	}
}
