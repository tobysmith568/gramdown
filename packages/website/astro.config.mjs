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

  integrations: [preact()]
});
