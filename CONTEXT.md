# Context — DustyElf.com

*Quartz 4 digital garden and personal blog with a custom authored layer on top of the upstream framework.*

---

## Glossary

### Site
The generated static site: HTML, CSS, and assets deployed to GitHub Pages.

### Content
Markdown in `content/`. This is the authored source of truth.

### Docs
Quartz documentation in `docs/`. These are reference texts for Quartz behavior.

### Repo Docs
`docs/agents/`. Repo-owned doctrine, vocabulary, and workflow rules. Not Quartz.

### QUARTZ_CHANGES.md
The record of framework-adjacent edits and why they exist.

### Component
A Preact/React function in `quartz/components/` that renders one part of the page tree.

### Inline Script
A `.inline.ts` file in `quartz/components/scripts/` that is bundled for browser execution.

### Layout
The arrangement of components into page regions, defined in `quartz.layout.ts`.

### Theme
The site’s visual language: colors, typography, spacing, and motion.

### Transformer
A plugin that changes content during the parse/transform phase.

### Filter
A plugin that decides whether content is published.

### Emitter
A plugin that produces output artifacts such as HTML, JSON, RSS, sitemap, or image assets.

---

## System Model

The custom layer extends Quartz through authored content, components, plugins, layout composition, and styling.

### Render Path
`content/` → Quartz pipeline → emitters → static site

### Component Path
Components receive page data and render into layout slots such as `head`, `header`, `left`, `right`, `beforeBody`, `afterBody`, and `footer`.

### Plugin Path
Transformers modify content, filters narrow publication, emitters materialize output.

### Script Path
Inline scripts attach to components, bundle through Quartz, and run in the browser after DOM lifecycle points such as `beforeDOMLoaded` and `afterDOMLoaded`.

### Style Path
Styles layer from Quartz base, then `quartz/styles/custom.scss`, then component-local CSS/SCSS.

### Layout Path
`quartz.layout.ts` composes shared components and page-specific regions; higher-order wrappers like `Flex`, `DesktopOnly`, `MobileOnly`, and `ConditionalRender` modify placement and visibility.

---

## Boundary Model

- `quartz/` is the framework layer.
- `content/` is the authored layer.
- `docs/` is Quartz reference.
- `docs/agents/` is repo-owned memory for repo-specific language and workflow.
- `QUARTZ_CHANGES.md` records framework-adjacent modifications.

---

## Docs Hierarchy

Read these docs by surface:

- [`docs/advanced/creating components.md`](docs/advanced/creating%20components.md) — component model, props, styling, scripts
- [`docs/advanced/making plugins.md`](docs/advanced/making%20plugins.md) — plugin model and pipeline roles
- [`docs/layout-components.md`](docs/layout-components.md) — layout helpers and visibility wrappers
- [`docs/layout.md`](docs/layout.md) — layout structure
- [`docs/configuration.md`](docs/configuration.md) — theme and configuration
- [`docs/authoring content.md`](docs/authoring%20content.md) — markdown content and frontmatter
- [`docs/advanced/paths.md`](docs/advanced/paths.md) — slug and path semantics
- [`docs/agents/domain.md`](docs/agents/domain.md) — how agents consume this repo's meta knowledge
- [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md) — issue workflow language
- [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md) — label vocabulary

---

## Operational Memory

- `overflow-x: hidden` on `html` or `body` breaks sticky positioning; `overflow-x: clip` preserves it.
- The homepage uses raw HTML blocks for complex composition.
- Global animations must be scoped; nested selectors collide.
- `.recent-notes` contains nested headings and tags; universal selectors are too broad.
- The search system uses a custom CJK-aware tokenizer.

---

## Deep Reference

### Extensions
Prefer extending Quartz through components, plugins, layout bindings, and styles instead of forking framework code. If a framework-adjacent change is required, record it in `QUARTZ_CHANGES.md`.

### Interactivity
Interactive behavior lives in scripts, not component event handlers. Scripts are attached explicitly and cleaned up across SPA navigation.

---

*This file is for deeper conversations: vocabulary, boundaries, and how the system is assembled.*
