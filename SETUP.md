<div align="center">

# Muljax Identity Platform Setup

An open-source identity platform built on Cloudflare Workers.

<br />

[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun\&logoColor=white)](https://bun.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react\&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite\&logoColor=white)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono\&logoColor=white)](https://hono.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-F38020?logo=cloudflare\&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare%20D1-F38020?logo=cloudflare\&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?logo=drizzle\&logoColor=black)](https://orm.drizzle.team/)
[![Alchemy](https://img.shields.io/badge/Alchemy-5A45FF?logo=alchemy\&logoColor=white)](https://alchemy.run/)

</div>

## Prerequisites

Before getting started, make sure you have:

* [Bun](https://bun.sh/) installed
* A [Cloudflare](https://www.cloudflare.com/) account
* A Cloudflare API token with the permissions required by Alchemy
* The repository cloned locally

## Configure `.env`

Copy the values from `.env.example` to `.env` and fill out the required values.

```sh
cp .env.example .env
```

> [!WARNING]
> If you have issues with Alchemy reporting that configuration values are not set, copy the values directly from the [raw `.env.example`](https://raw.githubusercontent.com/thehazell/id/refs/heads/main/.env.example) to rule out encoding issues, especially on Windows.

## Install dependencies

Install the project dependencies using Bun:

```sh
bun install
```

## Generate the OIDC private key

Muljax Identity Platform requires an OIDC private key for signing tokens. You do not need to generate this key manually.

Run:

```sh
bun alchemy/oidc-key.ts
```

This will generate the `OIDC_PRIVATE_KEY` secret for you.

## Deploy

Muljax Identity Platform uses [Alchemy](https://alchemy.run/) as its infrastructure-as-code layer. The complete infrastructure is managed by Alchemy, including the Cloudflare Workers, D1 database, profile storage, database migrations, and other required resources.

Once your `.env` is configured and the OIDC private key has been generated, the entire platform can be provisioned and deployed with a single command:

```sh
bun run deploy
```

You do not need to manually create Cloudflare resources, configure Workers, or run database migrations.

> [!NOTE]
> When redeploying an existing installation, you may see an error indicating that the previous profile bucket could not be deleted. **This is expected and normal.** The deployment can continue despite this error.

## Local development

After configuring your environment and dependencies, start the development environment with:

```sh
bun run dev
```

Refer to the application's development output for the URLs of the dashboard and API.

## Project structure

```text
.
├── apps/
│   ├── api/          # Hono API Worker
│   └── dashboard/    # React + Vite dashboard
├── alchemy.run.ts    # Cloudflare infrastructure definition
├── biome.json        # Biome configuration
├── package.json
└── .env.example
```

## Troubleshooting

### Alchemy cannot find environment variables

If Alchemy reports that a configuration value is missing even though it exists in `.env`:

1. Verify that the variable name exactly matches `.env.example`.
2. Make sure the `.env` file is located at the repository root.
3. Check for unexpected quotes or whitespace.
4. On Windows, try copying the values directly from the [raw `.env.example`](https://raw.githubusercontent.com/thehazell/id/refs/heads/main/.env.example).

### Profile bucket deletion error

When redeploying, Alchemy may report that the previous profile bucket cannot be deleted.

This is expected behavior and does not indicate that the deployment has failed. No manual intervention is required.

### Deployment issues

If deployment fails for another reason, verify that:

* Your Cloudflare credentials have the required permissions.
* All required `.env` values are populated.
* The `OIDC_PRIVATE_KEY` has been generated.
* You are running `bun run deploy` from the repository root.

Because infrastructure and database setup are handled by Alchemy, manual Cloudflare or D1 configuration should generally not be necessary.

## Updating an existing deployment

To update an existing installation, pull the latest changes and run:

```sh
bun install
bun run deploy
```

Alchemy will reconcile the deployed infrastructure with the current configuration.

## That's it

The platform is designed so that deployment is intentionally simple:

```sh
git clone https://github.com/thehazell/id
cd id
bun install
cp .env.example .env
# Configure .env
bun alchemy/oidc-key.ts
bun run deploy
```

Alchemy handles the infrastructure from there.
