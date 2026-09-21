package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/storage"
	"github.com/muljax/cli/pkg/ui"
)

const (
	DefaultScopes   = "openid profile email offline_access ssh:cert:issue ssh:ca:read ssh:keys:manage"
	DeviceGrantType = "urn:ietf:params:oauth:grant-type:device_code"
)

// DeviceCodeResponse represents the response from RFC 8628 §3.2 Device Authorization Endpoint.
type DeviceCodeResponse struct {
	DeviceCode              string `json:"device_code"`
	UserCode                string `json:"user_code"`
	VerificationURI         string `json:"verification_uri"`
	VerificationURIComplete string `json:"verification_uri_complete,omitempty"`
	ExpiresIn               int    `json:"expires_in"`
	Interval                int    `json:"interval"`
	Error                   string `json:"error,omitempty"`
	ErrorDesc               string `json:"error_description,omitempty"`
	ErrorURI                string `json:"error_uri,omitempty"`
}

// TokenResponse represents the standard OAuth 2.0 / OIDC token endpoint response.
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	Scope        string `json:"scope,omitempty"`
	IDToken      string `json:"id_token,omitempty"`
	Error        string `json:"error,omitempty"`
	ErrorDesc    string `json:"error_description,omitempty"`
	ErrorURI     string `json:"error_uri,omitempty"`
}

// RequestDeviceCode initiates an OAuth 2.0 Device Authorization request (RFC 8628 §3.1).
func RequestDeviceCode(cfg *config.Config, scope string) (*DeviceCodeResponse, error) {
	deviceURL := strings.TrimRight(cfg.Endpoint, "/") + "/oauth/device/code"

	form := url.Values{}
	form.Set("client_id", cfg.ClientID)
	if scope != "" {
		form.Set("scope", scope)
	} else {
		form.Set("scope", DefaultScopes)
	}

	req, err := http.NewRequest(http.MethodPost, deviceURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to authorization server: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var dcr DeviceCodeResponse
	if err := json.Unmarshal(body, &dcr); err != nil {
		return nil, fmt.Errorf("invalid device authorization response (status %d): %s", resp.StatusCode, string(body))
	}

	if resp.StatusCode != http.StatusOK || dcr.Error != "" {
		if dcr.Error != "" {
			return nil, &OAuthError{
				Code:        dcr.Error,
				Description: dcr.ErrorDesc,
				URI:         dcr.ErrorURI,
				StatusCode:  resp.StatusCode,
			}
		}
		return nil, fmt.Errorf("device authorization failed with status %d: %s", resp.StatusCode, string(body))
	}

	if dcr.DeviceCode == "" || dcr.UserCode == "" {
		return nil, errors.New("incomplete device authorization response: missing device_code or user_code")
	}

	if dcr.Interval <= 0 {
		dcr.Interval = 5
	}
	if dcr.ExpiresIn <= 0 {
		dcr.ExpiresIn = 600
	}

	return &dcr, nil
}

// PollDeviceToken polls the OAuth token endpoint until the user confirms or denies the device authorization.
func PollDeviceToken(ctx context.Context, cfg *config.Config, deviceCode string, interval, expiresIn int) (*TokenResponse, error) {
	tokenURL := strings.TrimRight(cfg.Endpoint, "/") + "/oauth/token"
	client := &http.Client{Timeout: 15 * time.Second}

	currentInterval := interval
	if currentInterval <= 0 {
		currentInterval = 5
	}

	deadline := time.Now().Add(time.Duration(expiresIn) * time.Second)

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(time.Duration(currentInterval) * time.Second):
		}

		if time.Now().After(deadline) {
			return nil, &OAuthError{
				Code:        ErrCodeExpiredToken,
				Description: "Device authorization timed out before user confirmation.",
			}
		}

		form := url.Values{}
		form.Set("grant_type", DeviceGrantType)
		form.Set("client_id", cfg.ClientID)
		form.Set("device_code", deviceCode)

		req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, strings.NewReader(form.Encode()))
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Cache-Control", "no-cache")
		req.Header.Set("Pragma", "no-cache")

		resp, err := client.Do(req)
		if err != nil {
			// Transient network glitch during polling, retry next tick
			continue
		}

		body, err := io.ReadAll(resp.Body)
		_ = resp.Body.Close()
		if err != nil {
			continue
		}

		var tr TokenResponse
		if err := json.Unmarshal(body, &tr); err != nil {
			continue
		}

		if resp.StatusCode == http.StatusOK && tr.AccessToken != "" {
			return &tr, nil
		}

		if tr.Error != "" {
			switch tr.Error {
			case ErrCodeAuthorizationPending:
				// Continue polling
				continue
			case ErrCodeSlowDown:
				// RFC 8628 §3.5: client must add 5 seconds to polling interval
				currentInterval += 5
				continue
			case ErrCodeAccessDenied:
				return nil, &OAuthError{
					Code:        ErrCodeAccessDenied,
					Description: "User rejected the device authorization request.",
					StatusCode:  resp.StatusCode,
				}
			case ErrCodeExpiredToken:
				return nil, &OAuthError{
					Code:        ErrCodeExpiredToken,
					Description: "The device activation code has expired.",
					StatusCode:  resp.StatusCode,
				}
			default:
				return nil, &OAuthError{
					Code:        tr.Error,
					Description: tr.ErrorDesc,
					URI:         tr.ErrorURI,
					StatusCode:  resp.StatusCode,
				}
			}
		}
	}
}

