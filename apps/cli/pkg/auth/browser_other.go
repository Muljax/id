//go:build !windows && !darwin

package auth

import "os/exec"

func openBrowser(url string) error {
	return exec.Command("xdg-open", url).Start()
}
