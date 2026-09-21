package update

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

const DefaultReleaseRepo = "Muljax/cli"

var DefaultHTTPClient = &http.Client{
	Timeout: 60 * time.Second,
}

type Release struct {
	TagName    string  `json:"tag_name"`
	Name       string  `json:"name"`
	Body       string  `json:"body"`
	Draft      bool    `json:"draft"`
	Prerelease bool    `json:"prerelease"`
	Assets     []Asset `json:"assets"`
}

type Asset struct {
	Name               string `json:"name"`
	Size               int64  `json:"size"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

func GetGitHubToken() string {
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		return token
	}
	return os.Getenv("GH_TOKEN")
}

func ResolveRelease(client *http.Client, repo, specificVersion string) (*Release, error) {
	if client == nil {
		client = DefaultHTTPClient
	}
	if repo == "" {
		repo = DefaultReleaseRepo
	}

	var apiURL string
	if specificVersion != "" {
		tag := specificVersion
		if !strings.HasPrefix(tag, "v") {
			tag = "v" + tag
		}
		apiURL = fmt.Sprintf("https://api.github.com/repos/%s/releases/tags/%s", repo, tag)
	} else {
		apiURL = fmt.Sprintf("https://api.github.com/repos/%s/releases/latest", repo)
	}

	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "muljax-cli-updater")

	if token := GetGitHubToken(); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := client.Do(req)
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		var rel Release
		if err := json.NewDecoder(resp.Body).Decode(&rel); err == nil {
			return &rel, nil
		}
	}
	if resp != nil {
		_ = resp.Body.Close()
	}

	if specificVersion == "" {
		tag, err := resolveLatestTagViaRedirect(repo)
		if err != nil {
			return nil, fmt.Errorf("could not query GitHub API or resolve latest release tag: %w", err)
		}
		return &Release{TagName: tag}, nil
	}

	tag := specificVersion
	if !strings.HasPrefix(tag, "v") {
		tag = "v" + tag
	}
	return &Release{TagName: tag}, nil
}

func resolveLatestTagViaRedirect(repo string) (string, error) {
	redirectClient := &http.Client{
		Timeout: 15 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	url := fmt.Sprintf("https://github.com/%s/releases/latest", repo)
	req, err := http.NewRequest(http.MethodHead, url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "muljax-cli-updater")

	resp, err := redirectClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusFound || resp.StatusCode == http.StatusMovedPermanently {
		loc := resp.Header.Get("Location")
		if loc != "" {
			parts := strings.Split(loc, "/releases/tag/")
			if len(parts) == 2 {
				return parts[1], nil
			}
		}
	}

	return "", fmt.Errorf("unexpected status %d from %s", resp.StatusCode, url)
}

func ResolveAssetURL(repo, tag, archiveName string, assets []Asset) string {
	if repo == "" {
		repo = DefaultReleaseRepo
	}
	for _, a := range assets {
		if a.Name == archiveName {
			return a.BrowserDownloadURL
		}
	}
	return fmt.Sprintf("https://github.com/%s/releases/download/%s/%s", repo, tag, archiveName)
}

func ResolveChecksumsURL(repo, tag string, assets []Asset) string {
	if repo == "" {
		repo = DefaultReleaseRepo
	}
	for _, a := range assets {
		if a.Name == "checksums.txt" {
			return a.BrowserDownloadURL
		}
	}
	return fmt.Sprintf("https://github.com/%s/releases/download/%s/checksums.txt", repo, tag)
}
