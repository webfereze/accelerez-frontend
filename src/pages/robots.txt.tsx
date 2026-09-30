import type { GetServerSideProps } from "next";
import { fetchChrome } from "@/utils/site";
import {
  PRIVATE_PREFIXES,
  isCanonicalHost,
  normaliseBaseUrl,
} from "@/utils/seo";

/**
 * `robots.txt`, served from the backend's answer rather than from a file.
 *
 * It has to agree with what `Seo` puts in every `<head>` — a page that says
 * `index` under a `robots.txt` that says `Disallow: /` is two contradictory
 * instructions about the same address, and a crawler resolves that badly. Both
 * read the same `GET /site-config`, so going live is a setting and a cache
 * expiry rather than a rebuild.
 *
 * **Fails closed.** No origin, an unreachable API, or a request that arrived on
 * a deployment URL instead of the real domain all produce a blanket
 * `Disallow: /`. The cost of being wrong that way is a day's indexing; the
 * other way it is a preview domain competing with the real site.
 */
function body(baseUrl: string, allowed: boolean): string {
  if (!allowed) return "User-agent: *\nDisallow: /\n";

  const lines = [
    "User-agent: *",
    // The admin, the account area and `/api` are not pages. `/offer/` is: a
    // real one, deliberately unlisted — the link *is* the credential, so an
    // offer must never reach a crawler even though it answers 200.
    ...[...PRIVATE_PREFIXES, "/offer/"].map((prefix) => `Disallow: ${prefix}`),
    "Allow: /",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ];

  return lines.join("\n");
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const chrome = await fetchChrome();
  const baseUrl = normaliseBaseUrl(chrome.config.baseUrl);
  const allowed =
    chrome.config.allowIndexing &&
    Boolean(baseUrl) &&
    isCanonicalHost(req.headers.host, baseUrl);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  // Long enough that a crawl does not hit the API every time, short enough that
  // flipping the switch takes effect the same hour.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600");
  res.write(body(baseUrl, allowed));
  res.end();

  return { props: {} };
};

/** Never rendered: `getServerSideProps` ends the response itself. */
export default function Robots() {
  return null;
}
