import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import ImageField from "@/components/ui/ImageField";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import CtaButton from "@/components/public/CtaButton";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Two photographs, side by side, each asking for one thing.
 *
 * **The page's fork in the road.** It is the block for the moment where a
 * visitor has read enough and there are exactly two ways on — a plan and a
 * conversation, nutrition and training — and neither is the smaller of the two.
 * That is why the panels are equal halves of the screen with nothing between
 * them: the composition *is* the argument that both doors are open.
 *
 * Deliberately **not** the `cta` block twice. That one is a single neon band
 * and its whole job is to be the one unmissable thing on a page; two of them
 * stacked would mean neither is. And deliberately not `imageStrip` with
 * buttons: a strip labels four things, this one asks for a decision between
 * two, so the type is centred and large and every panel carries a control.
 *
 * The words sit in the middle of the picture rather than at its foot, so each
 * half reads as its own small poster. That only survives a photograph with
 * something going on in it if the scrim is heaviest in the centre — a bottom-up
 * gradient copied from the strip leaves the title fighting the image.
 *
 * **The panel's group is named.** `CtaButton` starts its hover wipe on a bare
 * `group-hover:`, which matches *any* `group` ancestor — an unnamed group on
 * the panel meant the button filled in whenever the pointer was anywhere on
 * the photograph, which reads as a control firing by itself.
 *
 * Two panels is the design. Three still works; four is a strip and should be
 * one. On a phone they stack and each one gets a shorter frame, because a
 * full-height panel per half means two screens of scrolling to read two lines.
 */

export type SplitCtaItem = {
  id: string;
  image: string | null;
  alt: string;
  /** The small tracked-out line over the title. */
  eyebrow: Translated;
  title: Translated;
  ctaLabel: Translated;
  ctaHref: string;
};

export type SplitCtaData = {
  items: SplitCtaItem[];
};

let counter = 0;
const nextId = () => `split-${Date.now().toString(36)}-${counter++}`;

const emptyItem = (): SplitCtaItem => ({
  id: nextId(),
  image: null,
  alt: "",
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  ctaLabel: emptyTranslated(),
  ctaHref: "",
});

export function SplitCtaEditor({ data, onChange }: BlockEditorProps<SplitCtaData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const update = (id: string, patch: Partial<SplitCtaItem>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.splitCta.hint")}
      </p>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("blocks.splitCta.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...data, items: items.filter((i) => i.id !== item.id) })
                }
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                aria-label={t("blocks.splitCta.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <ImageField
                label={t("blocks.splitCta.image")}
                url={item.image}
                alt={item.alt}
                onChange={({ url, alt }) => update(item.id, { image: url, alt })}
              />
              <TranslatedField
                label={t("blocks.splitCta.eyebrow")}
                value={item.eyebrow ?? emptyTranslated()}
                onChange={(eyebrow) => update(item.id, { eyebrow })}
              />
              <TranslatedField
                label={t("blocks.splitCta.itemTitle")}
                value={item.title ?? emptyTranslated()}
                onChange={(title) => update(item.id, { title })}
                required
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <TranslatedField
                  label={t("blocks.splitCta.ctaLabel")}
                  value={item.ctaLabel ?? emptyTranslated()}
                  onChange={(ctaLabel) => update(item.id, { ctaLabel })}
                />
                <LinkField
                  label={t("blocks.splitCta.ctaHref")}
                  value={item.ctaHref ?? ""}
                  onChange={(ctaHref) => update(item.id, { ctaHref })}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() => onChange({ ...data, items: [...items, emptyItem()] })}
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.splitCta.add")}
      </Button>
    </div>
  );
}

/**
 * Written out rather than interpolated: Tailwind reads the class names out of
 * the source, so `md:grid-cols-${n}` compiles to no CSS at all and the panels
 * stack on every screen.
 */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-3",
};

export function SplitCtaRenderer({ data, locale }: BlockRendererProps<SplitCtaData>) {
  // A panel with no picture is a black rectangle with a heading in it, and one
  // with no heading is a photograph nobody can act on. Both are dropped rather
  // than rendered half-built.
  const items = (data.items ?? []).filter((item) => item.image && tr(item.title, locale));
  if (!items.length) return null;

  return (
    <section className={`grid ${COLUMNS[Math.min(items.length, 3)] ?? COLUMNS[3]}`}>
      {items.map((item) => {
        const eyebrow = tr(item.eyebrow, locale);
        const label = tr(item.ctaLabel, locale);

        return (
          <div
            key={item.id}
            className="group/panel relative isolate flex min-h-[26rem] items-center justify-center overflow-hidden bg-ink-900 px-6 py-20 text-center sm:px-10 lg:min-h-[34rem]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image ?? ""}
              alt={item.alt || ""}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover/panel:scale-105 motion-reduce:transition-none motion-reduce:group-hover/panel:scale-100"
            />

            {/* Heaviest in the middle, where the words are — see the note above. */}
            <span
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/45 via-ink-950/65 to-ink-950/45"
            />

            <div className="max-w-md">
              {eyebrow && (
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/75">
                  {eyebrow}
                </p>
              )}

              <h2 className="mt-5 font-head text-[2.25rem] leading-[1.05] text-white sm:text-5xl">
                {tr(item.title, locale)}
              </h2>

              {label && item.ctaHref && (
                <CtaButton href={item.ctaHref} variant="outline" className="mt-9">
                  {label}
                </CtaButton>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export const splitCtaDefaults = (): SplitCtaData => ({
  items: [emptyItem(), emptyItem()],
});
