const { i18n } = require("./next-i18next.config");

/**
 * `API_URL` is the **only** variable this app is configured with. Everything
 * else it needs — the canonical origin, the indexing switch — is served by the
 * backend from `GET /site-config`, so go-live is a variable and a restart
 * rather than a rebuild.
 *
 * Re-exported under a `NEXT_PUBLIC_` name because Next only inlines variables
 * with that prefix into the browser bundle, and the API is called from there.
 */
const apiUrl = process.env.API_URL ?? "http://localhost:8006";

/**
 * The API is also the image host, whenever object storage is not configured:
 * `UploadService` falls back to writing `./uploads` and serving `/uploads`,
 * so every photograph a trainer uploads is served from this origin.
 *
 * Derived from `API_URL` rather than listed by hand, and **the port is part of
 * it**. A `remotePatterns` entry with no `port` matches only URLs with no port,
 * so a hardcoded `{ hostname: "localhost" }` rejects `localhost:8006` — and the
 * failure is a 400 from the optimiser with `"url" parameter is not allowed`,
 * which arrives as a broken image icon and names nothing about the cause.
 */
const apiImageHost = (() => {
  try {
    const url = new URL(apiUrl);
    return [
      {
        protocol: url.protocol.replace(":", ""),
        hostname: url.hostname,
        ...(url.port ? { port: url.port } : {}),
        pathname: "/uploads/**",
      },
    ];
  } catch {
    return [];
  }
})();

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
];

/** @type {import('next').NextConfig} */
module.exports = {
  i18n,
  reactStrictMode: true,
  // The version of the framework is a hint for an attacker and nothing for
  // anyone else.
  poweredByHeader: false,
  env: { NEXT_PUBLIC_API_URL: apiUrl },
  /**
   * The translation files ride along into every server function.
   *
   * next-i18next reads `public/locales` from disk at request time, which the
   * bundler cannot see, so a page rendered on demand (`fallback: "blocking"`)
   * found no translations on Vercel and printed every key raw — while the
   * pages prerendered at build time, where the files are on disk, looked fine.
   */
  outputFileTracingIncludes: {
    "/**": ["./public/locales/**/*"],
  },
  images: {
    /**
     * **Development only.** Next 16 refuses to optimise an image whose host
     * resolves to a private address, which is a sensible SSRF guard and also
     * describes every local setup: the API serves uploads from
     * `localhost:8006`, so a trainer's photograph is refused with a 400 and
     * arrives as a broken image icon.
     *
     * Off in production, where the API is a public host and the guard is doing
     * the job it was written for.
     */
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    // Uploads are served from the API host locally and from object storage in
    // production; both are configured, never guessed.
    remotePatterns: [
      ...apiImageHost,
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**.r2.dev" },
      // The video block falls back to YouTube's own thumbnail when an editor
      // gives no poster of their own. Without these two hosts `next/image`
      // throws "hostname is not configured" and takes the whole page down with
      // it — which is how the block library crashed rather than rendering.
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.vimeocdn.com" },
      // Demo trainers and demo progress photographs. Listed rather than left
      // to a wildcard so it is obvious what has to go when the real material
      // arrives — see PLAN.md.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};
