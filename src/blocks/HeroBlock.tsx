import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import Select from "@/components/ui/Select";
import ImageField from "@/components/ui/ImageField";
import LinkField from "@/components/ui/LinkField";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import CtaButton from "@/components/public/CtaButton";
import SocialLinks from "@/components/public/SocialLinks";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The banner that opens a page.
 *
 * The hero is the one block that is **never** placed in the page container: it
 * runs edge to edge and, by default, fills the viewport. `BlockRenderer`
 * special-cases it, and the width toggle other blocks carry is hidden for it —
 * a hero inside a 1280px column is not a hero.
 *
 * **The headline is set in the serif, in sentence case.** Uppercase at display
 * size is the default every destination template reaches for, and it costs the
 * diacritics their room — Ă Â Î Ș Ț all carry marks that a tight uppercase line
 * clips. Sentence case in Fraunces reads as a magazine cover rather than a
 * poster, which is the whole direction of this site.
 *
 * It leads with motion where there is any: an optional looping clip, with the
 * image as its poster so nothing is ever blank, and the still shown instead to
 * anyone who asked their system for less motion.
 *
 * Accessibility: text sits on a two-stop scrim rather than directly on the
 * picture, so white type clears contrast over any frame; the media is
 * decorative and the words are real HTML.
 */

export type HeroData = {
  image: string | null;
  alt: string;
  /** Optional looping clip. The image becomes its poster. */
  video: string;
  eyebrow: Translated;
  title: Translated;
  subtitle: Translated;
  primaryLabel: Translated;
  primaryHref: string;
  secondaryLabel: Translated;
  secondaryHref: string;
  height: "full" | "tall" | "compact";
  align: "left" | "center";
};

/**
 * `svh` — the *small* viewport height — is deliberate: `vh` measures the
 * viewport with mobile browser chrome hidden, so a `100vh` hero has its
 * call-to-action buttons pushed under the address bar until the user scrolls.
 */
/**
 * Heights, minus the header **and** the frame the panel sits in.
 *
 * "Full" means "the rest of the first screen, with the white margin showing on
 * every side" — so it subtracts the fixed header above it and *twice* the frame
 * inset, once for the gap above the panel and once for the gap below it. Miss
 * the second and the panel runs exactly to the fold, which looks like the page
 * was cut rather than framed.
 *
 * The numbers are the header's own heights (4.5rem, 5.5rem from `md:`) and a
 * little more than twice the frame inset — the extra quarter is so the margin
 * below the panel is *visibly* a margin rather than a hairline, which at
 * exactly twice the inset is what it looked like. They are duplicated here
 * because CSS cannot read another rule's padding; if either changes, so does
 * this.
 *
 * `svh` rather than `vh`: on a phone `vh` is measured against the browser
 * chrome's *collapsed* state, so a `100vh` panel is taller than the screen on
 * first paint and the bottom margin is scrolled off anyway.
 */
const HEIGHTS: Record<HeroData["height"], string> = {
  full: "min-h-[calc(100svh-4.5rem-2rem)] md:min-h-[calc(100svh-5.5rem-3rem)]",
  tall: "min-h-[70svh]",
  compact: "min-h-[54svh]",
};

