//go:build windows

package sshutil

import (
	"os"
	"testing"
)

func assertPrivateKeyPermissions(t *testing.T, info os.FileInfo) {
	// On Windows, permissions are verified via NTFS ACLs (SecureFile)
}
