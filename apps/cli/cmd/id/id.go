package id

import (
	"errors"
	"fmt"
	"time"

	"github.com/muljax/cli/pkg/auth"
	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/storage"
	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

type ConfigGetter func() *config.Config

func NewIDCmd(getCfg ConfigGetter) *cobra.Command {
	idCmd := &cobra.Command{
		Use:   "id",
		Short: "Muljax Identity and Authentication commands",
	}

	authCmd := &cobra.Command{
		Use:   "auth",
		Short: "Manage Muljax authentication sessions",
	}

	loginCmd := &cobra.Command{
		Use:   "login",
		Short: "Authenticate with Muljax Identity via browser",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()
			ts, err := auth.Login(cfg)
			if err != nil {
				var oauthErr *auth.OAuthError
				if errors.As(err, &oauthErr) {
					ui.StepError(fmt.Sprintf("Authentication failed: %s", oauthErr.FriendlyMessage()))
					return oauthErr
				}
				return err
			}
			ui.Step(fmt.Sprintf("Successfully authenticated with %s", ui.Cyan(cfg.Endpoint)))
			ui.Step(fmt.Sprintf("Session active (valid until %s)", ui.Bold(ts.ExpiresAt.Format("02 Jan 15:04 MST"))))
			return nil
		},
	}

	logoutCmd := &cobra.Command{
		Use:   "logout",
		Short: "Log out and clear stored session tokens",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := storage.ClearTokens(); err != nil {
				return fmt.Errorf("failed to clear tokens: %w", err)
			}
			ui.Step("Successfully logged out. Stored session tokens cleared.")
			return nil
		},
	}

	statusCmd := &cobra.Command{
		Use:   "status",
		Short: "View current authentication session status",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg := getCfg()
			ts, err := storage.LoadTokens()
			if err != nil {
				ui.StepWarn("Not logged in. Run 'muljax id auth login' to authenticate.")
				return nil
			}

			ui.Header("Muljax Identity Session")
			ui.KeyValue("Endpoint", ui.Cyan(cfg.Endpoint))
			ui.KeyValue("Client ID", cfg.ClientID)

			if claims := ts.ParseClaims(); claims != nil {
				if claims.Email != "" {
					ui.KeyValue("User", ui.Bold(claims.Email))
				} else if claims.Sub != "" {
					ui.KeyValue("Subject", ui.Bold(claims.Sub))
				}
				if claims.Name != "" && claims.Name != claims.Email {
					ui.KeyValue("Name", claims.Name)
				}
			}

			if ts.IsAccessValid() {
				remaining := time.Until(ts.ExpiresAt).Round(time.Second)
				ui.KeyValue("Access Token", fmt.Sprintf("%s %s (expires in %v)", ui.BadgeSuccess("VALID"), maskToken(ts.AccessToken), remaining))
			} else {
				ago := time.Since(ts.ExpiresAt).Round(time.Second)
				ui.KeyValue("Access Token", fmt.Sprintf("%s %s (expired %v ago)", ui.BadgeDanger("EXPIRED"), maskToken(ts.AccessToken), ago))
			}

			if ts.RefreshToken != "" {
				ui.KeyValue("Refresh Token", fmt.Sprintf("%s %s", ui.BadgeInfo("CONFIGURED"), maskToken(ts.RefreshToken)))
			} else {
				ui.KeyValue("Refresh Token", ui.BadgeWarning("NONE"))
			}

			return nil
		},
	}

	authCmd.AddCommand(loginCmd, logoutCmd, statusCmd)
	idCmd.AddCommand(authCmd)

	return idCmd
}

func maskToken(t string) string {
	if len(t) <= 8 {
		return "******"
	}
	return ui.Dim(t[:4] + "..." + t[len(t)-4:])
}
