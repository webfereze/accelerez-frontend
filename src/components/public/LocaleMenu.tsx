import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { CheckIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { useSamePagePath } from "@/hooks/useSamePagePath";
import { LOCALES, type Locale } from "@/types/content";

/**
 * The language, as a globe beside the logo.
 *
 * **A menu rather than three links in a row.** Three tracked-out codes sitting
 * in the header is a permanent reminder that the site has other languages,
 * aimed at the majority of readers who are already in theirs; a globe says the
 * same thing in one mark and gets out of the way. The current language is
 * printed on the button so it is still answerable at a glance.
 *
 * Each option is a real `next/link` with a `locale`, so a reader can open one in
 * a new tab and a crawler can follow it. It keeps the current path minus the
 * hash — see `useSamePagePath` for why the hash has to go — which is right for
 * pages whose address does not change between languages.
 *
 * **Where the slug is translated, the page hands over its own `alternates`.**
 * An article's Hungarian address is not its Romanian one under `/hu/`, and a
 * language it was never written in has no address at all — so those pages map
 * each language either to the translation or to the listing in that language,
 * which is what ch. 09 asks for in place of a silent substitution. Every
 * language stays in the menu either way: removing one would hide the fact that
 * a translation is missing rather than announce it.
 *
 * Built on Headless UI so the keyboard behaviour, the focus trap and the
 * `aria-expanded` wiring are the library's problem rather than a set of
 * handlers that work until somebody presses Escape.
 */
export default function LocaleMenu({
  alternates,
}: {
  /** This page's address per language, for records with a translated slug. */
  alternates?: Partial<Record<Locale, string>> | null;
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const path = useSamePagePath();
  const current = router.locale ?? "ro";

  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label={t("nav.language")}
        className="flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-ink-400 transition-colors hover:bg-ink-900/5 hover:text-ink-50 data-open:bg-ink-900/5 data-open:text-ink-50"
      >
        <GlobeAltIcon className="h-5 w-5" aria-hidden />
        <span className="text-[0.8rem] font-medium uppercase">{current}</span>
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom start"
        className={clsx(
          "z-50 mt-2 min-w-40 origin-top rounded-lg border border-white/10 bg-ink-900 p-1 shadow-lg shadow-ink-950/5",
          "transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0",
        )}
      >
        {LOCALES.map((locale) => (
          <MenuItem key={locale}>
            <Link
              href={alternates?.[locale] ?? path}
              locale={locale}
              aria-current={locale === current ? "true" : undefined}
              className={clsx(
                "flex min-h-11 items-center justify-between gap-4 rounded-md px-3 text-sm transition-colors",
                "data-focus:bg-ink-900/5",
                locale === current ? "font-medium text-ink-50" : "text-ink-400",
              )}
            >
              {t(`locale.${locale}`)}
              {locale === current && (
                <CheckIcon className="h-4 w-4 shrink-0 text-acid-400" aria-hidden />
              )}
            </Link>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
