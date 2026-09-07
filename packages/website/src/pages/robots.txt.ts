import type { APIRoute } from "astro";
import { indexingDisabled } from "../consts";

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL("/sitemap-index.xml", site);

  const allowAll = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  const denyAll = "User-agent: *\nDisallow: /\n";

  const body = indexingDisabled ? denyAll : allowAll;
  const response = new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });

  return response;
};
