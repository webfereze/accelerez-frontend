import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import Select from "@/components/ui/Select";
import ImageField from "@/components/ui/ImageField";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/** A single image with an optional caption. */
export type ImageData = {
  url: string | null;
  alt: string;
  caption: Translated;
  width: "column" | "wide";
};

export function ImageEditor({ data, onChange }: BlockEditorProps<ImageData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <ImageField
        label={t("blocks.image.file")}
        url={data.url ?? null}
        alt={data.alt ?? ""}
        onChange={({ url, alt }) => onChange({ ...data, url, alt })}
      />
      <Select
        label={t("blocks.image.width")}
        value={data.width ?? "column"}
        onChange={(e) =>
          onChange({ ...data, width: e.target.value as ImageData["width"] })
        }
      >
        <option value="column">{t("blocks.image.widthColumn")}</option>
        <option value="wide">{t("blocks.image.widthWide")}</option>
      </Select>
      <TranslatedField
        label={t("blocks.image.caption")}
        value={data.caption ?? emptyTranslated()}
        onChange={(caption) => onChange({ ...data, caption })}
      />
    </div>
  );
}

export function ImageRenderer({ data, locale }: BlockRendererProps<ImageData>) {
  if (!data.url) return null;
  const caption = tr(data.caption, locale);

  return (
    <figure className={clsx(data.width === "wide" ? "w-full" : "max-w-4xl")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={data.url}
        alt={data.alt || ""}
        loading="lazy"
        decoding="async"
        className="w-full rounded-xl object-cover"
      />
      {caption && (
        <figcaption className="mt-2.5 text-sm text-ink-400">{caption}</figcaption>
      )}
    </figure>
  );
}

export const imageDefaults = (): ImageData => ({
  url: null,
  alt: "",
  caption: emptyTranslated(),
  width: "column",
});
