import type { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import PublicLayout from "@/components/public/PublicLayout";
import PageBody, { opensFullBleed, opensWithHero } from "@/components/public/PageBody";
import Seo from "@/components/public/Seo";
import PageHeading from "@/components/public/PageHeading";
import { translations } from "@/utils/i18n";
import { RESERVED_SLUGS, shareImageFrom } from "@/utils/seo";
import { tr } from "@/utils/localized";
import {
  fetchBlockContext,
  fetchChrome,
  fetchPage,
  fetchPageSlugs,
  type SiteChrome,
} from "@/utils/site";
import type { BlockContext } from "@/blocks/types";
import type { Page } from "@/types/content";

type Props = { page: Page; context: BlockContext; chrome: SiteChrome };

/**
 * Any editor-built content page: `/despre-noi`, `/contact`, whatever comes next.
 *
 * It shares `PageBody` with the home page, which is the point — the home page
 * is a content page with a flag on it, and two renderers would drift.
 *
 * **The `<h1>` is conditional.** A page opening with a hero already has one
 * inside that block; printing the title again above it would give the page two
 * first-level headings and show the name twice. A page opening with anything
 * else needs the heading, so it gets one here.
 */
export default function ContentPage({ page, context, chrome }: Props) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const title = tr(page.title, locale);
  const excerpt = tr(page.excerpt, locale);
  const siteName = chrome.site.name?.trim() || t("site.name");

  const underHeader = opensFullBleed(page);
  const needsHeading = !opensWithHero(page);

  // One level deep at most, which is what the page tree allows.
  const crumbs = [
    ...(page.parent
      ? [{ label: tr(page.parent.title, locale), href: `/${page.parent.slug}` }]
      : []),
    { label: title },
  ];

  return (
    <>
      <Seo
        title={`${tr(page.seoTitle, locale) || title} — ${siteName}`}
        description={tr(page.seoDescription, locale) || excerpt}
        image={shareImageFrom(page.content) ?? chrome.site.shareImage}
        imageAlt={chrome.site.shareImageAlt}
        noindex={page.noindex}
        modifiedTime={page.updatedAt}
      />

      <PublicLayout chrome={chrome} overHero={underHeader}>
        {needsHeading && <PageHeading title={title} lead={excerpt} crumbs={crumbs} />}

        <PageBody page={page} locale={locale ?? "ro"} context={context} />
      </PublicLayout>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await fetchPageSlugs();

  return {
    paths: (slugs ?? [])
      .filter((row) => !RESERVED_SLUGS.has(row.slug))
      .map((row) => ({ params: { slug: row.slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params, locale }) => {
  const slug = String(params?.slug ?? "");
  const [page, chrome] = await Promise.all([fetchPage(slug), fetchChrome()]);

  if (!page || page.isHomepage) return { notFound: true, revalidate: 60 };

  const context = await fetchBlockContext(page, locale ?? "ro");

  return {
    props: {
      page,
      context,
      chrome,
      ...(await translations(locale, ["common"])),
    },
    revalidate: 300,
  };
};
