import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ImageField from "@/components/ui/ImageField";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import { useIsSideColumn } from "./column";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A showcase slider: one tall featured photograph, the rest queued beside it.
 *
 * **The current slide is the big one.** That is the whole idea — the queue to
 * its right is what is coming, and picking one (or pressing next) promotes it
 * into the tall frame while the one leaving drops back into the queue. A
 * carousel where every slide is the same size has to animate a whole strip to
 * say anything happened; this says it by changing shape.
 *
 * Not a gallery: `gallery` is a grid of everything at once with a lightbox, for
 * looking through fifty photographs. This is four, arranged, with a heading
 * beside them — the thing a landing page opens with.
 *
 * **On a phone the tall frame is not there.** A 4:5 photograph under three
 * thumbnails is most of a screen spent saying the same thing twice, and the
 * block's whole idea — one big, the rest queued — needs two columns to read as
 * an arrangement at all. So a phone gets the three photographs and the
 * controls, and the strip it shows *starts* with the current slide rather than
 * with what follows it: with no featured frame, a queue of "what is next" would
 * be the one picture never shown.
 *
 * It is deliberately **not** an autoplaying carousel. Nothing moves until a
 * visitor asks it to: a photograph that changes on its own while someone is
 * reading the heading next to it is a distraction, and it fails
 * `prefers-reduced-motion` in a way no CSS can fix.
 */

export type SliderSlide = {
  id: string;
  image: string;
  alt: string;
  caption: Translated;
  /** Optional: makes the featured frame a link — usually to a tour. */
  href: string;
};

export type SliderData = {
  eyebrow: Translated;
  title: Translated;
  slides: SliderSlide[];
};

export function sliderDefaults(): SliderData {
  return {
    eyebrow: emptyTranslated(),
    title: emptyTranslated(),
    // Four, because four is the arrangement: one featured and three queued.
    slides: [0, 1, 2, 3].map((n) => newSlide(n)),
  };
}

function newSlide(index: number): SliderSlide {
  return {
    id: `slide-${Date.now().toString(36)}-${index}`,
    image: "",
    alt: "",
    caption: emptyTranslated(),
    href: "",
  };
}

// --- editor ----------------------------------------------------------------

export function SliderEditor({ data, onChange }: BlockEditorProps<SliderData>) {
  const { t } = useTranslation("common");
  const slides = data.slides ?? [];

  const update = (id: string, patch: Partial<SliderSlide>) =>
    onChange({
      ...data,
      slides: slides.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide)),
    });

  const move = (index: number, by: number) => {
    const to = index + by;
    if (to < 0 || to >= slides.length) return;

    const next = [...slides];
    [next[index], next[to]] = [next[to], next[index]];
    onChange({ ...data, slides: next });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.slider.eyebrow")}
          value={data.eyebrow ?? emptyTranslated()}
          onChange={(eyebrow) => onChange({ ...data, eyebrow })}
        />
        <TranslatedField
          label={t("blocks.slider.title")}
          value={data.title ?? emptyTranslated()}
          onChange={(title) => onChange({ ...data, title })}
        />
      </div>

      <ul className="space-y-3">
        {slides.map((slide, index) => (
          <li
            key={slide.id}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("blocks.slider.slide", { index: index + 1 })}
              </span>

              <div className="flex items-center gap-0.5">
                {/* Order matters here — slide one is what the block opens on. */}
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={t("blocks.slider.moveUp", { index: index + 1 })}
                  className="rounded p-1.5 text-slate-400 hover:bg-ink-900 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowLeftIcon className="h-4 w-4 rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === slides.length - 1}
                  aria-label={t("blocks.slider.moveDown", { index: index + 1 })}
                  className="rounded p-1.5 text-slate-400 hover:bg-ink-900 hover:text-slate-700 disabled:opacity-30"
                >
                  <ArrowRightIcon className="h-4 w-4 rotate-90" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...data,
                      slides: slides.filter((s) => s.id !== slide.id),
                    })
                  }
                  aria-label={t("blocks.slider.remove", { index: index + 1 })}
                  className="rounded p-1.5 text-slate-400 hover:bg-ink-900 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <ImageField
              label={t("blocks.slider.image")}
              url={slide.image || null}
              alt={slide.alt}
              onChange={({ url, alt }) => update(slide.id, { image: url ?? "", alt })}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <TranslatedField
                label={t("blocks.slider.caption")}
                value={slide.caption ?? emptyTranslated()}
                onChange={(caption) => update(slide.id, { caption })}
              />
              <LinkField
                label={t("blocks.slider.href")}
                value={slide.href ?? ""}
                onChange={(href) => update(slide.id, { href })}
              />
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() =>
          onChange({ ...data, slides: [...slides, newSlide(slides.length)] })
        }
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-sm text-slate-600 hover:border-flare-500 hover:text-flare-500"
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.slider.add")}
      </button>
    </div>
  );
}

