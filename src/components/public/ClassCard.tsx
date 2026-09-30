import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { money } from "@/utils/labels";
import { formatDay } from "@/utils/dates";
import type { TrainingClass } from "@/types/content";

/**
 * One class, as a card.
 *
 * **The picture is portrait and the type sits under it**, which is what makes a
 * row of these read as a poster wall rather than as a table. The heading is the
 * only thing set in capitals anywhere on the site: at this size and this
 * weight, capitals are the difference between a card and a list item.
 *
 * Four facts, in the order somebody asks for them: what it is, when it runs,
 * how long it takes, what it costs. **Both prices are shown when both exist** —
 * dropping in once and committing to a month are different decisions, and a
 * card that shows only the monthly figure reads as a subscription nobody can
 * try.
 *
 * `offset` staggers alternate cards down the page, as in the reference layout.
 * It is a prop rather than a `:nth-child` rule because the grid reflows at
 * every breakpoint, and an offset that survives into a two-column layout puts a
 * hole in the middle of the row.
 */
export default function ClassCard({
  item,
  offset = false,
  priority = false,
}: {
  item: TrainingClass;
  offset?: boolean;
  priority?: boolean;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const href = `/clase/${slugIn(item.slug, lang)}`;
  const ribbon = tr(item.ribbon, lang);

  return (
    <article className={clsx("group h-full", offset && "lg:mt-16")}>
      <Link href={href} className="flex h-full flex-col">
        <div className="relative aspect-3/4 overflow-hidden bg-ink-900">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.imageAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            <span className="flex h-full items-center justify-center font-head text-5xl text-white/10">
              {tr(item.title, lang).slice(0, 2).toUpperCase()}
            </span>
          )}

          {ribbon && (
            /* The diagonal band across the corner. Rotated with a transform
               rather than drawn as an image, so it takes whatever word an
               editor types without anybody opening a design tool. */
            <span
              aria-hidden
              /* Wide enough that the visible middle of the band holds the
                 whole word: the corner clips both ends, so a band only as wide
                 as its text loses the first letters to the crop. */
              className="pointer-events-none absolute -right-16 top-7 w-56 rotate-45 bg-acid-500 py-1.5 text-center text-[0.68rem] font-semibold uppercase tracking-wide text-ink-950 shadow-lg"
            >
              {ribbon}
            </span>
          )}
          <span className="sr-only">{ribbon}</span>
        </div>

        <h3 className="mt-5 font-head text-2xl uppercase leading-tight tracking-tight text-white">
          {tr(item.title, lang)}
        </h3>

        {tr(item.excerpt, lang) && (
          <p className="mt-3 line-clamp-4 text-[0.95rem] leading-relaxed text-ink-300">
            {tr(item.excerpt, lang)}
          </p>
        )}

        <dl className="mt-4 space-y-1.5 text-sm text-ink-400">
          {tr(item.scheduleText, lang) && (
            <div className="flex gap-2">
              <dt className="sr-only">{t("classes.schedule")}</dt>
              <dd className="text-ink-200">{tr(item.scheduleText, lang)}</dd>
            </div>
          )}

          {item.startsOn && (
            <div className="flex gap-2">
              <dt className="sr-only">{t("classes.startsOn")}</dt>
              <dd>{t("classes.startsOnValue", { date: formatDay(item.startsOn, lang) })}</dd>
            </div>
          )}

          {item.durationMinutes && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">{t("classes.duration")}</dt>
              <ClockIcon className="h-4 w-4" aria-hidden />
              <dd>{t("classes.minutes", { count: item.durationMinutes })}</dd>
            </div>
          )}
        </dl>

        <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {item.pricePerSession != null && (
            <span className="font-head text-lg text-acid-500">
              {money(item.pricePerSession, item.currency, lang)}
              <span className="ml-1 text-sm font-normal text-ink-400">
                {t("classes.perSession")}
              </span>
            </span>
          )}

          {item.pricePerMonth != null && (
            <span className="text-sm text-ink-300">
              {money(item.pricePerMonth, item.currency, lang)}
              <span className="ml-1 text-ink-500">{t("classes.perMonth")}</span>
            </span>
          )}

          {item.pricePerSession == null && item.pricePerMonth == null && (
            <span className="text-sm text-ink-400">{t("classes.priceOnRequest")}</span>
          )}
        </p>

        <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold uppercase tracking-wider text-white transition-colors group-hover:text-acid-400">
          {t("classes.viewDetails")}
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden />
        </span>
      </Link>
    </article>
  );
}
