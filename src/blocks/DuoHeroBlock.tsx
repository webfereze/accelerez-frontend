import { useTranslation } from "next-i18next/pages";
import ImageField from "@/components/ui/ImageField";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import CtaButton from "@/components/public/CtaButton";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The front page's opening when the site is two people: two photographs side
 * by side, one headline laid across both.
 *
 * **Two frames, not one wide picture.** The pair is the brand — him and her,
 * the men's side and the women's side of the same programme — and two
 * portraits next to each other say that before a word is read. A single
 * landscape crop of two people standing together would have to cut one of
 * them at the shoulder on a phone; two portrait halves survive every width,
 * which is why they stay side by side on a phone rather than stacking.
 *
 * **The headline is set in capitals here, deliberately**, unlike `hero`. This
 * block is a poster and the line is a slogan the client wrote in capitals. The
 * line box is kept at 1.08 so the marks on Ă Â Î Ș Ț Ő Ű clear the line above.
 *
 * Like `homeHero`, the headline is three fields so the accent word is set in
 * the neon without anyone typing markup.
 */

export type DuoHeroImage = { image: string | null; alt: string };

export type DuoHeroData = {
  left: DuoHeroImage;
  right: DuoHeroImage;
  eyebrow: Translated;
  titleLead: Translated;
  titleAccent: Translated;
  titleRest: Translated;
  lead: Translated;
  primaryLabel: Translated;
  primaryHref: string;
  secondaryLabel: Translated;
  secondaryHref: string;
};

export function DuoHeroEditor({
  data,
  onChange,
}: BlockEditorProps<DuoHeroData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ImageField
          label={t("blocks.duoHero.left")}
          url={data.left?.image ?? null}
          alt={data.left?.alt ?? ""}
          onChange={({ url, alt }) =>
            onChange({ ...data, left: { image: url, alt } })
          }
        />
        <ImageField
          label={t("blocks.duoHero.right")}
          url={data.right?.image ?? null}
          alt={data.right?.alt ?? ""}
          onChange={({ url, alt }) =>
            onChange({ ...data, right: { image: url, alt } })
          }
        />
      </div>

      <TranslatedField
        label={t("blocks.duoHero.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <TranslatedField
          label={t("blocks.homeHero.titleLead")}
          value={data.titleLead ?? emptyTranslated()}
          onChange={(titleLead) => onChange({ ...data, titleLead })}
          required
        />
        <TranslatedField
          label={t("blocks.homeHero.titleAccent")}
          hint={t("blocks.homeHero.titleAccentHint")}
          value={data.titleAccent ?? emptyTranslated()}
          onChange={(titleAccent) => onChange({ ...data, titleAccent })}
        />
        <TranslatedField
          label={t("blocks.homeHero.titleRest")}
          value={data.titleRest ?? emptyTranslated()}
          onChange={(titleRest) => onChange({ ...data, titleRest })}
        />
      </div>

      <TranslatedField
        label={t("blocks.homeHero.lead")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={3}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.homeHero.primaryLabel")}
          value={data.primaryLabel ?? emptyTranslated()}
          onChange={(primaryLabel) => onChange({ ...data, primaryLabel })}
        />
        <LinkField
          label={t("blocks.homeHero.primaryHref")}
          value={data.primaryHref ?? ""}
          onChange={(primaryHref) => onChange({ ...data, primaryHref })}
        />
        <TranslatedField
          label={t("blocks.homeHero.secondaryLabel")}
          value={data.secondaryLabel ?? emptyTranslated()}
          onChange={(secondaryLabel) => onChange({ ...data, secondaryLabel })}
        />
        <LinkField
          label={t("blocks.homeHero.secondaryHref")}
          value={data.secondaryHref ?? ""}
          onChange={(secondaryHref) => onChange({ ...data, secondaryHref })}
        />
      </div>
    </div>
  );
}

export function DuoHeroRenderer({
  data,
  locale,
}: BlockRendererProps<DuoHeroData>) {
  const frames = [data.left, data.right].filter((frame) => frame?.image);

  const eyebrow = tr(data.eyebrow, locale);
  const accent = tr(data.titleAccent, locale);
  const lead = tr(data.lead, locale);
  const primary = tr(data.primaryLabel, locale);
  const secondary = tr(data.secondaryLabel, locale);

  return (
    // Edge to edge and the rest of the first screen: no frame, no margin, no
    // border — the two photographs are the page's opening, not a panel on it.
    // The heights are the fixed header's (4.5rem, 5.5rem from `md:`).
    <section className="relative isolate flex min-h-[calc(100svh-4.5rem)] flex-col justify-end overflow-hidden bg-ink-900 md:min-h-[calc(100svh-5.5rem)]">
      {/* The two frames, touching. One photograph fills the panel if the
            editor only gave one, rather than leaving a black half. */}
      <div
        className={`absolute inset-0 -z-20 grid ${frames.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {frames.map((frame, index) => (
          <div key={index} className="relative overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frame.image as string}
              alt={frame.alt || ""}
              fetchPriority="high"
              decoding="async"
              className="ken-burns absolute inset-0 h-full w-full object-cover object-top"
            />
          </div>
        ))}
      </div>

      <div aria-hidden className="absolute inset-0 -z-10 bg-ink-950/20" />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-gradient-to-t from-ink-950 via-ink-950/75 to-transparent"
      />

      <div className="site-container relative w-full pb-14 pt-40 text-center md:pb-20">
        {eyebrow && (
          <p
            className="hero-rise text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white"
            style={{ animationDelay: "80ms" }}
          >
            {eyebrow}
          </p>
        )}

        <h1
          className="hero-rise mx-auto mt-6 max-w-5xl font-head text-[clamp(2.1rem,6vw,5.5rem)] uppercase leading-[1.08] text-white"
          style={{ animationDelay: "160ms" }}
        >
          {tr(data.titleLead, locale)}{" "}
          {accent && (
            <>
              <em className="not-italic text-acid-500">{accent}</em>{" "}
            </>
          )}
          {tr(data.titleRest, locale)}
        </h1>

        {lead && (
          <p
            className="hero-rise mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg"
            style={{ animationDelay: "320ms" }}
          >
            {lead}
          </p>
        )}

        {(primary || secondary) && (
          <div
            className="hero-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "420ms" }}
          >
            {primary && data.primaryHref && (
              <CtaButton href={data.primaryHref}>{primary}</CtaButton>
            )}
            {secondary && data.secondaryHref && (
              <CtaButton href={data.secondaryHref} variant="outline">
                {secondary}
              </CtaButton>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export const duoHeroDefaults = (): DuoHeroData => ({
  left: { image: null, alt: "" },
  right: { image: null, alt: "" },
  eyebrow: emptyTranslated(),
  titleLead: emptyTranslated(),
  titleAccent: emptyTranslated(),
  titleRest: emptyTranslated(),
  lead: emptyTranslated(),
  primaryLabel: emptyTranslated(),
  primaryHref: "",
  secondaryLabel: emptyTranslated(),
  secondaryHref: "",
});
