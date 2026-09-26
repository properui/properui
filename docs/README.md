# Proper UI documentation

These guides cover installing Proper UI, wiring it into a framework, theming it, and contributing components back.

There is no hosted documentation site yet. The full site (every component, every variant, live previews and props
tables) runs locally:

```bash
pnpm install
pnpm dev     # http://localhost:3000
```

Component-level reference (props, examples, source links) lives on that site, under
[`apps/docs/content/`](../apps/docs/content). The guides below are the parts you need before you get there.

## Getting started

| Guide                             | What it covers                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| [Installation](./installation.md) | Install as a package or copy components in with the CLI; manual setup from scratch |
| [Next.js](./nextjs.md)            | App Router and Pages Router setup, providers, server components                    |
| [Vite](./vite.md)                 | Vite + React setup, the Tailwind plugin, router wiring                             |

## Customising

| Guide                       | What it covers                                                      |
| --------------------------- | ------------------------------------------------------------------- |
| [Theming](./theming.md)     | The token layers and how to re-brand from one file                  |
| [Dark mode](./dark-mode.md) | The class-based strategy, `ThemeProvider`, section-scoped dark mode |
| [RTL](./rtl.md)             | Logical properties, `I18nProvider`, directional icons               |

## Tooling

| Guide                                                   | What it covers                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [CLI](./cli.md)                                         | `init`, `add`, `list`, `search`, `diff`, `login`                                                                    |
| [MCP server](./mcp.md)                                  | `@properui/mcp`: the registry and `add` as tools for AI assistants                                                  |
| [Contributing components](./contributing-components.md) | Adding a component end to end                                                                                       |
| [Ecosystem listing kit](./ecosystem.md)                 | Getting `@properui` listed on shadcn's registry directory, `registry.directory`, `21st.dev` and skills marketplaces |

## Reference

| Guide                                           | What it covers                                                                                            |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [Component API conventions](./component-api.md) | Flat props vs. compound (`Table.Header`), the three compound shapes, `className`/`children`/`href` idioms |
| [Figma mapping](./figma.md)                     | Untitled UI Figma layer names → registry slugs and real props, group by group                             |

## Elsewhere in the repo

- [README](../README.md): overview and quick start
- [CONTRIBUTING](../CONTRIBUTING.md): development setup, conventions, PR process
- [CODE_OF_CONDUCT](../CODE_OF_CONDUCT.md)
- [SECURITY](../SECURITY.md): reporting a vulnerability

## Requirements

| Dependency   | Version                                          |
| ------------ | ------------------------------------------------ |
| React        | 19                                               |
| Tailwind CSS | v4 (no `tailwind.config.js`)                     |
| TypeScript   | 5.9+ (optional for consumers, required to build) |
| Node         | 20+ (for the CLI and for development)            |
