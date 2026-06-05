import { FilePath, slugifyFilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { BrowserRuntime } from "../../../scripts/browser-runtime.mjs"
import fs from "fs"
import path from "path"
import { validateExcalidrawEmbeds, registerExcalidrawSlug } from "../transformers/excalidraw"

let browserRuntime: BrowserRuntime | null = null
let runtimeLock = false

function stripExt(s: string) {
  return s.replace(/\.(md|excalidraw)$/, "")
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
      const excalidrawPaths = allFiles.filter((fp) => fp.endsWith(".excalidraw") && !fp.endsWith(".excalidraw.md"))

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

      // ── Start browser runtime ─────────────────────────────────
      while (runtimeLock) {
        await new Promise((r) => setTimeout(r, 100))
      }
      runtimeLock = true

      if (!browserRuntime) {
        browserRuntime = new BrowserRuntime()
        await browserRuntime.start()
      }

      // ── Process pipeline content (.excalidraw.md files) ──────
      for (const [_, file] of pipelineExcalidraw) {
        const slug = file.data.slug!
        const excalidraw = file.data.excalidraw

        try {
          const elements = (excalidraw.elements || []).filter(
            (el: any) => !el.isDeleted,
          )
          const svg = await browserRuntime.exportSvg(
            elements,
            excalidraw.appState || {},
            excalidraw.files || {},
          )

          const svgPath = path.join(ctx.argv.output, `${stripExt(slug)}.svg`)
          fs.mkdirSync(path.dirname(svgPath), { recursive: true })
          fs.writeFileSync(svgPath, svg)
          fps.push(svgPath as FilePath)
        } catch (e) {
          console.error(`Error exporting Excalidraw for ${slug}:`, e)
        }
      }

      // ── Process .excalidraw files from filesystem ─────────────
      for (const fp of excalidrawPaths) {
        const fullPath = path.join(ctx.argv.directory, fp)
        try {
          const raw = await fs.promises.readFile(fullPath, "utf-8")
          const excalidraw = JSON.parse(raw)
          if (excalidraw.type !== "excalidraw") continue

          const slug = slugifyFilePath(fp as FilePath)
          const elements = (excalidraw.elements || []).filter(
            (el: any) => !el.isDeleted,
          )
          const svg = await browserRuntime.exportSvg(
            elements,
            excalidraw.appState || {},
            excalidraw.files || {},
          )

          const svgPath = path.join(ctx.argv.output, `${stripExt(slug)}.svg`)
          fs.mkdirSync(path.dirname(svgPath), { recursive: true })
          fs.writeFileSync(svgPath, svg)
          fps.push(svgPath as FilePath)
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

      await browserRuntime.stop()
      browserRuntime = null
      runtimeLock = false

      return fps
    },
  }
}
