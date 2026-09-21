package update

import (
	"crypto/sha256"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func DownloadFile(client *http.Client, url, destPath string) error {
	if client == nil {
		client = DefaultHTTPClient
	}
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "muljax-cli-updater")
	if token := GetGitHubToken(); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected HTTP status %d downloading %s", resp.StatusCode, url)
	}

	out, err := os.Create(destPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}

func VerifyChecksum(archivePath, checksumsPath, archiveName string) error {
	f, err := os.Open(archivePath)
	if err != nil {
		return err
	}
	defer f.Close()

	hasher := sha256.New()
	if _, err := io.Copy(hasher, f); err != nil {
		return err
	}
	actualChecksum := fmt.Sprintf("%x", hasher.Sum(nil))

	checksumData, err := os.ReadFile(checksumsPath)
	if err != nil {
		return err
	}

	lines := strings.Split(string(checksumData), "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		expectedHash := fields[0]
		fileName := strings.TrimPrefix(fields[1], "*")

		if fileName == archiveName || filepath.Base(fileName) == archiveName {
			if !strings.EqualFold(expectedHash, actualChecksum) {
				return fmt.Errorf("checksum mismatch for %s:\n  expected: %s\n  got:      %s", archiveName, expectedHash, actualChecksum)
			}
			return nil
		}
	}

	return fmt.Errorf("archive %s not found in checksums.txt", archiveName)
}