// --- renderer --------------------------------------------------------------

export function SliderRenderer({ data, locale }: BlockRendererProps<SliderData>) {
  const { t } = useTranslation("common");
  const side = useIsSideColumn();

  // A slide with no picture is a slide someone started and never finished. It
  // must not become a grey hole in the middle of the rotation.
  const slides = (data.slides ?? []).filter((slide) => slide.image);

  /**
   * Where the strip is, which way it is travelling, and what is still on its
   * way out.
   *
   * `leaving` is the slide the frame is showing *until its animation ends* —
   * two pictures are on screen during the change, one going and one arriving.
   * Without it the outgoing image would vanish the instant the state changed
   * and the transition would be an arrival with nothing to leave.
   */
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Deleting slides in the editor can leave the index past the end.
  useEffect(() => {
    setActive((current) => (current < slides.length ? current : 0));
    setLeaving(null);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const eyebrow = tr(data.eyebrow, locale);
  const title = tr(data.title, locale);

  const current = slides[Math.min(active, slides.length - 1)];

  /**
   * `by` is how the strip moves, not where it lands: +1 is "onwards", and it
   * stays +1 when the fourth slide wraps to the first. A direction worked out
   * from the two indices would run that wrap backwards, which is the classic
   * carousel tell — press next, watch it rewind.
   */
  const go = (index: number, by: 1 | -1 = 1) => {
    const next = ((index % slides.length) + slides.length) % slides.length;
    if (next === active) return;

    setLeaving(active);
    setDirection(by);
    setActive(next);
  };

  // The queue is what comes *after* the featured one, wrapping around, so the
  // block always reads left to right as "this one now, these next".
  const queue = slides
    .map((_, offset) => slides[(active + offset + 1) % slides.length])
    .slice(0, Math.min(3, slides.length - 1));

  // The phone's strip, which has no featured frame beside it: the current slide
  // is the first of the three, and it is the one marked.
  const strip = slides
    .slice(0, 3)
    .map((_, offset) => slides[(active + offset) % slides.length]);

  const controls = slides.length > 1;

  return (
    <section
      aria-roledescription="carousel"
      aria-label={title || t("blocks.slider.name")}
      onKeyDown={(e) => {
        if (!controls) return;
        if (e.key === "ArrowLeft") go(active - 1, -1);
        if (e.key === "ArrowRight") go(active + 1, 1);
      }}
      className={clsx(
        "grid items-start gap-8",
        // The rail is 320px: one column, no queue, controls underneath.
        !side && "lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-12",
      )}
    >
      {/* --- the featured slide ------------------------------------------- */}
      {/* Hidden on a phone, where the strip below carries the block — but not
          in the side rail, where the frame is the only thing there is. */}
      <div className={clsx("relative order-2 lg:order-1", !side && "hidden lg:block")}>
        <Featured
          slide={current}
          locale={locale}
          index={active}
          total={slides.length}
          direction={direction}
          leaving={leaving === null ? null : slides[leaving]}
          onLeft={() => setLeaving(null)}
        />

        {/* The arrow rides the edge of the frame rather than sitting under it:
            it belongs to the picture, and an overlapping control is what makes
            the composition read as designed rather than as a stack. Hidden on
            a phone, where the row of controls below does the job with room for
            a thumb. */}
        {controls && !side && (
          <Arrow
            direction="prev"
            onClick={() => go(active - 1, -1)}
            className="absolute -left-5 bottom-16 hidden lg:flex"
          />
        )}
      </div>

      {/* --- words, queue and controls ------------------------------------ */}
      <div className="order-1 lg:order-2">
        {(eyebrow || title) && (
          <header className={clsx(!side && "lg:pt-6")}>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-flare-400">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2
                className={clsx(
                  "mt-3 font-semibold leading-tight tracking-tight text-ink-100",
                  side ? "text-xl" : "text-3xl sm:text-4xl lg:text-5xl",
                )}
              >
                {title}
              </h2>
            )}
          </header>
        )}

        {/* The phone's three, starting with the current one. */}
        {!side && slides.length > 1 && (
          <ul className="mt-8 grid grid-cols-3 gap-3 lg:hidden">
            {strip.map((slide, index) => (
              <li key={`${slide.id}-strip-${active}`}>
                <Thumb
                  slide={slide}
                  locale={locale}
                  number={(active + index) % slides.length}
                  active={index === 0}
                  onClick={() => go(active + index, 1)}
                />
              </li>
            ))}
          </ul>
        )}

        {queue.length > 0 && !side && (
          <div className="relative mt-8 hidden lg:mt-14 lg:block">
            <ul className="grid grid-cols-3 gap-3 sm:gap-5">
              {queue.map((slide, index) => (
                // Keyed by *position in the queue as well as slide*, so every
                // card is a new element on each change and replays its
                // entrance — the strip moves, rather than one card swapping
                // its picture while its neighbours sit still.
                <li
                  key={`${slide.id}-${active}`}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className={
                    direction === 1 ? "queue-shift-right" : "queue-shift-left"
                  }
                >
                  <Thumb
                    slide={slide}
                    locale={locale}
                    number={(active + index + 1) % slides.length}
                    onClick={() => go(active + index + 1, 1)}
                  />
                </li>
              ))}
            </ul>

            {controls && (
              <Arrow
                direction="next"
                onClick={() => go(active + 1, 1)}
                className="absolute -right-5 top-1/2 hidden -translate-y-1/2 lg:flex"
              />
            )}
          </div>
        )}

        {controls && (
          <div
            className={clsx(
              "mt-6 flex flex-wrap items-center gap-4",
              !side && "lg:mt-8",
            )}
          >
            {/* On a phone the arrows live here, in reach. On a wide screen
                they have already been placed on the frame, so only the dots
                and the counter remain. */}
            <div className="flex items-center gap-2 lg:hidden">
              <Arrow direction="prev" onClick={() => go(active - 1, -1)} size="sm" />
              <Arrow direction="next" onClick={() => go(active + 1, 1)} size="sm" />
            </div>

            <ul className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <li key={slide.id}>
                  <button
                    type="button"
                    onClick={() => go(index, index > active ? 1 : -1)}
                    aria-label={t("blocks.slider.goTo", { index: index + 1 })}
                    aria-current={index === active ? "true" : undefined}
                    className="group flex h-8 items-center px-0.5"
                  >
                    {/* The active dot stretches into a bar — the position in a
                        set of four is legible at a glance, which four
                        identical circles never quite are. */}
                    <span
                      className={clsx(
                        "block h-1.5 rounded-full transition-all duration-300",
                        index === active
                          ? "w-8 bg-acid-500"
                          : "w-1.5 bg-ink-300 group-hover:bg-ink-400",
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>

            <p
              aria-live="polite"
              className="ml-auto text-sm font-semibold tabular-nums text-ink-400"
            >
              <span className="text-ink-100">{pad(active + 1)}</span> / {pad(slides.length)}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * The tall frame — a window with a strip of pictures moving past it.
 *
 * Two layers while a change is in flight: the one leaving and the one arriving.
 * They are keyed by slide id so React mounts a genuinely new element each time,
 * which is what lets a CSS animation replay; a mutated `src` on one `<img>`
 * would just blink.
 *
 * The frame owns the overflow, so both layers can sit outside it while they
 * travel without spilling into the page.
 */
function Featured({
  slide,
  locale,
  index,
  total,
  direction,
  leaving,
  onLeft,
}: {
  slide: SliderSlide;
  locale: string;
  index: number;
  total: number;
  /** +1 travelling onwards, -1 going back. */
  direction: 1 | -1;
  /** The slide on its way out, or null when nothing is moving. */
  leaving: SliderSlide | null;
  /** Called when the outgoing slide has finished leaving. */
  onLeft: () => void;
}) {
  const caption = tr(slide.caption, locale);

  const frame = (
    <>
      {leaving && (
        // Decorative for the moment it exists: the caption and the counter
        // below already describe the slide that is arriving, and a screen
        // reader must not be read the one that is leaving.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`leaving-${leaving.id}`}
          src={leaving.image}
          alt=""
          aria-hidden
          onAnimationEnd={onLeft}
          className={clsx(
            "absolute inset-0 h-full w-full object-cover",
            direction === 1 ? "slide-leave-left" : "slide-leave-right",
          )}
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={slide.id}
        src={slide.image}
        alt={slide.alt || caption || ""}
        className={clsx(
          "absolute inset-0 h-full w-full object-cover",
          direction === 1 ? "slide-enter-right" : "slide-enter-left",
        )}
      />

      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent"
      />

      <span className="absolute left-5 top-5 text-sm font-semibold tabular-nums text-white/70">
        {pad(index + 1)}
        <span className="text-white/40"> / {pad(total)}</span>
      </span>

      {caption && (
        <span className="absolute inset-x-5 bottom-5 block text-lg font-semibold leading-snug text-white drop-shadow-sm">
          {caption}
        </span>
      )}
    </>
  );

  const shell =
    // Taller than anything else in the block, and taller on a wide screen than
    // it is on a phone — the featured slide is the block's centre of gravity.
    "relative block aspect-[4/5] w-full overflow-hidden rounded-3xl bg-ink-800 lg:aspect-auto lg:h-[32rem]";

  if (slide.href) {
    return (
      <Link href={slide.href} className={clsx(shell, "group")}>
        {frame}
      </Link>
    );
  }

  return <div className={shell}>{frame}</div>;
}

/**
 * One queued slide. Clicking it promotes it into the tall frame.
 *
 * `active` is only ever true in the phone's strip: on a wide screen the current
 * slide is the tall frame beside the queue and needs no marking, but with the
 * frame gone something has to say which of the three the counter is talking
 * about.
 */
function Thumb({
  slide,
  locale,
  number,
  active = false,
  onClick,
}: {
  slide: SliderSlide;
  locale: string;
  number: number;
  active?: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation("common");
  const caption = tr(slide.caption, locale);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t("blocks.slider.goTo", { index: number + 1 })}
      aria-current={active ? "true" : undefined}
      className={clsx(
        "group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink-800 lg:aspect-[3/4] lg:h-52",
        active && "ring-2 ring-acid-500 ring-offset-2",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.image}
        alt={slide.alt || caption || ""}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
      />

      <span
        aria-hidden
        className="absolute inset-0 bg-ink-950/0 transition-colors duration-300 group-hover:bg-ink-950/25"
      />

      <span
        className={clsx(
          "absolute left-3 top-3 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums backdrop-blur-sm",
          active ? "bg-acid-500 text-ink-950" : "bg-ink-950/45 text-white",
        )}
      >
        {pad(number + 1)}
      </span>
    </button>
  );
}

/** The round green control. The site's one accent, used as a control. */
function Arrow({
  direction,
  onClick,
  size = "md",
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const { t } = useTranslation("common");
  const Icon = direction === "prev" ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(`blocks.slider.${direction}`)}
      className={clsx(
        "z-10 items-center justify-center rounded-full bg-acid-500 text-ink-950",
        "shadow-[0_10px_28px_-10px_rgba(152,185,37,0.9)] transition-all duration-200",
        "hover:bg-acid-400 hover:shadow-[0_14px_32px_-10px_rgba(221,189,38,0.55)]",
        "active:scale-95 motion-reduce:transition-none",
        size === "sm" ? "flex h-11 w-11" : "flex h-14 w-14",
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </button>
  );
}

/** "01", "04" — a counter of four reads better zero-padded. */
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** The gallery preview has no images to show, so it borrows the placeholder. */
export const SliderPlaceholderIcon = PhotoIcon;
