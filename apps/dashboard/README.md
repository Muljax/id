<div align="center">

# Muljax ID Dashboard

Modern React 19 Single Page Application (SPA) for identity management, user directory, SSH credentials, and instance administration.

[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## Overview

The **Muljax ID Dashboard** is the web console for the **Muljax Identity Platform**. It provides:
- **Self-Service Portal**: Passkey registration, SSH key management, certificate requests, active sessions, and profile settings.
- **Admin Control Plane**: User directory, user lifecycle scheduling, RBAC role and permission assignment, break-glass sign-in keys, and audit logs.
- **OAuth Consent Prompts**: Interactive authorization and scope consent screen for third-party OAuth/OIDC clients.

---

## Development

### Install Dependencies
```sh
bun install
```

### Run Local Development Server
```sh
bun run dev
```

### Typecheck & Lint
```sh
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
