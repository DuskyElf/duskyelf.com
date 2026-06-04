import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"
import { transformLink } from "../../util/path"

declare module "vfile" {
  interface DataMap {
    excalidraw?: any
  }
}

const embedsToValidate = new Set<{ sourceSlug: string; targetSlug: string; line: number }>()
const knownExcalidrawSlugs = new Set<string>()

function resolveExcalidrawTarget(sourceSlug: string, url: string, ctx: any): string {
  url = url.replace(/\.md$/, "")
  url = url.replace(/^(\.\.\/|\.\/)?content\//, "")
  const resolved = transformLink(sourceSlug, url, { strategy: "absolute", allSlugs: ctx.allSlugs })
  return resolved.replace(/^\.\//, "")
}

export const Excalidraw: QuartzTransformerPlugin = () => {
  return {
    name: "Excalidraw",
    markdownPlugins(ctx) {
      return [
        () => {
          return (tree: Root, file) => {
            const sourceSlug = file.data.slug!
            const isExcalidrawFile = sourceSlug.endsWith(".excalidraw")

            if (isExcalidrawFile) {
              knownExcalidrawSlugs.add(sourceSlug)
              visit(tree, "code", (node: any) => {
                if (node.lang === "json") {
                  try {
                    const parsed = JSON.parse(node.value)
                    if (parsed.type === "excalidraw") {
                      file.data.excalidraw = parsed
                      const title = "Excalidraw Drawing"
                      const slug = file.data.slug
                      node.type = "html" as any
                      node.value = `<div class="excalidraw-container"><img src="${slug}.svg" alt="${title}" class="excalidraw-svg" data-original-file="${slug}.md" /></div>`
                    }
                  } catch (e) {}
                }
              })
            }

            // Handle excalidraw embeds: ![alt](target.excalidraw.md)
            // OFM parses markdown to HTML, so we inspect html nodes
            visit(tree, "html", (node: any, _index, _parent) => {
              const html = node.value
              const match = html.match(/!\[([^\]]*)\]\(([^)]*\.excalidraw[^)]*)\)/)
              if (match) {
                const [, alt, url] = match
                const targetSlug = resolveExcalidrawTarget(sourceSlug, url, ctx)

                if (targetSlug.endsWith(".excalidraw")) {
                  embedsToValidate.add({
                    sourceSlug,
                    targetSlug,
                    line: node.position?.start?.line ?? 0,
                  })
                  const srcPath = targetSlug + ".svg"
                  const originalFile = targetSlug + ".md"
                  node.value = html.replace(
                    /!\[([^\]]*)\]\(([^)]*\.excalidraw[^)]*)\)/,
                    `<div class="excalidraw-embed"><img src="${srcPath}" alt="${alt}" data-original-file="${originalFile}" /></div>`,
                  )
                }
              }
            })
          }
        },
      ]
    },
    htmlPlugins() {
      return []
    },
  }
}

export function validateExcalidrawEmbeds() {
  const missing = []
  for (const embed of embedsToValidate) {
    if (!knownExcalidrawSlugs.has(embed.targetSlug)) {
      missing.push(
        `Embed target not found: ${embed.targetSlug} (referenced in ${embed.sourceSlug}.md:${embed.line})`,
      )
    }
  }
  if (missing.length > 0) {
    throw new Error(`\n` + missing.join(`\n`))
  }
}

export function clearExcalidrawState() {
  embedsToValidate.clear()
  knownExcalidrawSlugs.clear()
}
