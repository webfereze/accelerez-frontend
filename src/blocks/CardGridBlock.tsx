import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import LinkField from "@/components/ui/LinkField";
import Select from "@/components/ui/Select";
import ImageField from "@/components/ui/ImageField";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import SectionIntro from "@/components/public/SectionIntro";
import { useIsSideColumn } from "./column";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The grid of white cards the site leans on hardest — services, directions,
 * anything that is a set of equal things with a link each.
 *
 * **The cards are lighter than the page, and framed.** Warm paper ground, pure
 * white tiles, a hairline border and a soft radius — the same frame the hero
 * and the footer wear, so the page reads as one set of panels at three sizes.
 * No shadow: a shadow would make them float, and these are laid down.
 *
 * Each card is quiet at rest and ends in a bare arrow. On hover the tile lifts
 * its type and the arrow slides — nothing changes colour, because a grid of
 * tiles that all turn yellow on hover is a grid that shouts.
 *
 * Mobile-first: one card per row on a phone, two from `sm:`, then the chosen
 * count from `lg:`.
 */

export type CardGridData = {
  /** The small tracked-out line above the title. */
  eyebrow: Translated;
  title: Translated;
  /** The paragraph set beside the title, not under it. */
  lead: Translated;
  columns: 2 | 3 | 4;
  /** Cards without an image render as a compact text tile. */
  showImages: boolean;
  items: Array<{
    id: string;
    image: string | null;
    alt: string;
    heading: Translated;
    text: Translated;
    href: string;
  }>;
};

/**
 * Column counts are viewport breakpoints, so a block in the narrow side rail
 * would still get `md:`/`lg:` layouts on a wide screen — three cards crushed
 * into 320px. The rail is therefore forced to one column explicitly, using the
 * signal the block already has, rather than by measuring anything.
 */
const GRID: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

let counter = 0;
const nextId = () => `card-${Date.now().toString(36)}-${counter++}`;

const emptyCard = () => ({
  id: nextId(),
  image: null,
  alt: "",
  heading: emptyTranslated(),
  text: emptyTranslated(),
  href: "",
});

export function CardGridEditor({
  data,
  onChange,
}: BlockEditorProps<CardGridData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const update = (id: string, patch: Partial<CardGridData["items"][number]>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.eyebrow")}
        hint={t("blocks.eyebrowHint")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.cardGrid.heading")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />

      <TranslatedField
        label={t("blocks.lead")}
        hint={t("blocks.leadHint")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={2}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t("blocks.cardGrid.columns")}
          value={String(data.columns ?? 3)}
          onChange={(e) =>
            onChange({ ...data, columns: Number(e.target.value) as 2 | 3 | 4 })
          }
        >
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </Select>

        <label className="flex min-h-11 items-center gap-2.5 self-end text-sm text-ink-300">
          <input
            type="checkbox"
            checked={data.showImages ?? true}
            onChange={(e) => onChange({ ...data, showImages: e.target.checked })}
            className="h-5 w-5 rounded border-white/15 text-flare-500 focus:ring-flare-500"
          />
          {t("blocks.cardGrid.showImages")}
        </label>
      </div>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="rounded-lg border border-white/10 bg-ink-900/60 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {t("blocks.cardGrid.card", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    items: items.filter((i) => i.id !== item.id),
                  })
                }
                className="rounded p-1.5 text-ink-400 hover:bg-ink-900 hover:text-red-600"
                aria-label={t("blocks.cardGrid.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {data.showImages !== false && (
                <ImageField
                  label={t("blocks.cardGrid.image")}
                  url={item.image}
                  alt={item.alt}
                  onChange={({ url, alt }) =>
                    update(item.id, { image: url, alt })
                  }
                />
              )}
              <TranslatedField
                label={t("blocks.cardGrid.cardHeading")}
                value={item.heading ?? emptyTranslated()}
                onChange={(heading) => update(item.id, { heading })}
                required
              />
              <TranslatedField
                label={t("blocks.cardGrid.cardText")}
                value={item.text ?? emptyTranslated()}
                onChange={(text) => update(item.id, { text })}
                multiline
                rows={2}
              />
              <LinkField
                label={t("blocks.cardGrid.cardHref")}
                value={item.href ?? ""}
                onChange={(href) => update(item.id, { href })}
              />
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() => onChange({ ...data, items: [...items, emptyCard()] })}
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.cardGrid.add")}
      </Button>
    </div>
  );
}

export function CardGridRenderer({
  data,
  locale,
}: BlockRendererProps<CardGridData>) {
  const side = useIsSideColumn();
  const { t } = useTranslation("common");
  const items = (data.items ?? []).filter((item) => tr(item.heading, locale));

  if (!items.length) return null;

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        align={side ? "stack" : "split"}
        className="mb-12"
      />

      <ul className={clsx("grid gap-5", side ? "" : GRID[data.columns ?? 3])}>
        {items.map((item) => {
          const heading = tr(item.heading, locale);
          const text = tr(item.text, locale);
          const Wrapper = item.href ? "a" : "div";
          const linked = !!item.href;

          return (
            <li key={item.id}>
              <Wrapper
                {...(item.href ? { href: item.href } : {})}
                className={clsx(
                  "group relative flex h-full flex-col overflow-hidden rounded-card border border-white/10 bg-ink-900",
                  // The image sits flush to the tile's edges; the text gets the
                  // padding. A card with an image is therefore padded only
                  // below it, which is what stops the picture floating in a
                  // white frame.
                  linked && "transition-colors duration-300 hover:border-white/20",
                )}
              >
                {data.showImages !== false && item.image && (
                  <span className="block overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.alt || ""}
                      loading="lazy"
                      decoding="async"
                      className={clsx(
                        "h-52 w-full object-cover transition-transform duration-700 ease-out",
                        linked && "group-hover:scale-105",
                      )}
                    />
                  </span>
                )}

                <span className="flex flex-1 flex-col p-8 lg:p-10">
                  <span className="block font-head text-2xl text-ink-50 lg:text-[1.75rem]">
                    {heading}
                  </span>

                  {text && (
                    <span className="mt-3 block flex-1 text-[0.95rem] leading-relaxed text-ink-400">
                      {text}
                    </span>
                  )}

                  {item.href && (
                    // Decoration: the whole tile is already the link, so a
                    // second focusable anchor inside it would give a keyboard
                    // user two stops for one destination.
                    <span
                      aria-hidden
                      className="mt-8 inline-flex items-center text-ink-50"
                      title={t("blocks.cardGrid.open")}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-6 w-6 transition-transform duration-300 ease-out group-hover:translate-x-2 motion-reduce:transition-none"
                      >
                        <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="square" />
                      </svg>
                    </span>
                  )}
                </span>
              </Wrapper>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export const cardGridDefaults = (): CardGridData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  columns: 3,
  showImages: true,
  items: [emptyCard(), emptyCard(), emptyCard()],
});
