<div align="center">
	<img width="170" alt="Muljax Logo" src="https://github.com/user-attachments/assets/e9d50a92-6993-48e7-871e-d3b497cf721f" />
</div>
<br />

---

# Muljax CLI (`muljax`)

The official command-line interface for the [Muljax Identity Platform](https://github.com/Muljax/id).

[![Go](https://img.shields.io/badge/Go-00ADD8?logo=go&logoColor=white)](https://golang.org/)
[![OpenSSH](https://img.shields.io/badge/OpenSSH-231F20?logo=gnubash&logoColor=white)](https://www.openssh.com/)
[![OAuth 2.0](https://img.shields.io/badge/OAuth%202.0-EB5424?logo=auth0&logoColor=white)](https://oauth.net/2/)
[![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)](https://www.kernel.org/)
[![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)](https://apple.com/)
[![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)](https://microsoft.com/)

---

> [!WARNING]
> Muljax CLI is pre-1.0 and, as such, may ship breaking releases without a major semver bump.

> [!IMPORTANT]
> **Service Compatibility**: The Muljax CLI is designed strictly to operate against the **latest version** of the Muljax ID API and Dashboard. Backward compatibility with older, unmaintained server versions is not guaranteed or supported. Always ensure your server instance and CLI are running latest releases.

## Overview

The Muljax CLI (`muljax`) provides authentication, identity management, and automated zero-friction OpenSSH Certificate Authority (CA) client integration for the Muljax Identity Platform.

By hooking natively into OpenSSH client configuration via `Match host * exec`, `muljax` transparently validates and auto-renews short-lived SSH certificates before connection handshakes without interrupting workflows or requiring manual certificate requests.

## Key Features

- **Zero-Friction SSH**: Connect to any server trusting the Muljax CA using standard `ssh user@server` commands without manual intervention.
- **Automated OpenSSH Pre-Flight**: Integrates into `~/.ssh/config` using OpenSSH's native `Match host <pattern> exec "muljax ssh ensure-cert --quiet"`, scoped specifically to your organization's internal host patterns.
- **Transparent Certificate Renewal**: Expired or nearing-expiration (<30 minutes) certificates are automatically renewed in the background via OAuth 2.0 refresh tokens.
- **Local Key Security**: Asymmetric Ed25519 SSH private keys are generated locally and never transmitted over the network.
- **Live CA Revocation Checks**: Verifies certificate serial numbers against the live CA Certificate Revocation List (KRL) with intelligent 5-minute local caching.
- **Secure Credential Storage**: OAuth 2.0 access and refresh tokens are stored in the OS Keyring (macOS Keychain, Linux Secret Service / DBus, Windows Credential Manager) with a secure permission-restricted filesystem fallback (`0600`).

---

## Installation

Pre-compiled static binaries for Linux, macOS, and Windows (`amd64` and `arm64`) are available on [GitHub Releases](https://github.com/muljax/cli/releases/latest).

### Linux & macOS

Run the following in your terminal to download the latest release for your architecture and install it to your `PATH`:

```bash
# Detect OS and architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m | sed -e 's/x86_64/amd64/' -e 's/aarch64/arm64/')"

# Download, extract, and install
curl -sLO "https://github.com/muljax/cli/releases/latest/download/muljax_${OS}_${ARCH}.tar.gz"
tar -xzf "muljax_${OS}_${ARCH}.tar.gz" muljax
./muljax install
rm "muljax_${OS}_${ARCH}.tar.gz"
```

*(Tip: Pass `./muljax install --user` to install into `~/.local/bin` without requiring sudo privileges.)*

### Windows (PowerShell)

Run the following in PowerShell:

```powershell
$arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") { "arm64" } else { "amd64" }
$zip = "muljax_windows_$arch.zip"

Invoke-WebRequest -Uri "https://github.com/muljax/cli/releases/latest/download/$zip" -OutFile $zip
Expand-Archive -Path $zip -DestinationPath .\muljax-bin -Force
.\muljax-bin\muljax.exe install
Remove-Item $zip, .\muljax-bin -Recurse -Force
```

### Go Install / From Source

If you have Go 1.24+ installed:

```bash
go install github.com/muljax/cli@latest
```

Or clone and compile from source:

```bash
git clone https://github.com/Muljax/cli.git
cd cli
go build -o muljax .
./muljax install
```

---

## Quick Start

### 1. Run Interactive Onboarding

Configure your local SSH key pair, authenticate against your Muljax ID instance, and register the OpenSSH client hook:

```bash
muljax ssh setup
```

*(You can also pass flags directly: `muljax ssh setup --endpoint https://id.example.com --hosts "*.example.com,*.internal"`)*

### 2. Connect to Servers

Connect to any server that trusts your Muljax CA using standard SSH:

```bash
ssh user@server.internal
```

OpenSSH automatically triggers `muljax ssh ensure-cert --quiet` in the background. If your certificate is valid, connection completes immediately (<3ms fast-path). If expired or expiring soon, it is renewed transparently.

### 3. Verify Certificate & Auth Status

```bash
# View active certificate details, validity countdown, and CA revocation status
muljax ssh status

# View OAuth 2.0 session status
muljax id auth status
```

---

## Documentation

For in-depth guides and technical references, explore the following documentation:

| Guide | Description |
| :--- | :--- |
| [**Setup & Technical Guide** (`SETUP.md`)](./SETUP.md) | Complete guide covering architecture, client workstation setup, OpenSSH scoping, full CLI command reference, target server provisioning, headless/CI environments, and troubleshooting. |
| [**Contributing Guide** (`CONTRIBUTING.md`)](./CONTRIBUTING.md) | Development workflow, repository structure, local testing against Muljax ID, GoReleaser packaging, and pull request conventions. |
| [**Security Policy** (`SECURITY.md`)](./SECURITY.md) | Security model, cryptographic boundaries, and responsible vulnerability disclosure process. |

---

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.