// Login executes the full RFC 8628 Device Authorization flow, prompts the user, and persists session tokens.
func Login(cfg *config.Config) (*storage.TokenStorage, error) {
	dcr, err := RequestDeviceCode(cfg, DefaultScopes)
	if err != nil {
		return nil, fmt.Errorf("failed to request device code: %w", err)
	}

	verificationTarget := dcr.VerificationURI
	if dcr.VerificationURIComplete != "" {
		verificationTarget = dcr.VerificationURIComplete
	}

	printManualInstructions := func() {
		fmt.Printf("\n%s Manual Device Activation:\n", ui.InfoIcon())
		fmt.Printf("  1. Open the following URL on any device or browser:\n")
		fmt.Printf("     %s\n\n", ui.Cyan(dcr.VerificationURI))
		fmt.Printf("  2. Enter the activation code:\n")
		fmt.Printf("     %s\n\n", ui.Bold(ui.Cyan(dcr.UserCode)))
		if dcr.VerificationURIComplete != "" {
			fmt.Printf("  Or open directly: %s\n\n", ui.Cyan(dcr.VerificationURIComplete))
		}
	}

	browserErr := openBrowser(verificationTarget)
	if browserErr != nil {
		printManualInstructions()
	} else {
		fmt.Printf("\n%s Check your browser to complete authentication.\n", ui.InfoIcon())
		fmt.Printf("  If it did not open, press %s to view manual instructions.\n\n", ui.Bold("Enter"))

		go func() {
			var b [1]byte
			_, _ = os.Stdin.Read(b[:])
			printManualInstructions()
		}()
	}

	fmt.Printf("%s Waiting for authorization in your browser...\n", ui.InfoIcon())

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(dcr.ExpiresIn)*time.Second)
	defer cancel()

	tokens, err := PollDeviceToken(ctx, cfg, dcr.DeviceCode, dcr.Interval, dcr.ExpiresIn)
	if err != nil {
		return nil, err
	}

	expiresIn := tokens.ExpiresIn
	if expiresIn <= 0 {
		expiresIn = 3600
	}

	ts := &storage.TokenStorage{
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		TokenType:    tokens.TokenType,
		ExpiresAt:    time.Now().Add(time.Duration(expiresIn) * time.Second),
		IDToken:      tokens.IDToken,
	}

	if err := storage.SaveTokens(ts); err != nil {
		return nil, fmt.Errorf("failed to save tokens: %w", err)
	}

	return ts, nil
}

// RefreshAccessToken exchanges a valid refresh token for a fresh access token.
func RefreshAccessToken(cfg *config.Config, ts *storage.TokenStorage) (*storage.TokenStorage, error) {
	if ts.RefreshToken == "" {
		return nil, errors.New("no refresh token available, re-authentication required")
	}

	tokenURL := strings.TrimRight(cfg.Endpoint, "/") + "/oauth/token"

	form := url.Values{}
	form.Set("grant_type", "refresh_token")
	form.Set("client_id", cfg.ClientID)
	form.Set("refresh_token", ts.RefreshToken)

	req, err := http.NewRequest(http.MethodPost, tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var tr TokenResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return nil, fmt.Errorf("invalid token refresh response (status %d): %s", resp.StatusCode, string(body))
	}

	if resp.StatusCode != http.StatusOK || tr.Error != "" {
		if tr.Error != "" {
			return nil, &OAuthError{
				Code:        tr.Error,
				Description: tr.ErrorDesc,
				URI:         tr.ErrorURI,
				StatusCode:  resp.StatusCode,
			}
		}
		return nil, fmt.Errorf("token refresh failed with status %d: %s", resp.StatusCode, string(body))
	}

	if tr.AccessToken == "" {
		return nil, fmt.Errorf("no access token in refresh response (status %d)", resp.StatusCode)
	}

	expiresIn := tr.ExpiresIn
	if expiresIn <= 0 {
		expiresIn = 3600
	}

	ts.AccessToken = tr.AccessToken
	if tr.RefreshToken != "" {
		ts.RefreshToken = tr.RefreshToken
	}
	ts.TokenType = tr.TokenType
	ts.ExpiresAt = time.Now().Add(time.Duration(expiresIn) * time.Second)

	if err := storage.SaveTokens(ts); err != nil {
		return nil, fmt.Errorf("failed to persist refreshed tokens: %w", err)
	}

	return ts, nil
}

// ClientCredentialsToken retrieves an OAuth2 token using the client_credentials grant type per RFC 6749 §4.4.
func ClientCredentialsToken(cfg *config.Config, clientID, clientSecret, scope string) (*TokenResponse, error) {
	tokenURL := strings.TrimRight(cfg.Endpoint, "/") + "/oauth/token"

	form := url.Values{}
	form.Set("grant_type", "client_credentials")
	if clientID != "" {
		form.Set("client_id", clientID)
	} else {
		form.Set("client_id", cfg.ClientID)
	}
	if clientSecret != "" {
		form.Set("client_secret", clientSecret)
	}
	if scope != "" {
		form.Set("scope", scope)
	}

	req, err := http.NewRequest(http.MethodPost, tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Cache-Control", "no-cache")
	req.Header.Set("Pragma", "no-cache")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute client credentials request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var tr TokenResponse
	if err := json.Unmarshal(body, &tr); err != nil {
		return nil, fmt.Errorf("invalid client credentials response (status %d): %s", resp.StatusCode, string(body))
	}

	if resp.StatusCode != http.StatusOK || tr.Error != "" {
		if tr.Error != "" {
			return nil, &OAuthError{
				Code:        tr.Error,
				Description: tr.ErrorDesc,
				URI:         tr.ErrorURI,
				StatusCode:  resp.StatusCode,
			}
		}
		return nil, fmt.Errorf("client credentials request failed with status %d: %s", resp.StatusCode, string(body))
	}

	if tr.AccessToken == "" {
		return nil, fmt.Errorf("no access token in client credentials response (status %d)", resp.StatusCode)
	}

	return &tr, nil
}
