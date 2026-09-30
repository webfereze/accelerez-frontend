import Link from "next/link";
import clsx from "clsx";

/**
 * The category row above a listing.
 *
 * **Links, not buttons.** Each filter is a real URL — `/atractii?categorie=natura` —
 * so a filtered listing can be shared, bookmarked, reached with the back
 * button and prerendered. A row of `onClick` handlers gives up all four for no
 * gain, since the filtering itself is a one-line array operation either way.
 *
 * `aria-current` rather than colour alone marks the active one: the filled pill
 * is obvious to somebody looking at it and invisible to somebody listening.
 */
export type Filter = { value: string; label: string; count: number };

export default function FilterBar({
  filters,
  active,
  basePath,
  param,
  allLabel,
  totalCount,
}: {
  filters: Filter[];
  /** Empty string means "all". */
  active: string;
  basePath: string;
  /** The query key — `categorie`, `tip`. Romanian, like the routes. */
  param: string;
  allLabel: string;
  totalCount: number;
}) {
  const entries = [
    { value: "", label: allLabel, count: totalCount },
    // A filter that would return nothing is not offered: a visitor who picks it
    // learns only that they wasted a tap.
    ...filters.filter((filter) => filter.count > 0),
  ];

  return (
    <nav className="site-container -mt-6 md:-mt-8">
      <ul className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-ink-900 p-2 shadow-[0_18px_40px_-30px_rgba(11,15,13,0.5)]">
        {entries.map((entry) => {
          const selected = entry.value === active;
          const href = entry.value
            ? `${basePath}?${param}=${encodeURIComponent(entry.value)}`
            : basePath;

          return (
            <li key={entry.value || "all"}>
              <Link
                href={href}
                scroll={false}
                aria-current={selected ? "true" : undefined}
                className={clsx(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors duration-200",
                  selected
                    ? "bg-ink-900 text-ink-50"
                    : "text-ink-300 hover:bg-ink-900/5 hover:text-ink-100",
                )}
              >
                {entry.label}
                <span
                  className={clsx(
                    "rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold tabular-nums",
                    selected ? "bg-ink-900/15 text-ink-100" : "bg-ink-900/8 text-ink-400",
                  )}
                >
                  {entry.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