export function HeroEditor({ data, onChange }: BlockEditorProps<HeroData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <ImageField
        label={t("blocks.hero.image")}
        url={data.image ?? null}
        alt={data.alt ?? ""}
        onChange={({ url, alt }) => onChange({ ...data, image: url, alt })}
      />

      <Input
        label={t("blocks.hero.video")}
        hint={t("blocks.hero.videoHint")}
        placeholder="https://…/tura.mp4"
        value={data.video ?? ""}
        onChange={(e) => onChange({ ...data, video: e.target.value })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t("blocks.hero.height")}
          value={data.height ?? "full"}
          onChange={(e) =>
            onChange({ ...data, height: e.target.value as HeroData["height"] })
          }
        >
          <option value="full">{t("blocks.hero.heightFull")}</option>
          <option value="tall">{t("blocks.hero.heightTall")}</option>
          <option value="compact">{t("blocks.hero.heightCompact")}</option>
        </Select>

        <Select
          label={t("blocks.hero.align")}
          value={data.align ?? "left"}
          onChange={(e) =>
            onChange({ ...data, align: e.target.value as HeroData["align"] })
          }
        >
          <option value="left">{t("blocks.hero.alignLeft")}</option>
          <option value="center">{t("blocks.hero.alignCenter")}</option>
        </Select>
      </div>

      <TranslatedField
        label={t("blocks.hero.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.hero.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <TranslatedField
        label={t("blocks.hero.subtitle")}
        value={data.subtitle ?? emptyTranslated()}
        onChange={(subtitle) => onChange({ ...data, subtitle })}
        multiline
        rows={2}
      />

      <div className="rounded-lg border border-white/10 bg-ink-900/60 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          {t("blocks.hero.primaryCta")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TranslatedField
            label={t("blocks.hero.ctaLabel")}
            value={data.primaryLabel ?? emptyTranslated()}
            onChange={(primaryLabel) => onChange({ ...data, primaryLabel })}
          />
          <LinkField
            label={t("blocks.hero.ctaHref")}
            value={data.primaryHref ?? ""}
            onChange={(primaryHref) => onChange({ ...data, primaryHref })}
          />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-ink-900/60 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          {t("blocks.hero.secondaryCta")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TranslatedField
            label={t("blocks.hero.ctaLabel")}
            value={data.secondaryLabel ?? emptyTranslated()}
            onChange={(secondaryLabel) => onChange({ ...data, secondaryLabel })}
          />
          <LinkField
            label={t("blocks.hero.ctaHref")}
            value={data.secondaryHref ?? ""}
            onChange={(secondaryHref) => onChange({ ...data, secondaryHref })}
          />
        </div>
      </div>
    </div>
  );
}

export function HeroRenderer({ data, locale }: BlockRendererProps<HeroData>) {
  const { t } = useTranslation("common");

  const eyebrow = tr(data.eyebrow, locale);
  const title = tr(data.title, locale);
  const subtitle = tr(data.subtitle, locale);
  const primary = tr(data.primaryLabel, locale);
  const secondary = tr(data.secondaryLabel, locale);
  const centered = data.align === "center";

  // Each word rises on its own beat — the headline arrives, it doesn't appear.
  const words = title.split(" ").filter(Boolean);
  const settled = 260 + words.length * 70;

  return (
    // The frame: the hero is a **panel laid on the page**, not a band that
    // bleeds to the glass. The white margin around it is what separates it
    // from the header above, and the radius is what makes it an object rather
    // than a section — which is the whole point of not floating the navigation
    // over it any more.
    <div data-hero className="framed pb-3 pt-3 md:pb-5 md:pt-5">
      <section
        className={clsx(
          "site-container relative isolate flex flex-col justify-center overflow-hidden rounded-panel bg-ink-900 ring-1 ring-white/70",
          HEIGHTS[data.height ?? "full"],
        )}
      >
      {/* --- Backdrop ---------------------------------------------------- */}
      {data.video ? (
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden"
          poster={data.image ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          // The clip is decoration; the words are in the HTML above it.
          aria-hidden
        >
          <source src={data.video} />
        </video>
      ) : null}

      {data.image && (
        // Shown when there is no clip, and as the still for anyone who asked
        // for reduced motion. `ken-burns` drifts almost imperceptibly, which
        // reads as "this is footage" without ever demanding attention.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.image}
          alt={data.alt || ""}
          /**
           * The LCP element on almost every page that has a hero — it is
           * full-bleed and the height of the viewport, so nothing else comes
           * close.
           *
           * It was already in the server-rendered HTML, so the browser could
           * always *find* it; what it did not know is that this one matters
           * more than the fonts and scripts queued alongside it.
           *
           * Dropped to `low` when a video will cover it: then this is only the
           * poster behind a clip, and competing with the video it is about to
           * be hidden by makes both slower.
           */
          fetchPriority={data.video ? "low" : "high"}
          decoding="async"
          className={clsx(
            "absolute inset-0 -z-20 h-full w-full object-cover",
            data.video ? "hidden motion-reduce:block" : "ken-burns",
          )}
        />
      )}

      {!data.image && !data.video && (
        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-[radial-gradient(120%_90%_at_15%_0%,var(--color-acid-400)_0%,var(--color-ink-950)_60%)]"
        />
      )}

      {/* Two stops, not one: a broad wash keeps the whole frame legible, and a
          heavier foot anchors the type where it actually sits. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-ink-950/35"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent"
      />

      {/* --- Words -------------------------------------------------------- */}
      <div className="relative w-full px-8 pb-20 pt-24 md:px-14 lg:px-20">
        <div className="max-w-3xl">
          {eyebrow && (
            <p
              /* Tracked-out capitals, not a frosted chip. The whole design is
                 flat planes and bare type; a glass pill over a photograph is
                 the one piece of chrome that would give it away as a template.
                 It stays legible because the scrim below already darkens the
                 frame — the pill was solving a problem the gradient solves. */
              className="hero-rise text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white"
              style={{ animationDelay: "80ms" }}
            >
              {eyebrow}
            </p>
          )}

          {title && (
            <h1
              className={clsx(
                // `leading-[1.06]`, not the tighter setting a display face
                // invites: these are Romanian and Hungarian capitals, and
                // Ă Â Î Ș Ț Ő Ű all carry marks above cap height. A line box
                // shorter than the accents clips them, and a headline missing
                // its diacritics is a spelling mistake, not a style.
                "mt-7 font-head leading-[1.02] text-white",
                // Fluid rather than stepped: the headline is the page, and it
                // should fit its line at every width, not at four of them.
                "text-[clamp(2.25rem,6.2vw,5.25rem)]",
              )}
            >
              {words.map((word, index) => (
                // The mask the word rises out of is extended upward by the
                // padding and pulled back by the matching negative margin, so
                // it has room for the accents without moving the line.
                <span
                  key={`${word}-${index}`}
                  className="-mt-[0.18em] inline-block overflow-hidden pt-[0.18em] align-bottom"
                >
                  <span
                    className="hero-rise inline-block"
                    style={{ animationDelay: `${140 + index * 70}ms` }}
                  >
                    {word}
                    {index < words.length - 1 ? " " : ""}
                  </span>
                </span>
              ))}
            </h1>
          )}

          {subtitle && (
            <p
              className="hero-rise mt-7 max-w-xl text-base leading-relaxed text-ink-200 sm:text-lg"
              style={{ animationDelay: `${settled}ms` }}
            >
              {subtitle}
            </p>
          )}

          {(primary || secondary) && (
            <div
              className="hero-rise mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
              style={{ animationDelay: `${settled + 90}ms` }}
            >
              {primary && data.primaryHref && (
                <CtaButton href={data.primaryHref}>
                  {primary}
                </CtaButton>
              )}
              {secondary && data.secondaryHref && (
                <CtaButton href={data.secondaryHref} variant="outline" onDark>
                  {secondary}
                </CtaButton>
              )}
            </div>
          )}

        </div>
      </div>

      {/* A rail down the right edge: the profiles, then the scroll cue set
          vertically against a hairline — the reference's arrangement, and it
          keeps the left half of the frame clear for the headline. */}
      <div className="pointer-events-none absolute inset-y-0 right-6 hidden flex-col items-center justify-center gap-10 md:right-10 md:flex">
        <SocialLinks
          onDark
          size="sm"
          className="hero-rise pointer-events-auto flex-col"
          style={{ animationDelay: `${settled + 180}ms` }}
        />
      </div>

      <span
        aria-hidden
        className="absolute bottom-0 right-6 hidden flex-col items-center gap-3 md:right-12 md:flex"
      >
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/70 [writing-mode:vertical-rl]">
          {t("blocks.hero.scrollCue")}
        </span>
          <span className="hero-cue h-16 w-px bg-gradient-to-b from-white/60 to-transparent" />
        </span>
      </section>
    </div>
  );
}


export const heroDefaults = (): HeroData => ({
  image: null,
  alt: "",
  video: "",
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  subtitle: emptyTranslated(),
  primaryLabel: emptyTranslated(),
  primaryHref: "",
  secondaryLabel: emptyTranslated(),
  secondaryHref: "",
  height: "full",
  align: "left",
});
