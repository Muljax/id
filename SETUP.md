<div align="center">

# Muljax Identity Platform Setup

An open-source identity platform built on Cloudflare Workers.

<br />

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

## Prerequisites

Before getting started, make sure you have:

- [Bun](https://bun.sh/) installed
- [Terraform](https://developer.hashicorp.com/terraform/install) installed
- A [Cloudflare](https://www.cloudflare.com/) account
- A Cloudflare API token with the permissions required by the Terraform configuration
- The repository cloned locally

## Configure the environment

Copy the example environment file:

```sh
cp .env.example .env
```

Then fill out the required values.

The `.env` file is used by the application and local development environment. Terraform configuration is provided separately through Terraform variables.

For Terraform, copy the example variables file:

```sh
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Then configure the Cloudflare account, domain, and other deployment values.

> **Important:** `terraform.tfvars` may contain sensitive values. It is ignored by Git and should never be committed.

## Branding & Customization

You can customize the tenant's brand name, logo, and favicon across the dashboard, authentication flows, and OAuth consent screens.

### 1. Instance Name

Set `INSTANCE_NAME` in your `.env` (or `terraform.tfvars` for production):

```env
INSTANCE_NAME="Acme ID"
```

The instance name will automatically update across:
- Desktop sidebar, mobile drawer, and topbar navigation
- Authentication pages (login, registration, password recovery)
- OAuth authorization and consent prompts
- Dashboard overview and administration directory views
- Browser window / tab `<title>`

### 2. Logo & Icon

The platform supports both bundled static assets and external logo URLs:

* **Static Dist Asset (Recommended):**
  Place your logo file in `apps/dashboard/public/assets/` (e.g., `apps/dashboard/public/assets/logo.svg` or `logo.png`). Any file in this directory is automatically bundled into the dashboard build and served at `/assets/<filename>`.
  
  The dashboard defaults to `/assets/logo.svg`, which is also used as the browser tab favicon.

* **Remote URL or Custom Path:**
  Set `INSTANCE_LOGO` in `.env`:
  ```env
  INSTANCE_LOGO="https://cdn.example.com/logo.svg"
  ```
  Or reference a custom bundled asset path:
  ```env
  INSTANCE_LOGO="/assets/custom-logo.png"
  ```

* **Fallback Glyph:**
  If no custom logo is specified or an image fails to load, a modern accessible identity badge is rendered as a fallback.

## Install dependencies

Install the project dependencies using Bun:

```sh
bun install
```

## Generate the OIDC private key

Muljax Identity Platform requires an OIDC private key for signing tokens.

Generate the key with:

```sh
bun scripts/oidc-key.ts
```

This generates an ES256 private key and writes it to `.env` as `OIDC_PRIVATE_KEY`.

The generated private key should never be committed to the repository.

When deploying with Terraform, provide the generated key to Terraform through the `oidc_private_key` variable.

## Deploy

Muljax Identity Platform uses [Terraform](https://developer.hashicorp.com/terraform) as its infrastructure-as-code layer.

The infrastructure includes:

- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Rate limiting
- Cloudflare Workflows
- Custom domains
- Worker bindings
- Static dashboard assets
- D1 database migrations

### Build the application

Terraform deploys the built Worker files, so build the application before running Terraform:

```sh
bun run build
```

### Initialize Terraform

Initialize Terraform from the repository root:

```sh
terraform -chdir=terraform init
```

### Review the infrastructure changes

```sh
terraform -chdir=terraform plan
```

### Apply the infrastructure

```sh
terraform -chdir=terraform apply
```

Terraform will provision and configure the required Cloudflare infrastructure.

D1 migrations are automatically applied to the remote database during deployment. The migration system uses the Drizzle 1.0 migration layout under:

```text
apps/api/drizzle/migrations/
```

Each migration is stored in its own directory containing a `migration.sql` file.

## D1 migrations

D1 migrations are managed by Drizzle and applied to the remote Cloudflare D1 database during Terraform deployment.

The migration directory uses the Drizzle 1.0 structure:

```text
apps/api/drizzle/migrations/
├── 20260830233203_migration_name/
│   └── migration.sql
├── 20260905225516_another_migration/
│   └── migration.sql
└── ...
```

Terraform detects changes to the migration files and runs:

```sh
bunx wrangler d1 migrations apply <database> --remote
```

You normally do not need to apply migrations manually.

If you add or modify a migration, rebuild and run Terraform:

```sh
bun run build
terraform -chdir=terraform plan
terraform -chdir=terraform apply
```

The Terraform configuration generates a temporary Wrangler configuration containing the D1 migration settings required to locate the Drizzle migrations.

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
│   ├── api/                 # Hono API Worker
│   │   └── drizzle/
│   │       └── migrations/  # Drizzle D1 migrations
│   └── dashboard/           # React + Vite dashboard
├── scripts/
│   └── oidc-key.ts          # OIDC signing key generator
├── terraform/               # Cloudflare infrastructure
├── biome.json               # Biome configuration
├── package.json
└── .env.example
```

## Terraform outputs

After applying the infrastructure, Terraform provides useful deployment information, including:

- API Worker name
- Dashboard Worker name
- D1 database name and ID
- R2 profile bucket name
- API hostname and URL
- Dashboard hostname and URL
- OIDC issuer
- Instance name
- Cloudflare account and zone IDs

View the outputs with:

```sh
terraform -chdir=terraform output
```

## Troubleshooting

### Terraform is not installed

If Terraform cannot be found, install it using the official Terraform installation instructions:

https://developer.hashicorp.com/terraform/install

Then verify the installation:

```sh
terraform version
```

### Terraform cannot authenticate with Cloudflare

Verify that:

- Your Cloudflare API token is valid.
- The token has the required permissions.
- The token belongs to the correct Cloudflare account.
- Your Cloudflare account ID is configured correctly.

###
