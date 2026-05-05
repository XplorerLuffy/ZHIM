# ZHIM — Bhutan's Food Delivery Superapp

## Project Overview

ZHIM is a monorepo for Bhutan's food delivery superapp. It uses Turborepo with the following structure:

- `apps/customer` — Customer-facing mobile/web app
- `apps/rider` — Rider delivery app
- `apps/partner` — Restaurant partner dashboard
- `apps/console` — Internal admin console
- `apps/api` — Backend API
- `apps/wellexus` — Wellexus integration
- `packages/ui` — Shared UI component library
- `packages/types` — Shared TypeScript types
- `packages/i18n` — Internationalization

## Ruflo Plugin

Ruflo is registered as an MCP server for this project. It provides multi-agent AI orchestration with 100+ specialized agents, vector memory, self-learning, and swarm coordination.

**MCP server config:** `.claude/settings.json`

**Start the MCP server manually:**
```bash
npx ruflo@latest mcp start
```

**One-time full init (optional, adds hooks and daemon):**
```bash
npx ruflo@latest init
```

### Key Ruflo capabilities available via MCP tools

| Tool | Purpose |
|------|---------|
| `ruflo__memory_store` | Persist context across sessions |
| `ruflo__memory_search` | Retrieve past decisions and patterns |
| `ruflo__swarm_init` | Spin up a coordinated agent swarm |
| `ruflo__agent_spawn` | Launch a specialized agent |
| `ruflo__task_route` | Auto-route tasks to the right agent |

### Plugins

Install additional ruflo plugins as needed:

```bash
npx ruflo@latest plugins install ruflo-sparc      # 5-phase dev methodology
npx ruflo@latest plugins install ruflo-security-audit  # CVE scanning
npx ruflo@latest plugins install ruflo-testgen    # Auto test generation
npx ruflo@latest plugins install ruflo-docs       # Doc generation
npx ruflo@latest plugins install ruflo-jujutsu    # Git diff analysis
```

## Common Commands

```bash
npm run dev          # Start all apps
npm run build        # Build all packages
npm run test         # Run tests
npm run lint         # Lint everything
npm run type-check   # TypeScript check
npm run db:migrate   # Run API migrations
npm run db:seed      # Seed the database
```

## Tech Stack

- **Monorepo:** Turborepo + npm workspaces
- **Language:** TypeScript
- **Node:** >=20.0.0
