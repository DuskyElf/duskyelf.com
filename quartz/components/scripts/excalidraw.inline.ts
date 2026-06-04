import { attachPopoverListeners } from "./popover.inline"

// ── Edit-mode state ──────────────────────────────────────────────
let isInEditMode = false
let origLocationReload: ((...args: any[]) => void) | null = null

function getEditModeParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    isEditMode: params.get("edit") === "excalidraw",
    filePath: null as string | null,
  }
}

// ── Reload suppression ───────────────────────────────────────────
// The Quartz dev server injects a WebSocket handler that does
// document.location.reload(true) on every rebuild. During edit mode
// we suppress that so saves don't tear down the editor.
function suppressReload() {
  if (origLocationReload) return
  const protoReload = Object.getOwnPropertyDescriptor(
    Location.prototype,
    "reload",
  )?.value
  const locReload = window.location.reload
  const reloadFn =
    typeof protoReload === "function"
      ? protoReload
      : typeof locReload === "function"
        ? locReload
        : null
  if (typeof reloadFn !== "function") {
    console.warn(
      "[excalidraw] cannot suppress reload — Location.prototype.reload not found",
    )
    return
  }
  origLocationReload = reloadFn.bind(window.location)
  Location.prototype.reload = function () {
    console.debug("[excalidraw] suppressed reload during edit mode")
  }
}

function restoreReload() {
  if (origLocationReload) {
    Location.prototype.reload = origLocationReload as any
    origLocationReload = null
  }
}

// ── SVG dimension fetching ───────────────────────────────────────
// The SVG is rendered with a viewBox matching the drawing bounds.
// We fetch it ahead of time to match the iframe aspect ratio.
async function getSvgDimensions(
  src: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const resp = await fetch(src)
    const text = await resp.text()
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, "image/svg+xml")
    const svg = doc.documentElement

    // Try viewBox first: "minX minY width height"
    const viewBox = svg.getAttribute("viewBox")
    if (viewBox) {
      const parts = viewBox.trim().split(/\s+/).map(Number)
      if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3])) {
        return { width: parts[2], height: parts[3] }
      }
    }

    // Fall back to width/height attributes
    const w = svg.getAttribute("width")
    const h = svg.getAttribute("height")
    if (w && h) {
      const parsedW = parseFloat(w)
      const parsedH = parseFloat(h)
      if (!isNaN(parsedW) && !isNaN(parsedH)) {
        return { width: parsedW, height: parsedH }
      }
    }

    return null
  } catch {
    return null
  }
}

