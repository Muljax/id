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

Initialize Terraform:

```sh
terraform -chdir=terraform init
```

Review the infrastructure changes:

```sh
terraform -chdir=terraform plan
```

Apply the infrastructure:

```sh
terraform -chdir=terraform apply
```

Terraform will provision and configure the required Cloudflare infrastructure.

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
│   ├── api/             # Hono API Worker
│   └── dashboard/       # React + Vite dashboard
├── scripts/
│   └── oidc-key.ts      # OIDC signing key generator
├── terraform/           # Cloudflare infrastructure
├── biome.json           # Biome configuration
├── package.json
└── .env.example
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

### Terraform variables are missing

Make sure you have created the Terraform variables file:

```sh
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Then verify that the required values are configured.

Terraform does not automatically read `.env` files.

### Deployment issues

If deployment fails, verify that:

- All required Terraform variables are populated.
- The `OIDC_PRIVATE_KEY` has been generated.
- The OIDC private key has been provided to Terraform.
- Terraform has been initialized with `terraform -chdir=terraform init`.
- You are running commands from the repository root.
- Your Cloudflare credentials have the required permissions.

## Updating an existing deployment

To update an existing installation, pull the latest changes and run:

```sh
git pull

bun install

terraform -chdir=terraform plan
terraform -chdir=terraform apply
```

Terraform will re
