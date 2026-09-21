package sshutil

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

const (
	ConfigBeginMarker = "# BEGIN MULJAX SSH CONFIG"
	ConfigEndMarker   = "# END MULJAX SSH CONFIG"
)

func ConfigureSSH(privKeyPath string, hostPattern string) error {
	sshDir, err := GetSSHDir()
	if err != nil {
		return err
	}

	configPath := filepath.Join(sshDir, "config")

	// Determine command to invoke in Match exec
	cliBin := "muljax"
	if path, err := exec.LookPath("muljax"); err == nil {
		cliBin = path
	}

	if strings.Contains(cliBin, " ") {
		short := GetShortPath(cliBin)
		if !strings.Contains(short, " ") {
			cliBin = short
		} else if _, err := exec.LookPath("muljax"); err == nil {
			cliBin = "muljax"
		}
	}
	cliBin = filepath.ToSlash(cliBin)

	// Format privKeyPath for OpenSSH: use forward slashes and quote if containing spaces
	normPrivKey := filepath.ToSlash(privKeyPath)
	if strings.Contains(normPrivKey, " ") {
		normPrivKey = fmt.Sprintf(`"%s"`, normPrivKey)
	}

	if hostPattern == "" {
		hostPattern = "*.internal"
	}

	block := fmt.Sprintf("%s\nMatch host %s exec \"%s ssh ensure-cert --quiet\"\n    IdentityFile %s\n%s\n",
		ConfigBeginMarker,
		hostPattern,
		cliBin,
		normPrivKey,
		ConfigEndMarker,
	)

	existingContent := ""
	if data, err := os.ReadFile(configPath); err == nil {
		existingContent = string(data)
	}

	newContent := ""
	if strings.Contains(existingContent, ConfigBeginMarker) && strings.Contains(existingContent, ConfigEndMarker) {
		// Replace existing block
		start := strings.Index(existingContent, ConfigBeginMarker)
		end := strings.Index(existingContent, ConfigEndMarker) + len(ConfigEndMarker)
		// Include trailing newline if present
		if end < len(existingContent) && existingContent[end] == '\n' {
			end++
		}
		newContent = existingContent[:start] + block + existingContent[end:]
	} else {
		// Prepend block to ensure it matches before generic host blocks
		if existingContent != "" && !strings.HasSuffix(existingContent, "\n") {
			existingContent += "\n"
		}
		newContent = block + "\n" + existingContent
	}

	if err := os.WriteFile(configPath, []byte(strings.TrimSpace(newContent)+"\n"), 0600); err != nil {
		return err
	}
	_ = SecureFile(configPath)
	return nil
}

func RemoveSSHConfig() error {
	sshDir, err := GetSSHDir()
	if err != nil {
		return err
	}
	configPath := filepath.Join(sshDir, "config")
	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	content := string(data)
	if strings.Contains(content, ConfigBeginMarker) && strings.Contains(content, ConfigEndMarker) {
		start := strings.Index(content, ConfigBeginMarker)
		end := strings.Index(content, ConfigEndMarker) + len(ConfigEndMarker)
		if end < len(content) && content[end] == '\n' {
			end++
		}
		cleaned := content[:start] + content[end:]
		if err := os.WriteFile(configPath, []byte(strings.TrimSpace(cleaned)+"\n"), 0600); err != nil {
			return err
		}
		_ = SecureFile(configPath)
		return nil
	}
	return nil
}

func GetConfiguredHostPattern() string {
	sshDir, err := GetSSHDir()
	if err != nil {
		return ""
	}
	data, err := os.ReadFile(filepath.Join(sshDir, "config"))
	if err != nil {
		return ""
	}
	content := string(data)
	if !strings.Contains(content, ConfigBeginMarker) {
		return ""
	}
	lines := strings.Split(content, "\n")
	inBlock := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == ConfigBeginMarker {
			inBlock = true
			continue
		}
		if trimmed == ConfigEndMarker {
			break
		}
		if inBlock && strings.HasPrefix(trimmed, "Match host ") {
			rest := strings.TrimPrefix(trimmed, "Match host ")
			if idx := strings.Index(rest, " exec"); idx != -1 {
				return strings.TrimSpace(rest[:idx])
			}
			return strings.TrimSpace(rest)
		}
	}
	return ""
}
