/**
 * Dates, as this product writes them.
 *
 * `YYYY-MM-DD` in, a readable day out, in the reader's language. Parsed as a
 * **local** date rather than through `new Date("2026-09-21")`, which the
 * platform reads as UTC midnight and renders as the previous evening for
 * anybody west of Greenwich — a period that visibly starts a day early.
 */
function parse(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

const localeOf = (locale: string) => (locale === "ro" ? "ro-RO" : locale);

/** `21 septembrie`. */
export function formatDay(value: string, locale = "ro"): string {
  return new Intl.DateTimeFormat(localeOf(locale), {
    day: "numeric",
    month: "long",
  }).format(parse(value));
}

/** `21 sept. – 18 oct.` — short, because it is read beside a number. */
export function formatRange(from: string, to: string, locale = "ro"): string {
  const format = new Intl.DateTimeFormat(localeOf(locale), {
    day: "numeric",
    month: "short",
  });
  return `${format.format(parse(from))} – ${format.format(parse(to))}`;
}
