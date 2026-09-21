//go:build darwin

package auth

import "os/exec"

func openBrowser(url string) error {
	return exec.Command("open", url).Start()
}
