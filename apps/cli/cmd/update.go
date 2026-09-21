package cmd

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/muljax/cli/pkg/ui"
	"github.com/muljax/cli/pkg/update"
	"github.com/spf13/cobra"
)

func NewUpdateCmd() *cobra.Command {
	var targetDir string
	var userMode bool
	var force bool
	var checkOnly bool
	var specificVersion string

	cmd := &cobra.Command{
		Use:   "update",
		Short: "Update muljax to the latest release",
		Long: `Fetches the appropriate archive for your platform from the latest
Muljax release on GitHub, verifies its integrity, extracts it, and installs it.`,
		SilenceUsage:  true,
		SilenceErrors: true,
		RunE: func(*cobra.Command, []string) error {
			goos := runtime.GOOS
			goarch := runtime.GOARCH

			if !update.IsSupportedPlatform(goos, goarch) {
				return fmt.Errorf(
					"unsupported platform %s/%s; supported platforms: darwin/amd64, darwin/arm64, linux/amd64, linux/arm64, windows/amd64, windows/arm64",
					goos,
					goarch,
				)
			}

			ui.Header("Muljax CLI Update")
			ui.KeyValue("Current Version", Version)
			ui.KeyValue("Platform", fmt.Sprintf("%s/%s", goos, goarch))

			stopSpinner := ui.Spinner("Fetching release information...")
			rel, err := update.ResolveRelease(nil, "", specificVersion)
			stopSpinner()

			if err != nil {
				return fmt.Errorf("failed to fetch release information: %w", err)
			}

			targetTag := rel.TagName
			targetVersion := strings.TrimPrefix(targetTag, "v")
			currentClean := strings.TrimPrefix(Version, "v")

			ui.KeyValue("Target Version", targetTag)

			isUpToDate := currentClean == targetVersion && Version != "dev"

			if checkOnly {
				if isUpToDate {
					ui.Step(fmt.Sprintf(
						"muljax is up to date (%s)",
						ui.Cyan(Version),
					))
				} else {
					ui.StepInfo(fmt.Sprintf(
						"Update available: %s -> %s",
						ui.Dim(Version),
						ui.Cyan(targetTag),
					))

					ui.ReleaseNotes(rel.Body)

					fmt.Printf(
						"Run '%s' to install the update.\n",
						ui.Cyan("muljax update"),
					)
				}

				return nil
			}

			if isUpToDate && !force {
				ui.Step(fmt.Sprintf(
					"muljax is already up to date (%s)",
					ui.Cyan(Version),
				))

				fmt.Printf(
					"Use '%s' to force reinstallation.\n",
					ui.Cyan("muljax update --force"),
				)

				return nil
			}

			ui.ReleaseNotes(rel.Body)

			archiveName := update.ArchiveName(goos, goarch)

			archiveDownloadURL := update.ResolveAssetURL(
				update.DefaultReleaseRepo,
				targetTag,
				archiveName,
				rel.Assets,
			)

			checksumsURL := update.ResolveChecksumsURL(
				update.DefaultReleaseRepo,
				targetTag,
				rel.Assets,
			)

			tmpDir, err := os.MkdirTemp("", "muljax-update-*")
			if err != nil {
				return fmt.Errorf(
					"failed to create temporary working directory: %w",
					err,
				)
			}
			defer os.RemoveAll(tmpDir)

			archivePath := filepath.Join(tmpDir, archiveName)

			ui.StepInfo(fmt.Sprintf(
				"Downloading %s...",
				ui.Cyan(archiveName),
			))

			if err := update.DownloadFile(
				nil,
				archiveDownloadURL,
				archivePath,
			); err != nil {
				return fmt.Errorf(
					"failed to download release archive: %w",
					err,
				)
			}

			if checksumsURL != "" {
				checksumsPath := filepath.Join(tmpDir, "checksums.txt")

				if err := update.DownloadFile(
					nil,
					checksumsURL,
					checksumsPath,
				); err == nil {
					ui.StepInfo("Verifying archive integrity...")

					if err := update.VerifyChecksum(
						archivePath,
						checksumsPath,
						archiveName,
					); err != nil {
						return fmt.Errorf(
							"checksum verification failed: %w",
							err,
						)
					}

					ui.Step("Archive integrity verified (SHA256)")
				} else {
					ui.StepWarn(
						"Could not download checksums.txt; proceeding without checksum verification",
					)
				}
			}

			ui.StepInfo("Extracting archive...")

			extractedBinPath, err := update.ExtractArchive(
				archivePath,
				tmpDir,
				goos,
			)
			if err != nil {
				return fmt.Errorf(
					"failed to extract archive: %w",
					err,
				)
			}

			if err := os.Chmod(extractedBinPath, 0755); err != nil {
				return fmt.Errorf(
					"failed to make extracted binary executable: %w",
					err,
				)
			}

			installArgs := []string{"install", "--force"}

			if userMode {
				installArgs = append(installArgs, "--user")
			} else if targetDir != "" {
				installArgs = append(installArgs, "--dir", targetDir)
			} else {
				selfPath, err := os.Executable()
				if err == nil {
					if resolved, err := filepath.EvalSymlinks(selfPath); err == nil {
						selfPath = resolved
					}

					selfDir := filepath.Dir(selfPath)

					if isDirInPath(selfDir) {
						installArgs = append(installArgs, "--dir", selfDir)
					}
				}
			}

			if noColor || ui.NoColor {
				installArgs = append(installArgs, "--no-color")
			}

			installCmd := exec.Command(extractedBinPath, installArgs...)
			installCmd.Stdout = os.Stdout
			installCmd.Stderr = os.Stderr
			installCmd.Stdin = os.Stdin

			if err := installCmd.Run(); err != nil {
				return fmt.Errorf("installation failed: %w", err)
			}

			ui.Step(fmt.Sprintf(
				"Successfully updated muljax to %s",
				ui.Bold(targetTag),
			))

			return nil
		},
	}

	cmd.Flags().StringVarP(
		&targetDir,
		"dir",
		"d",
		"",
		"custom directory to install binary into",
	)

	cmd.Flags().BoolVarP(
		&userMode,
		"user",
		"u",
		false,
		"install into user local bin directory instead of system-wide",
	)

	cmd.Flags().BoolVarP(
		&force,
		"force",
		"f",
		false,
		"force update even if already up to date",
	)

	cmd.Flags().BoolVarP(
		&checkOnly,
		"check",
		"c",
		false,
		"check for available updates without installing",
	)

	cmd.Flags().StringVar(
		&specificVersion,
		"version",
		"",
		"specific release version to install (e.g. v0.7.1)",
	)

	return cmd
}
