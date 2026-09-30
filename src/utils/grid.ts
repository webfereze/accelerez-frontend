/**
 * How many columns a card row should use for the number of cards it actually
 * has.
 *
 * **A four-column grid holding two cards is the problem this solves.** The two
 * stretch to half the page each, or sit squeezed against the left edge with a
 * hole beside them, and either way the section reads as broken rather than as
 * small. A directory that starts with two trainers is the normal beginning of
 * this product, not an edge case.
 *
 * So the grid narrows to the content: two cards get two columns and the row is
 * centred at a width that keeps the cards their intended size. Only from four
 * upwards does it become the full four-column grid it was drawn as.
 */
export function cardColumns(count: number): string {
  if (count <= 1) return "grid-cols-1 max-w-sm";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-3xl";
  if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
}

/**
 * Centred only while the row is short of a full one — a full row is already the
 * width of the page and centring it would do nothing but cost a class.
 */
export function cardRowClass(count: number): string {
  return `grid gap-5 ${cardColumns(count)}${count > 0 && count < 4 ? " mx-auto" : ""}`;
}
