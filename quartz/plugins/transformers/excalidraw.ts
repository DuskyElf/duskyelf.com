import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"
import { findAndReplace } from "mdast-util-find-and-replace"
import { BrowserRuntime } from "../../../scripts/browser-runtime.mjs"

declare module "vfile" {
  interface DataMap {
    excalidraw?: any
  }
}

export const Excalidraw: QuartzTransformerPlugin = () => {
  return {
    name: "Excalidraw",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root, file) => {
            // Check if this is an excalidraw file
            const isExcalidrawFile = file.data.slug?.endsWith(".excalidraw")
            if (isExcalidrawFile) {
              // Extract JSON and set as file.data.excalidraw
              visit(tree, "code", (node) => {
                if (node.lang === "json") {
                  try {
                    const parsed = JSON.parse(node.value)
                    if (parsed.type === "excalidraw") {
                      file.data.excalidraw = parsed
                      
                      // Rewrite the markdown node to use the SVG that will be generated
                      // The filename will just be the slug + .svg, which is handled
                      // by the Content plugin returning it as an image embed
                      const title = "Excalidraw Drawing"
                      const slug = file.data.slug
                      node.type = "html" as any
                      node.value = `<div class="excalidraw-container"><img src="${slug}.svg" alt="${title}" class="excalidraw-svg" /></div>`
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              })
            }
          }
        },
      ]
    },
    htmlPlugins() {
      return []
    }
  }
}
