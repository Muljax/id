# Contributing to Muljax ID API

Thank you for contributing to the Muljax ID API!

## Development Workflow

1. Fork or branch from `main`:
   ```sh
   git checkout -b fix/my-fix
   ```
2. Install dependencies:
   ```sh
   bun install
   ```
3. Run tests and typechecking:
   ```sh
   bun test
   bun run typecheck
   bun run check
   ```

## Commit Conventions

This repository enforces [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new capabilities or endpoints
- `fix:` bug fixes and protocol corrections
- `refactor:` internal restructuring without behavior changes
- `test:` adding or updating tests
- `chore:` maintenance and dependency updates

Releases and changelogs are generated automatically via Release Please upon merge to `main`.