// ── Toast ────────────────────────────────────────────────────────
function showToast(message: string, isError = false) {
  const existing = document.querySelector(".excalidraw-toast")
  if (existing) existing.remove()

  const toast = document.createElement("div")
  toast.className = "excalidraw-toast"
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${isError ? "#e53e3e" : "#38a169"};
    color: white;
    border-radius: 8px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  `
  document.body.appendChild(toast)

  if (!document.querySelector("#excalidraw-toast-styles")) {
    const style = document.createElement("style")
    style.id = "excalidraw-toast-styles"
    style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`
    document.head.appendChild(style)
  }

  setTimeout(() => {
    toast.style.opacity = "0"
    toast.style.transition = "opacity 0.3s"
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

// ── Exit edit mode ───────────────────────────────────────────────
function exitEditMode() {
  restoreReload()
  isInEditMode = false
  sessionStorage.removeItem("excalidraw:editPath")

  // Hard navigation to get freshly rebuilt content from the server
  const cleanUrl = window.location.pathname + window.location.hash
  window.location.href = cleanUrl
}

// ── Enter edit mode ──────────────────────────────────────────────
async function enterEditMode(imgs: NodeListOf<Element>) {
  isInEditMode = true
  suppressReload()
  sessionStorage.setItem("excalidraw:editPath", window.location.pathname)

  // Track iframes so we can clean them up
  const iframes: HTMLIFrameElement[] = []
  const saveIndicators: HTMLElement[] = []

  const updateSaveIndicator = (saving: boolean) => {
    saveIndicators.forEach((el) => {
      el.style.display = saving ? "inline" : "none"
    })
  }

  for (const img of Array.from(imgs)) {
    const imgEl = img as HTMLImageElement
    const src = imgEl.getAttribute("src")
    if (!src) continue

    const originalFile = imgEl.getAttribute("data-original-file")
    if (!originalFile) continue

    // Fetch SVG to match iframe aspect ratio with rendered drawing
    const dimensions = await getSvgDimensions(src)

    // Container for iframe + error overlay (keeps layout stable)
    const container = document.createElement("div")
    container.className = "excalidraw-edit-container"
    container.style.cssText = `
      position: relative;
      width: 100%;
      ${dimensions ? `aspect-ratio: ${dimensions.width} / ${dimensions.height};` : "min-height: 400px;"}
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    `

    // Error overlay (hidden by default)
    const errorOverlay = document.createElement("div")
    errorOverlay.className = "excalidraw-error-overlay"
    errorOverlay.style.cssText = `
      display: none;
      position: absolute;
      inset: 0;
      background: rgba(255,255,255,0.95);
      border: 2px solid #fc8181;
      border-radius: 8px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: system-ui, sans-serif;
      z-index: 10;
      text-align: center;
    `
    errorOverlay.innerHTML = `
      <div style="font-size: 28px; margin-bottom: 8px;">⚠️</div>
      <div style="font-size: 15px; font-weight: 600; color: #c53030; margin-bottom: 4px;">Editor Error</div>
      <div style="font-size: 13px; color: #718096;" class="excalidraw-error-msg"></div>
      <button style="
        margin-top: 12px;
        padding: 6px 16px;
        background: #e2e8f0;
        border: none;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
        color: #2d3748;
      " class="excalidraw-error-retry">Retry</button>
    `

    // Create iframe
    const iframe = document.createElement("iframe")
    iframe.src = `/excalidraw?file=${encodeURIComponent(originalFile)}`
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      display: block;
    `
    iframe.setAttribute("data-file", originalFile)

    container.appendChild(iframe)
    container.appendChild(errorOverlay)
    imgEl.replaceWith(container)
    iframes.push(iframe)

    // ── Error detection ─────────────────────────────────────
    let editorReady = false
    const showIframeError = (msg: string) => {
      editorReady = false
      const overlay = container.querySelector(".excalidraw-error-overlay") as HTMLElement
      const msgEl = container.querySelector(".excalidraw-error-msg") as HTMLElement
      if (overlay && msgEl) {
        msgEl.textContent = msg
        overlay.style.display = "flex"
      }
      // Hide iframe content behind overlay
      iframe.style.opacity = "0.3"
    }

    const loadTimeout = setTimeout(() => {
      if (!editorReady) {
        showIframeError("Editor failed to respond. Check the console for details.")
      }
    }, 15000)

    iframe.addEventListener("load", () => {
      // If iframe loaded but no ready message, it likely failed
      setTimeout(() => {
        if (!editorReady) {
          showIframeError("Editor loaded but did not initialize. Check console for errors.")
        }
      }, 5000)
    })

    // Retry button reloads the iframe
    const retryBtn = container.querySelector(".excalidraw-error-retry") as HTMLElement
    retryBtn?.addEventListener("click", () => {
      const overlay = container.querySelector(".excalidraw-error-overlay") as HTMLElement
      if (overlay) overlay.style.display = "none"
      iframe.style.opacity = "1"
      iframe.src = iframe.src // reload
      editorReady = false
      setTimeout(() => {
        if (!editorReady) showIframeError("Editor still not responding.")
      }, 15000)
    })

    // ── Message handler (no auto-save — only saves on Preview click) ──
    const messageHandler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      const data = e.data
      if (!data?.type?.startsWith("excalidraw-")) return

      if (data.type === "excalidraw-ready") {
        editorReady = true
        clearTimeout(loadTimeout)
      } else if (data.type === "excalidraw-error") {
        showIframeError(data.message || "Unknown editor error")
      }
    }

    window.addEventListener("message", messageHandler)
  }

  // ── Preview button (exit edit mode) ───────────────────────────
  const previewBtn = document.createElement("button")
  previewBtn.className = "excalidraw-exit-btn"
  previewBtn.style.cssText = `
    position: fixed;
    top: 16px;
    right: 80px;
    z-index: 10001;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    background: #2d3748;
    color: white;
    border: none;
    border-radius: 6px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: background 0.15s;
  `

  // Saving indicator (inline inside button)
  const savingDot = document.createElement("span")
  savingDot.className = "excalidraw-saving-dot"
  savingDot.textContent = "●"
  savingDot.style.cssText = `
    display: none;
    font-size: 10px;
    color: #68d391;
    animation: pulse 1s infinite;
  `
  saveIndicators.push(savingDot)

  const previewLabel = document.createElement("span")
  previewLabel.textContent = "Preview"

  previewBtn.appendChild(savingDot)
  previewBtn.appendChild(previewLabel)

  if (!document.querySelector("#excalidraw-button-styles")) {
    const style = document.createElement("style")
    style.id = "excalidraw-button-styles"
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    `
    document.head.appendChild(style)
  }

  previewBtn.addEventListener("mouseenter", () => {
    previewBtn.style.background = "#1a202c"
  })
  previewBtn.addEventListener("mouseleave", () => {
    previewBtn.style.background = "#2d3748"
  })

  previewBtn.addEventListener("click", async () => {
    previewBtn.style.opacity = "0.6"
    previewBtn.style.pointerEvents = "none"
    previewLabel.textContent = "Saving…"
    updateSaveIndicator(true)

    const file = iframes[0]?.getAttribute("data-file")
    if (!file) {
      console.warn("[excalidraw] no data-file attribute on iframe")
      exitEditMode()
      return
    }

    // Request drawing data from the editor iframe
    const dataPromise = new Promise<any>((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.origin !== window.location.origin) return
        if (e.data?.type === "excalidraw-data") {
          window.removeEventListener("message", handler)
          resolve(e.data.data)
        }
      }
      window.addEventListener("message", handler)
      setTimeout(() => {
        window.removeEventListener("message", handler)
        reject(new Error("timeout"))
      }, 5000)
    })

    iframes[0]?.contentWindow?.postMessage({ type: "excalidraw-get-data" }, "*")

    let drawingData: any
    try {
      drawingData = await dataPromise
    } catch {
      console.warn("[excalidraw] iframe did not respond — saving anyway")
      exitEditMode()
      return
    }

    // POST the drawing data from the parent (no iframe round-trip)
    try {
      const apiUrl = `/api/excalidraw?file=${encodeURIComponent(file)}`
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(drawingData),
      })
      if (!resp.ok) {
        const errText = await resp.text()
        console.warn("[excalidraw] save failed:", errText)
        showToast("Save failed: " + errText, true)
      }
    } catch (e) {
      console.warn("[excalidraw] save error:", e)
      showToast("Save failed: " + ((e as Error)?.message || "unknown"), true)
    }

    exitEditMode()
  })

  document.body.appendChild(previewBtn)
}

