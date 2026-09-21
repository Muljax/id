package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/storage"
)

func TestOAuthErrorHelpers(t *testing.T) {
	tempUnavail := &OAuthError{
		Code:        ErrCodeTemporarilyUnavailable,
		Description: "Instance undergoing maintenance",
		StatusCode:  http.StatusServiceUnavailable,
	}
	if !tempUnavail.IsTemporarilyUnavailable() {
		t.Errorf("expected IsTemporarilyUnavailable to be true")
	}
	if !strings.Contains(tempUnavail.FriendlyMessage(), "Instance unavailable") {
		t.Errorf("unexpected friendly message: %s", tempUnavail.FriendlyMessage())
	}
	if !strings.Contains(tempUnavail.Error(), "temporarily_unavailable") {
		t.Errorf("unexpected error string: %s", tempUnavail.Error())
	}

	accessDenied := &OAuthError{
		Code:        ErrCodeAccessDenied,
		Description: "Non-admin access restricted during lockdown",
		StatusCode:  http.StatusForbidden,
	}
	if !accessDenied.IsAccessDenied() {
		t.Errorf("expected IsAccessDenied to be true")
	}
	if !strings.Contains(accessDenied.FriendlyMessage(), "Access denied") {
		t.Errorf("unexpected friendly message: %s", accessDenied.FriendlyMessage())
	}

	loginReq := &OAuthError{
		Code:        ErrCodeLoginRequired,
		Description: "Admin key required for silent auth",
		StatusCode:  http.StatusBadRequest,
	}
	if !loginReq.IsLoginRequired() {
		t.Errorf("expected IsLoginRequired to be true")
	}
	if !strings.Contains(loginReq.FriendlyMessage(), "Interactive") {
		t.Errorf("unexpected friendly message: %s", loginReq.FriendlyMessage())
	}

	invalidGrant := &OAuthError{
		Code:        ErrCodeInvalidGrant,
		Description: "Refresh token blocked for non-admin",
		StatusCode:  http.StatusBadRequest,
	}
	if !invalidGrant.IsInvalidGrant() {
		t.Errorf("expected IsInvalidGrant to be true")
	}

	authPending := &OAuthError{
		Code:       ErrCodeAuthorizationPending,
		StatusCode: http.StatusBadRequest,
	}
	if !authPending.IsAuthorizationPending() {
		t.Errorf("expected IsAuthorizationPending to be true")
	}

	slowDown := &OAuthError{
		Code:       ErrCodeSlowDown,
		StatusCode: http.StatusBadRequest,
	}
	if !slowDown.IsSlowDown() {
		t.Errorf("expected IsSlowDown to be true")
	}

	expired := &OAuthError{
		Code:       ErrCodeExpiredToken,
		StatusCode: http.StatusBadRequest,
	}
	if !expired.IsExpiredToken() {
		t.Errorf("expected IsExpiredToken to be true")
	}
}

func TestRequestDeviceCode_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/oauth/device/code" {
			http.NotFound(w, r)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		_ = r.ParseForm()
		if r.Form.Get("client_id") != "test-client" {
			http.Error(w, "invalid client_id", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		resp := DeviceCodeResponse{
			DeviceCode:              "dev_code_12345",
			UserCode:                "WDJB-4921",
			VerificationURI:         "https://id.example.com/device",
			VerificationURIComplete: "https://id.example.com/device?user_code=WDJB-4921",
			ExpiresIn:               600,
			Interval:                5,
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
		ClientID: "test-client",
	}

	dcr, err := RequestDeviceCode(cfg, DefaultScopes)
	if err != nil {
		t.Fatalf("RequestDeviceCode failed: %v", err)
	}

	if dcr.DeviceCode != "dev_code_12345" {
		t.Errorf("expected device code 'dev_code_12345', got '%s'", dcr.DeviceCode)
	}
	if dcr.UserCode != "WDJB-4921" {
		t.Errorf("expected user code 'WDJB-4921', got '%s'", dcr.UserCode)
	}
	if dcr.Interval != 5 {
		t.Errorf("expected interval 5, got %d", dcr.Interval)
	}
}

func TestPollDeviceToken_PendingThenSuccess(t *testing.T) {
	var pollCount int32

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/oauth/token" {
			http.NotFound(w, r)
			return
		}
		_ = r.ParseForm()
		if r.Form.Get("grant_type") != DeviceGrantType {
			http.Error(w, "invalid grant_type", http.StatusBadRequest)
			return
		}

		count := atomic.AddInt32(&pollCount, 1)
		w.Header().Set("Content-Type", "application/json")

		if count < 2 {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(TokenResponse{
				Error:     ErrCodeAuthorizationPending,
				ErrorDesc: "Authorization pending",
			})
			return
		}

		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(TokenResponse{
			AccessToken:  "at_device_success",
			RefreshToken: "rt_device_success",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
		})
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
		ClientID: "test-client",
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	tokens, err := PollDeviceToken(ctx, cfg, "dev_code_12345", 1, 600)
	if err != nil {
		t.Fatalf("PollDeviceToken failed: %v", err)
	}

	if tokens.AccessToken != "at_device_success" {
		t.Errorf("expected access token 'at_device_success', got '%s'", tokens.AccessToken)
	}
}

