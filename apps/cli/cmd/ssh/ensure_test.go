package ssh

import (
	"bytes"
	"io"
	"os"
	"strings"
	"testing"

	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/ui"
)

func TestEnsureCertFailureOutputFormatting(t *testing.T) {
	// Enable NoColor for deterministic testing
	ui.NoColor = true
	defer func() { ui.NoColor = false }()

	tmpDir, err := os.MkdirTemp("", "muljax-ensure-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	origHome := os.Getenv("HOME")
	defer os.Setenv("HOME", origHome)
	os.Setenv("HOME", tmpDir)

	cfg := &config.Config{
		Endpoint:    "http://localhost:8787",
		ClientID:    config.DefaultClientID,
		KeyName:     "test_ed25519",
		HostPattern: "*.corp.internal",
	}
	getCfg := func() *config.Config { return cfg }

	// Capture stdout
	oldStdout := os.Stdout
	r, w, err := os.Pipe()
	if err != nil {
		t.Fatalf("failed to create pipe: %v", err)
	}
	os.Stdout = w

	cmd := newEnsureCertCmd(getCfg)
	_ = cmd.Execute()

	_ = w.Close()
	os.Stdout = oldStdout

	var buf bytes.Buffer
	_, _ = io.Copy(&buf, r)
	output := buf.String()

	// Verify output format
	if strings.Contains(output, "[muljax]") {
		t.Errorf("output should not contain '[muljax]', got:\n%s", output)
	}
	if strings.Contains(output, "Run 'muljax ssh login' to re-authenticate.") {
		t.Errorf("output should not contain duplicate 'Run muljax ssh login to re-authenticate.', got:\n%s", output)
	}
	if !strings.Contains(output, "Action required: certificate is missing or corrupted") {
		t.Errorf("expected 'Action required: certificate is missing or corrupted', got:\n%s", output)
	}
	if !strings.Contains(output, "Decision: regenerating certificate via http://localhost:8787...") {
		t.Errorf("expected 'Decision: regenerating certificate via http://localhost:8787...', got:\n%s", output)
	}
	if !strings.Contains(output, "Certificate auto-renewal failed:") {
		t.Errorf("expected 'Certificate auto-renewal failed:', got:\n%s", output)
	}
}
