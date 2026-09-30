import { useTranslation } from "next-i18next/pages";
import TranslatedField from "@/components/ui/TranslatedField";
import type { Translated } from "@/types/content";

/**
 * The three fields every public record carries for search engines.
 *
 * **All optional, and they say so.** A required SEO title is one an editor
 * fills with the page title again, which is worse than leaving it empty — the
 * public pages already fall back to the record's own title and excerpt.
 *
 * `noindex` is a checkbox rather than a status, because it is orthogonal to
 * publishing: a page can be live and deliberately unlisted, which is how a
 * thank-you page or an internal document should behave.
 */
export default function SeoFields({
  title,
  description,
  noindex,
  onChange,
}: {
  title: Translated;
  description: Translated;
  noindex: boolean;
  onChange: (next: { title: Translated; description: Translated; noindex: boolean }) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <div className="grid gap-4 border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t("editor.seo")}
      </p>

      <TranslatedField
        label={t("editor.seoTitle")}
        hint={t("editor.seoTitleHint")}
        value={title}
        onChange={(next) => onChange({ title: next, description, noindex })}
      />

      <TranslatedField
        label={t("editor.seoDescription")}
        hint={t("editor.seoDescriptionHint")}
        value={description}
        onChange={(next) => onChange({ title, description: next, noindex })}
        multiline
        rows={2}
      />

      <label className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={noindex}
          onChange={(event) =>
            onChange({ title, description, noindex: event.target.checked })
          }
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        {t("editor.noindex")}
      </label>
      <p className="-mt-2 text-xs text-gray-500">{t("editor.noindexHint")}</p>
    </div>
  );
}
