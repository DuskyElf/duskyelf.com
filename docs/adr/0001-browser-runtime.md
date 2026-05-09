# ADR-0001: Browser Runtime for Excalidraw SVG Export

## Status

Accepted

## Context

Issue [#27](https://github.com/DuskyElf/duskyelf.com/issues/27) — Set up browser runtime infrastructure for Excalidraw SVG export.

The site needs to convert Excalidraw `.excalidraw` files to SVG at build time for static hosting. `@excalidraw/utils` provides `exportToSvg()` but requires a browser environment (DOM APIs, `document.createElementNS`, font loading via `FontFace`).

## Decision

**Browser runtime: Puppeteer + system Chromium (Chromium-only)**

- Use `puppeteer-core` (not full `puppeteer`) — flake.nix provides the browser binary
- `PUPPETEER_SKIP_DOWNLOAD=true` + `PUPPETEER_EXECUTABLE_PATH` env vars for reproducible builds
- CI uses `browser-actions/setup-chrome@v2` with `install-dependencies: true`
- Architecture: persistent daemon pattern — launch once, reuse across all drawings

### Why Puppeteer over Playwright

Per issue comment decision: Chromium-only use case, lighter footprint with `puppeteer-core`.

### Why not bundled Puppeteer browser

Avoids ~80MB download and ensures CI matches local development environment exactly.

## Consequences

### Positive
- Consistent Chromium version across local/CI via flake.nix
- Smaller npm install (puppeteer-core vs puppeteer bundle)
- CI can use `browser-actions/setup-chrome` which handles Ubuntu deps automatically

### Negative
- macOS/Windows users need to install Chromium separately (not via flake)
- `PUPPETEER_EXECUTABLE_PATH` must be set or Chromium must be on PATH

## References

- Issue [#27](https://github.com/DuskyElf/duskyelf.com/issues/27)
- [Puppeteer Configuration](https://pptr.dev/guides/configuration)
- [browser-actions/setup-chrome](https://github.com/browser-actions/setup-chromium)
