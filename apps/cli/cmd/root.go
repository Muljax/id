package cmd

import (
	"fmt"
	"os"

	cmdid "github.com/muljax/cli/cmd/id"
	cmdssh "github.com/muljax/cli/cmd/ssh"
	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

var (
	Version   = "dev"
	Commit    = "none"
	BuildDate = "unknown"

	cfgFile  string
	endpoint string
	noColor  bool
	appCfg   *config.Config
)

var RootCmd = &cobra.Command{
	Use:           "muljax",
	Short:         "Muljax Identity Platform CLI",
	Version:       Version,
	SilenceUsage:  true,
	SilenceErrors: true,
	Long: `Muljax CLI provides authentication, identity management, and automated 
zero-friction SSH Certificate Authority integration.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		if noColor {
			ui.NoColor = true
		}
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		if endpoint != "" {
			cfg.Endpoint = endpoint
			_ = cfg.Save()
		}
		appCfg = cfg
		return nil
	},
}

func Execute() {
	if err := RootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "%s %v\n", ui.ErrorIcon(), ui.Red(err.Error()))
		os.Exit(1)
	}
}

func newVersionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print the version of muljax",
		Run: func(cmd *cobra.Command, args []string) {
			if Commit != "none" || BuildDate != "unknown" {
				fmt.Printf("muljax version %s (commit: %s, built: %s)\n", Version, Commit, BuildDate)
			} else {
				fmt.Printf("muljax version %s\n", Version)
			}
		},
	}
}

func init() {
	RootCmd.SetVersionTemplate("muljax version {{.Version}}\n")

	RootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file path (default is $HOME/.config/muljax/config.json)")
	RootCmd.PersistentFlags().StringVar(&endpoint, "endpoint", "", "Muljax ID API endpoint (default: http://localhost:8787)")
	RootCmd.PersistentFlags().BoolVar(&noColor, "no-color", false, "disable colored terminal output")

	// Register subcommands
	RootCmd.AddCommand(newVersionCmd())
	RootCmd.AddCommand(NewInstallCmd())
	RootCmd.AddCommand(NewUpdateCmd())
	RootCmd.AddCommand(cmdid.NewIDCmd(func() *config.Config { return appCfg }))
	RootCmd.AddCommand(cmdssh.NewSSHCmd(func() *config.Config { return appCfg }))
}
