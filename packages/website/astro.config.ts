import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { legalPages } from "./src/consts";

// GitHub Pages on a custom apex-style subdomain (see public/CNAME), so no `base` and no
// sub-path prefixing. `output: "static"` keeps this to plain files GitHub Pages can serve.
// `build.format: "file"` gives `/terms` rather than `/terms/`.
export default defineConfig({
  site: "https://gramdown.tobythe.dev",
  output: "static",
  trailingSlash: "never",

  build: {
    format: "file"
  },

  // `mdx()` powers the `docs` content collection (8.8).
  integrations: [
    preact(),
    mdx(),
    sitemap({
      filter: page => {
        const path = new URL(page).pathname;
        const isLegal = legalPages.some(({ href }) => href === path);

        return !isLegal && path !== "/404";
      }
    })
  ],

  markdown: {
    shikiConfig: {
      // Dual themes: Shiki inlines the light colours and emits a `--shiki-dark*` custom
      // property per token. `global.css` swaps to the dark values under the dark palette.
      // Vitesse (8.10.6) - a low-saturation theme whose warm muted reds and greens sit with
      // the parchment ground, replacing the loud `light-plus` / `dark-plus`.
      themes: {
        light: "vitesse-light",
        dark: "vitesse-dark"
      }
    }
  }
});
