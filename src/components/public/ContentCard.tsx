import Link from "next/link";
import clsx from "clsx";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

/**
 * One entry in a listing — an attraction, a place to stay, an event, an article.
 *
 * The listings share one card on purpose. They hold different things, but a
 * visitor scanning them is doing the same job each time, and four card designs
 * would make that job four times.
 *
 * **No box.** The image is the card; the words sit on the page underneath it.
 * A bordered white panel on a white page is a line drawn for its own sake, and
 * it is what makes a grid of cards read as a dashboard rather than as a
 * magazine. What separates entries here is space and a rule under the meta row.
 *
 * **The whole card is the link.** A card where only the title is clickable
 * teaches the reader to aim, which on a touch screen is a card that feels
 * broken. The title takes the underline so it still reads as a link, and
 * "READ MORE →" spells out what the whole thing does.
 */
export default function ContentCard({
  href,
  image,
  imageAlt,
  meta,
  title,
  text,
  badge,
  footer,
  readMore,
}: {
  href: string;
  image?: string | null;
  imageAlt?: string | null;
  meta?: React.ReactNode;
  title: string;
  text?: string | null;
  /** Sits on the image — a category, a date, "Finished". */
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  /** The "read more" wording. Omitted, the row is left to `footer` alone. */
  readMore?: string;
}) {
  return (
    <Link href={href} className="group flex h-full flex-col">
      {image && (
        <span className="relative block overflow-hidden rounded-2xl bg-ink-800">
          <span className="block aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={imageAlt ?? ""}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </span>

          {badge && (
            <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-ink-900/95 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-200 backdrop-blur-sm">
              {badge}
            </span>
          )}
        </span>
      )}

      <span className="flex flex-1 flex-col pt-5">
        {meta && (
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
            {meta}
          </span>
        )}

        <span
          className={clsx(
            "font-head text-xl leading-snug text-ink-50 decoration-acid-500 decoration-2 underline-offset-[6px]",
            "group-hover:underline md:text-2xl",
            meta && "mt-2",
          )}
        >
          {title}
        </span>

        {text && (
          <span className="mt-2.5 text-sm leading-relaxed text-ink-400">{text}</span>
        )}

        {/* `mt-auto` is what aligns the bottom row across a grid of cards whose
            descriptions run to different lengths. */}
        <span className="mt-auto flex items-center justify-between gap-3 pt-5">
          {readMore ? (
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-100">
              {readMore}
              <ArrowRightIcon
                aria-hidden
                className="h-3.5 w-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1.5 motion-reduce:transition-none"
              />
            </span>
          ) : (
            <span />
          )}
          {footer}
        </span>
      </span>
    </Link>
  );
}
