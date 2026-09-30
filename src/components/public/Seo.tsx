import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { LOCALES, type Locale, type PublishedLocales } from "@/types/content";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import {
  DEFAULT_LOCALE,
  absoluteUrl,
  isPrivatePath,
  normaliseBaseUrl,
} from "@/utils/seo";

/** Open Graph type. Only the two the site actually publishes. */
type OgType = "website" | "article" | "profile";

export type SeoProps = {
  /** Full `<title>` text, already including the site name. */
  title: string;
  description?: string | null;
  /** Absolute URL of the share image. Relative paths are made absolute. */
  image?: string | null;
  /**
   * What the share image shows. Falls back to the page title, which is always
   * meaningful — a card with no `og:image:alt` is announced by screen readers
   * as an unlabelled image, and some platforms simply drop it.
   */
  imageAlt?: string | null;
  type?: OgType;
  /**
   * Per-record `noindex` from the CMS. The global switch can only ever add
   * `noindex`, never remove one an editor set.
   */
  noindex?: boolean;
  /** Article timestamps, for `og:article:*`. */
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /**
   * The languages **this record** is actually live in.
   *
   * Omitted on pages whose address is the same in every language — the CMS
   * pages, the listings — where all three alternates are real. Passed on
   * services, projects and articles, where they are not: an alternate for a
   * language the record was never written in points at a 404, which is worse
   * than saying nothing. Ch. 06 forbids serving one language's content under
   * another's address, and advertising the address is the same promise.
   *
   * It is also not enough on its own for a translated slug — the path here is
   * this language's — so those pages pass `alternates` as well.
   */
  locales?: PublishedLocales | null;
  /**
   * The path per language, for records whose **slug is translated**.
   *
   * Without it the alternate for Hungarian would be this article's Romanian
   * slug under `/hu/`, which is exactly the address the blueprint says must
   * 404.
   */
  alternates?: Partial<Record<Locale, string>> | null;
};

/**
 * Every public page's `<head>`.
 *
 * Centralised because these tags have to agree with each other and with
 * `robots.txt`: a canonical that disagrees with the sitemap, or an `og:url`
 * pointing at a different host than the canonical, is worse than having
 * neither — it tells a crawler two contradictory things about the same page.
 *
 * The route path comes from the router rather than a prop, so the canonical URL
 * cannot drift from the page it sits on.
 */
export default function Seo({
  title,
  description,
  image,
  imageAlt,
  type = "website",
  noindex = false,
  publishedTime,
  modifiedTime,
  locales,
  alternates,
}: SeoProps) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { baseUrl, allowIndexing } = useSiteConfig();
  const locale = router.locale ?? DEFAULT_LOCALE;

  // `asPath` carries the query string and hash; neither belongs in a canonical.
  // A filtered listing and its unfiltered self are one page to a crawler.
  const path = router.asPath.split(/[?#]/)[0];

  // With no origin — the API was unreachable when this page was rendered — the
  // canonical and og:url tags are omitted rather than emitted empty. An empty
  // `href` is not "no opinion": crawlers resolve it against the current URL,
  // which silently canonicalises a preview domain to itself.
  const origin = normaliseBaseUrl(baseUrl);
  const canonical = origin ? absoluteUrl(baseUrl, path, locale) : null;
  const blocked = !allowIndexing || noindex || isPrivatePath(path);
  /**
   * Which languages this page may advertise. An unset `publishedLocales` means
   * Romanian only — the same reading the API uses — and no prop at all means
   * the page exists in every language, which is true of the CMS pages.
   */
  const live: Locale[] = locales
    ? LOCALES.filter((code) => locales.includes(code))
    : [...LOCALES];

  /** This page's address in another language. */
  const pathIn = (alt: Locale) => alternates?.[alt] ?? path;

  const shareImage = image
    ? image.startsWith("http")
      ? image
      : `${origin}/${image.replace(/^\/+/, "")}`
    : null;

  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}

      {/*
        `noindex, nofollow` while the site is closed: `follow` would still let a
        crawler walk into pages it then cannot report on. Once open, `index,
        follow` is stated explicitly rather than left to the default, so the
        intent is visible in the page source.
      */}
      <meta
        name="robots"
        content={blocked ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
      />

      {canonical && <link rel="canonical" href={canonical} />}

      {/*
        hreflang is omitted entirely while indexing is off. Advertising four
        translations of a page that is `noindex` is a contradiction, and each
        alternate must point at an indexable URL to be honoured at all.
      */}
      {!blocked &&
        origin &&
        live.map((alt) => (
          <link
            key={`alternate-${alt}`}
            rel="alternate"
            hrefLang={alt}
            href={absoluteUrl(baseUrl, pathIn(alt), alt)}
          />
        ))}
      {!blocked && origin && live.includes(DEFAULT_LOCALE) && (
        <link
          key="alternate-default"
          rel="alternate"
          hrefLang="x-default"
          href={absoluteUrl(baseUrl, pathIn(DEFAULT_LOCALE), DEFAULT_LOCALE)}
        />
      )}

      <meta property="og:site_name" content={t("site.name")} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:locale" content={locale} />
      {live.filter((alt) => alt !== locale).map((alt) => (
        <meta key={`og-locale-${alt}`} property="og:locale:alternate" content={alt} />
      ))}
      {shareImage && <meta property="og:image" content={shareImage} />}
      {shareImage && (
        <meta property="og:image:alt" content={imageAlt?.trim() || title} />
      )}

      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Without an explicit card type a link renders as a bare grey rectangle. */}
      <meta name="twitter:card" content={shareImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {shareImage && <meta name="twitter:image" content={shareImage} />}
      {shareImage && (
        <meta name="twitter:image:alt" content={imageAlt?.trim() || title} />
      )}
    </Head>
  );
}
