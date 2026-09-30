import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

/**
 * Page controls for an admin table.
 *
 * Deliberately not a numbered strip of twenty buttons: with a list this size
 * nobody navigates to page 14 on purpose, they search. Previous, next, and
 * where you are — plus the total, which is the number people actually came for.
 *
 * Renders nothing at all for a single page, so a short list is not decorated
 * with dead controls.
 */
export default function Pagination({
  page,
  pages,
  total,
  onChange,
  className,
}: {
  page: number;
  pages: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}) {
  const { t } = useTranslation("common");

  if (pages <= 1) return null;

  const button =
    "flex min-h-11 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div
      className={clsx(
        "flex flex-wrap items-center justify-between gap-3 px-4 py-3",
        className,
      )}
    >
      <p className="text-sm text-gray-500">
        {t("pagination.position", { page, pages, total })}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={button}
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          {t("pagination.previous")}
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className={button}
        >
          {t("pagination.next")}
          <ChevronRightIcon className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
