import { useTranslation } from "next-i18next/pages";
import Input from "@/components/ui/Input";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import { useCountUp } from "@/hooks/useCountUp";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A wide yellow band with one number in it, and one thing to do.
 *
 * The full-width interruption between two quiet sections — the page's raised
 * voice. It works precisely because **the rest of the site is paper and
 * near-black**: the yellow at this size would be noise on a colourful page and is
 * an event on this one. That is also why there is only ever one on a page, and
 * why `sun` is rationed everywhere else.
 *
 * Deliberately **not** a discount band. This association sells nothing, so the
 * number is a fact about the destination — trails, springs, metres of altitude —
 * and the label beside it says which. A "% OFF" here would be the site making
 * an offer it cannot honour.
 *
 * It is not full-bleed: it sits inside the page gutter as a wide rounded panel,
 * so it reads as a card the page is holding up rather than as a new section.
 */

export type PromoBandData = {
  /** Text, so "1.200" and "24/7" survive; parsed for the count-up. */
  value: string;
  unit: Translated;
  eyebrow: Translated;
  title: Translated;
  ctaLabel: Translated;
  ctaHref: string;
};

export function PromoBandEditor({ data, onChange }: BlockEditorProps<PromoBandData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <Input
          label={t("blocks.promoBand.value")}
          hint={t("blocks.promoBand.valueHint")}
          value={data.value ?? ""}
          onChange={(event) => onChange({ ...data, value: event.target.value })}
        />
        <TranslatedField
          label={t("blocks.promoBand.unit")}
          value={data.unit ?? emptyTranslated()}
          onChange={(unit) => onChange({ ...data, unit })}
        />
      </div>

      <TranslatedField
        label={t("blocks.promoBand.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.promoBand.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.promoBand.ctaLabel")}
          value={data.ctaLabel ?? emptyTranslated()}
          onChange={(ctaLabel) => onChange({ ...data, ctaLabel })}
        />
        <LinkField
          label={t("blocks.promoBand.ctaHref")}
          value={data.ctaHref ?? ""}
          onChange={(ctaHref) => onChange({ ...data, ctaHref })}
        />
      </div>
    </div>
  );
}

export function PromoBandRenderer({ data, locale }: BlockRendererProps<PromoBandData>) {
  const title = tr(data.title, locale);
  const eyebrow = tr(data.eyebrow, locale);
  const unit = tr(data.unit, locale);
  const ctaLabel = tr(data.ctaLabel, locale);

  // "1.200 m" counts 1200 and keeps " m"; "24/7" is printed as typed.
  const match = /^\s*([\d.,\s]+)(.*)$/.exec(data.value ?? "");
  const digits = match ? match[1].replace(/[^\d]/g, "") : "";
  const numeric = digits ? Number(digits) : NaN;
  const suffix = match ? match[2] : "";
  const { ref, shown } = useCountUp(numeric);
  const animates = Number.isFinite(numeric);

  if (!title) return null;

  return (
    <Reveal>
      <div className="relative isolate overflow-hidden rounded-3xl bg-acid-500 px-7 py-10 md:px-12 md:py-12">
        {/* The soft shapes in the reference are clouds. Here they are two very
            large, very faint discs — enough to stop the panel being a flat
            rectangle, quiet enough not to compete with the number. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-64 w-64 rounded-full bg-acid-300/45"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-10 -z-10 h-72 w-72 rounded-full bg-acid-300/35"
        />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
            <p className="flex items-baseline gap-2">
              <span
                ref={ref as React.Ref<HTMLSpanElement>}
                className="font-head text-6xl leading-none text-white tabular-nums md:text-7xl"
              >
                {animates ? shown.toLocaleString(locale) : data.value}
                {animates && suffix}
              </span>
              {unit && (
                <span className="text-sm font-bold uppercase tracking-[0.12em] text-ink-100">
                  {unit}
                </span>
              )}
            </p>

            <div className="min-w-0">
              {eyebrow && (
                <p className="text-sm font-semibold text-white/90">{eyebrow}</p>
              )}
              <p className="mt-1 font-head text-2xl italic leading-snug text-flare-500 md:text-4xl">
                {title}
              </p>
            </div>
          </div>

          {ctaLabel && data.ctaHref && (
            // A white pill on the yellow band, rather than the site's own button: the
            // green would be a third colour inside one panel, and on this
            // ground white is the strongest contrast available.
            <a
              href={data.ctaHref}
              className="group inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-ink-900 px-7 text-sm font-semibold text-flare-500 shadow-sm transition-transform duration-300 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              {ctaLabel}
            </a>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export const promoBandDefaults = (): PromoBandData => ({
  value: "",
  unit: emptyTranslated(),
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  ctaLabel: emptyTranslated(),
  ctaHref: "",
});
