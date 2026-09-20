# Security Policy

The Muljax Identity Platform takes the security of our authentication, authorization, and cryptographic infrastructure with the highest priority. If you discover a security vulnerability, we ask that you report it responsibly through GitHub's Private Vulnerability Reporting.

## Supported Versions

Muljax ID follows [Semantic Versioning](https://semver.org/). Security patches and updates are actively provided for the current `1.x` release series.

| Version | Supported          | Status             |
| ------- | ------------------ | ------------------ |
| 1.x     | :white_check_mark: | Active support     |
| < 1.0   | :x:                | End of life        |

---

## Cryptographic & Architectural Security Boundaries

Muljax ID operates as an enterprise-grade identity and access management system built upon zero-trust and defense-in-depth principles across its components:

- **OpenSSH Certificate Authority (CA)**: The Ed25519 CA private key signs short-lived user and host certificates. Private CA keys must never be exposed or logged. Revocation is enforced via RFC 4251 binary Key Revocation Lists (KRL).
- **OIDC & OAuth 2.0 Provider**: Token issuance uses asymmetric cryptography (ES256/RS256) with public key distribution via `.well-known/jwks.json`. All public client authorizations require PKCE (RFC 7636) with SHA-256 challenges.
- **WebAuthn & Passkeys**: FIDO2 authentication ceremonies adhere strictly to WebAuthn Level 3 standards with challenge verification and replay prevention.
- **Role-Based Access Control (RBAC)**: All administrative and user endpoints evaluate granular, hierarchical permission strings (e.g., `ssh:sign`, `users:*`) with strict fail-closed authorization middleware.
- **Infrastructure & Secrets**: Root deployment scripts (`scripts/`) derive and inject secrets directly into Cloudflare Worker environments and encrypted Terraform state.

---

## Reporting a Vulnerability

Please report potential security vulnerabilities through **GitHub's Private Vulnerability Reporting**:

1. Navigate to the **Security** tab of the relevant repository ([`muljax/id`](https://github.com/Muljax/id), [`muljax/api`](https://github.com/Muljax/api), [`muljax/dashboard`](https://github.com/Muljax/dashboard), or [`muljax/cli`](https://github.com/Muljax/cli)).
2. Click **Report a vulnerability** to open a confidential advisory.

> [!CAUTION]
> **Do not** disclose vulnerabilities through public GitHub issues, pull requests, or public discussions.

### Information to Include

To help us triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential impact.
- Affected repository, component (`api`, `dashboard`, `terraform`, `cli`), and release version or commit hash.
- Step-by-step reproduction instructions or a minimal proof-of-concept (PoC).
- Any proposed mitigations or patches, if available.

> [!WARNING]
> Do not include live production secrets, real SSH CA private keys, Cloudflare API tokens, or personal identity data in your report. Use redacted or test keys for proof-of-concept examples.

---

## Response Timeline & Disclosure

We are committed to coordinating responsible disclosure with security researchers:

- **Acknowledgment**: Within **3 business days** of receiving a complete report.
- **Initial Assessment**: Within **7 business days** with confirmation and triage status.
- **Remediation & Advisory**: We will collaborate with the reporter to develop, verify, and deploy a patch before publishing a coordinated GitHub Security Advisory (GHSA).

---

## Deployment & Operator Responsibilities

Muljax ID is a deployable platform. Platform operators are responsible for:
- Safeguarding Cloudflare API tokens, account secrets, and Terraform state backends.
- Securely backing up and isolating Cloudflare D1 database instances.
- Ensuring DNS records, TLS certificates, and custom domain routing meet organizational compliance requirements.
- Promptly applying `1.x` security releases and updating deployment dependencies.
