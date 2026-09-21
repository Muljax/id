//go:build windows

package ui

import (
	"os"

	"golang.org/x/sys/windows"
)

func enableVirtualTerminalProcessing() {
	handle := windows.Handle(os.Stdout.Fd())
	var mode uint32
	if err := windows.GetConsoleMode(handle, &mode); err == nil {
		mode |= windows.ENABLE_VIRTUAL_TERMINAL_PROCESSING
		if err := windows.SetConsoleMode(handle, mode); err != nil {
			// If VT processing cannot be enabled, disable colors to avoid printing raw escape codes
			NoColor = true
		}
	}
}
