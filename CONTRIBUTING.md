<div align="center">

# Contributing to Muljax ID

Thanks for contributing to Muljax ID!

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

## Getting Started

Muljax ID is a TypeScript monorepo managed with Bun.

For installation, environment configuration, local development, and deployment instructions, see the [setup guide](./SETUP.md).

## Repository Structure

```text
.
├── apps/
│   ├── api/          # API Worker
│   └── dashboard/    # Dashboard application
├── scripts/          # Project scripts
├── terraform/        # Infrastructure configuration
├── .github/          # GitHub configuration
├── .vscode/          # VS Code configuration
├── biome.json        # Biome configuration
├── package.json
├── tsconfig.json
└── bun.lock
```

## Development

The project uses Bun for package management, scripts, and running TypeScript.

To see the available scripts:

```bash
bun run
```

### API

The API application lives in:

```text
apps/api
```

It is a Hono application running on Cloudflare Workers with Cloudflare D1 and Drizzle ORM.

### Dashboard

The dashboard application lives in:

```text
apps/dashboard
```

It is a React application built with Vite and served through a Cloudflare Worker.

## Code Quality

Before submitting changes, make sure all typechecks pass:

```bash
bun run typecheck
bun run typecheck:api
bun run typecheck:dashboard
```

Format the code with:

```bash
bun run format
```

Please do not submit changes that introduce TypeScript errors or leave the repository incorrectly formatted.

## Git Hooks

This repository uses [Husky](https://typicode.github.io/husky/) to run checks before commits.

The pre-commit hook runs:

```bash
bun run typecheck
bun run typecheck:api
bun run typecheck:dashboard
bunx --no -- commitlint --edit "$1"
```

If a typecheck fails or your commit does not use Conventional Commit style, the commit will be blocked.

### Bun and Husky

Git hooks may run with a different environment from your normal terminal, particularly when Git is invoked through an IDE or GUI.

Husky supports a user-level initialization file for this situation.

On macOS/Linux:

```text
~/.config/husky/init.sh
```

For example:

```sh
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

This file is local to your machine and should **not** be committed to the repository.

The repository's Husky hook intentionally does not contain machine-specific Bun paths so that it remains portable across environments.

## Making Changes

Create a branch for your work:

```bash
git checkout -b {feature,patch,fix,chore}/my-change
```

Make your changes, then run the relevant checks:

```bash
bun run typecheck
bun run typecheck:api
bun run typecheck:dashboard
bun run format
```

Review your changes:

```bash
git diff
```

Stage and commit:

```bash
git add .
git commit -m "feat: describe your change"
```

Husky will automatically run the pre-commit checks.

## Commit Messages

Muljax ID uses [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

Use concise commit messages that describe the change.

Examples:

```text
feat: add password reset flow
fix: handle expired sessions
refactor: simplify authentication middleware
docs: update setup instructions
chore: update dependencies
```

A useful format is:

```text
type: short description
```

Common types include:

- `feat` — new functionality
- `fix` — bug fix
- `refactor` — code restructuring without changing behavior
- `docs` — documentation changes
- `chore` — maintenance
