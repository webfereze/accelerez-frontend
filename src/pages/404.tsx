import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import Reveal from "@/components/public/Reveal";
import CtaButton from "@/components/public/CtaButton";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { fetchChrome, type SiteChrome } from "@/utils/site";
import type { Locale } from "@/types/content";

type Props = { chrome: SiteChrome };

/**
 * The page that is not there.
 *
 * **It wears the site's own chrome.** Next's default 404 is an unstyled line of
 * black text on white, and arriving at it from a designed page reads as the
 * site having crashed rather than as a link being wrong. The header and footer
 * alone do most of the work here: they say the site is fine and this address
 * is not.
 *
 * **It offers the way out rather than describing the problem.** A visitor who
 * mistyped a URL or followed an old link does not need "the requested resource
 * could not be found" — they need the six places they might have been going,
 * which is exactly the menu the CMS already holds. Built from `chrome.main`, so
 * a seventh section appears here the day it is added.
 *
 * **Statically generated.** Next requires `pages/404.tsx` to be static — it is
 * served for addresses that never reach a data fetch — so the menu and the
 * company name come from `getStaticProps` and are revalidated on a schedule
 * like every other page.
 */
export default function NotFound({ chrome }: Props) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = (locale ?? "ro") as Locale;

  const siteName = chrome.site.name?.trim() || t("site.name");

  return (
    <>
      {/* `noindex`: this page is served under hundreds of wrong addresses, and
          every one of them indexed is a thin duplicate of the same content. */}
      <Seo title={`${t("notFound.title")} — ${siteName}`} noindex />

      <PublicLayout chrome={chrome}>
        <section className="site-container flex min-h-[60svh] flex-col justify-center py-20 md:py-28">
          <Reveal>
            <p className="font-head text-[6rem] leading-none text-acid-400 md:text-[9rem]">
              404
            </p>

            <h1 className="mt-6 max-w-2xl font-head text-[2.5rem] text-ink-50 lg:text-6xl">
              {t("notFound.title")}
            </h1>

            <p className="mt-6 max-w-xl text-[1.05rem] leading-[1.8] text-ink-400">
              {t("notFound.lead")}
            </p>

            <div className="mt-10">
              <CtaButton href="/" arrow={false}>
                {t("notFound.home")}
              </CtaButton>
            </div>
          </Reveal>

          {chrome.main.length > 0 && (
            <Reveal delay={120} className="mt-16 border-t border-white/10 pt-10">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ink-400">
                {t("notFound.tryInstead")}
              </p>

              {/* The menu the CMS already holds, so this stays true without
                  anybody maintaining a second list of the site's sections. */}
              <ul className="mt-6 grid gap-x-10 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {chrome.main.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="group flex items-center justify-between gap-4 border-b border-white/10 py-4 font-head text-xl text-ink-50"
                    >
                      {tr(item.label, lang)}

                      <svg
                        aria-hidden
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-5 w-5 shrink-0 text-ink-300 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:text-ink-50 motion-reduce:transition-none"
                      >
                        <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="square" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </section>
      </PublicLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    chrome: await fetchChrome(),
    ...(await translations(locale, ["common"])),
  },
  revalidate: 300,
});
