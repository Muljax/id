//go:build windows

package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"

	"github.com/muljax/cli/pkg/ui"
)

func addDirToWindowsUserPath(targetDir string) (bool, error) {
	cleanTarget, err := filepath.Abs(targetDir)
	if err != nil {
		cleanTarget = filepath.Clean(targetDir)
	}

	k, err := registry.OpenKey(registry.CURRENT_USER, `Environment`, registry.QUERY_VALUE|registry.SET_VALUE)
	if err != nil {
		return false, err
	}
	defer k.Close()

	val, valType, err := k.GetStringValue("Path")
	if err != nil && err != registry.ErrNotExist {
		val, valType, err = k.GetStringValue("PATH")
	}
	if err != nil && err != registry.ErrNotExist {
		return false, err
	}

	// Check if already present in User PATH
	for _, p := range strings.Split(val, ";") {
		trimmed := strings.TrimSpace(p)
		if trimmed == "" {
			continue
		}
		cleanP, err := filepath.Abs(trimmed)
		if err != nil {
			cleanP = filepath.Clean(trimmed)
		}
		if strings.EqualFold(cleanP, cleanTarget) {
			return false, nil
		}
	}

	newPath := val
	if newPath != "" && !strings.HasSuffix(newPath, ";") {
		newPath += ";"
	}
	newPath += cleanTarget

	if valType == 0 {
		valType = registry.EXPAND_SZ
	}

	if valType == registry.EXPAND_SZ {
		if err := k.SetExpandStringValue("Path", newPath); err != nil {
			return false, err
		}
	} else {
		if err := k.SetStringValue("Path", newPath); err != nil {
			return false, err
		}
	}

	// Update PATH in current process
	currPath := os.Getenv("PATH")
	if currPath != "" && !strings.HasSuffix(currPath, ";") {
		currPath += ";"
	}
	_ = os.Setenv("PATH", currPath+cleanTarget)

	// Broadcast WM_SETTINGCHANGE so shells and Explorer pick up the change
	notifyEnvironmentChange()

	return true, nil
}

func notifyEnvironmentChange() {
	const (
		HWND_BROADCAST   = 0xffff
		WM_SETTINGCHANGE = 0x001a
		SMTO_ABORTIFHUNG = 0x0002
	)

	moduser32 := windows.NewLazySystemDLL("user32.dll")
	procSendMessageTimeout := moduser32.NewProc("SendMessageTimeoutW")

	envPtr, err := syscall.UTF16PtrFromString("Environment")
	if err != nil {
		return
	}

	var result uintptr
	_, _, _ = procSendMessageTimeout.Call(
		HWND_BROADCAST,
		WM_SETTINGCHANGE,
		0,
		uintptr(unsafe.Pointer(envPtr)),
		SMTO_ABORTIFHUNG,
		5000,
		uintptr(unsafe.Pointer(&result)),
	)
}

func replaceBinary(tmpPath, destPath string) error {
	if _, err := os.Stat(destPath); err == nil {
		// On Windows, a running executable cannot be deleted or overwritten,
		// but NTFS permits renaming it. Rename destPath to a temporary .old file.
		oldPath := fmt.Sprintf("%s.old.%d", destPath, time.Now().UnixNano())
		if err := os.Rename(destPath, oldPath); err != nil {
			// If rename fails, try direct removal
			_ = os.Remove(destPath)
		} else {
			// Schedule deletion on reboot if the file is currently locked/running
			if pOld, err := windows.UTF16PtrFromString(oldPath); err == nil {
				_ = windows.MoveFileEx(pOld, nil, windows.MOVEFILE_DELAY_UNTIL_REBOOT)
			}
			// Also attempt immediate removal (succeeds if not currently executing)
			_ = os.Remove(oldPath)
		}
	}

	if err := os.Rename(tmpPath, destPath); err != nil {
		// If rename fails, try direct fallback
		_ = os.Remove(destPath)
		return os.Rename(tmpPath, destPath)
	}
	return nil
}

func cleanupOldBinaries(destDir, binName string) {
	if files, err := filepath.Glob(filepath.Join(destDir, binName+".old.*")); err == nil {
		for _, f := range files {
			_ = os.Remove(f)
		}
	}
}

const defaultBinaryName = "muljax.exe"

func sameFilePath(a, b string) bool {
	return strings.EqualFold(a, b)
}

func resolveDefaultInstallDir(userMode bool) string {
	localApp := os.Getenv("LOCALAPPDATA")
	if localApp == "" {
		home, _ := os.UserHomeDir()
		localApp = filepath.Join(home, "AppData", "Local")
	}
	return filepath.Join(localApp, "Programs", "muljax")
}

func postInstallPathSetup(destDir string) {
	added, err := addDirToWindowsUserPath(destDir)
	if err != nil {
		ui.StepWarn(fmt.Sprintf("Could not automatically update user PATH: %v", err))
	} else if added {
		ui.Step(fmt.Sprintf("Added %s to your user PATH", ui.Cyan(destDir)))
		ui.StepInfo("Note: Restart your terminal or command prompt for PATH changes to take effect in new sessions.")
	}
}

func printPathInstructions(destDir string) {
	fmt.Printf("  Add it to your PATH via System Properties or PowerShell:\n  %s\n",
		ui.Cyan(fmt.Sprintf(`[Environment]::SetEnvironmentVariable("PATH", [Environment]::GetEnvironmentVariable("PATH", "User") + ";%s", "User")`, destDir)),
	)
}
