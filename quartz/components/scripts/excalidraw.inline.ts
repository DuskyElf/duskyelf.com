import { attachPopoverListeners } from "./popover.inline"

// ── Dark mode color swapping ─────────────────────────────────────
// Instead of CSS filter: invert() which doesn't handle SVG text with
// custom @font-face fonts, we swap fill/stroke attributes directly.
// This preserves correct text color switching in dark mode.

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  hex = hex.replace(/^#/, "")
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  }
  if (hex.length !== 6) return null
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    Math.round(r).toString(16).padStart(2, "0") +
    Math.round(g).toString(16).padStart(2, "0") +
    Math.round(b).toString(16).padStart(2, "0")
  )
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h, s, l }
}

function hslToRgb(h: number, s: number, l: number) {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return { r: r * 255, g: g * 255, b: b * 255 }
}

/**
 * Transform a hex color for dark mode by inverting lightness
 * while preserving hue and saturation.
 */
function lightColorToDark(hex: string, bgColor?: string): string | null {
  if (!hex || hex === "none" || hex === "transparent" || hex.startsWith("url(")) {
    return null
  }
  const rgb = hexToRgb(hex)
  if (!rgb) return null

  // Near-white → use actual page background color so it blends seamlessly
  if (rgb.r > 240 && rgb.g > 240 && rgb.b > 240) {
    return bgColor || "#050505"
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)

  // For desaturated colors (gray-ish), swap lightness directly
  if (hsl.s < 0.3) {
    const newL = 1 - hsl.l
    const clamped = Math.max(0.08, Math.min(0.92, newL))
    const result = hslToRgb(hsl.h, hsl.s, clamped)
    return rgbToHex(result.r, result.g, result.b)
  }

  // For saturated colors, keep hue but flip lightness
  const newL = Math.max(0.15, Math.min(0.85, 1 - hsl.l))
  const result = hslToRgb(hsl.h, hsl.s, newL)
  return rgbToHex(result.r, result.g, result.b)
}

function storeOriginalAttr(el: Element, attr: string) {
  const key = `data-excalidraw-${attr}`
  if (el.hasAttribute(attr) && !el.hasAttribute(key)) {
    el.setAttribute(key, el.getAttribute(attr)!)
  }
}

function restoreAttr(el: Element, attr: string) {
  const key = `data-excalidraw-${attr}`
  const stored = el.getAttribute(key)
  if (stored !== null) {
    el.setAttribute(attr, stored)
    el.removeAttribute(key)
  }
}

function applyDarkExcalidrawTheme(svg: SVGSVGElement) {
  // Read the page's actual dark-mode background so the SVG canvas blends in
  const pageBg = getComputedStyle(document.documentElement)
    .getPropertyValue("--light")
    .trim()

  const elements = svg.querySelectorAll("[fill], [stroke]")
  elements.forEach((el) => {
    if (el.hasAttribute("fill")) {
      storeOriginalAttr(el, "fill")
      const fill = el.getAttribute("fill")!
      const dark = lightColorToDark(fill, pageBg)
      if (dark) el.setAttribute("fill", dark)
    }
    if (el.hasAttribute("stroke")) {
      storeOriginalAttr(el, "stroke")
      const stroke = el.getAttribute("stroke")!
      const dark = lightColorToDark(stroke, pageBg)
      if (dark) el.setAttribute("stroke", dark)
    }
  })
}

function applyLightExcalidrawTheme(svg: SVGSVGElement) {
  const elements = svg.querySelectorAll(
    "[data-excalidraw-fill], [data-excalidraw-stroke]",
  )
  elements.forEach((el) => {
    if (el.hasAttribute("data-excalidraw-fill")) restoreAttr(el, "fill")
    if (el.hasAttribute("data-excalidraw-stroke")) restoreAttr(el, "stroke")
  })
}

function applyExcalidrawTheme(theme: "light" | "dark") {
  const svgs = document.querySelectorAll(
    "svg.excalidraw-svg, .excalidraw-embed svg",
  )
  svgs.forEach((svg) => {
    if (theme === "dark") {
      applyDarkExcalidrawTheme(svg as SVGSVGElement)
    } else {
      applyLightExcalidrawTheme(svg as SVGSVGElement)
    }
  })
}

// ── SVG inlining (normal view) ───────────────────────────────────
async function inlineExcalidrawSvgs() {
  const imgs = document.querySelectorAll("img.excalidraw-svg, .excalidraw-embed img")
  const promises: Promise<void>[] = []

  imgs.forEach((img) => {
    const imgEl = img as HTMLImageElement
    const src = imgEl.getAttribute("src")
    if (!src) return

    const promise = (async () => {
      try {
        const resp = await fetch(src)
        const svgText = await resp.text()

        const parser = new DOMParser()
        const doc = parser.parseFromString(svgText, "image/svg+xml")
        const svg = doc.documentElement as unknown as SVGSVGElement

        if (svg.tagName !== "svg") return

        // Copy relevant attributes from img to svg
        if (imgEl.id) svg.setAttribute("id", imgEl.id)
        svg.setAttribute("class", "excalidraw-svg")
        if (imgEl.style.cssText) svg.style.cssText = imgEl.style.cssText
        if (imgEl.getAttribute("alt")) svg.setAttribute("aria-label", imgEl.getAttribute("alt")!)

        // Make responsive
        svg.removeAttribute("width")
        svg.removeAttribute("height")
        svg.style.maxWidth = "100%"
        svg.style.height = "auto"

        // Replace img with svg
        imgEl.replaceWith(svg)

        // Attach popover listeners to new inlined links
        const newLinks = svg.querySelectorAll("a.internal")
        if (newLinks.length > 0) {
          attachPopoverListeners([...newLinks] as HTMLAnchorElement[])
        }
      } catch (e) {
        console.error("Failed to inline excalidraw SVG:", src, e)
      }
    })()
    promises.push(promise)
  })

  return Promise.all(promises)
}

// ── Main ─────────────────────────────────────────────────────────
document.addEventListener("nav", async () => {
  await inlineExcalidrawSvgs()

  // ── Apply initial dark/light theme on SVG elements ──────
  const currentTheme = document.documentElement.getAttribute("saved-theme")
  if (currentTheme === "dark") {
    applyExcalidrawTheme("dark")
  }

  // ── Listen for theme toggles ────────────────────────────
  const themeHandler = (e: CustomEvent) => {
    // Guard: only apply if we're on an excalidraw page
    const imgs = document.querySelectorAll(
      "svg.excalidraw-svg, .excalidraw-embed svg",
    )
    if (imgs.length === 0) return
    applyExcalidrawTheme(e.detail.theme)
  }
  document.addEventListener("themechange", themeHandler as EventListener)
  window.addCleanup(() =>
    document.removeEventListener("themechange", themeHandler as EventListener),
  )
})
