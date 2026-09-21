# Security Policy

The Muljax ID Documentation portal provides architectural specifications, deployment runbooks, API references, and security manuals for the Muljax Identity Platform.

## Supported Versions

Documentation updates track the active release line of the Muljax Identity Platform.

| Version | Supported          | Status             |
| ------- | ------------------ | ------------------ |
| 1.x     | :white_check_mark: | Active support     |
| < 1.0   | :x:                | End of life        |

---

## Documentation & Content Security

- **Credential & Secret Redaction**: All code examples, configuration samples, and deployment templates must exclusively use placeholder keys and fictitious credentials. Never commit production keys or real secrets to documentation.
- **Client-Side Rendering**: MDX parsing and custom React/Starlight components must enforce strict sanitization to prevent DOM XSS vulnerabilities.
- **Protocol Accuracy**: Security protocol documentation (OIDC, WebAuthn, SSH CA wire protocol) is maintained to accurately reflect implemented cryptographic standards.

---

## Reporting a Vulnerability

Please report security issues or documentation flaws through **GitHub's Private Vulnerability Reporting** for this repository ([`muljax/docs`](https://github.com/Muljax/docs)) or the orchestrator repository ([`muljax/id`](https://github.com/Muljax/id)).

> [!CAUTION]
> **Do not** disclose vulnerabilities through public GitHub issues, pull requests, or public discussions.

### Information to Include

When submitting a report, please provide:
- Description of the security issue (e.g., exposed credentials in docs, inaccurate cryptographic guidance, XSS in doc components).
- URL path or file path within the documentation repository.
- Impact assessment and suggested corrections.

---

## Response Timeline & Disclosure

- **Acknowledgment**: Within **3 business days** of receiving a complete report.
- **Initial Assessment**: Within **7 business days** with confirmation and triage status.
- **Disclosure**: Vulnerabilities are resolved in private draft advisories and released in coordination with a published GitHub Security Advisory (GHSA).
