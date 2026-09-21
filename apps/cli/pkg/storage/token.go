package storage

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/muljax/cli/pkg/config"
	"github.com/zalando/go-keyring"
)

const (
	KeyringService = "muljax-id-cli"
	KeyringUser    = "tokens"
	TokensFileName = "tokens.json"
)

type TokenStorage struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	TokenType    string    `json:"token_type"`
	ExpiresAt    time.Time `json:"expires_at"`
	IDToken      string    `json:"id_token,omitempty"`
}

type TokenClaims struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Iss   string `json:"iss"`
}

func (t *TokenStorage) ParseClaims() *TokenClaims {
	raw := t.IDToken
	if raw == "" {
		raw = t.AccessToken
	}
	if raw == "" {
		return nil
	}

	parts := strings.Split(raw, ".")
	if len(parts) < 2 {
		return nil
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		payload, err = base64.URLEncoding.DecodeString(parts[1])
		if err != nil {
			return nil
		}
	}

	var claims TokenClaims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil
	}

	return &claims
}

func (t *TokenStorage) IsAccessValid() bool {
	if t.AccessToken == "" {
		return false
	}
	// Buffer of 60 seconds
	return time.Now().Add(60 * time.Second).Before(t.ExpiresAt)
}

func SaveTokens(ts *TokenStorage) error {
	data, err := json.Marshal(ts)
	if err != nil {
		return err
	}

	// First try OS Keyring
	err = keyring.Set(KeyringService, KeyringUser, string(data))
	if err == nil {
		// Also clean up or sync file fallback
		_ = saveToFile(data)
		return nil
	}

	// Fallback to secure file if keyring fails (e.g. headless, no DBus, container)
	return saveToFile(data)
}

func LoadTokens() (*TokenStorage, error) {
	// Try OS Keyring first
	val, err := keyring.Get(KeyringService, KeyringUser)
	if err == nil && val != "" {
		var ts TokenStorage
		if err := json.Unmarshal([]byte(val), &ts); err == nil {
			return &ts, nil
		}
	}

	// Fallback to file storage
	return loadFromFile()
}

func ClearTokens() error {
	_ = keyring.Delete(KeyringService, KeyringUser)

	dir, err := config.GetConfigDir()
	if err == nil {
		filePath := filepath.Join(dir, TokensFileName)
		_ = os.Remove(filePath)
	}
	return nil
}

func saveToFile(data []byte) error {
	dir, err := config.GetConfigDir()
	if err != nil {
		return err
	}
	filePath := filepath.Join(dir, TokensFileName)
	return os.WriteFile(filePath, data, 0600)
}

func loadFromFile() (*TokenStorage, error) {
	dir, err := config.GetConfigDir()
	if err != nil {
		return nil, err
	}
	filePath := filepath.Join(dir, TokensFileName)
	data, err := os.ReadFile(filePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, errors.New("no saved tokens found, please run 'muljax id auth login' or 'muljax ssh login'")
		}
		return nil, err
	}

	var ts TokenStorage
	if err := json.Unmarshal(data, &ts); err != nil {
		return nil, err
	}
	return &ts, nil
}
