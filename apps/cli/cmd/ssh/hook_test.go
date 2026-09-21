package ssh

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/sshutil"
)

func TestHookAndUnhookCommands(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "muljax-hook-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	origHome := os.Getenv("HOME")
	defer os.Setenv("HOME", origHome)
	os.Setenv("HOME", tmpDir)

	cfg := &config.Config{
		Endpoint:    config.DefaultEndpoint,
		ClientID:    config.DefaultClientID,
		KeyName:     "test_ed25519",
		HostPattern: "*.corp.internal",
	}
	getCfg := func() *config.Config { return cfg }

	// 1. Run hook command
	hookCmd := newHookCmd(getCfg)
	if err := hookCmd.Execute(); err != nil {
		t.Fatalf("hookCmd.Execute() failed: %v", err)
	}

	// Verify key was created
	sshDir := filepath.Join(tmpDir, ".ssh")
	privPath := filepath.Join(sshDir, "test_ed25519")
	if _, err := os.Stat(privPath); err != nil {
		t.Fatalf("expected private key at %s, got error: %v", privPath, err)
	}

	// Verify SSH config has pattern
	pattern := sshutil.GetConfiguredHostPattern()
	if pattern != "*.corp.internal" {
		t.Fatalf("expected configured host pattern '*.corp.internal', got %q", pattern)
	}

	// 2. Run hook command with --hosts flag override
	hookOverrideCmd := newHookCmd(getCfg)
	hookOverrideCmd.SetArgs([]string{"--hosts", "*.custom.example.com"})
	if err := hookOverrideCmd.Execute(); err != nil {
		t.Fatalf("hookOverrideCmd.Execute() failed: %v", err)
	}

	pattern = sshutil.GetConfiguredHostPattern()
	if pattern != "*.custom.example.com" {
		t.Fatalf("expected configured host pattern '*.custom.example.com', got %q", pattern)
	}

	// 3. Run unhook command
	unhookCmd := newUnhookCmd()
	if err := unhookCmd.Execute(); err != nil {
		t.Fatalf("unhookCmd.Execute() failed: %v", err)
	}

	pattern = sshutil.GetConfiguredHostPattern()
	if pattern != "" {
		t.Fatalf("expected empty host pattern after unhook, got %q", pattern)
	}

	// Read config file to verify it doesn't contain markers
	configData, err := os.ReadFile(filepath.Join(sshDir, "config"))
	if err == nil && strings.Contains(string(configData), sshutil.ConfigBeginMarker) {
		t.Fatal("expected config file to not contain ConfigBeginMarker after unhook")
	}
}
