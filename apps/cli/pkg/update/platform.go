package update

import "fmt"

func IsSupportedPlatform(goos, goarch string) bool {
	switch goos {
	case "linux", "darwin", "windows":
		return goarch == "amd64" || goarch == "arm64"
	default:
		return false
	}
}

func ArchiveExtension(goos string) string {
	if goos == "windows" {
		return ".zip"
	}
	return ".tar.gz"
}

func BinaryName(goos string) string {
	if goos == "windows" {
		return "muljax.exe"
	}
	return "muljax"
}

func ArchiveName(goos, goarch string) string {
	return fmt.Sprintf("muljax_%s_%s%s", goos, goarch, ArchiveExtension(goos))
}
