import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

/**
 * Page numbers, for a public listing.
 *
 * **Numbers, not "load more".** A reader who wants the article they saw three
 * weeks ago needs to be able to get back to it, and a button that only ever
 * grows the list means scrolling past everything newer every time. Numbers are
 * also addressable: page four has a URL somebody can bookmark or send.
 *
 * With one page it renders nothing at all. A pager showing "1" on a blog with
 * six articles is a control that exists to say there is nothing to control.
 *
 * Long runs collapse to first · … · neighbours · … · last, so the row stays one
 * line at any length — forty page numbers wrap into a block that looks like a
 * table of contents.
 */
export default function Pager({
  page,
  pages,
  onChange,
  className,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const { t } = useTranslation("common");

  if (pages <= 1) return null;

  // First, last, the current page and its neighbours. The gaps become ellipses.
  const shown = [...Array(pages)].map((_, index) => index + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );

  const step = (
    to: number,
    label: string,
    Icon: typeof ArrowLeftIcon,
    disabled: boolean,
  ) => (
    <button
      type="button"
      onClick={() => onChange(to)}
      disabled={disabled}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-ink-100 transition-colors hover:border-white/20 hover:bg-ink-950 hover:text-white disabled:pointer-events-none disabled:opacity-30"
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );

  return (
    <nav className={clsx("flex items-center justify-center gap-2", className)}>
      {step(page - 1, t("pagination.previous"), ArrowLeftIcon, page <= 1)}

      {shown.map((n, index) => (
        <span key={n} className="flex items-center gap-2">
          {/* An ellipsis wherever the run skipped a number. */}
          {index > 0 && n - shown[index - 1] > 1 && (
            <span aria-hidden className="px-1 text-ink-400">
              …
            </span>
          )}

          <button
            type="button"
            onClick={() => onChange(n)}
            aria-current={n === page ? "page" : undefined}
            className={clsx(
              "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium tabular-nums transition-colors",
              n === page
                ? "bg-ink-950 text-white"
                : "text-ink-400 hover:bg-ink-900/5 hover:text-ink-50",
            )}
          >
            {n}
          </button>
        </span>
      ))}

      {step(page + 1, t("pagination.next"), ArrowRightIcon, page >= pages)}
    </nav>
  );
}
