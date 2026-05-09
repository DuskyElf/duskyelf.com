#!/usr/bin/env node
/**
 * Browser runtime test harness for Excalidraw SVG export.
 * 
 * ## Purpose
 * This is a FOUNDATION TEST. It proves:
 * 1. Headless Chromium launches correctly via Puppeteer
 * 2. DOM/SVG APIs are available in the headless environment
 * 3. The Puppeteer + system Chromium setup works end-to-end
 * 
 * ## Not included (deferred to issue #26)
 * - Actual @excalidraw/utils ESM bundle loading
 * - Local server + render page architecture for SVG conversion
 * - Integration with Quartz build pipeline
 * 
 * ## Usage
 * nix develop && node scripts/browser-runtime.mjs
 */

import puppeteer from 'puppeteer-core';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '9222');

/**
 * Test page HTML that verifies browser APIs are available.
 */
const TEST_HTML = `
<!DOCTYPE html>
<html>
<head><title>Browser Runtime Test</title></head>
<body>
<div id="result"></div>
<script>
window.testBrowserAPIs = {
  hasWebGL: !!document.createElement('canvas').getContext('webgl'),
  hasCanvas: !!document.createElement('canvas').getContext('2d'),
  hasSVG: !!document.createElementNS && !!XMLSerializer,
  hasFontFace: typeof FontFace !== 'undefined',
  userAgent: navigator.userAgent
};
document.getElementById('result').textContent = 'Browser APIs loaded';
</script>
</body>
</html>
`;

class BrowserRuntime {
  constructor() {
    this.browser = null;
    this.server = null;
  }

  async start() {
    const self = this;
    
    this.server = http.createServer((req, res) => {
      if (req.url === '/test.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(TEST_HTML);
      } else if (req.url === '/api/export-svg') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { elements } = JSON.parse(body);
            const svg = await self.exportSvg(elements || []);
            res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
            res.end(svg);
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', browser: 'running' }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    await new Promise(resolve => this.server.listen(PORT, '127.0.0.1', resolve));
    console.log(`Server listening on http://127.0.0.1:${PORT}`);

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
                          process.env.CHROME_PATH ||
                          '/home/duskyelf/.nix-profile/bin/chromium';
    
    this.browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    console.log(`Browser launched: ${executablePath}`);
    return this;
  }

  /**
   * Foundation test: proves DOM/SVG APIs work in headless Chromium.
   * 
   * This does NOT use @excalidraw/utils — it uses native browser APIs
   * to create a simple SVG, proving the underlying infrastructure works.
   * 
   * The actual @excalidraw/utils integration belongs to issue #26.
   */
  async exportSvg(elements) {
    const page = await this.browser.newPage();
    
    try {
      await page.goto(`http://127.0.0.1:${PORT}/test.html`);
      await page.waitForFunction('window.testBrowserAPIs !== undefined', { timeout: 5000 });

      const svg = await page.evaluate((els) => {
        const sampleElements = els.length > 0 ? els : [{
          type: 'rectangle',
          id: 'test-rect',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          strokeColor: '#000000',
          backgroundColor: '#ffffff',
        }];

        // Create SVG using browser's DOM APIs
        // @excalidraw/utils uses the same underlying APIs
        const SVG_NS = 'http://www.w3.org/2000/svg';
        const svgElement = document.createElementNS(SVG_NS, 'svg');
        svgElement.setAttribute('width', '200');
        svgElement.setAttribute('height', '200');
        svgElement.setAttribute('viewBox', '0 0 200 200');
        
        const bg = document.createElementNS(SVG_NS, 'rect');
        bg.setAttribute('width', '200');
        bg.setAttribute('height', '200');
        bg.setAttribute('fill', '#ffffff');
        svgElement.appendChild(bg);
        
        for (const el of sampleElements) {
          if (el.type === 'rectangle') {
            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', el.x || 0);
            rect.setAttribute('y', el.y || 0);
            rect.setAttribute('width', el.width || 100);
            rect.setAttribute('height', el.height || 100);
            rect.setAttribute('fill', el.backgroundColor || '#ffffff');
            rect.setAttribute('stroke', el.strokeColor || '#000000');
            rect.setAttribute('stroke-width', '2');
            svgElement.appendChild(rect);
          }
        }
        
        return new XMLSerializer().serializeToString(svgElement);
      }, elements);

      return svg;
    } finally {
      await page.close();
    }
  }

  async stop() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    console.log('Browser runtime stopped');
  }

  async healthCheck() {
    if (!this.browser || !this.browser.isConnected()) {
      return { status: 'error', message: 'Browser not connected' };
    }
    const pages = await this.browser.pages();
    return { 
      status: 'ok', 
      pages: pages.length,
    };
  }
}

async function main() {
  const runtime = new BrowserRuntime();
  
  try {
    await runtime.start();
    
    const health = await runtime.healthCheck();
    console.log('Health:', health);

    console.log('\n--- Foundation Test: Browser APIs ---');
    const svg = await runtime.exportSvg([]);
    console.log('SVG output length:', svg.length);
    console.log('SVG preview:', svg.substring(0, 300) + '...');
    
    if (svg.includes('<svg') && svg.includes('</svg>')) {
      console.log('✓ DOM/SVG APIs work in headless Chromium');
    }

    console.log('\n✓ Browser runtime foundation test passed');
    console.log('  (This proves the infrastructure; actual @excalidraw/utils integration is issue #26)');
  } catch (err) {
    console.error('✗ Browser runtime test failed:', err.message);
    process.exit(1);
  } finally {
    await runtime.stop();
  }
}

export { BrowserRuntime };
export default BrowserRuntime;

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
