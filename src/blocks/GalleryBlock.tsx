import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ArrowsPointingOutIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ImageField from "@/components/ui/ImageField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import Lightbox from "@/components/public/Lightbox";
import { useIsSideColumn } from "./column";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A photo gallery with a lightbox.
 *
 * The captions are plain strings rather than translated objects: a photo
 * caption is usually a place name ("Poiana Zânelor"), and asking an editor to
 * write the same proper noun three times is how galleries end up half
 * translated. Anything that genuinely needs translating goes in the title.
 */

export type GalleryImage = {
  id: string;
  url: string;
  alt: string;
  caption: string;
};

export type GalleryData = {
  title: Translated;
  columns: 2 | 3 | 4;
  images: GalleryImage[];
};

/**
 * Column counts are viewport breakpoints, so a block in the narrow side rail
 * would still get `md:`/`lg:` layouts on a wide screen — three cards crushed
 * into 320px. The rail is therefore forced to one column explicitly, using the
 * signal the block already has, rather than by measuring anything.
 */
const COLUMN_CLASS: Record<GalleryData["columns"], string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 md:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function GalleryEditor({ data, onChange }: BlockEditorProps<GalleryData>) {
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
          label={t("blocks.gallery.title")}
          value={data.title ?? emptyTranslated()}
          onChange={(title) => onChange({ ...data, title })}
        />
        <Select
          label={t("blocks.gallery.columns")}
          value={String(data.columns ?? 3)}
          onChange={(e) =>
            onChange({
              ...data,
              columns: Number(e.target.value) as GalleryData["columns"],
            })
          }
        >
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </Select>
      </div>

      <ul className="space-y-3">
        {images.map((image, index) => (
          <li
            key={image.id}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("blocks.gallery.image", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    images: images.filter((i) => i.id !== image.id),
                  })
                }
                aria-label={t("blocks.gallery.remove", { index: index + 1 })}
                className="rounded p-1.5 text-slate-400 hover:bg-ink-900 hover:text-red-600"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <ImageField
              label={t("blocks.gallery.file")}
              url={image.url || null}
              alt={image.alt}
              onChange={({ url, alt }) =>
                update(image.id, { url: url ?? "", alt })
              }
            />

            <Input
              label={t("blocks.gallery.caption")}
              value={image.caption}
              onChange={(e) => update(image.id, { caption: e.target.value })}
              hint={t("blocks.gallery.captionHint")}
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-acid-400 hover:text-acid-400"
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("blocks.gallery.add")}
      </button>
    </div>
  );
}

export function GalleryRenderer({
  data,
  locale,
}: BlockRendererProps<GalleryData>) {
  const side = useIsSideColumn();
  const { t } = useTranslation("common");
  const images = (data.images ?? []).filter((image) => image.url);
  const [open, setOpen] = useState<number | null>(null);

  const title = tr(data.title, locale);

  if (!images.length) return null;

  return (
    <section>
      {title && <h2 className="mb-5 text-2xl text-ink-50">{title}</h2>}

      <ul className={clsx("grid gap-3", side ? "grid-cols-2" : COLUMN_CLASS[data.columns ?? 3])}>
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              onClick={() => setOpen(index)}
              className="group relative block w-full overflow-hidden rounded-xl bg-ink-800 focus:outline-2 focus:outline-offset-2 focus:outline-acid-500"
            >
              <span className="block aspect-[4/3]">
                <Image
                  src={image.url}
                  alt={image.alt || image.caption || ""}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </span>

              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center bg-ink-950/0 text-white opacity-0 transition-all group-hover:bg-ink-950/30 group-hover:opacity-100"
              >
                <ArrowsPointingOutIcon className="h-7 w-7" />
              </span>

              {image.caption && (
                <span className="block px-1 pb-1 pt-2 text-left text-xs text-ink-400">
                  {image.caption}
                </span>
              )}
            </button>
          </li>
        ))}
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

export const galleryDefaults = (): GalleryData => ({
  title: emptyTranslated(),
  columns: 3,
  images: [],
});
