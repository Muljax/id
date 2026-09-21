//go:build !windows

package sshutil

import (
	"os"
	"testing"
)

func assertPrivateKeyPermissions(t *testing.T, info os.FileInfo) {
	if info.Mode().Perm() != 0600 {
		t.Errorf("expected private key permissions 0600, got %o", info.Mode().Perm())
	}
}
