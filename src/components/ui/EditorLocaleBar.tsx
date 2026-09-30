import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { useEditorLocale } from "@/hooks/useEditorLocale";
import { LOCALE_META, SOURCE_LOCALE, LOCALES, type Locale, type Translated } from "@/types/content";

/**
 * Picks the language the whole editor is working in.
 *
 * `completeness` is the set of translatable values on the form; the dot on each
 * language shows whether that language is filled in everywhere, so a missing
 * Hungarian translation is visible without opening each field. The site is
 * legally required in Romanian *and* Hungarian.
 */
export default function EditorLocaleBar({
  completeness = [],
  className,
}: {
  completeness?: Array<Translated | null | undefined>;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const { locale, setLocale } = useEditorLocale();

  const statusFor = (code: Locale): "empty" | "partial" | "full" => {
    const values = completeness.filter(Boolean) as Translated[];
    if (!values.length) return "full";

    const filled = values.filter((value) => value[code]?.trim()).length;
    if (filled === 0) return "empty";
    return filled === values.length ? "full" : "partial";
  };

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2",
        className,
      )}
    >
      <span className="px-1.5 text-xs font-medium text-gray-500">
        {t("editor.editingIn")}
      </span>

      <div role="tablist" aria-label={t("editor.language")} className="flex gap-1">
        {LOCALES.map((code) => {
          const status = statusFor(code);
          const active = locale === code;

          return (
            <button
              key={code}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setLocale(code)}
              className={clsx(
                "flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors",
                active
                  ? "bg-primary-800 font-semibold text-white"
                  : "font-medium text-gray-600 hover:bg-gray-100",
              )}
            >
              <span aria-hidden>{LOCALE_META[code].flag}</span>
              {LOCALE_META[code].name}
              <span
                aria-hidden
                className={clsx(
                  "h-1.5 w-1.5 rounded-full",
                  status === "full" && "bg-emerald-500",
                  status === "partial" && "bg-amber-400",
                  status === "empty" &&
                    (active ? "bg-white/40" : "bg-gray-300"),
                )}
              />
              <span className="sr-only">
                {t(`editor.status.${status}`)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Shown while editing a translation, not the source. Romanian is the
          language every record must have and the one a reader gets by default;
          the note is there to say that leaving this one empty is allowed. */}
      {locale !== SOURCE_LOCALE && (
        <p className="ml-auto px-1.5 text-xs text-gray-500">
          {t("editor.fallbackNote")}
        </p>
      )}
    </div>
  );
}
