package sshutil

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

type CertMetadata struct {
	SavedKeyID            string   `json:"saved_key_id,omitempty"`
	Endpoint              string   `json:"endpoint"`
	Serial                string   `json:"serial"`
	KeyID                 string   `json:"key_id"`
	Principals            []string `json:"principals"`
	ValidAfter            int64    `json:"valid_after"`
	ValidBefore           int64    `json:"valid_before"`
	Fingerprint           string   `json:"fingerprint,omitempty"`
	CaFingerprint         string   `json:"ca_fingerprint,omitempty"`
	LastRevocationCheckAt int64    `json:"last_revocation_check_at,omitempty"`
	IsRevoked             bool     `json:"is_revoked,omitempty"`
	RevocationLine        int      `json:"revocation_line,omitempty"`
}

func GetMetaPath(certPath string) string {
	return certPath + ".meta.json"
}

func ReadCertificate(certPath string) (*ssh.Certificate, error) {
	data, err := os.ReadFile(certPath)
	if err != nil {
		return nil, err
	}

	// Try ParseAuthorizedKey first
	pubKey, _, _, _, err := ssh.ParseAuthorizedKey(data)
	if err == nil {
		if cert, ok := pubKey.(*ssh.Certificate); ok {
			return cert, nil
		}
	}

	// Fallback: parse single-line certificate "<type> <base64> [comment]" via ssh.ParsePublicKey
	fields := strings.Fields(string(data))
	if len(fields) >= 2 {
		rawBytes, decErr := base64.StdEncoding.DecodeString(fields[1])
		if decErr != nil {
			return nil, fmt.Errorf("base64 decode error: %w", decErr)
		}
		parsedKey, parseErr := ssh.ParsePublicKey(rawBytes)
		if parseErr != nil {
			return nil, fmt.Errorf("ssh.ParsePublicKey error: %w", parseErr)
		}
		if cert, ok := parsedKey.(*ssh.Certificate); ok {
			return cert, nil
		}
		return nil, errors.New("parsed key is not a certificate")
	}

	return nil, errors.New("file is not a valid OpenSSH certificate")
}

func IsCertificateValid(cert *ssh.Certificate, minRemaining time.Duration) bool {
	if cert == nil {
		return false
	}

	now := time.Now()
	validAfter := time.Unix(int64(cert.ValidAfter), 0)
	validBefore := time.Unix(int64(cert.ValidBefore), 0)

	// Check if certificate has started
	if now.Before(validAfter) {
		return false
	}

	// Check if certificate has enough validity left
	if now.Add(minRemaining).After(validBefore) {
		return false
	}

	return true
}

func SaveCertificate(certPath string, content string) error {
	content = strings.TrimSpace(content) + "\n"
	return os.WriteFile(certPath, []byte(content), 0644)
}

func SaveCertMetadata(certPath string, meta *CertMetadata) error {
	data, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(GetMetaPath(certPath), data, 0644)
}

func LoadCertMetadata(certPath string) (*CertMetadata, error) {
	data, err := os.ReadFile(GetMetaPath(certPath))
	if err != nil {
		return nil, err
	}
	var meta CertMetadata
	if err := json.Unmarshal(data, &meta); err != nil {
		return nil, err
	}
	return &meta, nil
}

func UpdateCertRevocationStatus(certPath string, isRevoked bool, line int) error {
	meta, err := LoadCertMetadata(certPath)
	if err != nil {
		return err
	}
	meta.IsRevoked = isRevoked
	meta.RevocationLine = line
	meta.LastRevocationCheckAt = time.Now().Unix()
	return SaveCertMetadata(certPath, meta)
}
