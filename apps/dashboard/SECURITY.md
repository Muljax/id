# Security Policy

The Muljax ID Dashboard is the user portal and administrative web console for the Muljax Identity Platform. We take web application security, credential handling, and UI security vulnerabilities with highest priority.

## Supported Versions

Muljax ID Dashboard follows [Semantic Versioning](https://semver.org/). Security patches and updates are actively provided for the current `1.x` release series.

| Version | Supported          | Status             |
| ------- | ------------------ | ------------------ |
| 1.x     | :white_check_mark: | Active support     |
| < 1.0   | :x:                | End of life        |

---

## Client-Side & UI Security Boundaries

The Dashboard UI implements defense-in-depth protections across its frontend architecture:

- **WebAuthn Ceremonies**: Passkey registration and assertion browser ceremonies communicate securely with the browser FIDO2 authenticators and API endpoints.
- **Cross-Site Scripting (XSS) Prevention**: All dynamic user inputs, identity claims, audit logs, and SSH public keys are strictly sanitized before rendering via React's virtual DOM.
- **OAuth Consent Integrity**: The OAuth 2.0 authorization and scope consent screens prevent UI redressing, framing, and clickjacking attacks.
- **Session & Token Management**: Client-side state handling strictly isolates session tokens and avoids leaking credentials to third-party dependencies or analytics.
- **Worker Assets Serving**: Static assets served through Cloudflare Worker Assets adhere to modern security headers and caching boundaries.

---

## Reporting a Vulnerability

Please report security vulnerabilities through **GitHub's Private Vulnerability Reporting** for this repository ([`muljax/dashboard`](https://github.com/Muljax/dashboard)) or the orchestrator repository ([`muljax/id`](https://github.com/Muljax/id)).

> [!CAUTION]
> **Do not** disclose vulnerabilities through public GitHub issues, pull requests, or public discussions.

### Information to Include

When submitting an advisory, please provide:
- Description of the UI/frontend security vulnerability (e.g., XSS, CSRF, clickjacking, token leakage, open redirect).
- Affected browser, operating system, and release version or commit hash.
- Minimal reproduction steps, including URL paths and payloads.
- Suggested mitigations or patches, if known.

---

## Response Timeline & Disclosure

- **Acknowledgment**: Within **3 business days** of receiving a complete report.
- **Initial Assessment**: Within **7 business days** with confirmation and triage status.
- **Disclosure**: Vulnerabilities are resolved in private draft advisories and released in coordination with a published GitHub Security Advisory (GHSA).