func TestPollDeviceToken_AccessDenied(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(TokenResponse{
			Error:     ErrCodeAccessDenied,
			ErrorDesc: "User denied device authorization",
		})
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
		ClientID: "test-client",
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := PollDeviceToken(ctx, cfg, "dev_code_12345", 1, 600)
	if err == nil {
		t.Fatalf("expected error from PollDeviceToken, got nil")
	}

	oauthErr, ok := err.(*OAuthError)
	if !ok {
		t.Fatalf("expected *OAuthError, got %T: %v", err, err)
	}
	if !oauthErr.IsAccessDenied() {
		t.Errorf("expected IsAccessDenied to be true, got code: %s", oauthErr.Code)
	}
}

func TestRefreshAccessToken_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/oauth/token" {
			http.NotFound(w, r)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		_ = r.ParseForm()
		if r.Form.Get("grant_type") != "refresh_token" {
			http.Error(w, "invalid grant_type", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Pragma", "no-cache")
		w.WriteHeader(http.StatusOK)

		resp := TokenResponse{
			AccessToken:  "new_access_token_123",
			RefreshToken: "new_refresh_token_456",
			TokenType:    "Bearer",
			ExpiresIn:    3600,
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
		ClientID: "test-client",
	}
	ts := &storage.TokenStorage{
		AccessToken:  "old_access_token",
		RefreshToken: "old_refresh_token",
		ExpiresAt:    time.Now().Add(-10 * time.Minute),
	}

	refreshed, err := RefreshAccessToken(cfg, ts)
	if err != nil {
		t.Fatalf("RefreshAccessToken failed: %v", err)
	}
	if refreshed.AccessToken != "new_access_token_123" {
		t.Errorf("expected access token 'new_access_token_123', got '%s'", refreshed.AccessToken)
	}
	if refreshed.RefreshToken != "new_refresh_token_456" {
		t.Errorf("expected refresh token 'new_refresh_token_456', got '%s'", refreshed.RefreshToken)
	}
}

func TestClientCredentialsToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		if r.Form.Get("grant_type") != "client_credentials" {
			http.Error(w, "invalid grant_type", http.StatusBadRequest)
			return
		}
		if r.Form.Get("client_id") != "m2m-service" || r.Form.Get("client_secret") != "m2m-secret" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(TokenResponse{
				Error:     ErrCodeInvalidClient,
				ErrorDesc: "Client authentication failed",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Pragma", "no-cache")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(TokenResponse{
			AccessToken: "m2m_access_token_789",
			TokenType:   "Bearer",
			ExpiresIn:   7200,
			Scope:       "ssh:ca:read",
		})
	}))
	defer server.Close()

	cfg := &config.Config{
		Endpoint: server.URL,
	}

	resp, err := ClientCredentialsToken(cfg, "m2m-service", "m2m-secret", "ssh:ca:read")
	if err != nil {
		t.Fatalf("ClientCredentialsToken failed: %v", err)
	}
	if resp.AccessToken != "m2m_access_token_789" {
		t.Errorf("expected access token 'm2m_access_token_789', got '%s'", resp.AccessToken)
	}
}
