package update

import "testing"

func TestIsSupportedPlatform(t *testing.T) {
	tests := []struct {
		goos   string
		goarch string
		want   bool
	}{
		{"darwin", "amd64", true},
		{"darwin", "arm64", true},
		{"linux", "amd64", true},
		{"linux", "arm64", true},
		{"windows", "amd64", true},
		{"windows", "arm64", true},
		{"linux", "386", false},
		{"freebsd", "amd64", false},
		{"openbsd", "arm64", false},
		{"solaris", "amd64", false},
	}

	for _, tt := range tests {
		got := IsSupportedPlatform(tt.goos, tt.goarch)
		if got != tt.want {
			t.Errorf("IsSupportedPlatform(%q, %q) = %v, want %v", tt.goos, tt.goarch, got, tt.want)
		}
	}
}

func TestArchiveExtension(t *testing.T) {
	if got := ArchiveExtension("windows"); got != ".zip" {
		t.Errorf("ArchiveExtension(windows) = %q, want .zip", got)
	}
	if got := ArchiveExtension("linux"); got != ".tar.gz" {
		t.Errorf("ArchiveExtension(linux) = %q, want .tar.gz", got)
	}
	if got := ArchiveExtension("darwin"); got != ".tar.gz" {
		t.Errorf("ArchiveExtension(darwin) = %q, want .tar.gz", got)
	}
}

func TestBinaryName(t *testing.T) {
	if got := BinaryName("windows"); got != "muljax.exe" {
		t.Errorf("BinaryName(windows) = %q, want muljax.exe", got)
	}
	if got := BinaryName("linux"); got != "muljax" {
		t.Errorf("BinaryName(linux) = %q, want muljax", got)
	}
	if got := BinaryName("darwin"); got != "muljax" {
		t.Errorf("BinaryName(darwin) = %q, want muljax", got)
	}
}

func TestArchiveName(t *testing.T) {
	tests := []struct {
		goos   string
		goarch string
		want   string
	}{
		{"linux", "amd64", "muljax_linux_amd64.tar.gz"},
		{"linux", "arm64", "muljax_linux_arm64.tar.gz"},
		{"darwin", "amd64", "muljax_darwin_amd64.tar.gz"},
		{"darwin", "arm64", "muljax_darwin_arm64.tar.gz"},
		{"windows", "amd64", "muljax_windows_amd64.zip"},
		{"windows", "arm64", "muljax_windows_arm64.zip"},
	}

	for _, tt := range tests {
		got := ArchiveName(tt.goos, tt.goarch)
		if got != tt.want {
			t.Errorf("ArchiveName(%q, %q) = %q, want %q", tt.goos, tt.goarch, got, tt.want)
		}
	}
}
