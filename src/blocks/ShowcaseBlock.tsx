import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageField from "@/components/ui/ImageField";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import CtaButton from "@/components/public/CtaButton";
import Reveal from "@/components/public/Reveal";
import { useParallax } from "@/hooks/useParallax";
import { useCountUp } from "@/hooks/useCountUp";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A full-bleed band that hands the viewport over to the destination.
 *
 * It is the one block besides the hero that runs **edge to edge** — see
 * `FULL_BLEED_BLOCKS` in `types.ts`, which is the closed list. A band like this
 * trapped in the 1280px page gutter is a wide card, not a showcase, and the
 * whole point is the moment where the page stops being a column.
 *
 * Three pieces of movement, none of which carries meaning on its own — so every
 * one of them is switched off under `prefers-reduced-motion` and the band
 * simply renders:
 *
 * - The background **drifts against the scroll**, which is what gives the band
 *   depth as it passes.
 * - The heading and the figures **rise in** as they arrive.
 * - The figures **count up** once, the first time they are seen.
 *
 * The figures are deliberately plain numbers an editor types, not anything
 * computed. A counter wired to a live query is a counter that will one day say
 * "0 attractions" on the front page because a filter changed.
 */

export type ShowcaseStat = {
  id: string;
  /** Typed as text so "1.200" and "24/7" survive; parsed for the count-up. */
  value: string;
  label: Translated;
};

export type ShowcaseData = {
  image: string | null;
  alt: string;
  eyebrow: Translated;
  title: Translated;
  text: Translated;
  stats: ShowcaseStat[];
  ctaLabel: Translated;
  ctaHref: string;
};

// --- editor -----------------------------------------------------------------

