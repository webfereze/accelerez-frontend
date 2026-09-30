import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import SidePanel from "./SidePanel";
import CartButton from "./CartButton";
import CartDrawer from "./CartDrawer";
import LocaleMenu from "./LocaleMenu";
import SocialLinks from "./SocialLinks";
import NewsletterSignup from "./NewsletterSignup";
import CookieConsent, { reopenCookieChoice } from "./CookieConsent";
import { useSamePagePath } from "@/hooks/useSamePagePath";
import { areaFor, useViewer } from "@/hooks/useViewer";
import { tr } from "@/utils/localized";
import type { Locale, MenuItem } from "@/types/content";
import type { SiteChrome } from "@/utils/site";

/**
 * The chrome every public page wears.
 *
 * **The header is a rule, not a bar.** No capsule, no pill, no frosted panel —
 * the logo on the left, six plain text links, the language switcher, and the
 * one accent button the blueprint asks to be present on every page (ch. 02).
 *
 * **It never floats over the hero.** It keeps its own light band at the top of
 * every page, and the hero begins below it as a separate panel. A header laid
 * over a photograph has to solve legibility with a scrim or a frosted plate on
 * every page, and the first thing a reader meets is then a picture cut in half
 * by a menu. Here the two are simply different objects, which is also what
 * lets the navigation be plain dark type at every scroll position instead of
 * inverting.
 *
 * `overHero` survives as a prop and now means only "the first block brings its
 * own frame", which is no longer the header's business — it is accepted and
 * ignored so pages do not all have to be edited at once.
 *
 * **The header carries the logo, a language menu and the six links.** The
 * blueprint also puts a standing call-to-action button up here (ch. 02); it was
 * removed on request and lives in the side panel, which is the right call for
 * another reason — on the home page it sat directly above the hero's own call
 * to action, which is two asks in the same glance.
 *
 * The language is a **globe beside the logo** rather than three codes in a row:
 * see `LocaleMenu`. The navigation sits on the **right**, which leaves the two
 * identity marks together on the left and the things a reader acts on together
 * on the other side.
 *
 * The hamburger is back to narrow screens only. Six links, the account, a
 * logo and a globe do not fit on one line below `xl` at any type size worth
 * reading, and there
 * it opens the side panel — which now carries the navigation and the languages
 * and nothing else.
 *
 * Everything in the footer comes from the CMS: the columns are the header and
 * footer menus, and the address, registry line and social profiles are the
 * `site` setting. Nothing here is hardcoded, and each part renders nothing
 * while its source is empty.
 */
