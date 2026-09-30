import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import PublicLayout from "@/components/public/PublicLayout";
import PageBody, { opensFullBleed } from "@/components/public/PageBody";
import Seo from "@/components/public/Seo";
import { translations } from "@/utils/i18n";
import { shareImageFrom } from "@/utils/seo";
import { tr } from "@/utils/localized";
import {
  fetchBlockContext,
  fetchChrome,
  fetchHomepage,
  type SiteChrome,
} from "@/utils/site";
import type { BlockContext } from "@/blocks/types";
import type { Page } from "@/types/content";

type Props = {
  page: Page | null;
  /** Whatever the page's blocks need — see `fetchBlockContext`. */
  context: BlockContext;
  chrome: SiteChrome;
};

/**
 * The front page.
 *
 * **Assembled by an editor, not written here.** Its body is whatever blocks the
 * home page carries in the CMS, so the pitch can be rearranged, rewritten and
 * translated without a deploy.
 *
 * The sections it is built from are real block types — `homeHero`, `steps`,
 * `trainerGrid`, `cardGrid`, `testimonials`, `faqList`, `cta` — not a special
 * case of this route. Any of them can be used on any other page, and the home
 * page can be rebuilt out of different ones entirely.
 *
 * **Three of those blocks carry no content of their own**: the trainer grid,
 * the testimonials and the questions read from their collections, fetched once
 * here and handed down through `BlockContext`. That is what keeps the home page
 * from claiming a coach is available after they have closed their list.
 *
 * The one thing an editor does not control is the notice shown when the CMS has
 * nothing yet. It exists so a fresh install is a designed page rather than a
 * blank one, and it says plainly that content is missing rather than inventing
 * marketing copy.
 */
export default function Home({ page, context, chrome }: Props) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const underHeader = opensFullBleed(page);
  const siteName = chrome.site.name?.trim() || t("site.name");

  const title = page
    ? `${tr(page.seoTitle, locale) || tr(page.title, locale)} — ${siteName}`
    : `${siteName} — ${tr(chrome.site.tagline, locale) || t("site.tagline")}`;

  return (
    <>
      <Seo
        title={title}
        description={
          (page && (tr(page.seoDescription, locale) || tr(page.excerpt, locale))) ||
          t("site.description")
        }
        image={shareImageFrom(page?.content) ?? chrome.site.shareImage}
        imageAlt={chrome.site.shareImageAlt}
      />

      <PublicLayout chrome={chrome} overHero={underHeader}>
        {page && (page.content?.length ?? 0) > 0 ? (
          <PageBody page={page} locale={locale ?? "ro"} context={context} />
        ) : (
          <FirstRunNotice siteName={siteName} />
        )}
      </PublicLayout>
    </>
  );
}

/**
 * What a visitor sees before the CMS has any content.
 *
 * Deliberately says so rather than inventing marketing copy: a placeholder that
 * reads like the real thing is one somebody forgets to replace.
 */
function FirstRunNotice({ siteName }: { siteName: string }) {
  const { t } = useTranslation("common");

  return (
    <section className="bg-ink-950">
      <div className="site-container flex min-h-[70svh] flex-col justify-center py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-acid-400">
          {t("home.firstRun.eyebrow")}
        </p>
        <h1 className="mt-4 max-w-3xl font-head text-4xl leading-tight tracking-tight text-white md:text-6xl">
          {siteName}
        </h1>
        <p className="mt-5 max-w-prose text-base leading-relaxed text-ink-300 md:text-lg">
          {t("home.firstRun.body")}
        </p>
        <Link
          href="/admin/pages"
          className="mt-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
        >
          {t("home.firstRun.cta")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const [page, chrome] = await Promise.all([fetchHomepage(), fetchChrome()]);

  // Fetched once here and handed to whichever block wants it, rather than by
  // the block itself — see `BlockContext`. Only what this page's blocks
  // actually need is requested.
  const context = await fetchBlockContext(page, locale ?? "ro");

  return {
    props: {
      page,
      context,
      chrome,
      ...(await translations(locale, ["common"])),
    },
    // Five minutes matters here: a trainer who closes their list should stop
    // being advertised as available quickly.
    revalidate: 300,
  };
};
