import {
  FALLBACK_LOCALE,
  SOURCE_LOCALE,
  type Locale,
  type Translated,
} from "@/types/content";

/**
 * Reads a translatable field in the active locale, falling back to Romanian and
 * then to the source locale.
 *
 * The fallback is not optional: Danish content will often be missing, and a
 * blank heading is worse than one in the wrong language. Two steps because the
 * locale a visitor should land on (Romanian) and the one the data model
 * guarantees exists (Hungarian) are not the same.
 */
export function tr(
  value: Translated | null | undefined,
  locale: string | undefined,
): string {
  if (!value) return "";

  const preferred = value[locale as Locale];
  if (typeof preferred === "string" && preferred.trim()) return preferred;

  const fallback = value[FALLBACK_LOCALE];
  if (typeof fallback === "string" && fallback.trim()) return fallback;

  return value[SOURCE_LOCALE] ?? "";
}

/** True when the field has a real value in this locale (not just a fallback). */
export function hasTranslation(
  value: Translated | null | undefined,
  locale: string | undefined,
): boolean {
  const text = value?.[locale as Locale];
  return typeof text === "string" && text.trim().length > 0;
}

/** An empty `Translated`, for initialising a form. */
export function emptyTranslated(): Translated {
  return { ro: "", hu: "", en: "" };
}

/**
 * Undoes a paste from Word or Google Docs.
 *
 * Those editors join every word with a non-breaking space. A paragraph built
 * that way is, to the browser, one unbreakable word: it cannot wrap, so it runs
 * straight out of its column and across whatever sits beside it.
 *
 * **Only `&nbsp;` sitting between two non-space characters is touched**, and
 * only when there are several. That is the signature of word-joining paste.
 * Quill uses `&nbsp;` for something else entirely — it is the only way to
 * preserve a run of consecutive spaces, or a trailing one — and those always
 * sit next to a space or an edge. Rewriting them started a fight the editor
 * could not win: Quill re-serialised the spaces back to `&nbsp;`, this turned
 * them back into spaces, and the two looped until the tab froze.
 *
 * Never call this on every keystroke. It belongs at a boundary — a paste, or
 * closing the editor — not in the middle of someone typing.
 */
const WORD_JOINED = /(?<=[^\s>])&nbsp;(?=[^\s<])/g;

export function normalizePastedHtml(html: string): string {
  if (!html) return html;

  // One is ordinary ("10&nbsp;km"). Several joining words is a paste.
  const joins = html.match(WORD_JOINED);
  if (!joins || joins.length < 2) return html;

  return html.replace(WORD_JOINED, " ");
}
