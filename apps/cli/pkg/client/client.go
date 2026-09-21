package client

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/muljax/cli/pkg/auth"
	"github.com/muljax/cli/pkg/config"
	"github.com/muljax/cli/pkg/storage"
)

type Client struct {
	Config     *config.Config
	HTTPClient *http.Client
}

type IssueCertRequest struct {
	SavedKeyID string   `json:"savedKeyId,omitempty"`
	PublicKey  string   `json:"publicKey,omitempty"`
	TTL        int      `json:"ttl,omitempty"`
	Principals []string `json:"principals,omitempty"`
	Comment    string   `json:"comment,omitempty"`
}

type IssueCertResponse struct {
	Certificate   string   `json:"certificate"`
	Serial        string   `json:"serial"`
	KeyID         string   `json:"keyId"`
	Principals    []string `json:"principals"`
	ValidAfter    int64    `json:"validAfter"`
	ValidBefore   int64    `json:"validBefore"`
	Fingerprint   string   `json:"fingerprint"`
	CaFingerprint string   `json:"caFingerprint"`
	Error         string   `json:"error,omitempty"`
	Message       string   `json:"message,omitempty"`
}

type SshKey struct {
	ID          string `json:"id"`
	UserID      string `json:"userId"`
	Name        string `json:"name"`
	PublicKey   string `json:"publicKey"`
	Fingerprint string `json:"fingerprint"`
	CreatedAt   int64  `json:"createdAt"`
	LastUsedAt  *int64 `json:"lastUsedAt"`
}

type ListKeysResponse struct {
	Keys    []SshKey `json:"keys"`
	Error   string   `json:"error,omitempty"`
	Message string   `json:"message,omitempty"`
}

type RegisterKeyRequest struct {
	Name      string `json:"name"`
	PublicKey string `json:"publicKey"`
}

type RegisterKeyResponse struct {
	Key     SshKey `json:"key"`
	Error   string `json:"error,omitempty"`
	Message string `json:"message,omitempty"`
}

func New(cfg *config.Config) *Client {
	return &Client{
		Config: cfg,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// GetValidAccessToken returns an active access token, refreshing it if necessary.
func (c *Client) GetValidAccessToken() (string, error) {
	ts, err := storage.LoadTokens()
	if err != nil {
		return "", err
	}

	if ts.IsAccessValid() {
		return ts.AccessToken, nil
	}

	// Token is expired or expiring in < 60s, refresh it
	refreshed, err := auth.RefreshAccessToken(c.Config, ts)
	if err != nil {
		var oauthErr *auth.OAuthError
		if errors.As(err, &oauthErr) {
			if oauthErr.IsInvalidGrant() {
				return "", fmt.Errorf("session expired, revoked, or restricted during lockdown (%s); please run 'muljax id auth login' or 'muljax ssh login'", oauthErr.Code)
			}
			if oauthErr.IsTemporarilyUnavailable() {
				return "", fmt.Errorf("Muljax server is temporarily unavailable or in maintenance/lockdown mode: %w", oauthErr)
			}
			if oauthErr.IsAccessDenied() {
				return "", fmt.Errorf("access denied by server policy: %w", oauthErr)
			}
		}
		return "", fmt.Errorf("session expired or refresh failed (%w); please run 'muljax id auth login' or 'muljax ssh login'", err)
	}

	return refreshed.AccessToken, nil
}

func (c *Client) getSSHUrls(subpath string) []string {
	base := strings.TrimRight(c.Config.Endpoint, "/")
	if strings.HasSuffix(base, "/api") {
		return []string{
			base + "/ssh" + subpath,
			strings.TrimSuffix(base, "/api") + "/ssh" + subpath,
		}
	}
	return []string{
		base + "/api/ssh" + subpath,
		base + "/ssh" + subpath,
	}
}

func (c *Client) ListKeys() ([]SshKey, error) {
	accessToken, err := c.GetValidAccessToken()
	if err != nil {
		return nil, err
	}

	urls := c.getSSHUrls("/keys")
	var lastErr error

	for _, endpoint := range urls {
		req, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err != nil {
			return nil, err
		}

		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Bearer "+accessToken)

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}

		respBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode == http.StatusNotFound {
			lastErr = fmt.Errorf("keys endpoint not found (HTTP 404) at %s", endpoint)
			continue
		}

		var listResp ListKeysResponse
		if err := json.Unmarshal(respBytes, &listResp); err != nil {
			return nil, fmt.Errorf("failed to parse keys response (HTTP %d): %s", resp.StatusCode, string(respBytes))
		}

		if resp.StatusCode != http.StatusOK {
			msg := listResp.Error
			if listResp.Message != "" {
				msg = listResp.Message
			}
			if msg == "" {
				msg = fmt.Sprintf("HTTP %d", resp.StatusCode)
			}
			return nil, fmt.Errorf("failed to list SSH keys: %s", msg)
		}

		return listResp.Keys, nil
	}

	return nil, lastErr
}

func (c *Client) RegisterKey(name, pubKey string) (*SshKey, error) {
	accessToken, err := c.GetValidAccessToken()
	if err != nil {
		return nil, err
	}

	reqBody := RegisterKeyRequest{
		Name:      name,
		PublicKey: strings.TrimSpace(pubKey),
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	urls := c.getSSHUrls("/keys")
	var lastErr error

	for _, endpoint := range urls {
		req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Bearer "+accessToken)

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}

		respBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode == http.StatusNotFound {
			lastErr = fmt.Errorf("register key endpoint not found (HTTP 404) at %s", endpoint)
			continue
		}

		var regResp RegisterKeyResponse
		if err := json.Unmarshal(respBytes, &regResp); err != nil {
			return nil, fmt.Errorf("failed to parse register key response (HTTP %d): %s", resp.StatusCode, string(respBytes))
		}

		if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
			msg := regResp.Error
			if regResp.Message != "" {
				msg = regResp.Message
			}
			if msg == "" {
				msg = fmt.Sprintf("HTTP %d", resp.StatusCode)
			}
			return nil, fmt.Errorf("failed to register SSH key: %s", msg)
		}

		return &regResp.Key, nil
	}

	return nil, lastErr
}