export function ShowcaseEditor({ data, onChange }: BlockEditorProps<ShowcaseData>) {
  const { t } = useTranslation("common");
  const stats = data.stats ?? [];

  const setStat = (id: string, changes: Partial<ShowcaseStat>) =>
    onChange({
      ...data,
      stats: stats.map((stat) => (stat.id === id ? { ...stat, ...changes } : stat)),
    });

  return (
    <div className="space-y-4">
      <ImageField
        label={t("blocks.showcase.image")}
        url={data.image ?? null}
        alt={data.alt ?? ""}
        onChange={({ url, alt }) => onChange({ ...data, image: url, alt })}
      />

      <TranslatedField
        label={t("blocks.showcase.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.showcase.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <TranslatedField
        label={t("blocks.showcase.text")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={3}
      />

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-900">
          {t("blocks.showcase.stats")}
        </legend>

        <div className="space-y-3">
          {stats.map((stat) => (
            <div key={stat.id} className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
              <Input
                label={t("blocks.showcase.statValue")}
                value={stat.value}
                onChange={(event) => setStat(stat.id, { value: event.target.value })}
              />
              <TranslatedField
                label={t("blocks.showcase.statLabel")}
                value={stat.label ?? emptyTranslated()}
                onChange={(label) => setStat(stat.id, { label })}
              />
              <Button
                variant="ghost"
                aria-label={t("common.remove")}
                className="self-end"
                onClick={() =>
                  onChange({ ...data, stats: stats.filter((s) => s.id !== stat.id) })
                }
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ))}
        </div>

        {/* Four is where the row stops fitting on a laptop without the figures
            shrinking to the size of the labels under them. */}
        {stats.length < 4 && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() =>
              onChange({
                ...data,
                stats: [
                  ...stats,
                  {
                    id: `stat-${Date.now().toString(36)}`,
                    value: "",
                    label: emptyTranslated(),
                  },
                ],
              })
            }
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            {t("blocks.showcase.addStat")}
          </Button>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.showcase.ctaLabel")}
          value={data.ctaLabel ?? emptyTranslated()}
          onChange={(ctaLabel) => onChange({ ...data, ctaLabel })}
        />
        <LinkField
          label={t("blocks.showcase.ctaHref")}
          value={data.ctaHref ?? ""}
          onChange={(ctaHref) => onChange({ ...data, ctaHref })}
        />
      </div>
    </div>
  );
}

// --- renderer ---------------------------------------------------------------

/**
 * One figure. Split out because `useCountUp` is a hook and a list cannot call
 * one per item inside a `map` in the parent.
 */
function Stat({ stat, locale, index }: { stat: ShowcaseStat; locale: string; index: number }) {
  // "1.200 m" → counts 1200 and keeps " m". Anything with no leading number
  // ("24/7") is printed as typed and never animates.
  const match = /^\s*([\d.,\s]+)(.*)$/.exec(stat.value ?? "");
  const digits = match ? match[1].replace(/[^\d]/g, "") : "";
  const numeric = digits ? Number(digits) : NaN;
  const suffix = match ? match[2] : "";

  const { ref, shown } = useCountUp(numeric);
  const animates = Number.isFinite(numeric);

  return (
    <Reveal as="li" delay={index * 90} className="min-w-0">
      <p
        ref={ref as React.Ref<HTMLParagraphElement>}
        className="font-head text-3xl tracking-tight text-ink-50 tabular-nums md:text-4xl"
      >
        {animates ? shown.toLocaleString(locale) : stat.value}
        {animates && suffix}
      </p>
      <p className="mt-1 text-sm leading-snug text-ink-300">{tr(stat.label, locale)}</p>
    </Reveal>
  );
}

export function ShowcaseRenderer({ data, locale }: BlockRendererProps<ShowcaseData>) {
  const { ref, offset } = useParallax<HTMLDivElement>(0.18);

  const title = tr(data.title, locale);
  const eyebrow = tr(data.eyebrow, locale);
  const text = tr(data.text, locale);
  const ctaLabel = tr(data.ctaLabel, locale);
  const stats = data.stats ?? [];

  if (!title) return null;

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-ink-950">
      {data.image && (
        <div
          aria-hidden
          // Taller than the band and pulled up, so the drift never exposes an
          // edge at either extreme of the travel.
          className="absolute inset-x-0 -top-[12%] -z-20 h-[124%] will-change-transform"
          style={{ transform: `translate3d(0, ${offset}px, 0)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image}
            alt={data.alt ?? ""}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Two layers: a flat scrim for contrast, and a vertical gradient so the
          band joins the sections above and below it rather than sitting in a
          box of its own. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-950/70" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950 via-ink-950/40 to-ink-950"
      />

      <div className="site-container py-20 md:py-28">
        <Reveal className="max-w-3xl">
          {eyebrow && (
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-acid-400">
              <span aria-hidden className="h-px w-8 bg-acid-400/70" />
              {eyebrow}
            </p>
          )}

          <h2 className="mt-4 font-head text-3xl leading-tight tracking-tight text-ink-50 md:text-5xl">
            {title}
          </h2>

          {text && (
            <p className="mt-5 max-w-prose text-base leading-relaxed text-ink-200 md:text-lg">
              {text}
            </p>
          )}
        </Reveal>

        {stats.length > 0 && (
          <ul
            className={clsx(
              "mt-12 grid gap-8 border-t border-white/15 pt-10",
              stats.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2",
            )}
          >
            {stats.map((stat, index) => (
              <Stat key={stat.id} stat={stat} locale={locale} index={index} />
            ))}
          </ul>
        )}

        {ctaLabel && data.ctaHref && (
          <Reveal className="mt-12">
            <CtaButton href={data.ctaHref} onDark>
              {ctaLabel}
            </CtaButton>
          </Reveal>
        )}
      </div>
    </section>
  );
}

export const showcaseDefaults = (): ShowcaseData => ({
  image: null,
  alt: "",
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  text: emptyTranslated(),
  stats: [],
  ctaLabel: emptyTranslated(),
  ctaHref: "",
});
