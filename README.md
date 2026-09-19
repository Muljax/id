<div align="center">
	<img width="170" alt="Muljax Logo" src="https://github.com/user-attachments/assets/e9d50a92-6993-48e7-871e-d3b497cf721f" />
</div>
<br />

---

# Muljax Identity Platform

An open-source identity platform built on Cloudflare Workers.

[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-F38020?logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Terraform](https://img.shields.io/badge/Terraform-844FBA?logo=terraform&logoColor=white)](https://developer.hashicorp.com/terraform)

</div>

---

> [!NOTE]
> Muljax Identity Platform is **1.0 (GA)** and adheres to [Semantic Versioning](https://semver.org/). Breaking changes are strictly limited to major semver releases.

## Documentation

Full documentation, protocol specifications, administration manuals, and architecture guides are available in the [Documentation Site](./apps/docs) and online at your configured docs domain.

## Overview

The project is a monorepo consisting of three primary applications:
- **[API](./apps/api)**: High-performance Hono API Worker with D1 SQLite storage, WebAuthn/Passkeys, OIDC/OAuth 2.0 provider, and OpenSSH CA engine.
- **[Dashboard](./apps/dashboard)**: Modern Single-Page Application (SPA) built with React, Vite, and TanStack Router/Query/Form for identity and instance management.
- **[Docs](./apps/docs)**: Comprehensive documentation portal powered by Astro and Starlight.

Infrastructure is fully automated with [Terraform](https://developer.hashicorp.com/terraform), while development and compilation are powered by [Bun](https://bun.sh/).

## API

The Muljax ID API is a [Hono](https://hono.dev/) application running on [Cloudflare Workers](https://workers.cloudflare.com/).

The API uses [Cloudflare D1](https://developers.cloudflare.com/d1/) as its database, with [Drizzle ORM](https://orm.drizzle.team/) for database access.

### API Structure

```text
apps/api/
├── src/
│   ├── db/           # Database schema and queries
│   ├── lib/          # Core auth, crypto, ssh, and lifecycle logic
│   ├── middleware/   # API middleware (auth, rbac, rate limiting)
│   ├── routes/       # API routes (auth, oauth, passkeys, admin, ssh, well-known)
│   └── index.ts      # Worker entrypoint
├── drizzle/
│   └── migrations/   # D1 database migrations
└── build.ts          # API Worker build script
```

## Dashboard

The Muljax ID dashboard is a [React](https://react.dev/) app built with [Vite](https://vite.dev/).

The dashboard is compiled into a Cloudflare Worker with its static assets managed through the Worker Assets binding.

### Dashboard Structure

```text
apps/dashboard/
├── src/
│   ├── components/   # Reusable UI components
│   ├── lib/          # Client-side utilities and API client
│   └── routes/       # Dashboard routes (auth, directory, settings, audit, ssh)
├── worker.ts         # Dashboard Worker entrypoint
└── vite.config.ts
```

## Project Structure

```text
.
├── apps/
│   ├── api/          # Hono API Worker
│   ├── dashboard/    # React + Vite dashboard
│   └── docs/         # Astro + Starlight documentation site
├── scripts/
│   ├── generate-tfvars.ts # Terraform variables generator
│   ├── oidc-key.ts        # OIDC ES256 signing key generator
│   ├── ssh-ca-key.ts      # SSH CA Ed25519 key generator
│   └── seed-d1.ts         # D1 database seeder for standard values
├── terraform/             # Cloudflare infrastructure as code
├── README.md
├── SECURITY.md
├── CONTRIBUTING.md
└── SETUP.md               # Setup and deployment instructions
```

## Development

### Requirements

- [Bun](https://bun.sh/)
- [Cloudflare](https://www.cloudflare.com/)
- [Terraform](https://developer.hashicorp.com/terraform)

### Install

Install the project dependencies with:

```sh
bun install
```

## Setup and Deployment

Deploy the entire platform—including configuration derivation, Worker compilation, Terraform provisioning, D1 migrations, and standard database seeding—using:

```sh
bun run deploy
```

For complete step-by-step instructions, cryptographic key management, D1 database seeding, and Cloudflare configuration, see the [setup guide](./SETUP.md).

## License

See the [LICENSE](./LICENSE) file for details.