func (c *Client) DeleteKey(keyID string) error {
	accessToken, err := c.GetValidAccessToken()
	if err != nil {
		return err
	}

	urls := c.getSSHUrls("/keys/" + keyID)
	var lastErr error

	for _, endpoint := range urls {
		req, err := http.NewRequest(http.MethodDelete, endpoint, nil)
		if err != nil {
			return err
		}

		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Bearer "+accessToken)

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}
		resp.Body.Close()

		if resp.StatusCode == http.StatusNotFound {
			lastErr = fmt.Errorf("key not found (HTTP 404)")
			continue
		}

		if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
			return fmt.Errorf("failed to delete SSH key (HTTP %d)", resp.StatusCode)
		}

		return nil
	}

	return lastErr
}

func normalizeKeyForComparison(keyStr string) string {
	parts := strings.Fields(strings.TrimSpace(keyStr))
	if len(parts) >= 2 {
		return parts[0] + " " + parts[1]
	}
	return strings.TrimSpace(keyStr)
}

func (c *Client) EnsureSavedKey(name, pubKey string) (string, error) {
	normPub := normalizeKeyForComparison(pubKey)

	// 1. Check existing keys
	keys, err := c.ListKeys()
	if err == nil {
		for _, k := range keys {
			if normalizeKeyForComparison(k.PublicKey) == normPub {
				return k.ID, nil
			}
		}
	}

	// 2. Register key if not found
	keyName := strings.TrimSpace(name)
	if keyName == "" {
		hostname, err := os.Hostname()
		if err == nil && hostname != "" {
			keyName = fmt.Sprintf("%s (muljax-cli)", hostname)
		} else {
			keyName = "muljax-cli-key"
		}
	}

	registered, err := c.RegisterKey(keyName, pubKey)
	if err == nil && registered.ID != "" {
		return registered.ID, nil
	}

	// 3. If register failed (e.g. 409 conflict), retry list to find it
	if keysRetry, listErr := c.ListKeys(); listErr == nil {
		for _, k := range keysRetry {
			if normalizeKeyForComparison(k.PublicKey) == normPub {
				return k.ID, nil
			}
		}
	}

	if err != nil {
		return "", err
	}
	return "", errors.New("failed to ensure saved SSH key")
}

