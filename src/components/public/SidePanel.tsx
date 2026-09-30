import Link from "next/link";
import { useRouter } from "next/router";
import { useSamePagePath } from "@/hooks/useSamePagePath";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import Drawer from "./Drawer";
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
}: {
  open: boolean;
  onClose: () => void;
  /** The main navigation, shown here on narrow screens. */
  items: MenuItem[];
}) {
  const { t } = useTranslation("common");
  const { viewer, ready } = useViewer();
  const router = useRouter();
  const path = useSamePagePath();
  const locale = (router.locale ?? "ro") as Locale;

  return (
    <Drawer open={open} onClose={onClose} label={t("nav.panel")}>
      {/* The account, first: on a phone this panel *is* the header, and the
            one thing a signed-in visitor opens it for is their own area. */}
      {ready && (
        <Link
          href={viewer ? areaFor(viewer.role) : "/autentificare"}
          tabIndex={open ? 0 : -1}
          className="mb-6 inline-flex min-h-12 w-fit items-center gap-2 rounded-full bg-acid-500 px-5 font-head font-semibold text-ink-950"
        >
          <UserCircleIcon className="h-5 w-5" aria-hidden />
          {viewer ? viewer.firstName || t("nav.myAccount") : t("nav.signIn")}
        </Link>
      )}

      {/* The navigation, on the screens too narrow for the header's own. */}
      {items.length > 0 && (
        <nav>
          <ul className="flex flex-col">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  tabIndex={open ? 0 : -1}
                  className="flex min-h-12 items-center border-b border-white/10 font-head text-xl text-ink-50"
                >
                  {tr(item.label, locale)}
                </Link>
              </li>
            ))}
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
        <ul className="flex gap-2">
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
      </div>
    </Drawer>
  );
}
