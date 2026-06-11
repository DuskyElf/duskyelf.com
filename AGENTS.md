## Prime Law

Read the doc for the surface you are touching. Do not act from memory.

- Components / inline scripts — [`docs/advanced/creating components.md`](docs/advanced/creating%20components.md)
- Plugins / filters / emitters — [`docs/advanced/making plugins.md`](docs/advanced/making%20plugins.md)
- Layout — [`docs/layout-components.md`](docs/layout-components.md), [`docs/layout.md`](docs/layout.md)
- Theme — [`docs/configuration.md`](docs/configuration.md)
- Content — [`docs/authoring content.md`](docs/authoring%20content.md)
- Repo vocabulary — [`docs/agents/domain.md`](docs/agents/domain.md)
- Issues / labels — [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md), [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md)

## Agent skills

- **Issue tracker** — GitHub Issues via `gh`. [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)
- **Triage labels** — `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md)
- **Quartz + repo docs** — read root `CONTEXT.md` for the repo's custom Quartz layer. [`docs/agents/domain.md`](docs/agents/domain.md)

## System Shape

Quartz 4 with a custom authored layer.

- `content/` → source pages
- `quartz/` → framework layer
- `quartz.components` / `quartz.plugins` → extension points
- `quartz.layout.ts` → page regions
- `quartz/styles/custom.scss` → site voice
- `scripts/` → build-time tooling (browser runtime for Excalidraw SVG export)
- `sequoia.json` → Sequoia Comments config
- `wrangler.toml` → Cloudflare Pages deployment config

## Hard Boundaries

- `quartz/` is upstream-adjacent; record framework changes in `QUARTZ_CHANGES.md`
- `docs/` is Quartz documentation
- `docs/agents/` is repo-owned doctrine and vocabulary

## Working Surfaces

- Components / inline scripts → `quartz/components/` / `quartz/components/scripts/*.inline.ts`
- Build-time scripts → `scripts/` (browser runtime, excalidraw bundle)
- Transformers / filters / emitters → `quartz/plugins/*`
- Layout → `quartz.layout.ts`
- Theme → `quartz.config.ts`, `quartz/styles/custom.scss`
- Config → `sequoia.json`, `wrangler.toml`
- Decisions → `docs/adr/`

## Operational Memory

- `overflow-x: clip` preserves sticky children; `overflow-x: hidden` breaks them.
- The homepage uses raw HTML blocks for complex structure.
- Global animations must be scoped.
- `RecentNotes` has nested headings and tags; avoid broad selectors.
- Sequoia Comments uses `<sequoia-comments>` custom element, injects script via `afterDOMLoaded` on non-index pages.
- Excalidraw uses a Puppeteer browser runtime in `scripts/browser-runtime.mjs` for build-time SVG export; SVGs are content-hashed and cached in `cache/excalidraw/`.
- Content in dot-directories (`.well-known/`) is now supported (dotfile glob fix in `QUARTZ_CHANGES.md`).

## Tone

Use repo vocabulary. Be brief. No action without the right doc context.
