package update

import (
	"archive/tar"
	"archive/zip"
	"bytes"
	"compress/gzip"
	"os"
	"path/filepath"
	"testing"
)

func createTestTarGz(t *testing.T, entries map[string]string) []byte {
	var buf bytes.Buffer
	gw := gzip.NewWriter(&buf)
	tw := tar.NewWriter(gw)

	for name, content := range entries {
		hdr := &tar.Header{
			Name:     name,
			Mode:     0755,
			Size:     int64(len(content)),
			Typeflag: tar.TypeReg,
		}
		if err := tw.WriteHeader(hdr); err != nil {
			t.Fatalf("failed to write tar header: %v", err)
		}
		if _, err := tw.Write([]byte(content)); err != nil {
			t.Fatalf("failed to write tar body: %v", err)
		}
	}

	if err := tw.Close(); err != nil {
		t.Fatalf("failed to close tar writer: %v", err)
	}
	if err := gw.Close(); err != nil {
		t.Fatalf("failed to close gzip writer: %v", err)
	}

	return buf.Bytes()
}

func createTestZip(t *testing.T, entries map[string]string) []byte {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	for name, content := range entries {
		w, err := zw.Create(name)
		if err != nil {
			t.Fatalf("failed to create zip entry: %v", err)
		}
		if _, err := w.Write([]byte(content)); err != nil {
			t.Fatalf("failed to write zip body: %v", err)
		}
	}

	if err := zw.Close(); err != nil {
		t.Fatalf("failed to close zip writer: %v", err)
	}

	return buf.Bytes()
}

func TestExtractTarGz(t *testing.T) {
	tmpDir := t.TempDir()
	archiveBytes := createTestTarGz(t, map[string]string{
		"README.md": "readme content",
		"muljax":    "binary content",
	})

	archivePath := filepath.Join(tmpDir, "muljax_linux_amd64.tar.gz")
	if err := os.WriteFile(archivePath, archiveBytes, 0644); err != nil {
		t.Fatalf("failed to write archive: %v", err)
	}

	destDir := filepath.Join(tmpDir, "extracted")
	binPath, err := ExtractArchive(archivePath, destDir, "linux")
	if err != nil {
		t.Fatalf("ExtractArchive failed: %v", err)
	}

	if filepath.Base(binPath) != "muljax" {
		t.Fatalf("expected binary name 'muljax', got %q", filepath.Base(binPath))
	}

	content, err := os.ReadFile(binPath)
	if err != nil {
		t.Fatalf("failed to read extracted binary: %v", err)
	}
	if string(content) != "binary content" {
		t.Fatalf("expected binary content 'binary content', got %q", string(content))
	}

	missingBinBytes := createTestTarGz(t, map[string]string{
		"README.md": "readme only",
	})
	missingArchivePath := filepath.Join(tmpDir, "missing.tar.gz")
	if err := os.WriteFile(missingArchivePath, missingBinBytes, 0644); err != nil {
		t.Fatalf("failed to write missing archive: %v", err)
	}
	if _, err := ExtractArchive(missingArchivePath, filepath.Join(tmpDir, "dest2"), "linux"); err == nil {
		t.Fatal("expected error when binary missing from tar, got nil")
	}
}

func TestExtractZip(t *testing.T) {
	tmpDir := t.TempDir()
	archiveBytes := createTestZip(t, map[string]string{
		"README.txt": "readme content",
		"muljax.exe": "windows binary content",
	})

	archivePath := filepath.Join(tmpDir, "muljax_windows_amd64.zip")
	if err := os.WriteFile(archivePath, archiveBytes, 0644); err != nil {
		t.Fatalf("failed to write archive: %v", err)
	}

	destDir := filepath.Join(tmpDir, "extracted")
	binPath, err := ExtractArchive(archivePath, destDir, "windows")
	if err != nil {
		t.Fatalf("ExtractArchive failed: %v", err)
	}

	if filepath.Base(binPath) != "muljax.exe" {
		t.Fatalf("expected binary name 'muljax.exe', got %q", filepath.Base(binPath))
	}

	content, err := os.ReadFile(binPath)
	if err != nil {
		t.Fatalf("failed to read extracted binary: %v", err)
	}
	if string(content) != "windows binary content" {
		t.Fatalf("expected 'windows binary content', got %q", string(content))
	}

	missingBinBytes := createTestZip(t, map[string]string{
		"README.txt": "readme only",
	})
	missingArchivePath := filepath.Join(tmpDir, "missing.zip")
	if err := os.WriteFile(missingArchivePath, missingBinBytes, 0644); err != nil {
		t.Fatalf("failed to write missing zip: %v", err)
	}
	if _, err := ExtractArchive(missingArchivePath, filepath.Join(tmpDir, "dest3"), "windows"); err == nil {
		t.Fatal("expected error when binary missing from zip, got nil")
	}
}
