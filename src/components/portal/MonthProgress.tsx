import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { useRouter } from "next/router";
import { formatDay, formatRange } from "@/utils/dates";
import type { AccessState } from "@/types/content";

/**
 * How much of the paid month is left.
 *
 * **A period is twenty-eight days from the day the trainer confirmed it**, not
 * a calendar month — see the API's `period.ts`. The bar fills as the period is
 * used up rather than draining, because a bar that empties reads as something
 * being taken away.
 *
 * Three states, and the colour is the message:
 *
 * - **Open, with room** — neon, and the number is reassurance.
 * - **Open, five days or fewer** — pink, because this is the week somebody has
 *   to do something about next month. Warning early beats a closed account.
 * - **Closed** — pink and full, with the sentence saying which month is not
 *   confirmed rather than a bar nobody can act on.
 *
 * `daysLeft` counts today as active: on the last day it says one day, not none.
 * Somebody who paid for four weeks gets four weeks.
 */
export default function MonthProgress({
  access,
  className,
}: {
  access: AccessState;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const used = Math.max(access.daysTotal - access.daysLeft, 0);
  const percent = access.daysTotal ? Math.round((used / access.daysTotal) * 100) : 0;

  const endingSoon = access.open && access.daysLeft <= 5;
  const tone = !access.open || endingSoon ? "flare" : "acid";

  const lang = locale ?? "ro";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink-300">
          <span className="font-head text-base text-white">
            {access.startsOn && access.endsOn
              ? formatRange(access.startsOn, access.endsOn, lang)
              : t("month.noPeriod")}
          </span>
          {access.open && access.endsOn && (
            <span className="ml-2 text-ink-400">
              {t("month.endsOn", { date: formatDay(access.endsOn, lang) })}
            </span>
          )}
        </p>

        <p
          className={clsx(
            "text-sm font-semibold",
            tone === "acid" ? "text-acid-400" : "text-flare-400",
          )}
        >
          {access.open
            ? t("month.daysLeft", { count: access.daysLeft })
            : access.lastEndedOn
              ? t("month.expiredOn", { date: formatDay(access.lastEndedOn, lang) })
              : t("month.notConfirmed")}
        </p>
      </div>

      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={access.daysTotal}
        aria-valuenow={used}
        aria-label={t("month.progressLabel")}
      >
        <div
          className={clsx(
            "h-full rounded-full transition-[width] duration-500",
            tone === "acid" ? "bg-acid-500" : "bg-flare-500",
          )}
          // Closed months show a full bar: nothing is running, and a bar at 40%
          // beside "not confirmed" reads as though something still is.
          style={{ width: access.open ? `${percent}%` : "100%" }}
        />
      </div>

      {endingSoon && (
        <p className="mt-2 text-xs text-flare-300">{t("month.endingSoon")}</p>
      )}
    </div>
  );
}
