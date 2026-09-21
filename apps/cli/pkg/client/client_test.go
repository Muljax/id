package client

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/muljax/cli/pkg/auth"
	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/storage"
)

func TestCheckRevocation(t *testing.T) {
	mockRawRevocationList := `# OpenSSH Revoked Keys
serial: 1001
serial: 2002
serial: 999999999
`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/ssh/ca/revoked-keys" && r.URL.Query().Get("format") == "raw" {
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write([]byte(mockRawRevocationList))
			return
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
	}
	c := New(cfg)

	// Test revoked serial
	isRevoked, lineNum, err := c.CheckRevocation("2002")
	if err != nil {
		t.Fatalf("CheckRevocation failed: %v", err)
	}
	if !isRevoked {
		t.Errorf("expected serial 2002 to be revoked")
	}
	if lineNum != 3 {
		t.Errorf("expected serial 2002 to be found on line 3, got %d", lineNum)
	}

	// Test non-revoked serial
	isRevoked, lineNum, err = c.CheckRevocation("12345")
	if err != nil {
		t.Fatalf("CheckRevocation failed: %v", err)
	}
	if isRevoked {
		t.Errorf("expected serial 12345 to NOT be revoked")
	}
	if lineNum != 0 {
		t.Errorf("expected lineNum 0 for non-revoked serial, got %d", lineNum)
	}
}

func TestGetValidAccessToken_Refresh(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/oauth/token" {
			_ = r.ParseForm()
			if r.Form.Get("refresh_token") == "lockdown_token" {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Cache-Control", "no-store")
				w.Header().Set("Pragma", "no-cache")
				w.WriteHeader(http.StatusBadRequest)
				_ = json.NewEncoder(w).Encode(auth.TokenResponse{
					Error:     auth.ErrCodeInvalidGrant,
					ErrorDesc: "Refresh token blocked for non-admin during lockdown",
				})
				return
			}
		}
		http.NotFound(w, r)
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
		ClientID: "test-client",
	}
	c := New(cfg)

	// Save expired token in storage
	ts := &storage.TokenStorage{
		AccessToken:  "expired_access_token",
		RefreshToken: "lockdown_token",
		ExpiresAt:    time.Now().Add(-1 * time.Hour),
	}
	if err := storage.SaveTokens(ts); err != nil {
		t.Fatalf("failed to save test tokens: %v", err)
	}
	defer func() { _ = storage.ClearTokens() }()

	_, err := c.GetValidAccessToken()
	if err == nil {
		t.Fatalf("expected error from GetValidAccessToken during lockdown refresh, got nil")
	}
	if !strings.Contains(err.Error(), "session expired, revoked, or restricted during lockdown") {
		t.Errorf("unexpected error message: %v", err)
	}
}

func TestEnsureSavedKey_And_IssueCertificate(t *testing.T) {
	testPubKey := "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGt6Ptestkey test-comment"
	savedKeyUUID := "key-uuid-1234"

	var registeredKey bool
	var issuedWithSavedKey bool

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.URL.Path == "/api/ssh/keys" {
			if r.Method == http.MethodGet {
				if registeredKey {
					_ = json.NewEncoder(w).Encode(ListKeysResponse{
						Keys: []SshKey{
							{
								ID:          savedKeyUUID,
								Name:        "test-host (muljax-cli)",
								PublicKey:   testPubKey,
								Fingerprint: "SHA256:fingerprint",
							},
						},
					})
				} else {
					_ = json.NewEncoder(w).Encode(ListKeysResponse{
						Keys: []SshKey{},
					})
				}
				return
			} else if r.Method == http.MethodPost {
				var req RegisterKeyRequest
				_ = json.NewDecoder(r.Body).Decode(&req)
				registeredKey = true
				w.WriteHeader(http.StatusCreated)
				_ = json.NewEncoder(w).Encode(RegisterKeyResponse{
					Key: SshKey{
						ID:          savedKeyUUID,
						Name:        req.Name,
						PublicKey:   req.PublicKey,
						Fingerprint: "SHA256:fingerprint",
					},
				})
				return
			}
		}

		if r.URL.Path == "/api/ssh/certs/issue" && r.Method == http.MethodPost {
			var req IssueCertRequest
			_ = json.NewDecoder(r.Body).Decode(&req)
			if req.SavedKeyID == savedKeyUUID {
				issuedWithSavedKey = true
			}
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(IssueCertResponse{
				Certificate: "ssh-ed25519-cert-v01@openssh.com test-cert",
				Serial:      "1001",
				KeyID:       "user@example.com",
				Principals:  []string{"user"},
				ValidAfter:  time.Now().Unix(),
				ValidBefore: time.Now().Add(8 * time.Hour).Unix(),
			})
			return
		}

		http.NotFound(w, r)
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
		ClientID: "test-client",
	}
	c := New(cfg)

	// Save active token in storage
	ts := &storage.TokenStorage{
		AccessToken: "active_token",
		ExpiresAt:   time.Now().Add(1 * time.Hour),
	}
	if err := storage.SaveTokens(ts); err != nil {
		t.Fatalf("failed to save tokens: %v", err)
	}
	defer func() { _ = storage.ClearTokens() }()

	// 1. EnsureSavedKey should register key
	keyID, err := c.EnsureSavedKey("my-test-key", testPubKey)
	if err != nil {
		t.Fatalf("EnsureSavedKey failed: %v", err)
	}
	if keyID != savedKeyUUID {
		t.Errorf("expected keyID %s, got %s", savedKeyUUID, keyID)
	}
	if !registeredKey {
		t.Errorf("expected key to be registered via POST /keys")
	}

	// 2. Second call should find existing key without re-registering
	keyID2, err := c.EnsureSavedKey("my-test-key", testPubKey)
	if err != nil {
		t.Fatalf("EnsureSavedKey second call failed: %v", err)
	}
	if keyID2 != savedKeyUUID {
		t.Errorf("expected keyID %s on second call, got %s", savedKeyUUID, keyID2)
	}

	// 3. Issue certificate using savedKeyID
	certResp, err := c.IssueCertificate(keyID, testPubKey, 28800, nil)
	if err != nil {
		t.Fatalf("IssueCertificate failed: %v", err)
	}
	if !issuedWithSavedKey {
		t.Errorf("expected certificate to be issued with savedKeyID %s", savedKeyUUID)
	}
	if certResp.Certificate == "" {
		t.Errorf("expected non-empty certificate")
	}
}
