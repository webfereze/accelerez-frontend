import { useTranslation } from "next-i18next/pages";
import Input from "./Input";
import Textarea from "./Textarea";
import { useEditorLocale } from "@/hooks/useEditorLocale";
import { LOCALE_META, SOURCE_LOCALE, type Translated } from "@/types/content";

/**
 * One field of a translatable value (`{ ro, hu, en }`).
 *
 * It shows **only the language the editor is currently working in**, chosen
 * once via `<EditorLocaleBar>`. Per-field language tabs were removed: with a
 * dozen fields on a page they made it impossible to tell which language you
 * were writing in, and the form read as a wall of duplicated inputs.
 *
 * **The source language is `SOURCE_LOCALE`**, which is what `required` enforces
 * and what the reference line shows while translating. It is read from that
 * constant rather than spelled out: this used to name Hungarian in the check
 * while the warning it printed said "Romanian is required", so a Hungarian
 * field was flagged as a missing Romanian one and no field was ever actually
 * required in the language the site falls back to.
 */
export default function TranslatedField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
  rows = 3,
  hint,
  onBlur,
}: {
  label: string;
  value: Translated;
  onChange: (next: Translated) => void;
  multiline?: boolean;
  /** Romanian is the fallback every reader gets, so it is the required one. */
  required?: boolean;
  rows?: number;
  hint?: string;
  /** For a field that persists when the editor leaves it rather than on Save. */
  onBlur?: () => void;
}) {
  const { t } = useTranslation("common");
  const { locale } = useEditorLocale();

  const Field = multiline ? Textarea : Input;
  const isRequired = required && locale === SOURCE_LOCALE;

  // The source language, shown as a reference while translating.
  const reference =
    locale !== SOURCE_LOCALE && value?.[SOURCE_LOCALE]?.trim()
      ? value[SOURCE_LOCALE]!.trim()
      : null;

  return (
    <div>
      <Field
        label={`${label} · ${LOCALE_META[locale].flag} ${LOCALE_META[locale].name}`}
        value={value?.[locale] ?? ""}
        onChange={(e: { target: { value: string } }) =>
          onChange({ ...value, [locale]: e.target.value })
        }
        required={isRequired}
        hint={hint}
        onBlur={onBlur}
        {...(multiline ? { rows } : {})}
      />

      {reference && (
        <p className="mt-1.5 text-xs text-gray-500">
          <span className="font-medium">
            {LOCALE_META[SOURCE_LOCALE].flag} {LOCALE_META[SOURCE_LOCALE].name}:{" "}
          </span>
          {reference}
        </p>
      )}

      {isRequired && !value?.[SOURCE_LOCALE]?.trim() && (
        <p className="mt-1.5 text-xs text-amber-700">
          {t("translated.roRequired")}
        </p>
      )}
    </div>
  );
}
