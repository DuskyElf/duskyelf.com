import { QuartzTransformerPlugin } from "../types"
import { Root } from "mdast"
import { visit } from "unist-util-visit"
import { FullSlug, FilePath, slugifyFilePath } from "../../util/path"

declare module "vfile" {
  interface DataMap {
    excalidraw?: any
  }
}

const embedsToValidate = new Set<{ sourceSlug: string; targetSlug: string; line: number }>()
const knownExcalidrawSlugs = new Set<string>()

export function registerExcalidrawSlug(slug: FullSlug) {
  knownExcalidrawSlugs.add(slug)
}

function stripExt(s: string) {
  return s.replace(/\.(md|excalidraw)$/, "")
}

function resolveExcalidrawTarget(sourceSlug: FullSlug, url: string, ctx: any): string {
  url = url.replace(/\.md$/, "")
  url = url.replace(/^(\.\.\/|\.\/)?content\//, "")

  // Already an absolute slug (no relative prefix)
  if (!url.startsWith(".")) return url

  // Resolve relative URL against the source slug's directory
  const sourceParts = sourceSlug.split("/")
  sourceParts.pop() // remove leaf to get directory
  for (const part of url.split("/")) {
    if (part === "." || part === "") continue
    if (part === "..") {
      if (sourceParts.length > 0) sourceParts.pop()
    } else {
      sourceParts.push(part)
    }
  }

  return sourceParts.join("/")
}

/** Build the SVG slug (absolute path) from an excalidraw target slug.
 *  The CrawlLinks HTML plugin will later rebase this to a relative URL
 *  from the page to the site root. */
function embedSvgPath(sourceSlug: string, targetSlug: string): string {
  return stripExt(targetSlug) + ".svg"
}

export const Excalidraw: QuartzTransformerPlugin = () => {
  return {
    name: "Excalidraw",
    markdownPlugins(ctx) {
      // Pre-scan for .excalidraw files (they're data files, not .md — won't go through pipeline)
      // Register their slugs so embed validation passes.
      const excalidrawFiles = (ctx.allFiles || []).filter(
        (fp: string) => fp.endsWith(".excalidraw") && !fp.endsWith(".excalidraw.md"),
      )
      for (const fp of excalidrawFiles) {
        registerExcalidrawSlug(slugifyFilePath(fp as FilePath))
      }

      return [
        () => {
          return (tree: Root, file) => {
            const sourceSlug = file.data.slug! as FullSlug
            const isExcalidrawFile = sourceSlug.endsWith(".excalidraw")

            if (isExcalidrawFile) {
              knownExcalidrawSlugs.add(sourceSlug)
              visit(tree, "code", (node: any) => {
                if (node.lang === "json") {
                  try {
                    const parsed = JSON.parse(node.value)
                    if (parsed.type === "excalidraw") {
                      file.data.excalidraw = parsed
                      const svgSrc = stripExt(sourceSlug) + ".svg"
                      node.type = "html" as any
                      node.value = `<div class="excalidraw-container"><img src="${svgSrc}" alt="Excalidraw Drawing" class="excalidraw-svg" /></div>`
                    }
                  } catch (e) {}
                }
              })
            }

            // Handle excalidraw embeds: ![alt](target.excalidraw) or ![alt](target.excalidraw.md)
            // After OFM text transforms, both ![]() and ![[wikilinks]] end up as image nodes.
            visit(tree, "image", (node: any, index, parent) => {
              const url = node.url
              if (!url.match(/\.excalidraw(\.md)?$/)) return

              const targetSlug = resolveExcalidrawTarget(sourceSlug, url, ctx)

              if (targetSlug.endsWith(".excalidraw")) {
                embedsToValidate.add({
                  sourceSlug,
                  targetSlug,
                  line: node.position?.start?.line ?? 0,
                })
                const srcPath = embedSvgPath(sourceSlug, targetSlug)

                // Replace with an HTML node so we can add the excalidraw-svg class
                // and wrapping div needed by the runtime inlining script.
                node.type = "html" as any
                node.value = `<div class="excalidraw-embed"><img src="${srcPath}" alt="${node.alt || ""}" class="excalidraw-svg" /></div>`
              }
            })

            // Also check raw HTML nodes (backward compat with any old syntax)
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
                  const srcPath = embedSvgPath(sourceSlug, targetSlug)
                  // Replace with an HTML img element that has the excalidraw-svg class
                  node.value = html.replace(
                    /!\[([^\]]*)\]\(([^)]*\.excalidraw[^)]*)\)/,
                    `<div class="excalidraw-embed"><img src="${srcPath}" alt="${alt}" class="excalidraw-svg" /></div>`,
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
        `Embed target not found: ${embed.targetSlug} (referenced in ${embed.sourceSlug}:${embed.line})`,
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
