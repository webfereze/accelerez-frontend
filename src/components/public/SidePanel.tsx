import Link from "next/link";
import { useRouter } from "next/router";
import { useSamePagePath } from "@/hooks/useSamePagePath";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ArrowUpRightIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import Drawer from "./Drawer";
import SocialLinks from "./SocialLinks";
import { areaFor, useViewer } from "@/hooks/useViewer";
import { tr } from "@/utils/localized";
import { LOCALES, LOCALE_META, type Locale } from "@/types/content";
import type { MenuItem } from "@/types/content";

/**
 * The panel the hamburger opens: who the association is, and how to reach them.
 *
 * It replaces the language codes that used to sit in the header. **The
 * switcher moved in here rather than away** — the site serves three languages
 * and a visitor who reads Hungarian still has to be able to find it; what it
 * does not need is three more items competing with the navigation.
 *
 * On a narrow screen it also carries the navigation itself, because there the
 * capsule menu is hidden and this is the only way through the site.
 *
 * Everything about the association is read from the `site` setting and renders
 * nothing while that is blank, which is how it ships — an invented address is
 * worse than a visible gap.
 *
 * Three things it does because a panel that traps you is worse than no panel:
 * **Escape closes it**, **the page behind does not scroll**, and focus moves to
 * the close button when it opens so a keyboard reader is inside it rather than
 * still on the page behind.
 */
export default function SidePanel({
  open,
  onClose,
  items,
  logo,
  siteName,
}: {
  open: boolean;
  onClose: () => void;
  /** The main navigation, shown here on narrow screens. */
  items: MenuItem[];
  /** The same mark as the header, so the panel reads as the site, not a dialog. */
  logo: string;
  siteName: string;
}) {
  const { t } = useTranslation("common");
  const { viewer, ready } = useViewer();
  const router = useRouter();
  const path = useSamePagePath();
  const locale = (router.locale ?? "ro") as Locale;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      label={t("nav.menu")}
      header={
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={siteName} className="h-7 w-auto" />
      }
    >
      {/* The account, first: on a phone this panel *is* the header, and the
            one thing a signed-in visitor opens it for is their own area. */}
      {ready && (
        <Link
          href={viewer ? areaFor(viewer.role) : "/autentificare"}
          tabIndex={open ? 0 : -1}
          className="mb-8 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-acid-500 px-5 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
        >
          <UserCircleIcon className="h-5 w-5" aria-hidden />
          {viewer ? viewer.firstName || t("nav.myAccount") : t("nav.signIn")}
        </Link>
      )}

      {/* The navigation, on the screens too narrow for the header's own. */}
      {items.length > 0 && (
        <nav>
          <ul className="flex flex-col">
            {items.map((item) => {
              // The same test as the header's links, so the page you are on
              // is marked here too — with the acid bar the header draws under it.
              const current =
                path === item.href ||
                (item.href !== "/" && path.startsWith(`${item.href}/`));

              return (
                <li key={item.id} className="border-b border-white/10">
                  <Link
                    href={item.href}
                    tabIndex={open ? 0 : -1}
                    aria-current={current ? "page" : undefined}
                    className={clsx(
                      "group flex min-h-14 items-center gap-3 font-head text-2xl transition-colors",
                      current ? "text-acid-400" : "text-ink-50 hover:text-acid-400",
                    )}
                  >
                    <span
                      aria-hidden
                      className={clsx(
                        "h-6 w-1 shrink-0 bg-acid-500 transition-opacity",
                        current ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1 break-words">
                      {tr(item.label, locale)}
                    </span>
                    <ArrowUpRightIcon
                      aria-hidden
                      className="h-5 w-5 shrink-0 text-ink-500 transition-colors group-hover:text-acid-400"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* The language, as well as the globe in the header: on a phone the
            panel *is* the navigation, and making somebody close it to change
            language is a round trip for a one-click decision. */}
      <div className="mt-auto pt-10">
        <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-400">
          {t("nav.language")}
        </p>
        <ul className="flex flex-wrap gap-2">
          {LOCALES.map((code) => (
            <li key={code}>
              <Link
                href={path}
                locale={code}
                tabIndex={open ? 0 : -1}
                aria-current={code === locale ? "true" : undefined}
                className={clsx(
                  "flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
                  code === locale
                    ? "border-ink-50 bg-ink-900 text-ink-50"
                    : "border-white/25 text-ink-300 hover:border-white/60 hover:text-white",
                )}
              >
                {LOCALE_META[code].name}
              </Link>
            </li>
          ))}
        </ul>

        {/* The profiles, as in the footer — nothing renders while the site
            setting has none. */}
        <SocialLinks onDark size="sm" className="mt-8" />
      </div>
    </Drawer>
  );
}
