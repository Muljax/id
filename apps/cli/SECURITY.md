# Security Policy

The Muljax CLI (`muljax`) provides client-side authentication, RFC 8628 Device Authorization Grant, secure credential persistence, and automated OpenSSH Certificate Authority integration for the Muljax Identity Platform. We take client-side security, cryptographic integrity, and key protection with critical urgency.

## Supported Versions & Service Compatibility

Muljax CLI is actively maintained in the `0.x` pre-1.0 series on [GitHub Releases](https://github.com/Muljax/cli/releases).

| Version | Supported          | Status             |
| ------- | ------------------ | ------------------ |
| Latest  | :white_check_mark: | Active support     |
| < Latest| :x:                | Unsupported        |

> [!IMPORTANT]
> **API & Dashboard Compatibility Requirement**: The Muljax CLI is designed strictly to work with the **latest version** of the Muljax ID API Worker and Dashboard web console. Backward compatibility with older, unmaintained backend versions is not guaranteed. Always ensure your server instance and CLI binaries are kept up to date with the latest releases.

---

## Client-Side Security Boundaries

The Muljax CLI enforces strict security controls and cryptographic boundaries:

- **Local Private Key Isolation**: Asymmetric Ed25519 SSH private keys are generated locally using Go's `crypto/ed25519` and `crypto/rand`. Private keys are written to disk with strict POSIX permissions (`0600`) and are **never** transmitted over the network or exposed in log output. Only the corresponding public key is sent during certificate signing requests.
- **RFC 8628 Device Code Authorization**: CLI authentication uses the OAuth 2.0 Device Authorization Grant (RFC 8628) with high-entropy device verification codes, polling rate limiting, and cryptographic token exchanges.
- **Secure Token Storage**: OAuth 2.0 access tokens, refresh tokens, and OIDC ID tokens are persisted in the host operating system's native secure keyring (macOS Keychain, Linux Secret Service API via DBus, and Windows Credential Manager). When running in headless or containerized environments without a graphical keyring daemon, tokens fall back to a restricted `0600` JSON file within `~/.config/muljax/`.
- **Live CA Revocation (KRL) Validation**: When inspecting certificate validity via `muljax ssh status`, the CLI retrieves the OpenSSH Key Revocation List (KRL) from the CA endpoint to verify that the active certificate has not been revoked.
- **OpenSSH Configuration Hook Hardening**: The transparent renewal hook registered in `~/.ssh/config` is strictly scoped to your organization's internal domain patterns (e.g. `Match host *.internal exec ...`), preventing execution during connections to untrusted public SSH hosts.

---

## Reporting a Vulnerability

Please report security vulnerabilities through **GitHub's Private Vulnerability Reporting** for this repository ([`muljax/cli`](https://github.com/Muljax/cli)) or the orchestrator repository ([`muljax/id`](https://github.com/Muljax/id)).

> [!CAUTION]
> **Do not** disclose vulnerabilities through public GitHub issues, pull requests, or public discussions.

### Information to Include

When submitting an advisory, please provide:
- Detailed description of the vulnerability and attack vector (e.g., token leakage, key permission bypass, argument injection, insecure file creation).
- Operating system, architecture, and exact `muljax version` output.
- Minimal steps to reproduce or proof-of-concept (PoC).
- Potential impact on users, private keys, or SSH client configurations.
- Suggested fixes or mitigations, if known.

> [!WARNING]
> Never include real production SSH private keys, active OAuth tokens, or sensitive host credentials in your report. Use synthetic test keys for reproduction.

---

## Response Timeline & Disclosure

- **Acknowledgment**: Within **3 business days** of receiving a complete report.
- **Initial Assessment**: Within **7 business days** with confirmation and triage status.
- **Disclosure**: Vulnerabilities are resolved in private draft advisories and released in coordination with a published GitHub Security Advisory (GHSA).
