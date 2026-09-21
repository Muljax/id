//go:build windows

package sshutil

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"golang.org/x/sys/windows"
)

// SecureFile ensures that the file is only accessible by the current user and SYSTEM.
// Windows OpenSSH requires private keys and SSH config files to have strict NTFS ACLs,
// rejecting keys where Users or Authenticated Users have access.
func SecureFile(path string) error {
	token := windows.GetCurrentProcessToken()
	tokenUser, err := token.GetTokenUser()
	if err != nil {
		return fmt.Errorf("failed to get current user token: %w", err)
	}

	sidStr := tokenUser.User.Sid.String()

	icacls := "icacls.exe"
	if sysRoot := os.Getenv("SystemRoot"); sysRoot != "" {
		icacls = filepath.Join(sysRoot, "System32", "icacls.exe")
	}

	cmd := exec.Command(icacls, path, "/inheritance:r", "/grant:r", "*"+sidStr+":(R,W)", "/grant:r", "*S-1-5-18:F")
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("failed to set NTFS permissions via icacls (%s): %w: %s", path, err, string(out))
	}
	return nil
}

// GetShortPath returns the 8.3 short path name on Windows if available,
// which contains no spaces and avoids quoting issues with OpenSSH Match exec.
func GetShortPath(longPath string) string {
	p, err := windows.UTF16PtrFromString(longPath)
	if err != nil {
		return longPath
	}
	buf := make([]uint16, windows.MAX_PATH)
	n, err := windows.GetShortPathName(p, &buf[0], uint32(len(buf)))
	if err != nil || n == 0 {
		return longPath
	}
	if n > uint32(len(buf)) {
		buf = make([]uint16, n)
		n, err = windows.GetShortPathName(p, &buf[0], uint32(len(buf)))
		if err != nil || n == 0 {
			return longPath
		}
	}
	return windows.UTF16ToString(buf[:n])
}
