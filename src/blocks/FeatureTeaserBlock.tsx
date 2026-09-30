import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import ImageField from "@/components/ui/ImageField";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import CtaButton from "@/components/public/CtaButton";
import Reveal from "@/components/public/Reveal";
import { BLOCK_ICON_KEYS, iconFor } from "./icons";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A picture beside a heading and a short list of reasons.
 *
 * The workhorse "who we are / why here" section. It differs from `mediaText` in
 * that the right-hand column is **structured** — each point has an icon, a
 * name and a sentence — which is what keeps three reasons from becoming one
 * paragraph nobody reads.
 *
 * **The heading is split in two.** `title` sets in near-black and `titleAccent`
 * follows it in the accent, which is the one place the site lets a heading carry
 * colour. Two fields rather than markup in one: an editor pasting
 * `<span class="text-acid-400">` into a translated string is how a CMS starts
 * storing HTML it cannot validate.
 */

export type FeatureItem = {
  id: string;
  icon: string;
  title: Translated;
  text: Translated;
};

export type FeatureTeaserData = {
  image: string | null;
  alt: string;
  /** Picture left or right of the words. */
  position: "left" | "right";
  eyebrow: Translated;
  title: Translated;
  /** Continues the heading, set in the accent. */
  titleAccent: Translated;
  text: Translated;
  items: FeatureItem[];
  ctaLabel: Translated;
  ctaHref: string;
  /** A single figure beside the button — "25 de ani", "3.5k vizitatori". */
  /** The dark slab laid over the picture's corner. */
  caption: Translated;
  statValue: string;
  statLabel: Translated;
};

export function FeatureTeaserEditor({
  data,
  onChange,
}: BlockEditorProps<FeatureTeaserData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const setItem = (id: string, changes: Partial<FeatureItem>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    });

  return (
    <div className="space-y-4">
      <ImageField
        label={t("blocks.featureTeaser.image")}
        url={data.image ?? null}
        alt={data.alt ?? ""}
        onChange={({ url, alt }) => onChange({ ...data, image: url, alt })}
      />

      <Select
        label={t("blocks.featureTeaser.position")}
        value={data.position ?? "left"}
        onChange={(event) =>
          onChange({ ...data, position: event.target.value as "left" | "right" })
        }
      >
        <option value="left">{t("blocks.featureTeaser.positionLeft")}</option>
        <option value="right">{t("blocks.featureTeaser.positionRight")}</option>
      </Select>

      <TranslatedField
        label={t("blocks.featureTeaser.caption")}
        hint={t("blocks.featureTeaser.captionHint")}
        value={data.caption ?? emptyTranslated()}
        onChange={(caption) => onChange({ ...data, caption })}
      />

      <TranslatedField
        label={t("blocks.featureTeaser.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.featureTeaser.title")}
          value={data.title ?? emptyTranslated()}
          onChange={(title) => onChange({ ...data, title })}
          required
        />
        <TranslatedField
          label={t("blocks.featureTeaser.titleAccent")}
          hint={t("blocks.featureTeaser.titleAccentHint")}
          value={data.titleAccent ?? emptyTranslated()}
          onChange={(titleAccent) => onChange({ ...data, titleAccent })}
        />
      </div>

      <TranslatedField
        label={t("blocks.featureTeaser.text")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={3}
      />

      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-semibold text-gray-900">
          {t("blocks.featureTeaser.items")}
        </legend>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-200 p-3">
              <div className="grid gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
                <Select
                  label={t("blocks.featureTeaser.icon")}
                  value={item.icon}
                  onChange={(event) => setItem(item.id, { icon: event.target.value })}
                >
                  {BLOCK_ICON_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {t(`blocks.icon.${key}`)}
                    </option>
                  ))}
                </Select>
                <TranslatedField
                  label={t("blocks.featureTeaser.itemTitle")}
                  value={item.title ?? emptyTranslated()}
                  onChange={(title) => setItem(item.id, { title })}
                />
                <Button
                  variant="ghost"
                  aria-label={t("common.remove")}
                  className="self-end"
                  onClick={() =>
                    onChange({ ...data, items: items.filter((i) => i.id !== item.id) })
                  }
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                </Button>
              </div>

              <div className="mt-3">
                <TranslatedField
                  label={t("blocks.featureTeaser.itemText")}
                  value={item.text ?? emptyTranslated()}
                  onChange={(text) => setItem(item.id, { text })}
                  multiline
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Four is where the column stops being a list and becomes a page. */}
        {items.length < 4 && (
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() =>
              onChange({
                ...data,
                items: [
                  ...items,
                  {
                    id: `feature-${Date.now().toString(36)}`,
                    icon: "sparkles",
                    title: emptyTranslated(),
                    text: emptyTranslated(),
                  },
                ],
              })
            }
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            {t("blocks.featureTeaser.addItem")}
          </Button>
        )}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.featureTeaser.ctaLabel")}
          value={data.ctaLabel ?? emptyTranslated()}
          onChange={(ctaLabel) => onChange({ ...data, ctaLabel })}
        />
        <LinkField
          label={t("blocks.featureTeaser.ctaHref")}
          value={data.ctaHref ?? ""}
          onChange={(ctaHref) => onChange({ ...data, ctaHref })}
        />
      </div>
    </div>
  );
}

