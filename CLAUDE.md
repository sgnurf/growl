# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Growl** ("**Gr**aph s**o**mething **wl**") is a graph visualization application built with SvelteKit + Svelte 5 and D3.js, with Neo4j as the persistent graph database.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript/Svelte type checking
npm run check:watch  # Continuous type checking
npm run lint         # Prettier + ESLint
npm run format       # Auto-format code
npm run test         # Run all tests (unit + integration)
npm run test:unit    # Vitest unit tests only
npm run test:integration  # Playwright E2E tests only
```

To run a single unit test file:

```bash
npx vitest run src/lib/components/d3graph/graph.test.ts
```

## Architecture

### Frontend

- **SvelteKit** (adapter-auto) with **Svelte 5** runes (`$state`, `$derived`, `$props`)
- **Tailwind CSS v4** (configured via `@tailwindcss/vite` plugin, imported as `@import 'tailwindcss'` in styles.css — no `tailwind.config.js`)
- **D3.js v7** for force-directed graph simulation and SVG rendering

### Graph Visualization (`src/lib/components/d3graph/`)

The core visualization system:

- **`graph.svelte`** — Main component. Runs a D3 force simulation reactive to Svelte state. Accepts `config: GraphConfiguration`, `nodes: Node[]`, and `links: Link[]` props. The simulation is created once as a `const` (not `$derived`) to avoid mutating state inside a derived computation; `$effect` blocks configure forces and restart the simulation when inputs change. Simulation updates `renderedNodes` and `renderedLinks` on each tick.
- **`graphNodes/shape.svelte`** — Dispatcher that selects the correct node renderer based on `node.shapeConfiguration.shapeType`
- **`graphNodes/`** — Pluggable node renderers: `circle.svelte`, `square.svelte`, `triangle.svelte`, `custom.svelte`
- **`types.ts`** — Shared `Node` and `Link` type definitions
- **`graphTestHarness.svelte`** — Interactive test harness for the graph component

### Backend API (`src/routes/api/`)

SvelteKit server endpoints connecting to Neo4j:

| Endpoint                 | Method | Purpose                     |
| ------------------------ | ------ | --------------------------- |
| `/api/graph/node`        | POST   | Create/update nodes         |
| `/api/graph/node/delete` | DELETE | Remove nodes                |
| `/api/graph/link`        | POST   | Create relationships        |
| `/api/nodes`             | GET    | Stub: fetch all nodes/links |

- **`src/lib/services/neo4jQueryExecutor.ts`** — Neo4j driver abstraction (connects to `neo4j://localhost:7687`)
- **`fluentvalidation-ts`** is used for request body validation in API routes

### Coordinate spaces in `graph.svelte`

The SVG has a centered viewBox (`-width/2 -height/2 width height`). Pan/zoom is applied as a CSS transform on the inner `<g>` via D3 zoom, not on the SVG root. Simulation node positions (`x`, `y`, `fx`, `fy`) are in SVG/viewBox space. Drag event deltas (`e.dx`, `e.dy`) are also in SVG space — divide by the current zoom scale `k` to convert to simulation space. Never use raw `e.x`/`e.y` to set `fx`/`fy` directly; use the node's own `x`/`y` instead.

### Testing

- **Unit tests**: Vitest with JSDOM environment. `vite.config.ts` forces `resolve.conditions: ['browser']` in test mode so Svelte resolves to its browser build (not the SSR build). `setupTest.js` imports `@testing-library/jest-dom/vitest` for DOM matchers.
- **Integration tests**: Playwright (`playwright.config.ts`, tests in `tests/`). Requires a Neo4j instance running at `neo4j://localhost:7687` before running.
- Unit test files are colocated with source: `*.test.ts` alongside components
