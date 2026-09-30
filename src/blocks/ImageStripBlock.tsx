import { useTranslation } from "next-i18next/pages";
import Link from "next/link";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import ImageField from "@/components/ui/ImageField";
import LinkField from "@/components/ui/LinkField";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A row of pictures, edge to edge, each with a word laid over it.
 *
 * **The whole width, no gaps, no captions underneath.** It is the one block
 * that gives a page a photographic break, and it only works if the pictures
 * touch: a grid with gutters reads as a gallery, while a strip reads as a
 * single band of imagery with labels on it — which is what the design uses it
 * for, to name the disciplines without writing a paragraph about any of them.
 *
 * The type sits bottom-left over a gradient that is heaviest exactly where the
 * words are. A flat scrim over each whole picture would grey out the two-thirds
 * nothing sits on, and these are meant to be photographs.
 *
 * Deliberately **not** a card grid with images: the cards there are white tiles
 * that happen to have pictures, and merging the two would mean one component
 * with a `variant` prop deciding between two art directions.
 *
 * They stack two-up on a phone and one-up below that — four 90px-wide
 * photographs in a row is four illegible smudges.
 */

export type ImageStripItem = {
  id: string;
  image: string | null;
  alt: string;
  title: Translated;
  text: Translated;
  href: string;
};

export type ImageStripData = {
  items: ImageStripItem[];
};

let counter = 0;
const nextId = () => `strip-${Date.now().toString(36)}-${counter++}`;

const emptyItem = (): ImageStripItem => ({
  id: nextId(),
  image: null,
  alt: "",
  title: emptyTranslated(),
  text: emptyTranslated(),
  href: "",
});

export function ImageStripEditor({ data, onChange }: BlockEditorProps<ImageStripData>) {
  const { t } = useTranslation("common");
  const items = data.items ?? [];

  const update = (id: string, patch: Partial<ImageStripItem>) =>
    onChange({
      ...data,
      items: items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.imageStrip.hint")}
      </p>

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("blocks.imageStrip.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({ ...data, items: items.filter((i) => i.id !== item.id) })
                }
                className="rounded p-1.5 text-gray-400 hover:bg-ink-900 hover:text-red-600"
                aria-label={t("blocks.imageStrip.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <ImageField
                label={t("blocks.imageStrip.image")}
                url={item.image}
                alt={item.alt}
                onChange={({ url, alt }) => update(item.id, { image: url, alt })}
              />
              <TranslatedField
                label={t("blocks.imageStrip.itemTitle")}
                value={item.title ?? emptyTranslated()}
                onChange={(title) => update(item.id, { title })}
                required
              />
              <TranslatedField
                label={t("blocks.imageStrip.itemText")}
                value={item.text ?? emptyTranslated()}
                onChange={(text) => update(item.id, { text })}
              />
              <LinkField
                label={t("blocks.imageStrip.href")}
                value={item.href ?? ""}
                onChange={(href) => update(item.id, { href })}
              />
            </div>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() => onChange({ ...data, items: [...items, emptyItem()] })}
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.imageStrip.add")}
      </Button>
    </div>
  );
}

export function ImageStripRenderer({ data, locale }: BlockRendererProps<ImageStripData>) {
  const items = (data.items ?? []).filter((item) => item.image && tr(item.title, locale));
  if (!items.length) return null;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const title = tr(item.title, locale);
        const text = tr(item.text, locale);
        // Split rather than a `Wrapper` variable: `next/link` requires an
        // `href`, so a conditional spread leaves TypeScript unable to prove the
        // element it is building is a valid link.
        const className =
          "group relative isolate block aspect-[3/4] overflow-hidden bg-ink-900";

        const body = (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image ?? ""}
              alt={item.alt || ""}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />

            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent"
            />

            <span className="absolute inset-x-0 bottom-0 p-7 lg:p-9">
              <span className="block font-head text-3xl text-white lg:text-4xl">
                {title}
              </span>
              {text && (
                <span className="mt-2 block text-[0.95rem] text-ink-200">{text}</span>
              )}
            </span>
          </>
        );

        return item.href ? (
          <Link key={item.id} href={item.href} className={className}>
            {body}
          </Link>
        ) : (
          <div key={item.id} className={className}>
            {body}
          </div>
        );
      })}
    </section>
  );
}

export const imageStripDefaults = (): ImageStripData => ({
  items: [emptyItem(), emptyItem(), emptyItem(), emptyItem()],
});