export function FeatureTeaserRenderer({
  data,
  locale,
}: BlockRendererProps<FeatureTeaserData>) {
  const title = tr(data.title, locale);
  const accent = tr(data.titleAccent, locale);
  const eyebrow = tr(data.eyebrow, locale);
  const text = tr(data.text, locale);
  const caption = tr(data.caption, locale);
  const ctaLabel = tr(data.ctaLabel, locale);
  const statLabel = tr(data.statLabel, locale);
  const items = data.items ?? [];

  if (!title) return null;

  const pictureRight = (data.position ?? "left") === "right";

  return (
    <section className="relative grid items-center gap-14 [overflow:clip] lg:grid-cols-2 lg:gap-20">
      {data.image && (
        <Reveal className={clsx("relative min-w-0", pictureRight && "lg:order-2")}>
          <div className="overflow-hidden rounded-panel bg-ink-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.image}
              alt={data.alt ?? ""}
              loading="lazy"
              className="aspect-[4/5] w-full object-cover md:aspect-[3/4]"
            />
          </div>

          {/* A near-black slab laid over the picture's lower corner, the way a
              caption is set into a printed page. It overlaps deliberately: the
              overlap is what makes two flat rectangles read as one composition
              rather than as a picture with a box under it. */}
          {caption && (
            <p className="absolute bottom-0 right-0 max-w-[16rem] rounded-card bg-ink-950 px-8 py-7 font-head text-3xl leading-[1.08] text-white sm:translate-x-6 sm:translate-y-6 lg:text-4xl">
              {caption}
            </p>
          )}
        </Reveal>
      )}

      <Reveal className={clsx("min-w-0", pictureRight && "lg:order-1")}>
        {eyebrow && (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-300">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-6 font-head text-[2.5rem] text-ink-50 lg:text-6xl">
          {title}
          {accent && <span className="text-acid-400"> {accent}</span>}
        </h2>

        {text && (
          <p className="mt-7 max-w-lg text-[1.05rem] leading-[1.8] text-ink-400">{text}</p>
        )}

        {items.length > 0 && (
          // Numbered and ruled, not bulleted with an icon in a circle. The
          // number is the reference's device and it does real work: it says
          // these are steps in an order, which is exactly the claim an agency's
          // "how we think" list is making.
          <ol className="mt-10 border-t border-white/15">
            {items.map((item, index) => (
              <Reveal
                as="li"
                key={item.id}
                delay={index * 70}
                className="flex items-baseline gap-6 border-b border-white/15 py-6"
              >
                <span
                  aria-hidden
                  className="font-head text-lg tabular-nums text-ink-50"
                >
                  {String(index + 1).padStart(2, "0")}.
                </span>
                <span className="min-w-0">
                  <span className="block font-head text-xl text-ink-50">
                    {tr(item.title, locale)}
                  </span>
                  {tr(item.text, locale) && (
                    <span className="mt-1.5 block text-[0.95rem] leading-relaxed text-ink-400">
                      {tr(item.text, locale)}
                    </span>
                  )}
                </span>
              </Reveal>
            ))}
          </ol>
        )}

        {(ctaLabel || data.statValue) && (
          <div className="mt-10 flex flex-wrap items-center gap-8">
            {ctaLabel && data.ctaHref && (
              <CtaButton href={data.ctaHref} arrow={false}>
                {ctaLabel}
              </CtaButton>
            )}

            {data.statValue && (
              <p className="flex items-baseline gap-2">
                <span className="font-head text-4xl text-ink-50">{data.statValue}</span>
                {statLabel && (
                  <span className="max-w-[10rem] text-xs font-semibold uppercase leading-tight tracking-wide text-ink-400">
                    {statLabel}
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </Reveal>
    </section>
  );
}

export const featureTeaserDefaults = (): FeatureTeaserData => ({
  caption: emptyTranslated(),
  image: null,
  alt: "",
  position: "left",
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  titleAccent: emptyTranslated(),
  text: emptyTranslated(),
  items: [],
  ctaLabel: emptyTranslated(),
  ctaHref: "",
  statValue: "",
  statLabel: emptyTranslated(),
});
