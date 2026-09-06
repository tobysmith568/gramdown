import type { APIRoute } from "astro";
import { indexingDisabled } from "../consts";

// Dynamic so the one `indexingDisabled` flag drives both this file and the
// site-wide meta tag in BaseLayout. Replaces the old static public/robots.txt.
const allowAll = "User-agent: *\nAllow: /\n";
const denyAll = "User-agent: *\nDisallow: /\n";

export const GET: APIRoute = () => {
  const body = indexingDisabled ? denyAll : allowAll;
  const response = new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });

  return response;
};
