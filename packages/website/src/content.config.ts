import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

// Made a change to this file? Run `bunx astro sync` to refresh the generated types.

// The docs pages. `id` "index" renders at `/docs`; every other id at `/docs/<id>`.
// `order` drives the sidebar; `description` feeds each page's <meta> and the sidebar hint.
const docsLoader = glob({ pattern: "**/*.mdx", base: "./src/content/docs" });

const docsSchema = z.object({
  title: z.string(),
  description: z.string(),
  order: z.number()
});

const docs = defineCollection({ loader: docsLoader, schema: docsSchema });

// The legal pages: Terms, Privacy, Cookies. `lastUpdated` is rendered in each page's
// rail alongside the back-link (the same fact is also stated in the prose).
const policiesLoader = glob({ pattern: "**/*.mdx", base: "./src/content/policies" });

const policiesSchema = z.object({
  lastUpdated: z.date()
});

const policies = defineCollection({ loader: policiesLoader, schema: policiesSchema });

export const collections = { docs, policies };
