package sshutil

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"golang.org/x/crypto/ssh"
)

const (
	DefaultKeyBaseName = "muljax_id_ed25519"
)

func GetSSHDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	sshDir := filepath.Join(home, ".ssh")
	if err := os.MkdirAll(sshDir, 0700); err != nil {
		return "", err
	}
	return sshDir, nil
}

func GetDefaultPaths(keyName string) (privPath string, pubPath string, certPath string, err error) {
	if keyName == "" {
		keyName = DefaultKeyBaseName
	}
	sshDir, err := GetSSHDir()
	if err != nil {
		return "", "", "", err
	}
	privPath = filepath.Join(sshDir, keyName)
	pubPath = privPath + ".pub"
	certPath = privPath + "-cert.pub"
	return privPath, pubPath, certPath, nil
}

// EnsureKeyPair ensures the local Ed25519 private and public keys exist.
// Returns the formatted OpenSSH single-line public key string.
func EnsureKeyPair(privPath string, pubPath string) (string, error) {
	if _, err := os.Stat(privPath); err == nil {
		_ = SecureFile(privPath)
		// Key exists; read public key
		pubBytes, err := os.ReadFile(pubPath)
		if err == nil {
			return strings.TrimSpace(string(pubBytes)), nil
		}
		// If public key is missing but private key exists, derive it
		privBytes, err := os.ReadFile(privPath)
		if err != nil {
			return "", fmt.Errorf("failed to read private key: %w", err)
		}
		rawKey, err := ssh.ParseRawPrivateKey(privBytes)
		if err != nil {
			return "", fmt.Errorf("failed to parse private key: %w", err)
		}
		edKey, ok := rawKey.(*ed25519.PrivateKey)
		if !ok {
			return "", errors.New("existing Muljax key is not Ed25519")
		}
		sshPub, err := ssh.NewPublicKey(edKey.Public())
		if err != nil {
			return "", err
		}
		pubStr := strings.TrimSpace(string(ssh.MarshalAuthorizedKey(sshPub)))
		_ = os.WriteFile(pubPath, []byte(pubStr+"\n"), 0644)
		return pubStr, nil
	}

	// Generate new Ed25519 key pair
	pubKey, privKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return "", fmt.Errorf("failed to generate Ed25519 key: %w", err)
	}

	// Marshal private key to OpenSSH format
	pemBlock, err := ssh.MarshalPrivateKey(privKey, "muljax-key")
	if err != nil {
		return "", fmt.Errorf("failed to marshal private key: %w", err)
	}

	if err := os.WriteFile(privPath, pem.EncodeToMemory(pemBlock), 0600); err != nil {
		return "", fmt.Errorf("failed to write private key: %w", err)
	}

	if err := SecureFile(privPath); err != nil {
		return "", fmt.Errorf("failed to set secure permissions on private key: %w", err)
	}

	// Marshal public key to OpenSSH authorized_keys format
	sshPub, err := ssh.NewPublicKey(pubKey)
	if err != nil {
		return "", err
	}
	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "local"
	}
	pubLine := fmt.Sprintf("%s muljax@%s\n", strings.TrimSpace(string(ssh.MarshalAuthorizedKey(sshPub))), hostname)

	if err := os.WriteFile(pubPath, []byte(pubLine), 0644); err != nil {
		return "", fmt.Errorf("failed to write public key: %w", err)
	}

	return strings.TrimSpace(pubLine), nil
}
