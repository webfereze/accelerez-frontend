/**
 * Normalises a tag so two editors typing the same word produce one tag.
 *
 * Lowercased, trimmed, spaces to hyphens, diacritics kept. Romanian tags are
 * read by visitors in a filter list, and stripping the diacritics would turn
 * "iarnă" into "iarna" — a different word, and the wrong one.
 */
export function slugifyTag(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}
