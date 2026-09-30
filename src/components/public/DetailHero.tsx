import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

/**
 * The top of a single attraction, property or event.
 *
 * A picture with the title over it, and a way back to the listing. It is the
 * only `<h1>` on these pages, which is why the title is passed in rather than
 * left to whatever the block body happens to start with.
 *
 * **It runs under the fixed header**, so the top of the image is padded to
 * clear it and the gradient is heaviest at the top: white type over a pale sky
 * is unreadable, and these covers are frequently pale skies.
 *
 * With no cover image it degrades to the flat dark band rather than an empty
 * frame — a record an editor has not photographed yet should still have a
 * designed header.
 */
export default function DetailHero({
  image,
  imageAlt,
  backHref,
  backLabel,
  meta,
  title,
  lead,
  aside,
}: {
  image?: string | null;
  imageAlt?: string | null;
  backHref: string;
  backLabel: string;
  meta?: React.ReactNode;
  title: string;
  lead?: string | null;
  /** A short row under the lead — stars, a date, an admission line. */
  aside?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-ink-100">
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={imageAlt ?? ""}
            className="absolute inset-0 -z-20 h-full w-full object-cover object-bottom"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/85 via-ink-950/55 to-ink-950/90"
          />
        </>
      )}

      <div className="site-container pb-12 pt-28 md:pb-16 md:pt-36">
        <Link
          href={backHref}
          className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-300 transition-colors hover:text-ink-50"
        >
          <ChevronLeftIcon
            aria-hidden
            className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:transition-none"
          />
          {backLabel}
        </Link>

        {meta && (
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-acid-400">
            {meta}
          </p>
        )}

        <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-ink-50 md:text-5xl">
          {title}
        </h1>

        {lead && (
          <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-200 md:text-lg">
            {lead}
          </p>
        )}

        {aside && <div className="mt-6">{aside}</div>}
      </div>
    </section>
  );
}
