import type { GetServerSideProps } from "next";
import {
  fetchChrome,
  fetchPageSlugs,
  fetchPostSlugs,
  fetchTrainerSlugs,
  fetchProductSlugs,
} from "@/utils/site";
import { LOCALES, type Locale } from "@/types/content";
import {
  RESERVED_SLUGS,
  absoluteUrl,
  isCanonicalHost,
  isPrivatePath,
  normaliseBaseUrl,
} from "@/utils/seo";

/** One address, in the languages it genuinely exists in. */
type Entry = { paths: Partial<Record<Locale, string>>; lastmod?: string };

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * The sitemap.
 *
 * **A record appears once per language it was actually written in**, with the
 * others listed beside it as `xhtml:link` alternates. That is the same rule the
 * routes and the `hreflang` tags follow, and it matters more here than
 * anywhere: a sitemap that lists `/hu/blog/<romanian-slug>` is an invitation to
 * crawl a 404, and it is the site itself issuing it. This product forbids serving one
 * language's content under another's address; listing the address is the same
 * promise made to a machine.
 *
 * Server-rendered rather than generated at build: the content changes when an
 * editor publishes, not when the site is deployed, and a stale sitemap is worse
 * than a slightly slower one. Cached for an hour at the edge.
 *
 * **Fails closed**, like `robots.txt`: an unreachable API or a request on a
 * deployment URL produces an empty but valid sitemap rather than a map of a
 * site that is not meant to be found yet.
 */
function render(baseUrl: string, entries: Entry[]): string {
  const urls = entries.flatMap((entry) => {
    const langs = LOCALES.filter((locale) => entry.paths[locale]);

    return langs.map((locale) => {
      const alternates = langs
        .map(
          (alt) =>
            `    <xhtml:link rel="alternate" hreflang="${alt}" href="${escape(
              absoluteUrl(baseUrl, entry.paths[alt] as string, alt),
            )}" />`,
        )
        .join("\n");

      return [
        "  <url>",
        `    <loc>${escape(absoluteUrl(baseUrl, entry.paths[locale] as string, locale))}</loc>`,
        entry.lastmod ? `    <lastmod>${entry.lastmod.slice(0, 10)}</lastmod>` : "",
        alternates,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n");
    });
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/** The same path in all three languages — listings, and the CMS pages. */
const everywhere = (path: string, lastmod?: string): Entry => ({
  paths: Object.fromEntries(LOCALES.map((locale) => [locale, path])),
  lastmod,
});

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const chrome = await fetchChrome();
  const baseUrl = normaliseBaseUrl(chrome.config.baseUrl);
  const allowed =
    chrome.config.allowIndexing &&
    Boolean(baseUrl) &&
    isCanonicalHost(req.headers.host, baseUrl);

  let entries: Entry[] = [];

  if (allowed) {
    const [pages, posts, trainers, products] = await Promise.all([
      fetchPageSlugs(),
      fetchPostSlugs(),
      fetchTrainerSlugs(),
      fetchProductSlugs(),
    ]);

    /** A record's own addresses: one per language it is published in. */
    const translated = (
      row: { slug: Record<string, string>; locales: string[]; updatedAt?: string },
      prefix: string,
    ): Entry => ({
      paths: Object.fromEntries(
        (row.locales ?? ["ro"]).flatMap((locale) => {
          const slug = row.slug?.[locale];
          return slug ? [[locale, `${prefix}/${slug}`]] : [];
        }),
      ),
      lastmod: row.updatedAt,
    });

    entries = [
      everywhere("/"),
      everywhere("/antrenori"),
      everywhere("/blog"),
      everywhere("/magazin"),
      // The CMS pages keep one address in every language — their slug is not
      // translated. See the note in PLAN.md: it is a decision, not an oversight.
      // `acasa` and `blog` are listed above under the addresses that actually
      // serve them — see `RESERVED_SLUGS`.
      ...(pages ?? [])
        .filter((page) => !RESERVED_SLUGS.has(page.slug) && !isPrivatePath(`/${page.slug}`))
        .map((page) => everywhere(`/${page.slug}`, page.updatedAt)),
      ...(trainers ?? []).map((row) => translated(row, "/antrenori")),
      ...(posts ?? []).map((row) => translated(row, "/blog")),
      ...(products ?? []).map((row) => translated(row, "/magazin")),
    ];
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.write(render(baseUrl, entries));
  res.end();

  return { props: {} };
};

/** Never rendered: `getServerSideProps` ends the response itself. */
export default function Sitemap() {
  return null;
}
