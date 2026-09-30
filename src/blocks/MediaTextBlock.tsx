import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import Select from "@/components/ui/Select";
import LinkField from "@/components/ui/LinkField";
import ImageField from "@/components/ui/ImageField";
import TranslatedField from "@/components/ui/TranslatedField";
import RichTextField from "@/components/ui/RichTextField";
import CtaButton from "@/components/public/CtaButton";
import { emptyTranslated, tr } from "@/utils/localized";
import { PROSE_RICH } from "./prose";
import type { Translated } from "@/types/content";
import { useIsSideColumn } from "./column";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Image beside text — the classic "poza stânga, conținut dreapta".
 *
 * Variants: which side the image sits on, and how wide it is.
 *
 * Mobile-first: on a phone the two always stack, image first, in a single
 * column — a 40/60 split at 360 px is unreadable. The side/ratio choices only
 * take effect once the block itself is wide enough (`md:`), not the window.
 */

export type MediaTextData = {
  image: string | null;
  alt: string;
  /** Which side the image sits on (desktop only). */
  position: "left" | "right";
  /** How much width the image takes (desktop only). */
  ratio: "third" | "half" | "twoFifths";
  title: Translated;
  html: Translated;
  ctaLabel: Translated;
  ctaHref: string;
};

const RATIO_CLASSES: Record<MediaTextData["ratio"], string> = {
  third: "md:grid-cols-3 [&>figure]:md:col-span-1 [&>div]:md:col-span-2",
  twoFifths: "md:grid-cols-5 [&>figure]:md:col-span-2 [&>div]:md:col-span-3",
  half: "md:grid-cols-2 [&>figure]:md:col-span-1 [&>div]:md:col-span-1",
};

export function MediaTextEditor({
  data,
  onChange,
}: BlockEditorProps<MediaTextData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <ImageField
        label={t("blocks.mediaText.image")}
        url={data.image ?? null}
        alt={data.alt ?? ""}
        onChange={({ url, alt }) => onChange({ ...data, image: url, alt })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t("blocks.mediaText.position")}
          value={data.position ?? "left"}
          onChange={(e) =>
            onChange({
              ...data,
              position: e.target.value as MediaTextData["position"],
            })
          }
        >
          <option value="left">{t("blocks.mediaText.imageLeft")}</option>
          <option value="right">{t("blocks.mediaText.imageRight")}</option>
        </Select>

        <Select
          label={t("blocks.mediaText.ratio")}
          value={data.ratio ?? "third"}
          onChange={(e) =>
            onChange({
              ...data,
              ratio: e.target.value as MediaTextData["ratio"],
            })
          }
        >
          <option value="third">{t("blocks.mediaText.ratioThird")}</option>
          <option value="twoFifths">{t("blocks.mediaText.ratioTwoFifths")}</option>
          <option value="half">{t("blocks.mediaText.ratioHalf")}</option>
        </Select>
      </div>

      <TranslatedField
        label={t("blocks.mediaText.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />

      <RichTextField
        label={t("blocks.mediaText.body")}
        value={data.html ?? emptyTranslated()}
        onChange={(html) => onChange({ ...data, html })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.mediaText.ctaLabel")}
          value={data.ctaLabel ?? emptyTranslated()}
          onChange={(ctaLabel) => onChange({ ...data, ctaLabel })}
        />
        <LinkField
          label={t("blocks.mediaText.ctaHref")}
          value={data.ctaHref ?? ""}
          onChange={(ctaHref) => onChange({ ...data, ctaHref })}
        />
      </div>
    </div>
  );
}

export function MediaTextRenderer({
  data,
  locale,
}: BlockRendererProps<MediaTextData>) {
  const side = useIsSideColumn();
  const title = tr(data.title, locale);
  const html = tr(data.html, locale);
  const ctaLabel = tr(data.ctaLabel, locale);

  return (
    <section
      className={clsx(
        "grid items-center gap-6 md:gap-10",
        // In the rail the image never sits beside the text: there is no room
        // for both, and the `md:` classes below would put them there anyway,
        // because they measure the window rather than this column.
        side ? "" : RATIO_CLASSES[data.ratio ?? "third"],
      )}
    >
      {data.image && (
        <figure
          className={clsx(
            "m-0",
            // Only reorder once side by side — stacked, the image comes first.
            !side && data.position === "right" && "md:order-last",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.image}
            alt={data.alt || ""}
            loading="lazy"
            decoding="async"
            className="w-full rounded-xl object-cover"
          />
        </figure>
      )}

      <div className="min-w-0">
        {title && (
          <h2 className="font-head text-2xl leading-tight tracking-tight text-ink-50 md:text-4xl">
            {title}
          </h2>
        )}

        {html && (
          <div
            className={`
              mt-3 break-words text-base leading-relaxed text-ink-300
              [&_a]:text-flare-400 [&_a]:underline
              [&_li]:mt-1
              [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6
              [&_p]:mt-3 [&_p:first-child]:mt-0
              [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6
              ${PROSE_RICH}
            `}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {ctaLabel && data.ctaHref && (
          <CtaButton href={data.ctaHref} variant="outline" className="mt-5">
            {ctaLabel}
          </CtaButton>
        )}
      </div>
    </section>
  );
}

export const mediaTextDefaults = (): MediaTextData => ({
  image: null,
  alt: "",
  position: "left",
  ratio: "third",
  title: emptyTranslated(),
  html: emptyTranslated(),
  ctaLabel: emptyTranslated(),
  ctaHref: "",
});