func (c *Client) IssueCertificate(savedKeyID string, pubKey string, ttl int, principals []string) (*IssueCertResponse, error) {
	accessToken, err := c.GetValidAccessToken()
	if err != nil {
		return nil, err
	}

	reqBody := IssueCertRequest{
		SavedKeyID: savedKeyID,
		PublicKey:  pubKey,
		TTL:        ttl,
		Principals: principals,
		Comment:    "muljax-cert",
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	urls := c.getSSHUrls("/certs/issue")
	var lastErr error

	for _, endpoint := range urls {
		req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
		if err != nil {
			return nil, err
		}

		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Authorization", "Bearer "+accessToken)

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			lastErr = fmt.Errorf("network error requesting certificate: %w", err)
			continue
		}

		respBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode == http.StatusNotFound {
			// Try next endpoint in case route is mounted differently
			lastErr = fmt.Errorf("certificate endpoint not found (HTTP 404) at %s", endpoint)
			continue
		}

		var certResp IssueCertResponse
		if err := json.Unmarshal(respBytes, &certResp); err != nil {
			return nil, fmt.Errorf("failed to parse certificate response (HTTP %d): %s", resp.StatusCode, string(respBytes))
		}

		if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
			msg := certResp.Error
			if certResp.Message != "" {
				msg = certResp.Message
			}
			if msg == "" {
				msg = fmt.Sprintf("HTTP %d", resp.StatusCode)
			}
			return nil, fmt.Errorf("certificate issuance failed: %s", msg)
		}

		if certResp.Certificate == "" {
			return nil, errors.New("certificate issuance returned empty certificate payload")
		}

		return &certResp, nil
	}

	return nil, lastErr
}

func (c *Client) GetCaPublicKey() (string, error) {
	urls := c.getSSHUrls("/ca/public-key?format=raw")
	var lastErr error

	for _, endpoint := range urls {
		req, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err != nil {
			return "", err
		}

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			lastErr = err
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode == http.StatusNotFound {
			lastErr = fmt.Errorf("CA public key endpoint not found (HTTP 404) at %s", endpoint)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			return "", fmt.Errorf("failed to fetch CA public key (status %d): %s", resp.StatusCode, string(bodyBytes))
		}

		return strings.TrimSpace(string(bodyBytes)), nil
	}

	return "", lastErr
}

// CheckRevocation queries the raw format revoked keys endpoint (/ca/revoked-keys?format=raw)
// and checks whether the provided certificate serial number is in the revocation list.
func (c *Client) CheckRevocation(serial string) (bool, int, error) {
	urls := c.getSSHUrls("/ca/revoked-keys?format=raw")
	var lastErr error

	target := strings.TrimSpace(serial)

	for _, endpoint := range urls {
		req, err := http.NewRequest(http.MethodGet, endpoint, nil)
		if err != nil {
			return false, 0, err
		}

		if ts, err := storage.LoadTokens(); err == nil && ts.AccessToken != "" {
			req.Header.Set("Authorization", "Bearer "+ts.AccessToken)
		}

		client := &http.Client{Timeout: 4 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
			continue
		}

		bodyBytes, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode == http.StatusNotFound {
			lastErr = fmt.Errorf("revoked keys endpoint not found (HTTP 404) at %s", endpoint)
			continue
		}

		if resp.StatusCode != http.StatusOK {
			return false, 0, fmt.Errorf("failed to fetch revoked keys (HTTP %d): %s", resp.StatusCode, string(bodyBytes))
		}

		lines := strings.Split(string(bodyBytes), "\n")
		for i, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "#") || trimmed == "" {
				continue
			}
			if strings.HasPrefix(trimmed, "serial:") {
				revokedSerial := strings.TrimSpace(strings.TrimPrefix(trimmed, "serial:"))
				if revokedSerial == target {
					return true, i + 1, nil // Serial found on revocation list at line (1-indexed)
				}
			}
		}

		return false, 0, nil // Not revoked
	}

	return false, 0, lastErr
}
