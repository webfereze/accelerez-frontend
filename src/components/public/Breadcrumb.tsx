import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { absoluteUrl } from "@/utils/seo";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export type Crumb = { label: string; href?: string };

/**
 * The trail back up from where you are.
 *
 * **The home page is prepended here, not by every caller.** It is on every
 * trail by definition, and asking each page to remember it is how one of them
 * ends up without it — or with it labelled differently. Callers pass only the
 * steps that are theirs.
 *
 * With nothing but home in it, it renders nothing: a breadcrumb reading "Acasă"
 * on the home page is a navigation aid pointing at the page you are on.
 *
 * Emitted as a real `<nav>` with an ordered list, and the last item carries
 * `aria-current="page"` rather than being a dead link — a breadcrumb whose last
 * step navigates to itself is a small lie that screen readers announce.
 *
 * It also emits the `BreadcrumbList` JSON-LD, which is what turns a result's
 * URL line into "Home > Tours > Mud Run" in search listings. The markup is
 * generated from the same `items` the trail renders, deliberately: a
 * hand-maintained copy in each page's `<head>` is how structured data ends up
 * describing a navigation path the page no longer has.
 */
export default function Breadcrumb({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { baseUrl } = useSiteConfig();

  if (items.length === 0) return null;

  const trail: Crumb[] = [{ label: t("nav.home"), href: "/" }, ...items];

  /**
   * URLs must be absolute or Google drops the list entirely. `item` is omitted
   * on the final crumb — that is the page itself, and schema.org treats a
   * self-referencing last step as redundant.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      ...(crumb.href && index < trail.length - 1
        ? { item: absoluteUrl(baseUrl, crumb.href, locale) }
        : {}),
    })),
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <nav aria-label={t("nav.breadcrumb")} className={className}>
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
        {trail.map((item, index) => {
          const last = index === trail.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className="transition-colors hover:text-ink-50">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="text-ink-300">
                  {item.label}
                </span>
              )}

              {!last && (
                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-300" aria-hidden />
              )}
            </li>
          );
        })}
        </ol>
      </nav>
    </>
  );
}
