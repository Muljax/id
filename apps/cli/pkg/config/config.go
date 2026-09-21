package config

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

const (
	DefaultEndpoint    = "http://localhost:8787"
	DefaultClientID    = "muljax-cli"
	DefaultKeyName     = "muljax_id_ed25519"
	DefaultHostPattern = "*.internal"
	AppDirName         = "muljax"
	ConfigFile         = "config.json"
)

type Config struct {
	Endpoint    string `json:"endpoint"`
	ClientID    string `json:"client_id"`
	KeyName     string `json:"key_name,omitempty"`
	HostPattern string `json:"host_pattern,omitempty"`
}

func GetConfigDir() (string, error) {
	userConfigDir, err := os.UserConfigDir()
	if err != nil {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		userConfigDir = filepath.Join(home, ".config")
	}
	dir := filepath.Join(userConfigDir, AppDirName)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return "", err
	}
	return dir, nil
}

func Load() (*Config, error) {
	dir, err := GetConfigDir()
	if err != nil {
		return &Config{
			Endpoint: DefaultEndpoint,
			ClientID: DefaultClientID,
			KeyName:  DefaultKeyName,
		}, nil
	}

	path := filepath.Join(dir, ConfigFile)
	data, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return &Config{
				Endpoint: DefaultEndpoint,
				ClientID: DefaultClientID,
				KeyName:  DefaultKeyName,
			}, nil
		}
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	if cfg.Endpoint == "" {
		cfg.Endpoint = DefaultEndpoint
	}
	if cfg.ClientID == "" {
		cfg.ClientID = DefaultClientID
	}
	if cfg.KeyName == "" {
		cfg.KeyName = DefaultKeyName
	}

	return &cfg, nil
}

func (c *Config) Save() error {
	dir, err := GetConfigDir()
	if err != nil {
		return err
	}

	path := filepath.Join(dir, ConfigFile)
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(path, data, 0600)
}
