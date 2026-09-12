import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("/sitemap-index.xml", site);

  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  const response = new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });

  return response;
};
