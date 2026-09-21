<div align="center">

# Muljax ID API Worker

High-performance identity API, OIDC provider, and OpenSSH Certificate Authority built on Cloudflare Workers and D1.

[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)

</div>

---

## Overview

The **Muljax ID API Worker** is the backend service for the **Muljax Identity Platform**. It runs as a Cloudflare Worker using [Hono](https://hono.dev) and [Cloudflare D1](https://developers.cloudflare.com/d1/) with [Drizzle ORM](https://orm.drizzle.team).

### Capabilities
- **OIDC & OAuth 2.0 Provider**: RFC 6749, RFC 7636 (PKCE), RFC 7009 (Revocation), RFC 7662 (Introspection), OpenID Discovery.
- **WebAuthn & Passkeys**: FIDO2 ceremony verification using SimpleWebAuthn.
- **OpenSSH CA & KRL**: RFC 4251 binary wire serialization, Ed25519 certificate issuance, and dynamic OpenSSH Key Revocation List generation.
- **RBAC & User Lifecycle**: Granular permission matching, hierarchical wildcards, and Cloudflare Workflows integration.

---

## Development

### Install Dependencies
```sh
bun install
```

### Run Local Development Worker
```sh
bun run dev
```

### Run Tests & Typechecking
```sh
bun test
bun run typecheck
bun run check
```

### Build for Production
```sh
bun run build
```

---

## Deployment

Deployments and infrastructure provisioning are managed centrally through the root orchestrator repository ([`muljax/id`](https://github.com/muljax/id)) via Terraform.

## License

See the [LICENSE](./LICENSE) file for details.
