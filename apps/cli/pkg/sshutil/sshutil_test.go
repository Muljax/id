package sshutil

import (
	"crypto/ed25519"
	"crypto/rand"
	"os"
	"path/filepath"
	"testing"
	"time"

	"golang.org/x/crypto/ssh"
)

func TestEnsureKeyPair(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "muljax-ssh-test-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	privPath := filepath.Join(tmpDir, "test_ed25519")
	pubPath := privPath + ".pub"

	// 1. Generation
	pubStr, err := EnsureKeyPair(privPath, pubPath)
	if err != nil {
		t.Fatalf("EnsureKeyPair failed: %v", err)
	}
	if pubStr == "" {
		t.Fatal("expected non-empty public key string")
	}

	// Verify permissions
	privInfo, err := os.Stat(privPath)
	if err != nil {
		t.Fatalf("private key stat failed: %v", err)
	}
	assertPrivateKeyPermissions(t, privInfo)

	// 2. Idempotence: calling again returns same public key without error
	pubStr2, err := EnsureKeyPair(privPath, pubPath)
	if err != nil {
		t.Fatalf("second EnsureKeyPair failed: %v", err)
	}
	if pubStr != pubStr2 {
		t.Errorf("expected idempotent public key %s, got %s", pubStr, pubStr2)
	}
}

func TestCertificateValidity(t *testing.T) {
	_, privKey, _ := ed25519.GenerateKey(rand.Reader)
	signer, _ := ssh.NewSignerFromKey(privKey)

	userPub, _, _ := ed25519.GenerateKey(rand.Reader)
	sshUserPub, _ := ssh.NewPublicKey(userPub)

	now := uint64(time.Now().Unix())
	cert := &ssh.Certificate{
		Key:             sshUserPub,
		CertType:        ssh.UserCert,
		KeyId:           "test@example.com",
		ValidPrincipals: []string{"test-user"},
		ValidAfter:      now - 60,
		ValidBefore:     now + 3600, // 1 hour left
	}
	_ = cert.SignCert(rand.Reader, signer)

	if !IsCertificateValid(cert, 30*time.Minute) {
		t.Error("expected cert with 1h remaining to be valid with 30m buffer")
	}
	if IsCertificateValid(cert, 2*time.Hour) {
		t.Error("expected cert with 1h remaining to be invalid with 2h buffer")
	}
}

func TestConfigureSSHScoped(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "muljax-ssh-config-*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	// Override HOME so GetSSHDir uses tmpDir
	origHome := os.Getenv("HOME")
	defer os.Setenv("HOME", origHome)
	os.Setenv("HOME", tmpDir)

	privPath := filepath.Join(tmpDir, ".ssh", "test_key")
	scopedPattern := "*.corp.example.com,*.internal"

	// 1. Initial configuration
	if err := ConfigureSSH(privPath, scopedPattern); err != nil {
		t.Fatalf("ConfigureSSH failed: %v", err)
	}

	gotPattern := GetConfiguredHostPattern()
	if gotPattern != scopedPattern {
		t.Errorf("expected host pattern %q, got %q", scopedPattern, gotPattern)
	}

	// 2. Re-configure with new pattern (update)
	newPattern := "*.internal"
	if err := ConfigureSSH(privPath, newPattern); err != nil {
		t.Fatalf("second ConfigureSSH failed: %v", err)
	}

	gotPattern2 := GetConfiguredHostPattern()
	if gotPattern2 != newPattern {
		t.Errorf("expected updated host pattern %q, got %q", newPattern, gotPattern2)
	}

	// 3. Remove
	if err := RemoveSSHConfig(); err != nil {
		t.Fatalf("RemoveSSHConfig failed: %v", err)
	}
	if p := GetConfiguredHostPattern(); p != "" {
		t.Errorf("expected empty host pattern after removal, got %q", p)
	}
}
