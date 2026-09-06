import mdx from "@astrojs/mdx";
import preact from "@astrojs/preact";
import { defineConfig } from "astro/config";

// GitHub Pages on a custom apex-style subdomain (see public/CNAME), so no `base` and no
// sub-path prefixing. `output: "static"` keeps this to plain files GitHub Pages can serve.
// `build.format: "file"` gives `/terms` rather than `/terms/`, matching ../tobysmith.uk.
export default defineConfig({
  site: "https://gramdown.tobythe.dev",
  output: "static",
  trailingSlash: "never",

  build: {
    format: "file"
  },

  // `mdx()` powers the `docs` content collection (8.8); `sitemap()` lands in 8.10.
  integrations: [preact(), mdx()],

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
