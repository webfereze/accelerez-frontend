import { useCallback, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import HtmlEditor, { isEmptyHtml } from "./HtmlEditor";
import { normalizePastedHtml } from "@/utils/localized";
import Modal from "./Modal";
import Button from "./Button";
import { useEditorLocale } from "@/hooks/useEditorLocale";
import { SOURCE_LOCALE, LOCALE_META, type Locale, type Translated } from "@/types/content";

/**
 * Rich-text editor for one language of a translatable value, following the
 * A compact preview card that opens a full editor in
 * a modal.
 *
 * The language comes from `<EditorLocaleBar>` — the same one the rest of the
 * form is using — so there are no per-field language tabs to get lost in.
 *
 * The editor itself is `HtmlEditor` — shared with the campaign body, so both
 * offer the same buttons and produce the same kind of HTML.
 */
export default function RichTextField({
  label,
  value,
  onChange,
  /**
   * Edit one language and ignore the editor's language bar.
   *
   * For records that are **not** translated — an offer is written to one person
   * in one language, so a language bar above it would offer three fields where
   * only one has any meaning. The value is still a `Translated` so this
   * component has one shape, but only this slot is read or written.
   */
  singleLocale,
}: {
  label: string;
  value: Translated;
  onChange: (next: Translated) => void;
  singleLocale?: Locale;
}) {
  const { t } = useTranslation("common");

  const editing = useEditorLocale();
  const locale = singleLocale ?? editing.locale;
  const [open, setOpen] = useState(false);

  /**
   * Closing is where pasted content is cleaned.
   *
   * A boundary, not a keystroke: the editor and the normaliser disagree about
   * `&nbsp;` — Quill needs it to hold a run of spaces, this strips it — and
   * doing it while someone types means the two rewrite each other until the tab
   * stops responding. Once, on the way out, they never meet.
   */
  const close = useCallback(() => {
    setOpen(false);

    const current = value?.[locale] ?? "";
    const cleaned = normalizePastedHtml(current);

    if (cleaned !== current) onChange({ ...value, [locale]: cleaned });
  }, [value, locale, onChange]);
  const html = value?.[locale] || "";
  const { flag, name } = LOCALE_META[locale];

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-gray-700">
          {label} · {flag} {name}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-2.5 text-xs font-medium text-primary-800 transition-colors hover:bg-primary-100"
        >
          <PencilSquareIcon className="h-3.5 w-3.5" aria-hidden />
          {t("richText.edit")}
        </button>
      </div>

      {/* Preview card — click anywhere to edit. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-left transition-colors hover:border-gray-400"
      >
        {isEmptyHtml(html) ? (
          <span className="text-sm italic text-gray-400">
            {t("richText.emptyHint")}
          </span>
        ) : (
          <div className="relative max-h-40 overflow-hidden">
            <div
              className="text-sm text-gray-700 [&_a]:text-primary-700 [&_a]:underline [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: html }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"
            />
          </div>
        )}
      </button>

      <Modal
        open={open}
        onClose={close}
        title={`${label} · ${flag} ${name}`}
        footer={
          <Button onClick={close}>{t("richText.done")}</Button>
        }
      >
        <div>
          <HtmlEditor
            // Remount when the editing language changes, so Quill picks up the
            // new value instead of keeping the previous language's document.
            editorKey={locale}
            value={html}
            // Straight through. Rewriting the html on every keystroke put this
            // editor in a loop with Quill's own escaping — see `close` below,
            // which is where the cleaning belongs.
            onChange={(next) => onChange({ ...value, [locale]: next })}
            className="[&_.ql-container.ql-snow]:max-h-[46vh]"
          />

          {/* The source language, shown as a reference while translating.
              Both halves of this test used to name Hungarian directly while the
              body below read `SOURCE_LOCALE` — so on a Romanian-source site the
              reference was offered whenever a *Hungarian* draft existed and
              then printed the Romanian one. `SOURCE_LOCALE` is the single
              answer; nothing here should spell a language out. */}
          {!singleLocale && locale !== SOURCE_LOCALE && !isEmptyHtml(value?.[SOURCE_LOCALE]) && (
            <details className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <summary className="cursor-pointer text-xs font-medium text-gray-600">
                {LOCALE_META[SOURCE_LOCALE].flag} {t("richText.showReference")}
              </summary>
              <div
                className="mt-2 text-sm text-gray-600 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: value[SOURCE_LOCALE] ?? "" }}
              />
            </details>
          )}
        </div>
      </Modal>
    </div>
  );
}
