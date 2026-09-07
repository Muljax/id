<div align="center">

# Muljax Identity Platform

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

---

> [!WARNING]
> Muljax Identity Platform is pre-1.0 and, as such, may ship breaking releases without a major semver bump.

## Overview

The project consists of two main applications, the [API](./apps/api) and the [dashboard](./apps/dashboard).

## API

The Muljax ID API is a [Hono](https://hono.dev/) application running on [Cloudflare Workers](https://workers.cloudflare.com/).

The API uses [Cloudflare D1](https://developers.cloudflare.com/d1/) as its database, with [Drizzle ORM](https://orm.drizzle.team/) for database access.

### API Structure

```text
apps/api/
├── src/
│   ├── db/           # Database schema and queries
│   ├── middleware/   # API middleware
│   ├── routes/       # API routes
│   └── index.ts      # Worker entrypoint
└── wrangler.jsonc
```

## Dashboard

The Muljax ID dashboard is a [React](https://react.dev/) app built with [Vite](https://vite.dev).

### Dashboard Structure

```text
apps/dashboard/
├── src/
│   ├── components/   # Reusable UI components
│   ├── lib/          # Client-side utilities
│   └── routes/       # Dashboard routes
└── vite.config.ts
```

## Project Structure

```text
.
├── apps/
│   ├── api/          # Hono API
│   └── dashboard/    # React + Vite dashboard
└── README.md
```

## Development

### Requirements

* [Bun](https://bun.sh/)
* [Cloudflare](https://www.cloudflare.com/)

### Install

```sh
bun install
```

### Development

Start the development environment with:

```sh
bun run dev
```

## Deployment

Muljax Identity Platform is deployed using [Alchemy](https://alchemy.run/) and runs on [Cloudflare Workers](https://workers.cloudflare.com/).

The API uses [Cloudflare D1](https://developers.cloudflare.com/d1/) for persistent storage.

## License

See the [LICENSE](./LICENSE) file for details.
