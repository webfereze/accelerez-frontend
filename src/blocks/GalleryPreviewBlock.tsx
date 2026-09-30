import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import ImageField from "@/components/ui/ImageField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import Lightbox from "@/components/public/Lightbox";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { GalleryImage } from "./GalleryBlock";
import { useIsSideColumn } from "./column";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A strip of photographs that stands in for a larger set.
 *
 * Distinct from `gallery`, which shows everything it holds. This shows a few
 * and says how many more there are — the shape a page wants when the photos are
 * supporting evidence rather than the point of the section, and the reason the
 * two are separate blocks rather than one with a mode switch.
 *
 * **The overflow tile opens at itself, not at the beginning.** Clicking "+12"
 * on the fifth thumbnail and landing on the first image loses the place the
 * visitor had just chosen.
 *
 * The images are the same shape as the gallery's, and both open the same
 * `Lightbox` — a second viewer would drift from the first on exactly the
 * details nobody re-tests.
 */

export type GalleryPreviewData = {
  title: Translated;
  /** Thumbnails shown before the rest collapse into a "+X" tile. */
  visible: number;
  images: GalleryImage[];
};

/**
 * Written out rather than built from a template literal: Tailwind reads these
 * files as text, so a class assembled at runtime is a class it never generates.
 */
const LG_COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
};

/** The editor offers these; anything else is clamped into range on render. */
const CHOICES = [2, 3, 4, 5, 6];

export function GalleryPreviewEditor({
  data,
  onChange,
}: BlockEditorProps<GalleryPreviewData>) {
  const { t } = useTranslation("common");
  const images = data.images ?? [];

  const update = (id: string, patch: Partial<GalleryImage>) =>
    onChange({
      ...data,
      images: images.map((image) =>
        image.id === id ? { ...image, ...patch } : image,
      ),
    });

  const add = () =>
    onChange({
      ...data,
      images: [
        ...images,
        {
          id: `img-${Date.now().toString(36)}-${images.length}`,
          url: "",
          alt: "",
          caption: "",
        },
      ],
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.galleryPreview.title")}
          value={data.title ?? emptyTranslated()}
          onChange={(title) => onChange({ ...data, title })}
        />
        <Select
          label={t("blocks.galleryPreview.visible")}
          hint={t("blocks.galleryPreview.visibleHint")}
          value={String(data.visible ?? 5)}
          onChange={(e) => onChange({ ...data, visible: Number(e.target.value) })}
        >
          {CHOICES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>

      <ul className="space-y-3">
        {images.map((image, index) => (
          <li
            key={image.id}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {index + 1}
              </span>
              <button
                type="button"
                aria-label={t("common.delete")}
                onClick={() =>
                  onChange({
                    ...data,
                    images: images.filter((i) => i.id !== image.id),
                  })
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-ink-900 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            {/* `ImageField` carries the alt text with the file — the two
                belong together, and a separate alt input is one an editor
                fills in for the wrong picture after reordering. */}
            <ImageField
              label={t("blocks.galleryPreview.image")}
              url={image.url || null}
              alt={image.alt}
              onChange={({ url, alt }) =>
                update(image.id, { url: url ?? "", alt })
              }
            />

            <Input
              label={t("blocks.galleryPreview.caption")}
              value={image.caption}
              onChange={(e) => update(image.id, { caption: e.target.value })}
              hint={t("blocks.galleryPreview.captionHint")}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 text-sm text-slate-600 hover:border-slate-400 hover:text-slate-900"
      >
        <PlusIcon className="h-4 w-4" />
        {t("blocks.galleryPreview.add")}
      </button>
    </div>
  );
}

export function GalleryPreviewRenderer({
  data,
  locale,
}: BlockRendererProps<GalleryPreviewData>) {
  const side = useIsSideColumn();
  const [open, setOpen] = useState<number | null>(null);

  const images = (data.images ?? []).filter((image) => image.url);
  const title = tr(data.title, locale);

  if (!images.length) return null;

  // Clamped rather than trusted: the value is editor data and may predate a
  // change to what the editor offers.
  const visible = Math.min(Math.max(data.visible ?? 5, 2), 6);
  const shown = images.slice(0, visible);
  const hidden = images.length - shown.length;

  // In the 320px rail two columns is all that fits, whatever the block asks
  // for — breakpoints measure the window, not the column.
  const columns = side ? "grid-cols-2" : clsx("grid-cols-2 sm:grid-cols-3", LG_COLUMNS[visible]);

  return (
    <section>
      {title && <h2 className="mb-7 font-head text-2xl leading-tight tracking-tight text-ink-50 md:text-4xl">{title}</h2>}

      <ul className={clsx("grid gap-3", columns)}>
        {shown.map((image, index) => {
          // The overflow count rides on the last visible tile rather than
          // adding a tile of its own, which would push a photo out to make room
          // for a label about the photos.
          const isOverflow = hidden > 0 && index === shown.length - 1;

          return (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setOpen(index)}
                className="group relative block w-full overflow-hidden rounded-xl bg-ink-800 focus:outline-2 focus:outline-offset-2 focus:outline-acid-500"
              >
                <span className="block aspect-square">
                  <Image
                    src={image.url}
                    alt={isOverflow ? "" : image.alt || image.caption || ""}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </span>

                {isOverflow ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink-950/60 font-head text-xl text-white transition-colors group-hover:bg-ink-950/70">
                    +{hidden}
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-ink-950/0 transition-colors group-hover:bg-ink-950/20"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <Lightbox
        images={images}
        index={open}
        onIndexChange={setOpen}
        onClose={() => setOpen(null)}
        label={title || undefined}
      />
    </section>
  );
}

export const galleryPreviewDefaults = (): GalleryPreviewData => ({
  title: emptyTranslated(),
  visible: 5,
  images: [],
});
