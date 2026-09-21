//go:build !windows

package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/muljax/cli/pkg/ui"
)

const defaultBinaryName = "muljax"

func sameFilePath(a, b string) bool {
	return a == b
}

func resolveDefaultInstallDir(userMode bool) string {
	if userMode {
		home, _ := os.UserHomeDir()
		return filepath.Join(home, ".local", "bin")
	}

	// On Unix (Linux / macOS):
	// If running as root (e.g. sudo), use /usr/local/bin
	if os.Geteuid() == 0 {
		return "/usr/local/bin"
	}

	// If /usr/local/bin is writable, default to /usr/local/bin
	testFile := filepath.Join("/usr/local/bin", fmt.Sprintf(".perm-test-%d", os.Getpid()))
	if err := os.WriteFile(testFile, []byte(""), 0644); err == nil {
		_ = os.Remove(testFile)
		return "/usr/local/bin"
	}

	// Fallback to user ~/.local/bin
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".local", "bin")
}

func postInstallPathSetup(destDir string) {
	// No-op on non-Windows
}

func printPathInstructions(destDir string) {
	home, _ := os.UserHomeDir()
	shellConfig := "~/.bashrc or ~/.zshrc"
	if _, err := os.Stat(filepath.Join(home, ".zshrc")); err == nil {
		shellConfig = "~/.zshrc"
	} else if _, err := os.Stat(filepath.Join(home, ".bashrc")); err == nil {
		shellConfig = "~/.bashrc"
	}
	fmt.Printf("  Add it to %s:\n  %s\n",
		ui.Dim(shellConfig),
		ui.Cyan(fmt.Sprintf(`export PATH="%s:$PATH"`, destDir)),
	)
}

func replaceBinary(tmpPath, destPath string) error {
	_ = os.Remove(destPath)
	return os.Rename(tmpPath, destPath)
}

func cleanupOldBinaries(destDir, binName string) {
	// No-op on non-Windows
}
