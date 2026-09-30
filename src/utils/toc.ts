import type { PageBlock } from "@/types/content";

export type TocEntry = { id: string; text: string; level: 2 | 3 };

/** The shortest article that earns a contents list. Below this it is noise. */
const MIN_ENTRIES = 3;

/**
 * An `id` per heading, from the heading's own words.
 *
 * Diacritics are kept — `de-ce-nu-e-destul` and `de-ce-nu-e-destul` differ by a
 * letter that changes the word, and an anchor nobody reads is still an anchor
 * that ends up in somebody's address bar.
 */
function anchor(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\p{L}\p{N}-]/gu, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") || "sectiune"
  );
}

/** `<b>Word</b> &amp; more` → `Word & more`. */
function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The contents list a long article gets, and the ids its headings need for it.
 *
 * Ch. 09: "Articolele lungi au cuprins cu legături interne." An internal link
 * needs something to point at, and the body is editor HTML — there is no JSX
 * seam to hang an `id` on — so this rewrites the HTML itself, in
 * `getStaticProps`, and the page ships with the anchors already in it. Doing it
 * in the browser instead would mean a contents list that appears after the
 * paint and links that a crawler never sees.
 *
 * **It reads the article in one language only.** The body is a `Translated`
 * value per block and the ids come from the words actually rendered, so a
 * Hungarian article gets Hungarian anchors rather than Romanian ones under a
 * Hungarian address — the same rule the slugs follow.
 *
 * Returns the blocks unchanged when there are fewer than three headings: a
 * contents list of two is a list of the two things the reader can already see.
 */
export function withContents(
  blocks: PageBlock[] | null,
  locale: string,
): { blocks: PageBlock[]; toc: TocEntry[] } {
  const source = blocks ?? [];
  const toc: TocEntry[] = [];
  const used = new Set<string>();

  const next = source.map((block) => {
    if (block.type !== "richText") return block;

    const html = block.data?.html as Record<string, string> | null | undefined;
    const value = html?.[locale];
    if (typeof value !== "string" || !value) return block;

    const rewritten = value.replace(
      /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
      (whole, level: string, attrs: string, inner: string) => {
        // A heading the editor already gave an id keeps it: it may be linked to
        // from somewhere this code cannot see.
        if (/\sid\s*=/i.test(attrs)) return whole;

        const text = plain(inner);
        if (!text) return whole;

        let id = anchor(text);
        let n = 2;
        while (used.has(id)) id = `${anchor(text)}-${n++}`;
        used.add(id);

        toc.push({ id, text, level: Number(level) as 2 | 3 });
        return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
      },
    );

    if (rewritten === value) return block;

    return {
      ...block,
      data: { ...block.data, html: { ...html, [locale]: rewritten } },
    };
  });

  if (toc.length < MIN_ENTRIES) return { blocks: source, toc: [] };
  return { blocks: next, toc };
}
