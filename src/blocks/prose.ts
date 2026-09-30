/**
 * Table and code styling for the blocks that render editor HTML.
 *
 * Split out because two blocks (`richText`, `mediaText`) both drop raw HTML
 * through `dangerouslySetInnerHTML` and neither styled a `<table>` — so a table
 * arrived as unspaced, unaligned text with no rules between the rows. The base
 * prose classes still differ between the two (mediaText renders its own `<h2>`
 * and deliberately has no heading styles), so only the part they genuinely
 * share lives here.
 *
 * **Quill cannot produce a table.** The admin editor is restricted to a format
 * whitelist — headings, lists, links, emphasis — so the only tables on the site
 * are the ones seeded from the backend, currently the cookie policy's. That is
 * a reason to style them, not to skip them: seeded content is what a visitor
 * sees on day one and no editor can fix it from the admin.
 */

/**
 * The responsive-table trick, and why it is `block` rather than a wrapper.
 *
 * The HTML arrives as a string, so there is no JSX seam to wrap the table in an
 * `overflow-x-auto` div — the rule the design skill asks for. `display: block`
 * on the table itself gets the same result: it becomes its own scroll
 * container, and `w-max` + `max-w-full` lets it size to its content up to the
 * gutter, then scroll rather than forcing the page sideways.
 *
 * This does not break column alignment, which is the usual worry. `thead` and
 * `tbody` are consecutive table-row-group siblings, so CSS wraps them in a
 * *single* anonymous table box — one table, columns still aligned. It is the
 * same approach GitHub uses on rendered markdown.
 */
export const PROSE_TABLE = `
  [&_table]:mt-4 [&_table]:block [&_table]:w-max [&_table]:max-w-full
  [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm
  [&_thead]:border-b-2 [&_thead]:border-white/15
  [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:align-bottom
  [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.12em]
  [&_th]:text-flare-500 sm:[&_th]:px-4 sm:[&_th]:py-3
  [&_td]:px-3 [&_td]:py-2 [&_td]:align-top sm:[&_td]:px-4 sm:[&_td]:py-3
  [&_tbody_tr]:border-b [&_tbody_tr]:border-white/10
  [&_tbody_tr:last-child]:border-b-0
`;

/**
 * Inline `<code>`, which the cookie policy leans on heavily — every row of its
 * table names a real storage key, and a key set in body type is a key nobody
 * can tell from prose.
 */
export const PROSE_CODE = `
  [&_code]:rounded [&_code]:bg-ink-800 [&_code]:px-1.5 [&_code]:py-0.5
  [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-ink-100
`;

/** Both, for a block that renders arbitrary editor or seeded HTML. */
export const PROSE_RICH = `${PROSE_TABLE} ${PROSE_CODE}`;
