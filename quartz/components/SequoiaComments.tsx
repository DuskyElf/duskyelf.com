import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { h } from "preact"

export default (() => {
  const SequoiaComments: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return h("sequoia-comments", { class: classNames(displayClass) })
  }

  SequoiaComments.afterDOMLoaded = `
    (function () {
      // Only inject if not already present
      if (document.querySelector('script[src*="sequoia-comments"]')) return;

      const script = document.createElement("script");
      script.src = "/static/sequoia-comments.js";
      script.type = "module";
      document.head.appendChild(script);
    })();
  `

  return SequoiaComments
}) satisfies QuartzComponentConstructor
