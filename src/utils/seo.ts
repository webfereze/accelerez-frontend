import { LOCALES, type Locale } from "@/types/content";

/** The locale that owns the unprefixed URL — must match `next-i18next.config.js`. */
export const DEFAULT_LOCALE: Locale = "ro";

/**
 * The canonical origin and the indexing switch come from the **backend**
 * (`GET /site-config`), not from this app's environment — the frontend is
 * configured with `API_URL` alone.
 *
 * Everything SEO emits has to be absolute: `<link rel="canonical">`, `og:url`
 * and every `<loc>` in the sitemap are meaningless as relative paths — a
 * crawler resolves them against whatever host served the page, so a preview
 * domain would canonicalise itself.
 */
export function normaliseBaseUrl(baseUrl: string | undefined): string {
  return (baseUrl ?? "").replace(/\/+$/, "");
}

/** The locale prefix Next puts on a URL — the default locale carries none. */
export function localePrefix(locale: string | undefined): string {
  const value = (locale ?? DEFAULT_LOCALE) as Locale;
  return value === DEFAULT_LOCALE ? "" : `/${value}`;
}

/**
 * Absolute URL for a route path in one locale.
 *
 * `path` is the locale-independent route ("/tours/mud-run"), always starting
 * with a slash. The site root is emitted without a trailing slash so a page
 * never has two canonical spellings.
 */
export function absoluteUrl(baseUrl: string | undefined, path: string, locale?: string): string {
  const clean = path === "/" ? "" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return `${normaliseBaseUrl(baseUrl)}${localePrefix(locale)}${clean}`;
}

/** Every locale's URL for one route, for hreflang and the sitemap. */
export function localeAlternates(
  baseUrl: string | undefined,
  path: string,
): Array<{ locale: Locale; url: string }> {
  return LOCALES.map((locale) => ({ locale, url: absoluteUrl(baseUrl, path, locale) }));
}

/**
 * Route prefixes that must never be indexed or listed, whatever the switch says.
 *
 * The admin panel and the account area are behind a login, the cart and
 * checkout are per-visitor, and `/api` is not a page. Kept in one place so
 * `robots.txt` and the sitemap cannot disagree about what is private.
 */
export const PRIVATE_PREFIXES = [
  "/admin",
  "/account",
  "/cart",
  "/checkout",
  "/unsubscribe",
  "/api/",
];

/**
 * CMS page slugs that a **file route already owns**.
 *
 * `acasa` is the home page, served at `/` by `index.tsx`. `blog` is the
 * listing at `pages/blog/index.tsx`, while the CMS also holds a page of that
 * name because the menu links to it.
 *
 * Kept here, beside `isPrivatePath`, for the same reason: the catch-all route
 * and the sitemap must agree about them. A file route always wins at request
 * time, so a CMS page listed under one of these names is either a duplicate in
 * the sitemap or — for `blog` — a path Next collects and never exports, which
 * fails the whole build with "Invariant: page wasn't built" and names nothing.
 */
export const RESERVED_SLUGS = new Set(["acasa", "blog"]);

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

/**
 * The bare hostname of a URL, lowercased and without `www.` or a port.
 *
 * Used to decide whether a request arrived on the site's real domain or on a
 * deployment URL that happens to serve the same build.
 */
export function bareHost(value: string | undefined): string {
  if (!value) return "";
  const withScheme = value.includes("://") ? value : `https://${value}`;
  try {
    return new URL(withScheme).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Whether a request arrived on the canonical domain.
 *
 * One build is served on several hostnames — the real domain and the
 * `*.vercel.app` deployment URL alongside it — and only the real one may be
 * indexed. A deployment URL serving the same pages is duplicate content, and
 * the duplicate outranking the real site takes weeks to undo.
 *
 * **Fails closed**, like every other indexing decision here: an unknown or
 * unparseable host, or no canonical to compare against, counts as not
 * canonical. The cost of being wrong in that direction is a page that is not
 * indexed yet; in the other, it is a preview domain in Google.
 *
 * `www.` is ignored on both sides — the redirect between the two is a hosting
 * concern, and treating them as different sites here would block whichever one
 * the visitor happened to use.
 */
export function isCanonicalHost(
  requestHost: string | undefined,
  canonical: string | undefined,
): boolean {
  const expected = bareHost(canonical);
  if (!expected) return false;
  return bareHost(requestHost) === expected;
}

/**
 * The picture a link to this page should show when it is shared.
 *
 * **The image at the top of the page**, which is what somebody pasting the link
 * expects to see — a hero's photograph, a slider's first slide, or the first
 * picture on a page that opens with one. A hero that plays a video still
 * answers: its `image` is the poster, so it is the frame the video starts on.
 *
 * Content pages carried no share image at all before this, so every link to the
 * homepage or any CMS page unfurled as a bare grey rectangle while tours, posts
 * and products showed their cover.
 *
 * Returns `null` rather than guessing when a page opens with text. The caller
 * falls back to the site's own share image, which an editor sets once.
 */
export function shareImageFrom(
  blocks: Array<{ type: string; data: Record<string, unknown> }> | null | undefined,
): string | null {
  if (!blocks?.length) return null;

  for (const block of blocks) {
    const data = block.data ?? {};

    if (block.type === "hero") {
      const image = text(data.image);
      if (image) return image;
      // A hero with only a video has no frame to share; keep looking rather
      // than returning the video URL, which no crawler can render.
      continue;
    }

    if (block.type === "slider") {
      const slides = Array.isArray(data.slides) ? data.slides : [];
      for (const slide of slides) {
        const image = text((slide as Record<string, unknown>)?.image);
        if (image) return image;
      }
      continue;
    }

    if (block.type === "image") {
      const url = text(data.url);
      if (url) return url;
    }
  }

  return null;
}

/** A trimmed string, or `""` — block data is editor-entered and loosely typed. */
function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
