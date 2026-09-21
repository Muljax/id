# Security Policy

The Muljax ID API Worker implements core cryptographic signing, authentication ceremonies, authorization, and database persistence for the Muljax Identity Platform. We take security vulnerabilities in the API service with critical urgency.

## Supported Versions

Muljax ID API follows [Semantic Versioning](https://semver.org/). Security patches and updates are actively provided for the current `1.x` release series.

| Version | Supported          | Status             |
| ------- | ------------------ | ------------------ |
| 1.x     | :white_check_mark: | Active support     |
| < 1.0   | :x:                | End of life        |

---

## Cryptographic & API Security Boundaries

The API Worker enforces strict security guarantees across multiple subsystems:

- **OpenSSH CA & Binary Wire Protocol**: Ed25519 root CA signing operations run in an isolated environment. The API serializes RFC 4251 binary certificates and generates dynamic OpenSSH Key Revocation Lists (KRL).
- **OIDC / OAuth 2.0 Engine**: Asymmetric token signing with ES256/RS256, JWKS public exposure (`.well-known/jwks.json`), PKCE code verifier SHA-256 validation (RFC 7636), and token introspection/revocation endpoints (RFC 7662 / RFC 7009).
- **WebAuthn / Passkeys**: FIDO2 authentication and registration ceremonies adhere strictly to WebAuthn specifications using `@simplewebauthn` with challenge verification, counter validation, and origin verification.
- **RBAC & Authorization Middleware**: Granular permission matching supporting hierarchical wildcards (e.g. `users:read`, `ssh:sign`, `*`), fail-closed authorization, and tenant isolation.
- **Data Persistence & Query Safety**: Cloudflare D1 interactions are strictly parameterized via Drizzle ORM to eliminate SQL injection vectors.

---

## Reporting a Vulnerability

Please report security vulnerabilities through **GitHub's Private Vulnerability Reporting** for this repository ([`muljax/api`](https://github.com/Muljax/api)) or the orchestrator repository ([`muljax/id`](https://github.com/Muljax/id)).

> [!CAUTION]
> **Do not** disclose vulnerabilities through public GitHub issues, pull requests, or public discussions.

### Information to Include

When submitting an advisory, please provide:
- Detailed description of the vulnerability and attack vector (e.g., auth bypass, signature forgery, injection, timing attack).
- Exact steps to reproduce or a minimal proof-of-concept (PoC).
- Potential impact on users, tenants, or cryptographic keys.
- Suggested fixes or mitigations, if known.

> [!WARNING]
> Never submit real production private keys, Cloudflare tokens, live session cookies, or user PII in a report. Use synthetic test keys for reproduction.

---

## Response Timeline & Disclosure

- **Acknowledgment**: Within **3 business days** of receiving a complete report.
- **Initial Assessment**: Within **7 business days** with confirmation and triage status.
- **Disclosure**: Vulnerabilities are resolved in private draft advisories and released in coordination with a published GitHub Security Advisory (GHSA).
