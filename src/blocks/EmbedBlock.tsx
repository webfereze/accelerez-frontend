import { useTranslation } from "next-i18next/pages";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/** A map or a video from a host we trust. */
export type EmbedData = {
  url: string;
  title: Translated;
  ratio: "video" | "map";
};

/**
 * Only these hosts may be framed. An `<iframe>` runs third-party code inside
 * the page, so the list is an allowlist rather than a filter — anything else
 * simply doesn't render.
 */
const ALLOWED = [
  "www.youtube.com",
  "youtube.com",
  "youtu.be",
  "player.vimeo.com",
  "www.google.com",
  "maps.google.com",
  "www.openstreetmap.org",
];

export function isAllowedEmbed(url: string): boolean {
  try {
    return ALLOWED.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Turns a watch/share link into the embeddable form. */
export function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (parsed.hostname.endsWith("youtube.com") && parsed.pathname === "/watch") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    return url;
  } catch {
    return url;
  }
}

export function EmbedEditor({ data, onChange }: BlockEditorProps<EmbedData>) {
  const { t } = useTranslation("common");
  const invalid = !!data.url && !isAllowedEmbed(data.url);

  return (
    <div className="space-y-4">
      <Input
        label={t("blocks.embed.url")}
        value={data.url ?? ""}
        onChange={(e) => onChange({ ...data, url: e.target.value })}
        placeholder="https://www.youtube.com/watch?v=…"
        inputMode="url"
        spellCheck={false}
        error={invalid ? t("blocks.embed.notAllowed") : undefined}
        hint={t("blocks.embed.allowedHosts")}
      />
      <Select
        label={t("blocks.embed.ratio")}
        value={data.ratio ?? "video"}
        onChange={(e) =>
          onChange({ ...data, ratio: e.target.value as EmbedData["ratio"] })
        }
      >
        <option value="video">{t("blocks.embed.ratioVideo")}</option>
        <option value="map">{t("blocks.embed.ratioMap")}</option>
      </Select>
      <TranslatedField
        label={t("blocks.embed.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        hint={t("blocks.embed.titleHint")}
      />
    </div>
  );
}

export function EmbedRenderer({ data, locale }: BlockRendererProps<EmbedData>) {
  if (!data.url || !isAllowedEmbed(data.url)) return null;

  const title = tr(data.title, locale);

  return (
    <div>
      <div
        className={
          data.ratio === "map"
            ? "aspect-[4/3] overflow-hidden rounded-xl border border-white/10"
            : "aspect-video overflow-hidden rounded-xl border border-white/10"
        }
      >
        <iframe
          src={toEmbedUrl(data.url)}
          // An embedded frame must be named, or a screen reader announces
          // only "frame".
          title={title || "embed"}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
      {title && <p className="mt-2.5 text-sm text-ink-400">{title}</p>}
    </div>
  );
}

export const embedDefaults = (): EmbedData => ({
  url: "",
  title: emptyTranslated(),
  ratio: "video",
});
