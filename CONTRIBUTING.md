<div align="center">

# Contributing to Muljax ID

Thanks for contributing to Muljax ID!

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

## Getting Started

Muljax ID is a TypeScript monorepo managed with Bun.

For installation, environment configuration, local development, and deployment instructions, see the [setup guide](./SETUP.md).

## Repository Structure

```text
.
├── alchemy/          # Infrastructure configuration
├── apps/
│   ├── api/          # API Worker
│   └── dashboard/    # Dashboard application
├── .github/          # GitHub configuration
├── .vscode/          # VS Code configuration
├── alchemy.run.ts    # Alchemy entry point
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

### Dashboard

The dashboard application lives in:

```text
apps/dashboard
```

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

If a typecheck fails or your commit does not use conventional commit style, the commit will be blocked.

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

The repository's Husky hook intentionally does not contain machine-specific Bun paths so that it remains portable across Windows, macOS, and Linux.

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

* `feat` — new functionality
* `fix` — bug fix
* `refactor` — code restructuring without changing behavior
* `docs` — documentation changes
* `chore` — maintenance
* `test` — tests
* `perf` — performance improvements

## Infrastructure

Muljax ID uses Alchemy to manage its Cloudflare infrastructure.

To preview infrastructure changes:

```bash
bun run plan
```

To deploy:

```bash
bun run deploy
```

Infrastructure changes should be reviewed carefully because they may modify Cloudflare resources.

## Pull Requests

When opening a pull request:

* Explain what changed.
* Explain why the change was needed.
* Keep the PR focused.
* Include relevant testing information.
* Make sure all typechecks pass.
* Make sure formatting passes.
* Do not include secrets or local `.env` files.
* Do not include unrelated changes.

Before requesting review, verify:

```bash
bun run typecheck
bun run typecheck:api
bun run typecheck:dashboard
bun run format
```

## Environment Variables

Never commit secrets or credentials.

Use:

```text
.env
```

for local configuration and:

```text
.env.example
```

to document required environment variables.

If you add a new required environment variable, update `.env.example` with a safe placeholder.

For environment setup instructions, see [`SETUP.md`](./SETUP.md).

## Reporting Issues

If you find a bug or have an idea for an improvement, open an issue with enough information for someone else to reproduce or understand the problem.

Include, where applicable:

* What you expected to happen
* What actually happened
* Steps to reproduce the issue
* Relevant error messages
* Environment information
* A minimal reproduction

## License

Muljax ID is licensed under the GNU General Public License v3.0.

See [`LICENSE`](./LICENSE) for the complete license.
