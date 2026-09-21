<div align="center">

# Contributing to Muljax CLI

Thanks for contributing to the Muljax CLI!

The official command-line interface for the [Muljax Identity Platform](https://github.com/Muljax/id).

<br />

[![Go](https://img.shields.io/badge/Go-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![OpenSSH](https://img.shields.io/badge/OpenSSH-231F20?logo=gnubash&logoColor=white)](https://www.openssh.com/)
[![OAuth 2.0](https://img.shields.io/badge/OAuth%202.0-EB5424?logo=auth0&logoColor=white)](https://oauth.net/2/)
[![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)](https://www.kernel.org/)
[![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)](https://apple.com/)
[![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)](https://microsoft.com/)

</div>

## Getting Started

Muljax CLI is written in Go.

For installation, client onboarding, and server integration instructions, see the [Setup Guide](./SETUP.md).

## Repository Structure

```text
.
├── cmd/
│   ├── id/                 # Identity & authentication subcommands (muljax id auth)
│   │   └── id.go
│   ├── ssh/                # OpenSSH CA integration subcommands (muljax ssh)
│   │   ├── cert.go         # Key generation & manual certificate request
│   │   ├── ensure.go       # OpenSSH Match exec pre-flight auto-renewal hook
│   │   ├── hook.go         # Add or update ~/.ssh/config integration blocks
│   │   ├── server.go       # Target server setup guide & CA pubkey display
│   │   ├── setup.go        # Interactive onboarding wizard & OpenSSH config
│   │   ├── ssh.go          # SSH root command, config helpers, and cert inspector
│   │   ├── status.go       # Certificate status, validity, and revocation inspector
│   │   └── unhook.go       # Safe removal of ~/.ssh/config integration blocks
│   ├── install.go          # Self-installation command (muljax install)
│   ├── root.go             # Root Cobra command & global persistent flags
│   └── update.go           # Self-update command
├── pkg/
│   ├── auth/               # OAuth 2.0 PKCE flow, loopback server, and token refresh
│   │   ├── oauth.go
│   │   ├── pkce.go
│   │   └── pkce_test.go
│   ├── client/             # HTTP client for Muljax ID API and CA endpoints
│   │   ├── client.go
│   │   └── client_test.go
│   ├── config/             # CLI persistent configuration management
│   │   └── config.go
│   ├── sshutil/            # Key generation, certificate parsing, and ~/.ssh/config hooks
│   │   ├── cert.go
│   │   ├── config.go
│   │   ├── keys.go
│   │   ├── permissions_other.go
│   │   ├── permissions_windows.go
│   │   └── sshutil_test.go
│   ├── storage/            # OS Keyring and secure fallback token storage
│   │   └── token.go
│   ├── ui/                 # CLI output formatting, ANSI colors, badges, and spinners
│   │   └── ui.go
│   └── update/             # Release checking and self-update logic
│       └── update.go
├── CONTRIBUTING.md
├── go.mod
├── go.sum
├── LICENSE
├── main.go                 # Application entrypoint
├── README.md
├── SECURITY.md
└── SETUP.md
```

## Development

### Prerequisites

- [Go](https://golang.org/) 1.24 or higher
- `git`
- [GoReleaser](https://goreleaser.com/) v2+ (optional, for testing release builds)

### Building

To compile the binary locally:

```bash
go build -o muljax .
```

To test the binary:

```bash
./muljax --help
```

### Running Tests

Execute all tests across all packages:

```bash
go test -v ./...
```

To run tests with race detection enabled:

```bash
go test -race ./...
```

### Testing Against Local Muljax ID

To test CLI commands against a local Muljax ID instance (running on `http://localhost:8787`):

```bash
# Run setup against local backend
./muljax ssh setup --endpoint http://localhost:8787 --hosts "*.local"

# Or authenticate directly
./muljax id auth login --endpoint http://localhost:8787
```

### GoReleaser Snapshot Testing

To test archive creation and packaging without tagging a release:

```bash
goreleaser release --snapshot --clean
```

Binaries and archives will be generated in `dist/`.

## Code Quality

Before submitting changes, ensure your code passes standard Go formatting and static analysis:

```bash
# Format code
go fmt ./...

# Run static analysis
go vet ./...

# Run all unit tests
go test ./...
```

Please do not submit pull requests that fail tests or introduce compilation or formatting issues.

## Making Changes

1. Create a branch for your work:
   ```bash
   git checkout -b feature/my-change
   # or: git checkout -b fix/issue-description
   ```
2. Implement your changes and add corresponding unit tests where applicable (e.g. under `pkg/*/`).
3. Run tests and static analysis:
   ```bash
   go test ./...
   go vet ./...
   ```
4. Review your diff:
   ```bash
   git diff
   ```
5. Commit your changes following Conventional Commits format:
   ```bash
   git add .
   git commit -m "feat(ssh): add custom renewal threshold flag"
   ```

## Commit Messages

Muljax uses [Conventional Commits](https://www.conventionalcommits.org/) for git commit messages.

Format:

```text
<type>(<optional scope>): <description>
```

Common types include:

- `feat` — new functionality or command
- `fix` — bug fix
- `refactor` — code restructuring without altering external behavior
- `docs` — documentation additions or updates
- `test` — adding or improving test coverage
- `chore` — maintenance, dependencies, or tooling

Examples:

```text
feat(ssh): support custom certificate principal selection
fix(auth): handle missing browser environment on headless linux
docs: update OpenSSH Match exec configuration instructions
test(client): add mock test for ca revocation parsing
```