// ── SVG inlining (normal view) ───────────────────────────────────
async function inlineExcalidrawSvgs() {
  const imgs = document.querySelectorAll(
    "img.excalidraw-svg, .excalidraw-embed img",
  )
  const promises: Promise<void>[] = []

  Array.from(imgs).forEach((img) => {
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

        if (imgEl.id) svg.setAttribute("id", imgEl.id)
        svg.setAttribute("class", "excalidraw-svg")
        if (imgEl.style.cssText) svg.style.cssText = imgEl.style.cssText
        if (imgEl.getAttribute("alt"))
          svg.setAttribute("aria-label", imgEl.getAttribute("alt")!)

        svg.removeAttribute("width")
        svg.removeAttribute("height")
        svg.style.maxWidth = "100%"
        svg.style.height = "auto"

        imgEl.replaceWith(svg)

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
  const editParams = getEditModeParams()

  // Exiting edit mode (same page, dropping ?edit=excalidraw)
  if (isInEditMode && !editParams.isEditMode) {
    const editPath = sessionStorage.getItem("excalidraw:editPath")
    if (editPath === window.location.pathname) {
      // SPA already morphed the (stale) body; force a full load for fresh content
      exitEditMode()
      return
    }
    // Navigating to a different page — just restore reload and let SPA stand
    restoreReload()
    isInEditMode = false
    sessionStorage.removeItem("excalidraw:editPath")
  }

  if (editParams.isEditMode) {
    const imgs = document.querySelectorAll(
      "img.excalidraw-svg, .excalidraw-embed img",
    )
    if (imgs.length > 0) {
      try {
        await enterEditMode(imgs)
      } catch (e) {
        console.error("[excalidraw] enterEditMode failed:", e)
      }
    }
  } else {
    isInEditMode = false
    await inlineExcalidrawSvgs()
  }
})
