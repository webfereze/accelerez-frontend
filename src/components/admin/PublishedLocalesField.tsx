import { useTranslation } from "next-i18next/pages";
import { LOCALES } from "@/types/content";
import type { Locale } from "@/types/content";

/**
 * Which languages a record is actually live in.
 *
 * **This is not the same question as "is there text in this field".** The
 * blueprint forbids serving one language's content under another's address
 * (ch. 06, ch. 09), so the site needs a deliberate answer from an editor rather
 * than a guess from whether a translation happens to be non-empty — a half-
 * finished Hungarian draft would otherwise publish itself the moment somebody
 * typed a title into it.
 *
 * Romanian is the source language and cannot be switched off. It is shown
 * checked and disabled rather than hidden, because an editor who cannot see it
 * will wonder whether the Romanian version is published at all.
 */
export default function PublishedLocalesField({
  value,
  onChange,
}: {
  value: string[] | null | undefined;
  onChange: (next: Locale[]) => void;
}) {
  const { t } = useTranslation("common");
  const current = (value?.length ? value : ["ro"]) as string[];

  const toggle = (locale: Locale, on: boolean) => {
    const next = new Set(current);
    if (on) next.add(locale);
    else next.delete(locale);
    next.add("ro");
    // Kept in the canonical order rather than in click order, so two records
    // with the same languages compare equal.
    onChange(LOCALES.filter((l) => next.has(l)));
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{t("editor.publishedLocales")}</p>
      <p className="mt-1 text-xs text-gray-500">{t("editor.publishedLocalesHint")}</p>

      <div className="mt-3 flex flex-wrap gap-4">
        {LOCALES.map((locale) => {
          const source = locale === "ro";
          return (
            <label
              key={locale}
              className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={source || current.includes(locale)}
                disabled={source}
                onChange={(event) => toggle(locale, event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-60"
              />
              {t(`locale.${locale}`)}
              {source && (
                <span className="text-xs text-gray-400">{t("editor.sourceLocale")}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
