#!/usr/bin/env node
/**
 * Browser runtime for Excalidraw SVG export.
 * Uses @excalidraw/utils internally via headless Chromium.
 */

import puppeteer from "puppeteer-core"
import http from "http"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Detect project root based on import location
let PROJECT_ROOT = __dirname
if (__dirname.includes(".quartz-cache")) {
  PROJECT_ROOT = path.resolve(__dirname, "..", "..")
} else if (__dirname.includes("scripts")) {
  PROJECT_ROOT = path.resolve(__dirname, "..")
}

const PORT = parseInt(process.env.PORT || "9222")

class BrowserRuntime {
  constructor() {
    this.browser = null
    this.server = null
  }

  async start() {
    if (this.server) return this
    const self = this

    this.server = http.createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*")
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
      res.setHeader("Access-Control-Allow-Headers", "Content-Type")

      if (req.url === "/render.html") {
        const renderHtmlPath = path.join(PROJECT_ROOT, "scripts", "render.html")
        if (fs.existsSync(renderHtmlPath)) {
          res.writeHead(200, { "Content-Type": "text/html" })
          res.end(fs.readFileSync(renderHtmlPath))
        } else {
          res.writeHead(404)
          res.end("render.html not found")
        }
      } else {
        res.writeHead(404)
        res.end("Not found")
      }
    })

    await new Promise((resolve) => this.server.listen(PORT, "127.0.0.1", resolve))

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    if (!executablePath) {
      throw new Error("PUPPETEER_EXECUTABLE_PATH or CHROME_PATH environment variable must be set")
    }

    this.browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })

    return this
  }

  async exportSvg(elements, appState = {}, files = {}) {
    const page = await this.browser.newPage()

    await page.goto(`http://127.0.0.1:${PORT}/render.html`, { timeout: 30000 })
    await page.waitForFunction(() => window.exportToSvg !== undefined, { timeout: 30000 })

    // Wait for bundle initialization
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const check = await page.evaluate(() => typeof window.ExcalidrawUtils)
    if (check === "undefined") {
      throw new Error("ExcalidrawUtils not loaded")
    }

    const svg = await page.evaluate(
      async (els, state, f) => {
        return await window.exportToSvg(els, state, f)
      },
      elements,
      appState,
      files,
    )

    await page.close()
    return svg
  }

  async stop() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }

  async healthCheck() {
    if (!this.browser || !this.browser.isConnected()) {
      return { status: "error", message: "Browser not connected" }
    }
    const pages = await this.browser.pages()
    return { status: "ok", pages: pages.length }
  }
}

export { BrowserRuntime }
export default BrowserRuntime
