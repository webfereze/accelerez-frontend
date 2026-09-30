/**
 * How a class's next session is written.
 *
 * The API computes *when* it is — see `nextOccurrence` — and this decides how
 * to say it. Three forms, because "marți la 18:00" is the wrong answer to a
 * class that starts in forty minutes.
 */
export function formatNext(iso: string, locale = "ro", t?: (key: string, vars?: Record<string, unknown>) => string): string {
  const when = new Date(iso);
  const now = new Date();
  const lang = locale === "ro" ? "ro-RO" : locale;

  const time = new Intl.DateTimeFormat(lang, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(when);

  const sameDay = when.toDateString() === now.toDateString();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = when.toDateString() === tomorrow.toDateString();

  if (sameDay && t) return t("schedule.today", { time });
  if (isTomorrow && t) return t("schedule.tomorrow", { time });

  const day = new Intl.DateTimeFormat(lang, {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(when);

  return `${day} · ${time}`;
}

/** ISO weekday numbers as their short names, in the reader's language. */
export function weekdayNames(weekdays: number[], locale = "ro"): string {
  const format = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : locale, {
    weekday: "short",
  });

  // 2024-01-01 was a Monday, so day 1 of that week is ISO weekday 1. Any known
  // Monday works; hardcoding one avoids depending on today's date.
  return weekdays
    .filter((day) => day >= 1 && day <= 7)
    .sort((a, b) => a - b)
    .map((day) => format.format(new Date(2024, 0, day)))
    .join(", ");
}
