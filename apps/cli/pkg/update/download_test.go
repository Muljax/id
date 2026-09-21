package update

import (
	"crypto/sha256"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestVerifyChecksum(t *testing.T) {
	tmpDir := t.TempDir()

	content := []byte("binary archive content test")
	hasher := sha256.New()
	hasher.Write(content)
	expectedHash := fmt.Sprintf("%x", hasher.Sum(nil))

	archiveName := "muljax_linux_amd64.tar.gz"
	archivePath := filepath.Join(tmpDir, archiveName)
	if err := os.WriteFile(archivePath, content, 0644); err != nil {
		t.Fatalf("failed to write test archive: %v", err)
	}

	checksumsContent := fmt.Sprintf("%s  %s\n%s  *%s\n", "1234567890abcdef", "other_file.tar.gz", expectedHash, archiveName)
	checksumsPath := filepath.Join(tmpDir, "checksums.txt")
	if err := os.WriteFile(checksumsPath, []byte(checksumsContent), 0644); err != nil {
		t.Fatalf("failed to write checksums.txt: %v", err)
	}

	if err := VerifyChecksum(archivePath, checksumsPath, archiveName); err != nil {
		t.Fatalf("VerifyChecksum failed: %v", err)
	}

	badChecksumContent := fmt.Sprintf("%s  %s\n", "0000000000000000000000000000000000000000000000000000000000000000", archiveName)
	badChecksumsPath := filepath.Join(tmpDir, "bad_checksums.txt")
	if err := os.WriteFile(badChecksumsPath, []byte(badChecksumContent), 0644); err != nil {
		t.Fatalf("failed to write bad checksums: %v", err)
	}
	if err := VerifyChecksum(archivePath, badChecksumsPath, archiveName); err == nil {
		t.Fatal("expected checksum mismatch error, got nil")
	}

	emptyChecksumsPath := filepath.Join(tmpDir, "empty_checksums.txt")
	if err := os.WriteFile(emptyChecksumsPath, []byte(""), 0644); err != nil {
		t.Fatalf("failed to write empty checksums: %v", err)
	}
	if err := VerifyChecksum(archivePath, emptyChecksumsPath, archiveName); err == nil {
		t.Fatal("expected archive not found error, got nil")
	}
}

func TestDownloadFile(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/file.txt" {
			_, _ = w.Write([]byte("download payload test"))
			return
		}
		http.NotFound(w, r)
	}))
	defer ts.Close()

	tmpDir := t.TempDir()
	destPath := filepath.Join(tmpDir, "downloaded.txt")

	if err := DownloadFile(ts.Client(), ts.URL+"/file.txt", destPath); err != nil {
		t.Fatalf("DownloadFile failed: %v", err)
	}

	data, err := os.ReadFile(destPath)
	if err != nil {
		t.Fatalf("failed to read downloaded file: %v", err)
	}
	if string(data) != "download payload test" {
		t.Fatalf("expected 'download payload test', got %q", string(data))
	}

	if err := DownloadFile(ts.Client(), ts.URL+"/notfound", destPath); err == nil {
		t.Fatal("expected error downloading missing file, got nil")
	}
}
