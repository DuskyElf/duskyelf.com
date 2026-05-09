# Research: Issue #27 — Puppeteer + System Chromium + Excalidraw SVG Export

## Summary

Setup requires configuring Puppeteer to skip its bundled Chromium download and use the system installation, then using `@excalidraw/utils` `exportToSvg` API in a headless browser context for server-side SVG generation. GitHub Actions CI needs the `browser-actions/setup-chrome` action with `install-dependencies: true`.

---

## Findings

### 1. Puppeteer System Chromium Configuration

**Environment Variables** (skip browser download during install):
```bash
PUPPETEER_SKIP_DOWNLOAD=true
# or the browser-specific variant:
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

**Configuration File** (`.puppeteerrc.cjs` or `puppeteer.config.js`):
```javascript
/** @type {import("puppeteer").Configuration} */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  chrome: {
    skipDownload: true,
    executablePath: '/usr/bin/chromium-browser', // Linux default
  },
};
```

**Runtime Launch Options**:
```typescript
const browser = await puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'], // required for CI/containers
});
```

**Environment Variable Override** (if config not loaded early):
```bash
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

[Configuration | Puppeteer](https://pptr.dev/guides/configuration)  
[Configuration interface | Puppeteer](https://pptr.dev/next/api/puppeteer.configuration)  
[Stack Overflow: puppeteer-core + system chromium](https://stackoverflow.com/questions/56081642/use-puppeteer-core-and-installing-chromium-manually)

---

### 2. @excalidraw/utils exportToSvg API

**Package**: `@excalidraw/utils` (standalone, published as UMD + ESM)

**Import**:
```typescript
import { exportToSvg, exportToBlob } from "@excalidraw/utils";
```

**API Signature**:
```typescript
exportToSvg({
  elements: ExcalidrawElement[],
  appState?: Partial<AppState>,
  exportPadding?: number,       // default: 10
  files?: BinaryFiles,
  renderEmbeddables?: boolean,
  exportingFrame?: ExcalidrawFrameLikeElement | null,
  skipInliningFonts?: true,
  reuseImages?: boolean,
}): Promise<SVGSVGElement>
```

**Browser Requirements**:
- Must run in a **browser environment** (DOM APIs used internally)
- `document.createElementNS()` for SVG element creation
- `canvas.getContext('2d')` for text measurement
- Uses `roughjs/bin/rough` for SVG rendering
- Loads fonts via `FontFace` API

[Export Utilities | Excalidraw developer docs](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export)  
[@excalidraw/utils - npm](https://www.npmjs.com/package/@excalidraw/utils)

---

### 3. Node.js Headless Chromium SVG Rendering Pattern

**Full server-side export pattern**:

```typescript
import puppeteer from 'puppeteer';
import { exportToSvg } from '@excalidraw/utils';

async function renderExcalidrawToSvg(elements: any[], appState?: any): Promise<string> {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Load excalidraw utils in the browser context
    await page.addScriptTag({ url: 'https://unpkg.com/@excalidraw/utils@0.1.0/dist/excalidraw-utils.umd.prod.js' });
    
    // Execute export in browser
    const svgElement = await page.evaluate(async ({ elements, appState }) => {
      const ExcalidrawUtils = (window as any).ExcalidrawUtils;
      return await ExcalidrawUtils.exportToSvg({ elements, appState });
    }, { elements, appState });

    return svgElement.outerHTML;
  } finally {
    await browser.close();
  }
}
```

**Key Implementation Details** (`exportToSvg` internals from source):

From [`packages/excalidraw/scene/export.ts`](https://github.com/excalidraw/excalidraw/blob/2b0e4c96/packages/excalidraw/scene/export.ts):
1. Creates SVG root via `document.createElementNS(SVG_NS, "svg")`
2. Generates font face declarations via `Fonts.generateFontFaceDeclarations()`
3. Uses `rough.svg()` for roughJS rendering
4. Calls `renderSceneToSvg()` for element rendering

From [`packages/utils/src/export.ts`](https://github.com/excalidraw/excalidraw/blob/2b0e4c96/packages/utils/src/export.ts):
- Wrapper that restores elements and appState before calling `_exportToSvg`
- Handles `deleteInvisibleElements: true` preprocessing

---

### 4. GitHub Actions CI Setup

**Action**: `browser-actions/setup-chrome@v2`

**Basic Workflow**:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Chromium
        uses: browser-actions/setup-chrome@v2
        with:
          chrome-version: stable
          install-dependencies: true  # Required on Ubuntu runners

      - name: Install dependencies
        run: npm ci
        env:
          PUPPETEER_SKIP_DOWNLOAD: true
          PUPPETEER_EXECUTABLE_PATH: ${{ steps.setup-chrome.outputs.chrome-path }}

      - name: Run build
        run: npm run build
```

**Getting the executable path**:
```yaml
- id: setup-chrome
  uses: browser-actions/setup-chrome@v2
  with:
    chrome-version: stable
    install-dependencies: true

- run: echo "Chromium at: ${{ steps.setup-chrome.outputs.chrome-path }}"
```

[browser-actions/setup-chrome](https://github.com/browser-actions/setup-chromium)  
[Getting Started | browser-actions/setup-chrome](https://deepwiki.com/browser-actions/setup-chrome/2-getting-started)

---

## Configuration Values Summary

| Setting | Value |
|---------|-------|
| `PUPPETEER_SKIP_DOWNLOAD` | `true` |
| Linux Chromium path | `/usr/bin/chromium-browser` |
| CI `install-dependencies` | `true` (Ubuntu) |
| Launch args (CI) | `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage` |
| `headless` option | `'new'` (modern) or `true` (legacy) |
| `@excalidraw/utils` version | `0.1.0+` (UMD/ESM dual) |
| Default export padding | `10` |

---

## Sources

### Kept

- [Configuration | Puppeteer](https://pptr.dev/guides/configuration) — Official docs for configuration options
- [browser-actions/setup-chrome](https://github.com/browser-actions/setup-chromium) — Official GitHub Action for CI Chromium setup
- [Export Utilities | Excalidraw developer docs](https://docs.excalidraw.com/docs/@excalidraw/excalidraw/api/utils/export) — API documentation
- [`packages/excalidraw/scene/export.ts`](https://github.com/excalidraw/excalidraw/blob/2b0e4c96/packages/excalidraw/scene/export.ts) — Source implementation of `exportToSvg`
- [`packages/utils/src/export.ts`](https://github.com/excalidraw/excalidraw/blob/2b0e4c96/packages/utils/src/export.ts) — Public API wrapper
- [Stack Overflow: puppeteer-core + system Chromium](https://stackoverflow.com/questions/56081642/use-puppeteer-core-and-installing-chromium-manually) — Pattern for lighter puppeteer-core usage

### Dropped

- `convert-svg` and `svg-to-img` packages — Higher-level wrappers, not needed given direct Puppeteer control
- `akabekobeko/npm-svg2png` — Overkill for pure SVG export use case

---

## Gaps

- **NixOS/nixpkgs specific paths**: The nixpkgs Chromium binary path is `/nix/store/...-chromium-<version>/bin/chromium-browser` — exact path depends on the specific package version. May need Nix evaluation or runtime path detection.
- **Browser version compatibility**: `@excalidraw/utils` doesn't pin minimum Chromium version — roughjs-based rendering should work with any modern Chromium.
- **Font loading in headless mode**: Font inlining (`skipInliningFonts`) may behave differently without display fonts available; test with system fonts.

## Suggested Next Steps

1. Verify nixpkgs Chromium binary location with `nix eval --raw 'nixpkgs.chromium.out'` or similar
2. Test `exportToSvg` in headless context with minimal elements to confirm DOM APIs work
3. Check if `renderSceneToSvg` has any canvas-dependent code paths that fail in pure headless
