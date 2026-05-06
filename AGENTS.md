# AGENTS.md — DustyElf.com

## Role

This file is the agent’s operating law for the repo.

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

## Hard Boundaries

- `quartz/` is upstream-adjacent; record framework changes in `QUARTZ_CHANGES.md`
- `docs/` is Quartz documentation
- `docs/agents/` is repo-owned doctrine and vocabulary

## Working Surfaces

- Components / inline scripts → `quartz/components/` / `quartz/components/scripts/*.inline.ts`
- Transformers / filters / emitters → `quartz/plugins/*`
- Layout → `quartz.layout.ts`
- Theme → `quartz.config.ts`, `quartz/styles/custom.scss`

## Operational Memory

- `overflow-x: clip` preserves sticky children; `overflow-x: hidden` breaks them.
- The homepage uses raw HTML blocks for complex structure.
- Global animations must be scoped.
- `RecentNotes` has nested headings and tags; avoid broad selectors.

## Tone

Use repo vocabulary. Be brief. No action without the right doc context.
