//go:build !windows

package sshutil

import "os"

// SecureFile sets standard 0600 permissions on non-Windows platforms.
func SecureFile(path string) error {
	return os.Chmod(path, 0600)
}

// GetShortPath is a no-op on non-Windows platforms.
func GetShortPath(longPath string) string {
	return longPath
}
