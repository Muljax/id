package cmd

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/muljax/cli/pkg/ui"
	"github.com/spf13/cobra"
)

func NewInstallCmd() *cobra.Command {
	var targetDir string
	var userMode bool
	var force bool

	cmd := &cobra.Command{
		Use:   "install",
		Short: "Install muljax binary onto your system PATH",
		Long: `Installs the muljax executable into a directory in your system or user PATH.
Automatically detects appropriate installation directories for Linux, macOS, and Windows.`,
		SilenceUsage:  true,
		SilenceErrors: true,
		RunE: func(cmd *cobra.Command, args []string) error {
			selfPath, err := os.Executable()
			if err != nil {
				return fmt.Errorf("failed to determine executable path: %w", err)
			}
			selfPath, err = filepath.EvalSymlinks(selfPath)
			if err != nil {
				return fmt.Errorf("failed to resolve executable symlinks: %w", err)
			}

			if strings.Contains(selfPath, "go-build") || strings.Contains(selfPath, "/b/") {
				return fmt.Errorf("cannot install while running via 'go run'; compile the binary first with 'go build -o muljax .'")
			}

			binName := defaultBinaryName

			destDir := targetDir
			if destDir == "" {
				destDir = resolveDefaultInstallDir(userMode)
			}

			if err := os.MkdirAll(destDir, 0755); err != nil {
				if os.IsPermission(err) {
					return fmt.Errorf("permission denied creating %s; try running with 'sudo muljax install' or use 'muljax install --user'", destDir)
				}
				return fmt.Errorf("failed to create directory %s: %w", destDir, err)
			}

			destPath := filepath.Join(destDir, binName)

			cleanSelf, _ := filepath.Abs(selfPath)
			cleanDest, _ := filepath.Abs(destPath)
			if sameFilePath(cleanSelf, cleanDest) {
				ui.Step(fmt.Sprintf("muljax is already installed at %s", ui.Cyan(destPath)))
				return nil
			}

			cleanupOldBinaries(destDir, binName)

			isReplacing := false
			if _, err := os.Stat(destPath); err == nil {
				if !force {
					if srcBytes, err := os.ReadFile(selfPath); err == nil {
						if dstBytes, err := os.ReadFile(destPath); err == nil && bytes.Equal(srcBytes, dstBytes) {
							ui.Step(fmt.Sprintf("muljax is already installed and up to date at %s", ui.Cyan(destPath)))
							return nil
						}
					}
				}
				isReplacing = true
			}

			testFile := filepath.Join(destDir, fmt.Sprintf(".test-write-%d", os.Getpid()))
			if err := os.WriteFile(testFile, []byte(""), 0644); err != nil {
				if os.IsPermission(err) {
					if !userMode && destDir == "/usr/local/bin" {
						return fmt.Errorf("permission denied writing to %s\n  Run with elevated privileges: %s\n  Or install for current user only: %s",
							destDir,
							ui.Cyan("sudo muljax install"),
							ui.Cyan("muljax install --user"),
						)
					}
					return fmt.Errorf("permission denied writing to %s: %w", destDir, err)
				}
				return fmt.Errorf("cannot write to %s: %w", destDir, err)
			}
			_ = os.Remove(testFile)

			if isReplacing {
				ui.StepInfo(fmt.Sprintf("Installing binary to %s (replacing existing)...", ui.Cyan(destPath)))
			} else {
				ui.StepInfo(fmt.Sprintf("Installing binary to %s...", ui.Cyan(destPath)))
			}

			srcFile, err := os.Open(selfPath)
			if err != nil {
				return fmt.Errorf("failed to open source binary: %w", err)
			}
			defer srcFile.Close()

			tmpFile, err := os.CreateTemp(destDir, "muljax-tmp-*")
			if err != nil {
				return fmt.Errorf("failed to create temporary installation file: %w", err)
			}
			tmpPath := tmpFile.Name()

			if _, err := io.Copy(tmpFile, srcFile); err != nil {
				tmpFile.Close()
				_ = os.Remove(tmpPath)
				return fmt.Errorf("failed to copy binary: %w", err)
			}

			if err := tmpFile.Chmod(0755); err != nil {
				tmpFile.Close()
				_ = os.Remove(tmpPath)
				return fmt.Errorf("failed to set executable permissions: %w", err)
			}
			tmpFile.Close()

			// Replace existing file (supports replacing running executables on Windows)
			if err := replaceBinary(tmpPath, destPath); err != nil {
				_ = os.Remove(tmpPath)
				return fmt.Errorf("failed to finalize installation: %w", err)
			}

			ui.Step(fmt.Sprintf("Successfully installed muljax to %s", ui.Bold(destPath)))

			postInstallPathSetup(destDir)

			if !isDirInPath(destDir) {
				fmt.Println()
				ui.StepWarn(fmt.Sprintf("Note: %s is not in your current PATH environment variable.", ui.Cyan(destDir)))
				printPathInstructions(destDir)
			} else if !force {
				fmt.Printf("\n%s Ready! Run '%s' to configure SSH integration.\n\n",
					ui.Green("✓"),
					ui.Cyan("muljax ssh setup"),
				)
			}

			return nil
		},
	}

	cmd.Flags().StringVarP(&targetDir, "dir", "d", "", "custom directory to install binary into")
	cmd.Flags().BoolVarP(&userMode, "user", "u", false, "install into user local bin directory instead of system-wide")
	cmd.Flags().BoolVarP(&force, "force", "f", false, "force overwrite of existing installation")

	return cmd
}

func isDirInPath(targetDir string) bool {
	cleanTarget, err := filepath.Abs(targetDir)
	if err != nil {
		cleanTarget = filepath.Clean(targetDir)
	}

	pathEnv := os.Getenv("PATH")
	for _, p := range filepath.SplitList(pathEnv) {
		cleanP, err := filepath.Abs(p)
		if err != nil {
			cleanP = filepath.Clean(p)
		}
		if sameFilePath(cleanP, cleanTarget) {
			return true
		}
	}
	return false
}
