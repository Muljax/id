# Muljax ID Documentation Portal

Documentation portal for the **Muljax Identity Platform**, built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).

## Development

Start the local documentation development server:

```sh
bun run dev
```

The site will be available at `http://localhost:4321`.

## Building for Production

Compile static assets and generate the search index:

```sh
bun run build
```

The static output will be generated in `./dist/`.

## Structure

```text
apps/docs/
├── src/
│   ├── assets/       # Media and diagrams
│   └── content/
│       └── docs/     # Markdown and MDX documentation pages
│           ├── admin-guides/
│           ├── getting-started/
│           ├── overview/
│           ├── protocols/
│           ├── reference/
│           └── user-guides/
├── astro.config.mjs  # Astro and Starlight configuration
└── package.json
```

## Adding and Editing Documentation

Documentation pages are written in `.md` or `.mdx` under `src/content/docs/`. Starlight automatically maps file paths to web routes with built-in search, syntax highlighting, and Mermaid diagram rendering.
