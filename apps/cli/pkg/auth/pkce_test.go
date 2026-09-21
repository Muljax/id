package auth

import (
	"crypto/sha256"
	"encoding/base64"
	"testing"
)

func TestGeneratePKCE(t *testing.T) {
	pkce, err := GeneratePKCE()
	if err != nil {
		t.Fatalf("GeneratePKCE failed: %v", err)
	}

	if pkce.Method != "S256" {
		t.Errorf("expected S256 method, got %s", pkce.Method)
	}
	if len(pkce.Verifier) < 43 {
		t.Errorf("verifier too short: %d", len(pkce.Verifier))
	}

	// Verify SHA-256 relationship
	h := sha256.Sum256([]byte(pkce.Verifier))
	expectedChallenge := base64.RawURLEncoding.EncodeToString(h[:])
	if pkce.Challenge != expectedChallenge {
		t.Errorf("challenge mismatch: expected %s, got %s", expectedChallenge, pkce.Challenge)
	}
}
