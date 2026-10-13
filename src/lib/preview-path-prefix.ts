import type { LocationRewrite } from "@tanstack/react-router";

/**
 * Path-based preview hosts serve the dev server under `/{port_id}/` and strip
 * that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
 * prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
 * client routing and generated links aligned with the public URL.
 */
const PATH_BASED_PREVIEW_HOSTS = new Set([
  "preview.grok.genai.mil",
  "preview.grok.mil",
  "preview.grokgsac.com",
]);

const PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;

export const GITHUB_PAGES_BASE = "/Sentinel-Strength";

/** Project-site prefix on GitHub Pages (`user.github.io/Sentinel-Strength`). */
export function pagesPathPrefix(hostname: string, pathname: string): string | undefined {
  if (!hostname.toLowerCase().endsWith(".github.io")) return undefined;
  if (pathname === GITHUB_PAGES_BASE || pathname.startsWith(`${GITHUB_PAGES_BASE}/`)) {
    return GITHUB_PAGES_BASE;
  }
  return undefined;
}

export function previewPathPrefix(hostname: string, pathname: string): string | undefined {
  if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return undefined;
  return PORT_ID_PREFIX.exec(pathname)?.[0];
}

export function prefixRewrite(prefix: string): LocationRewrite {
  return {
    input: ({ url }) => {
      if (url.pathname === prefix) url.pathname = "/";
      else if (url.pathname.startsWith(`${prefix}/`))
        url.pathname = url.pathname.slice(prefix.length);
      return url;
    },
    output: ({ url }) => {
      url.pathname = `${prefix}${url.pathname}`;
      return url;
    },
  };
}

export function previewPathRewrite(): LocationRewrite | undefined {
  if (typeof window === "undefined") return undefined;
  const prefix =
    pagesPathPrefix(window.location.hostname, window.location.pathname) ??
    previewPathPrefix(window.location.hostname, window.location.pathname);
  return prefix ? prefixRewrite(prefix) : undefined;
}
