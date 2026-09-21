//go:build !windows

package ui

func enableVirtualTerminalProcessing() {
	// POSIX terminals (Linux, macOS, BSD) natively interpret ANSI escape sequences
}
