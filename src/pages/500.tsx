import type { GetStaticProps } from "next";
import Link from "next/link";
import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { translations } from "@/utils/i18n";

/**
 * When the site itself has failed.
 *
 * **It fetches nothing.** A 500 is most often served because something the page
 * needed was unreachable — the API, the database — so a page that asks for the
 * menu in order to render an apology is a page that fails to render the
 * apology. No `fetchChrome`, no `PublicLayout`, no blocks: the logo is a file,
 * the words are UI strings, and the only link goes to `/`.
 *
 * It still wears the design, because that is the whole reason this file exists
 * — Next's default is unstyled text, and a visitor who meets it has no way to
 * tell a broken page from a broken company.
 *
 * Deliberately terser than the 404. That one is a wrong address and the visitor
 * is fine; this one is our fault, and the useful things to say are "it is not
 * you", "try again", and how to reach a person.
 */
export default function ServerError() {
  const { t } = useTranslation("common");

  return (
    <>
      <Head>
        <title>{t("serverError.title")}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="site-shell flex min-h-screen flex-col items-start justify-center bg-ink-900 px-6 py-20 md:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-accelerez.png" alt="" className="h-9 w-auto" />

        <p className="mt-16 font-head text-[6rem] leading-none text-acid-400 md:text-[9rem]">
          500
        </p>

        <h1 className="mt-6 max-w-2xl font-head text-[2.5rem] text-ink-50 lg:text-6xl">
          {t("serverError.title")}
        </h1>

        <p className="mt-6 max-w-xl text-[1.05rem] leading-[1.8] text-ink-400">
          {t("serverError.lead")}
        </p>

        <Link
          href="/"
          className="mt-10 inline-flex min-h-11 items-center rounded-full bg-acid-500 px-6 font-head text-[0.9rem] font-medium text-ink-950 transition-colors hover:bg-ink-950 hover:text-white"
        >
          {t("serverError.retry")}
        </Link>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
