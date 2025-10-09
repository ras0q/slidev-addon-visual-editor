import type { MarkdownItAsync } from "markdown-it-async"
import { defineConfig } from "vite"

/// <reference types="vite/client" />
/// <reference types="@slidev/types" />

export default defineConfig(() => ({
  plugins: [],
  slidev: {
    markdown: {
      markdownItSetup(md: MarkdownItAsync) {
        md.core.ruler.after("inline", "add-data-markdown-map", (state) => {
          const attr = "data-markdown-map"

          for (const token of state.tokens) {
            if (!token.map) continue

            if (token.type === "html_inline" || token.type === "html_block") {
              if (token.content.includes(`${attr}=`)) continue

              token.content = token.content.replace(
                /(<[a-zA-Z0-9-]+)(\s|>)/,
                `$1 ${attr}='html-${token.map[0]}-${token.map[1]}'$2`
              )

              continue
            }

            if (token.type.endsWith("_open") && token.type !== "list_item_open" && token.tag !== "") {
              if (!token.attrs) token.attrs = []
              token.attrs.push([attr, `${token.tag}-${token.map[0]}-${token.map[1]}`])
            }
          }
        })
      }
    }
  }
}))
