import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

// Made a change to this file? Run `bunx astro sync` to refresh the generated types.

// The docs pages (8.8). `id` "index" renders at `/docs`; every other id at `/docs/<id>`.
// `order` drives the sidebar; `description` feeds each page's <meta> and the sidebar hint.
const docsLoader = glob({ pattern: "**/*.mdx", base: "./src/content/docs" });

const docsSchema = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number()
});

const docs = defineCollection({ loader: docsLoader, schema: docsSchema });

// The `policies` collection (Terms, Privacy) lands in 8.9.

export const collections = { docs };
