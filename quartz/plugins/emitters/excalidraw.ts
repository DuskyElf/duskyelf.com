import { FilePath } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { BrowserRuntime } from "../../../scripts/browser-runtime.mjs"
import fs from "fs"
import path from "path"
import { validateExcalidrawEmbeds } from "../transformers/excalidraw"

let browserRuntime: BrowserRuntime | null = null
let runtimeLock = false

export const ExcalidrawSvg: QuartzEmitterPlugin = () => {
  return {
    name: "ExcalidrawSvg",
    getQuartzComponents() {
      return []
    },
    async emit(ctx, content, resources): Promise<FilePath[]> {
      const fps: FilePath[] = []
      const excalidrawFiles = content.filter((c) => c[1].data.excalidraw)

      // Validate embedded excalidraw files before emitting
      validateExcalidrawEmbeds()

      if (excalidrawFiles.length === 0) return fps

      // Simple lock to avoid multiple builds spinning up browsers concurrently
      while (runtimeLock) {
        await new Promise((r) => setTimeout(r, 100))
      }
      runtimeLock = true

      if (!browserRuntime) {
        browserRuntime = new BrowserRuntime()
        await browserRuntime.start()
      }

      for (const [_, file] of excalidrawFiles) {
        const slug = file.data.slug!
        const excalidraw = file.data.excalidraw

        try {
          const svg = await browserRuntime.exportSvg(
            excalidraw.elements || [],
            excalidraw.appState || {},
            excalidraw.files || {},
          )

          const svgPath = path.join(ctx.argv.output, `${slug}.svg`)
          fs.mkdirSync(path.dirname(svgPath), { recursive: true })
          fs.writeFileSync(svgPath, svg)
          fps.push(svgPath as FilePath)
        } catch (e) {
          console.error(`Error exporting Excalidraw for ${slug}:`, e)
        }
      }

      // If in serve mode or build mode, we don't stop the browser runtime
      // so it can be reused on subsequent builds
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
