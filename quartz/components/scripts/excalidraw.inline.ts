import { attachPopoverListeners } from "./popover.inline"

function inlineExcalidrawSvgs() {
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
        if (imgEl.className) svg.setAttribute("class", imgEl.className)
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

document.addEventListener("nav", async () => {
  await inlineExcalidrawSvgs()
})
