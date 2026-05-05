# AGENTS.md — DustyElf.com

## Project

Personal digital garden/blog. Static site built with Quartz 4 → GitHub Pages.

## What This Agent Handles

- **Dev**: Running server, type checks, debugging
- **UI**: Tweaks to existing components or adding new ones
- **NOT content**: Blog posts/notes are written manually by the human.

## Tech Stack

- Quartz 4.5.2 (SSG), Preact, TypeScript
- Node ≥22, npm ≥10.9.2

## Dev Commands

```bash
npm run docs      # Build & serve locally (http://localhost:8080)
npm run check    # TS + Prettier check
npm run format   # Auto-format
```

## UI Customization Points

### CSS (main styling)

- `quartz/styles/custom.scss` — your CSS overrides
- `quartz/styles/syntax.scss` — code highlighting theme

### Components

- `quartz/components/` — React/Preact components
- Layout defined in `quartz/layout.ts`

### Theme Config

- `quartz.config.ts` — colors, fonts, plugins

## Design

- Use **frontend-design** skill for aesthetic guidance
- Fonts: Schibsted Grotesk (headers), Source Sans Pro (body), IBM Plex Mono (code)
- Primary accent: orange (#e04006 / #ff5a1f dark)
- Avoid generic AI aesthetics — make it distinct

## Key Files

| File                        | Purpose             |
| --------------------------- | ------------------- |
| `quartz.config.ts`          | Site config         |
| `quartz.layout.ts`          | Layout & components |
| `quartz/styles/custom.scss` | Your CSS            |
| `content/`                  | Markdown content    |

## Implementation Discoveries & Context

- **Homepage (`content/index.md`)**: Actively uses raw HTML block elements (`<div class="hero-section">`) rather than just markdown to enable complex flexbox layouts and specific DOM styling.
- **Animation Targeting**: Global transitions (like `fadeUp`) can easily collide with nested component elements. Always scope animations explicitly (e.g. `> h3` instead of `h3`) and actively disable (`animation: none`) nested animations if the parent handles the transition, especially for `.tags` and nested headers.
- **Quartz `RecentNotes` component**: The CSS class `.recent-notes` contains nested `h3` tags and `.tags` lists. When animating this component, avoid selecting nested tags universally.
- **Dark Mode Dividers/Graphs**: Ensure `--lightgray` in dark mode (`quartz.config.ts`) is bright enough (e.g. `#2a2a2a`) to be visible against the `#050505` background; the default `#1a1a1a` renders borders and graph node connections practically invisible.
