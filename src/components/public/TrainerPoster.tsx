import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ArrowUpRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { formatKey, money, specializationKey } from "@/utils/labels";
import type { Trainer } from "@/types/content";

/**
 * One trainer at half the width of the screen — a poster, not a card.
 *
 * **Its own component rather than a `size` prop on `TrainerCard`.** The card is
 * a tile in a directory: a photograph, then a white-on-dark block of facts
 * underneath it, four to a row. This is a single photograph the height of a
 * screen with the name set across it. The two share a subject and nothing
 * else, and one component with a flag deciding between two compositions is how
 * both of them end up mediocre.
 *
 * **The price is the reveal.** Everything a visitor needs in order to *choose*
 * is on the poster from the start — who they are, what for, where. The figure
 * is what they need in order to *decide*, so it arrives when they lean in:
 * the photograph darkens a shade, the panel lifts, the sum and the arrow slide
 * up together. On a page whose job is to make somebody look at four faces,
 * holding the number back is what keeps the first pass about the people.
 *
 * **It is held back only where hovering exists.** Below `md` the price is
 * simply there: a touch screen has no hover, and a figure nobody can reveal is
 * a figure nobody sees. The same reveal fires on keyboard focus, so tabbing
 * through the section is not a worse experience than pointing at it.
 *
 * The group is **named** (`group/poster`). `CtaButton` and anything else built
 * on a bare `group-hover:` would otherwise fire from an ancestor group — see
 * the note in `SplitCtaBlock`.
 */
export default function TrainerPoster({
  trainer,
  locale = "ro",
  priority = false,
  wide = false,
}: {
  trainer: Trainer;
  locale?: string;
  priority?: boolean;
  /** The odd one out, spanning both columns — see `TrainerGridRenderer`. */
  wide?: boolean;
}) {
  const { t } = useTranslation("common");

  const href = `/antrenori/${slugIn(trainer.slug, locale)}`;
  const headline = tr(trainer.headline, locale);
  const specializations = (trainer.specializations ?? []).slice(0, 3);

  return (
    <article className="group/poster h-full">
      <Link
        href={href}
        className={clsx(
          "relative isolate flex h-full min-h-[28rem] items-end overflow-hidden rounded-card",
          "bg-ink-900 ring-1 ring-inset ring-white/10 transition-shadow duration-500",
          "hover:ring-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid-500",
          wide ? "lg:min-h-[32rem]" : "lg:min-h-[40rem]",
        )}
      >
        {trainer.photo ? (
          <Image
            src={trainer.photo}
            alt={trainer.displayName}
            fill
            // Half the screen from `md` up, the whole of it below.
            sizes="(min-width: 768px) 50vw, 100vw"
            priority={priority}
            // Anchored to the top: a gym photograph is usually full-body, and a
            // centred crop of one puts the chest in the frame and the face out.
            className="-z-10 object-cover object-top transition-transform duration-[1200ms] ease-out group-hover/poster:scale-105 motion-reduce:transition-none motion-reduce:group-hover/poster:scale-100"
          />
        ) : (
          /* A trainer added this morning has no photograph. A monogram is a
             designed absence; a broken image is not. */
          <span className="absolute inset-0 -z-10 flex items-center justify-center font-head text-[10rem] text-white/10">
            {initials(trainer.displayName)}
          </span>
        )}

        {/* Two scrims doing two jobs: the first keeps the name legible over a
            light shirt, the second is the lean-in — the whole picture drops a
            shade so the panel below reads as lit. */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/5"
        />
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-ink-950/0 transition-colors duration-500 ease-out group-hover/poster:bg-ink-950/25 motion-reduce:transition-none"
        />

        {!trainer.isAcceptingClients && (
          <span className="absolute left-5 top-5 rounded-full bg-ink-950/85 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-flare-400 ring-1 ring-inset ring-flare-500/40">
            {t("trainer.full")}
          </span>
        )}

        <div className="w-full p-6 sm:p-8 lg:p-10">
          {(trainer.city || trainer.formats?.[0]) && (
            <p className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/70">
              {trainer.city && (
                <>
                  <MapPinIcon className="h-3.5 w-3.5" aria-hidden />
                  {trainer.city}
                </>
              )}
              {trainer.formats?.[0] && <span>· {t(formatKey(trainer.formats[0]))}</span>}
            </p>
          )}

          <h3 className="mt-3 font-head text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            {trainer.displayName}
          </h3>

          {headline && (
            <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink-200">
              {headline}
            </p>
          )}

          {specializations.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {specializations.map((spec) => (
                <li
                  key={spec}
                  className="rounded-full bg-white/10 px-3 py-1 text-[0.7rem] font-medium text-white ring-1 ring-inset ring-white/15 backdrop-blur-xs"
                >
                  {t(specializationKey(spec))}
                </li>
              ))}
            </ul>
          )}

          {/* The reveal. Hidden only from `md` up, where a pointer exists. */}
          <div
            className={clsx(
              "mt-7 flex items-center gap-4 border-t border-white/15 pt-5",
              "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
              "md:translate-y-2 md:opacity-0",
              "md:group-hover/poster:translate-y-0 md:group-hover/poster:opacity-100",
              "md:group-focus-within/poster:translate-y-0 md:group-focus-within/poster:opacity-100",
            )}
          >
            {trainer.monthlyPrice != null ? (
              <p className="text-sm text-ink-300">
                <span className="font-head text-3xl text-acid-400">
                  {money(trainer.monthlyPrice, trainer.currency, locale)}
                </span>{" "}
                {t("trainer.perMonth")}
              </p>
            ) : (
              <p className="font-head text-lg text-white">
                {t("trainer.priceOnRequest")}
              </p>
            )}

            <span className="ml-auto flex items-center gap-2 text-sm font-medium text-white">
              {t("trainer.seeProfile")}
              <ArrowUpRightIcon
                strokeWidth={2}
                className="h-4 w-4 transition-transform duration-300 ease-out group-hover/poster:translate-x-0.5 group-hover/poster:-translate-y-0.5 motion-reduce:transition-none"
                aria-hidden
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Two letters at most — three is a monogram nobody can read. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