export default function PublicLayout({
  chrome,
  overHero = false,
  alternates,
  children,
}: {
  chrome: SiteChrome;
  /** True when the page opens with a full-bleed block the header should float over. */
  overHero?: boolean;
  /**
   * This page's address per language, passed by the pages whose slug is
   * translated — articles, services, case studies. See `LocaleMenu`.
   */
  alternates?: Partial<Record<Locale, string>> | null;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = (router.locale ?? "ro") as Locale;

  // Without the hash — see `useSamePagePath`. It is both the current-page test
  // for the navigation and the target of the language links.
  const path = useSamePagePath();

  // Who is signed in, if anybody. The header is the only place on the public
  // site that needs to know — see `useViewer`.
  const { viewer, ready } = useViewer();

  const [scrolled, setScrolled] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  // A hairline appears once the page has moved, so the header separates itself
  // from content scrolling under it without drawing a line across a page that
  // is still at the top.
  const siteName = chrome.site.name?.trim() || t("site.name");
  const year = new Date().getFullYear();

  return (
    <SiteSettingsProvider value={chrome.site}>
      {/* `site-shell` is what squares every corner inside it — see globals.css.
          The admin lives outside this element and keeps its own rounding. */}
      <div className="site-shell flex min-h-screen flex-col">
        <header
          className={clsx(
            "fixed inset-x-0 top-0 z-50 bg-ink-900 transition-[border-color] duration-300",
            scrolled ? "border-b border-white/10" : "border-b border-transparent",
          )}
        >
          {/* Mobile first: logo, then the bag and the menu button pushed right, with
              tight gaps. The six links, the account and the globe need more
              room than a phone has — at 360px the old row was ~440px wide and
              pushed the menu button off the screen. */}
          <div className="site-container flex h-[4.5rem] items-center gap-2 sm:gap-4 md:h-[5.5rem] xl:gap-8">
            <Link href="/" className="min-w-0 shrink text-ink-50 sm:shrink-0">
              {/* The file in `public/brand/` unless the CMS has been given one.
                  A brand mark is a file somebody drops in, not something worth
                  a round trip through an upload form — but the setting still
                  wins, so a second site on this codebase can override it
                  without touching the repository. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chrome.site.logo || "/brand/logo-accelerez.png"}
                alt={siteName}
                // Sized by the mark, not by the file. The supplied PNG was
                // 1920×1920 with the logo floating in the middle of it, so a
                // 56px box rendered a 15px wordmark; the file is now trimmed to
                // the ink and this is the height of the logo itself.
                className="h-7 w-auto sm:h-9 md:h-11"
              />
            </Link>

            {/* From `sm` up; on a phone the languages are in the menu panel. */}
            <div className="hidden sm:block">
              <LocaleMenu alternates={alternates} />
            </div>

            <nav className="ml-auto hidden items-center gap-7 xl:flex">
              {chrome.main.map((item) => {
                const current =
                  path === item.href ||
                  (item.href !== "/" && path.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    className={clsx(
                      "relative whitespace-nowrap py-1 text-[0.95rem] font-medium transition-colors duration-200",
                      current ? "text-ink-50" : "text-ink-400 hover:text-ink-50",
                    )}
                  >
                    {tr(item.label, locale)}
                    {/* The only mark of the current page, and the only accent
                        in the header. A filled pill would compete with the
                        button two elements to its right. */}
                    <span
                      aria-hidden
                      className={clsx(
                        "absolute inset-x-0 -bottom-0.5 h-0.5 origin-left bg-acid-500 transition-transform duration-300",
                        current ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* The account, on the right and after the navigation: it is not a
                page of the site, it is where this visitor's own things are.
                Rendered only once the session is known, so the header does not
                flash "sign in" at somebody who is signed in. */}
            {ready && (
              <Link
                href={viewer ? areaFor(viewer.role) : "/autentificare"}
                className="hidden min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/15 px-4 text-sm font-medium text-white transition-colors hover:border-acid-500 hover:text-acid-400 xl:inline-flex"
              >
                <UserCircleIcon className="h-4 w-4" aria-hidden />
                {viewer
                  ? viewer.firstName || t("nav.myAccount")
                  : t("nav.signIn")}
              </Link>
            )}

            {/* The bag: after the account on a desktop, beside the menu
                button on a phone — on every screen, see `CartButton`. */}
            <CartButton className="ml-auto shrink-0 xl:ml-0" />

            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              aria-expanded={panelOpen}
              aria-label={t("nav.menu")}
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-100 transition-colors hover:bg-white/10 hover:text-white xl:hidden"
            >
              <Bars3Icon className="h-6 w-6" aria-hidden />
            </button>
          </div>
        </header>

        <SidePanel
          open={panelOpen}
          onClose={closePanel}
          items={chrome.main}
          logo={chrome.site.logo || "/brand/logo-accelerez.png"}
          siteName={siteName}
        />
        <CartDrawer />

        {/* Every page clears the fixed header — the hero no longer runs under
            it, so there is no longer a case that does not. */}
        <main className="flex-1 pt-[4.5rem] md:pt-[5.5rem]">{children}</main>

        {/* The footer is a panel too, inside the same white margin as the hero,
            so the page closes the way it opened. */}
        <footer className="framed mt-28 pb-5">
          <div className="site-container rounded-panel bg-ink-950 px-8 py-20 text-ink-300 md:px-14 md:py-24">
            <div className="grid gap-14 lg:grid-cols-[1.3fr_1fr_1fr_1.5fr] lg:gap-10">
              <div>
                <p className="font-head text-4xl text-white">{siteName}</p>

                {tr(chrome.site.tagline, locale) && (
                  <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-400">
                    {tr(chrome.site.tagline, locale)}
                  </p>
                )}

                {chrome.site.address && (
                  <address className="mt-5 text-sm not-italic leading-relaxed text-ink-400">
                    {chrome.site.address}
                  </address>
                )}

                <SocialLinks onDark size="sm" className="mt-7" />
              </div>

              <FooterColumn title={t("footer.pages")} items={chrome.main} locale={locale} />
              <FooterColumn title={t("footer.links")} items={chrome.footer} locale={locale} />

              <div>
                <h2 className="font-head text-2xl text-white">{t("footer.newsletter")}</h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
                  {t("footer.newsletterText")}
                </p>
                <NewsletterSignup className="mt-6" onDark />
              </div>
            </div>

            <div className="mt-16 flex flex-col gap-3 border-t border-white/12 pt-7 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {chrome.site.company?.name || siteName}
                {chrome.site.company?.cui ? ` · CUI ${chrome.site.company.cui}` : ""}
                {chrome.site.company?.onrc ? ` · ${chrome.site.company.onrc}` : ""}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {/* Ch. 02 puts the cookie settings in the footer. A banner that
                    can only ever be answered once is a decision a visitor is
                    not allowed to revisit, which is not what consent means. */}
                <button
                  type="button"
                  onClick={reopenCookieChoice}
                  className="min-h-8 text-left underline decoration-white/25 underline-offset-4 transition-colors hover:text-ink-200 hover:decoration-white/60"
                >
                  {t("cookies.settings")}
                </button>
                <p>{t("footer.copyright", { year })}</p>
              </div>
            </div>
          </div>
        </footer>

        <CookieConsent />
      </div>
    </SiteSettingsProvider>
  );
}

/** One column of footer links. Renders nothing when its menu is empty. */
function FooterColumn({
  title,
  items,
  locale,
}: {
  title: string;
  items: MenuItem[];
  locale: Locale;
}) {
  if (items.length === 0) return null;

  return (
    <nav>
      <h2 className="font-head text-2xl text-white">{title}</h2>
      <ul className="mt-6 flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="text-sm text-ink-400 transition-colors hover:text-white"
            >
              {tr(item.label, locale)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
