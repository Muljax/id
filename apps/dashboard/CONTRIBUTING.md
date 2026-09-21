# Contributing to Muljax ID Dashboard

Thank you for contributing to the Muljax ID Dashboard!

## Development Workflow

1. Fork or branch from `main`:
   ```sh
   git checkout -b feat/my-feature
   ```
2. Install dependencies:
   ```sh
   bun install
   ```
3. Run checks and build:
   ```sh
   bun run typecheck
   bun run check
   bun run build
   ```

## Commit Conventions

This repository enforces [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new dashboard features or UI views
- `fix:` UI bug fixes and state corrections
- `style:` styling and layout refinements
- `refactor:` component refactoring without functional changes
- `chore:` maintenance and dependency updates

Releases and changelogs are generated automatically via Release Please upon merge to `main`.
