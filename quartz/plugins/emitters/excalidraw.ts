import { FilePath, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { BrowserRuntime } from "../../../scripts/browser-runtime.mjs"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { validateExcalidrawEmbeds, registerExcalidrawSlug } from "../transformers/excalidraw"

let browserRuntime: BrowserRuntime | null = null
let runtimeLock = false

const CACHE_DIR = path.join(process.cwd(), "cache", "excalidraw")

function stripExt(s: string) {
  return s.replace(/\.(md|excalidraw)$/, "")
}

function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex")
}

function cachePaths(slug: string) {
  const base = path.join(CACHE_DIR, `${stripExt(slug)}`)
  return { svg: `${base}.svg`, hash: `${base}.hash` }
}

export const ExcalidrawSvg: QuartzEmitterPlugin = () => {
  return {
    name: "ExcalidrawSvg",
    getQuartzComponents() {
      return []
    },
    async emit(ctx, content, _resources): Promise<FilePath[]> {
      const fps: FilePath[] = []

      // ── Scan .excalidraw files from the filesystem ────────────
      // They're not .md so they bypass the pipeline; we read them directly.
      const allFiles: string[] = ctx.allFiles || []
      const excalidrawPaths = allFiles.filter(
        (fp) => fp.endsWith(".excalidraw") && !fp.endsWith(".excalidraw.md"),
      )

      // ── Gather pipeline-processed excalidraw content ──────────
      const pipelineExcalidraw = content.filter((c) => c[1].data.excalidraw)

      // ── Register all known slugs before validation ────────────
      // (pipeline slugs are already registered by the transformer)
      for (const fp of excalidrawPaths) {
        registerExcalidrawSlug(slugifyFilePath(fp as FilePath))
      }

      // ── Validate embeds ──────────────────────────────────────
      validateExcalidrawEmbeds()

      if (pipelineExcalidraw.length === 0 && excalidrawPaths.length === 0) return fps

      // ── Ensure cache directory exists ─────────────────────────
      await fs.promises.mkdir(CACHE_DIR, { recursive: true })

      // ── Helper: ensure browser runtime is started (lazy) ──────
      async function startRuntime(): Promise<BrowserRuntime> {
        while (runtimeLock) {
          await new Promise((r) => setTimeout(r, 100))
        }
        runtimeLock = true
        if (!browserRuntime) {
          browserRuntime = new BrowserRuntime()
          await browserRuntime.start()
        }
        runtimeLock = false
        return browserRuntime
      }

      // ── Helper: render excalidraw data to SVG ─────────────────
      async function renderSvg(
        elements: any[],
        appState: any,
        files: any,
      ): Promise<string> {
        const runtime = await startRuntime()
        return runtime.exportSvg(elements, appState, files)
      }

      // ── Helper: attempt cache replay for a slug ───────────────
      // Returns true if cache hit, false if miss (needs re-render).
      async function tryServeFromCache(
        slug: string,
        hash: string,
        svgOut: string,
      ): Promise<boolean> {
        const { svg: svgCache, hash: hashCache } = cachePaths(slug)

        let cachedHash: string | null = null
        try {
          cachedHash = await fs.promises.readFile(hashCache, "utf-8")
        } catch {}

        if (cachedHash !== hash) return false

        try {
          await fs.promises.mkdir(path.dirname(svgOut), { recursive: true })
          await fs.promises.copyFile(svgCache, svgOut)
          return true
        } catch {
          return false
        }
      }

      // ── Helper: write SVG to both output and cache ────────────
      async function writeSvg(slug: string, svg: string, svgOut: string, hash: string) {
        const { svg: svgCache, hash: hashCache } = cachePaths(slug)
        await fs.promises.mkdir(path.dirname(svgOut), { recursive: true })
        await fs.promises.mkdir(path.dirname(svgCache), { recursive: true })
        await fs.promises.writeFile(svgOut, svg)
        await fs.promises.writeFile(svgCache, svg)
        await fs.promises.writeFile(hashCache, hash)
      }

      // ── Process pipeline content (.excalidraw.md files) ──────
      for (const [_, file] of pipelineExcalidraw) {
        const slug = file.data.slug!
        const excalidraw = file.data.excalidraw

        try {
          const sourceStr = JSON.stringify(excalidraw)
          const hash = hashContent(sourceStr)
          const svgOut = path.join(ctx.argv.output, `${stripExt(slug)}.svg`)

          if (await tryServeFromCache(slug, hash, svgOut)) {
            fps.push(svgOut as FilePath)
            continue
          }

          const elements = (excalidraw.elements || []).filter(
            (el: any) => !el.isDeleted,
          )
          const svg = await renderSvg(
            elements,
            excalidraw.appState || {},
            excalidraw.files || {},
          )

          await writeSvg(slug, svg, svgOut, hash)
          fps.push(svgOut as FilePath)
        } catch (e) {
          console.error(`Error exporting Excalidraw for ${slug}:`, e)
        }
      }

      // ── Process .excalidraw files from filesystem ─────────────
      for (const fp of excalidrawPaths) {
        const fullPath = path.join(ctx.argv.directory, fp)
        try {
          const raw = await fs.promises.readFile(fullPath, "utf-8")
          const hash = hashContent(raw)

          const slug = slugifyFilePath(fp as FilePath)
          const svgOut = path.join(ctx.argv.output, `${stripExt(slug)}.svg`)

          if (await tryServeFromCache(slug, hash, svgOut)) {
            fps.push(svgOut as FilePath)
            continue
          }

          const excalidraw = JSON.parse(raw)
          if (excalidraw.type !== "excalidraw") continue

          const elements = (excalidraw.elements || []).filter(
            (el: any) => !el.isDeleted,
          )
          const svg = await renderSvg(
            elements,
            excalidraw.appState || {},
            excalidraw.files || {},
          )

          await writeSvg(slug, svg, svgOut, hash)
          fps.push(svgOut as FilePath)
        } catch (e) {
          console.error(`Error exporting Excalidraw for ${fp}:`, e)
        }
      }

      // ── Browser runtime cleanup ───────────────────────────────
      const isServeMode = ctx.argv.serve === true
      if (isServeMode) {
        runtimeLock = false
        return fps
      }

      if (browserRuntime) {
        await browserRuntime.stop()
        browserRuntime = null
      }
      runtimeLock = false

      return fps
    },
  }
}
