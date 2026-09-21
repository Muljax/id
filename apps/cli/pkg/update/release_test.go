package update

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResolveAssetURL(t *testing.T) {
	assets := []Asset{
		{
			Name:               "muljax_linux_amd64.tar.gz",
			BrowserDownloadURL: "https://custom.download/muljax_linux_amd64.tar.gz",
		},
	}

	got := ResolveAssetURL("Muljax/cli", "v0.8.0", "muljax_linux_amd64.tar.gz", assets)
	if got != "https://custom.download/muljax_linux_amd64.tar.gz" {
		t.Fatalf("expected asset url from assets, got %q", got)
	}

	fallback := ResolveAssetURL("Muljax/cli", "v0.8.0", "muljax_darwin_arm64.tar.gz", assets)
	expectedFallback := "https://github.com/Muljax/cli/releases/download/v0.8.0/muljax_darwin_arm64.tar.gz"
	if fallback != expectedFallback {
		t.Fatalf("expected fallback %q, got %q", expectedFallback, fallback)
	}

	emptyRepoFallback := ResolveAssetURL("", "v0.8.0", "muljax_darwin_arm64.tar.gz", assets)
	if emptyRepoFallback != expectedFallback {
		t.Fatalf("expected empty repo fallback %q, got %q", expectedFallback, emptyRepoFallback)
	}
}

func TestResolveChecksumsURL(t *testing.T) {
	assets := []Asset{
		{
			Name:               "checksums.txt",
			BrowserDownloadURL: "https://custom.download/checksums.txt",
		},
	}

	got := ResolveChecksumsURL("Muljax/cli", "v0.8.0", assets)
	if got != "https://custom.download/checksums.txt" {
		t.Fatalf("expected checksums url from assets, got %q", got)
	}

	fallback := ResolveChecksumsURL("Muljax/cli", "v0.8.0", nil)
	expectedFallback := "https://github.com/Muljax/cli/releases/download/v0.8.0/checksums.txt"
	if fallback != expectedFallback {
		t.Fatalf("expected fallback %q, got %q", expectedFallback, fallback)
	}

	emptyRepoFallback := ResolveChecksumsURL("", "v0.8.0", nil)
	if emptyRepoFallback != expectedFallback {
		t.Fatalf("expected empty repo fallback %q, got %q", expectedFallback, emptyRepoFallback)
	}
}

func TestResolveRelease(t *testing.T) {
	expectedRel := Release{
		TagName: "v0.8.0",
		Assets: []Asset{
			{Name: "muljax_linux_amd64.tar.gz"},
		},
	}

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(expectedRel)
	}))
	defer ts.Close()

	client := ts.Client()
	rel, err := ResolveRelease(client, "test-owner/test-repo", "0.8.0")
	if err != nil {
		t.Fatalf("ResolveRelease with specificVersion returned error: %v", err)
	}
	if rel.TagName != "v0.8.0" {
		t.Fatalf("expected tag v0.8.0, got %s", rel.TagName)
	}
}
