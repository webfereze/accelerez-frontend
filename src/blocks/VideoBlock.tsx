import { useState } from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { PlayIcon } from "@heroicons/react/24/solid";
import ImageField from "@/components/ui/ImageField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * A video, presented properly.
 *
 * Separate from the generic embed block, which frames anything (a map, a form)
 * inside a bare rectangle. A video wants a cover image, a title, a caption and
 * — this is the point — nothing loaded from YouTube until someone actually
 * presses play. An `<iframe>` on page load runs Google's script for every
 * visitor, costs the page its Lighthouse score, and sets third-party cookies on
 * a public-sector site nobody consented to. So the block shows a poster and
 * swaps in the player on click, from the no-cookie domain.
 *
 * Files uploaded to our own storage skip all of that and play natively.
 */

export type VideoData = {
  /** YouTube / Vimeo link, or a direct video file URL. */
  url: string;
  /** Cover image. Optional for YouTube, which supplies its own thumbnail. */
  poster: string | null;
  posterAlt: string;
  title: Translated;
  caption: Translated;
  ratio: "wide" | "classic" | "vertical";
};

type Source =
  | { kind: "youtube"; id: string }
  | { kind: "vimeo"; id: string }
  | { kind: "file"; src: string }
  | null;

/** Works out what was pasted. Returns null for anything unplayable. */
export function parseVideoSource(raw: string): Source {
  const value = (raw ?? "").trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? { kind: "youtube", id } : null;
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
    // watch?v=…, /embed/…, /shorts/… and /live/… all name the same id.
    const fromQuery = url.searchParams.get("v");
    if (fromQuery) return { kind: "youtube", id: fromQuery };

    const match = url.pathname.match(/^\/(embed|shorts|live)\/([\w-]+)/);
    return match ? { kind: "youtube", id: match[2] } : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.pathname.match(/(\d+)/);
    return match ? { kind: "vimeo", id: match[1] } : null;
  }

  // Anything else is only accepted as a real video file — never framed.
  if (/\.(mp4|webm|ogg|mov)$/i.test(url.pathname) && /^https?:$/.test(url.protocol)) {
    return { kind: "file", src: url.toString() };
  }

  return null;
}

/** The player URL, already asking to start playing. */
function playerUrl(source: Exclude<Source, null>): string {
  if (source.kind === "youtube") {
    return `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0`;
  }
  if (source.kind === "vimeo") {
    return `https://player.vimeo.com/video/${source.id}?autoplay=1&dnt=1`;
  }
  return source.src;
}

const RATIOS: Record<VideoData["ratio"], string> = {
  wide: "aspect-video",
  classic: "aspect-[4/3]",
  vertical: "aspect-[9/16] mx-auto max-w-sm",
};

export function VideoEditor({ data, onChange }: BlockEditorProps<VideoData>) {
  const { t } = useTranslation("common");
  const source = parseVideoSource(data.url ?? "");
  const invalid = !!data.url && !source;

  return (
    <div className="space-y-4">
      <Input
        label={t("blocks.video.url")}
        value={data.url ?? ""}
        onChange={(e) => onChange({ ...data, url: e.target.value })}
        placeholder="https://www.youtube.com/watch?v=…"
        inputMode="url"
        spellCheck={false}
        error={invalid ? t("blocks.video.notSupported") : undefined}
        hint={t("blocks.video.urlHint")}
      />

      <ImageField
        label={t("blocks.video.poster")}
        url={data.poster ?? null}
        alt={data.posterAlt ?? ""}
        onChange={({ url, alt }) =>
          onChange({ ...data, poster: url, posterAlt: alt })
        }
      />
      <p className="-mt-2 text-xs text-slate-500">
        {t("blocks.video.posterHint")}
      </p>

      <TranslatedField
        label={t("blocks.video.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TranslatedField
        label={t("blocks.video.caption")}
        value={data.caption ?? emptyTranslated()}
        onChange={(caption) => onChange({ ...data, caption })}
        multiline
        rows={2}
      />

      <Select
        label={t("blocks.video.ratio")}
        value={data.ratio ?? "wide"}
        onChange={(e) =>
          onChange({ ...data, ratio: e.target.value as VideoData["ratio"] })
        }
      >
        <option value="wide">{t("blocks.video.ratioWide")}</option>
        <option value="classic">{t("blocks.video.ratioClassic")}</option>
        <option value="vertical">{t("blocks.video.ratioVertical")}</option>
      </Select>
    </div>
  );
}

export function VideoRenderer({ data, locale }: BlockRendererProps<VideoData>) {
  const { t } = useTranslation("common");
  const [playing, setPlaying] = useState(false);

  const source = parseVideoSource(data.url ?? "");
  if (!source) return null;

  const title = tr(data.title, locale);
  const caption = tr(data.caption, locale);
  const ratio = RATIOS[data.ratio ?? "wide"] ?? RATIOS.wide;

  // YouTube hosts a thumbnail for every video, so a poster is optional there.
  const poster =
    data.poster ||
    (source.kind === "youtube"
      ? `https://i.ytimg.com/vi/${source.id}/maxresdefault.jpg`
      : null);

  return (
    <figure className="m-0">
      {title && (
        <h2 className="mb-3 text-xl text-ink-50 sm:text-2xl">{title}</h2>
      )}

      <div
        className={clsx(
          "relative isolate overflow-hidden rounded-2xl bg-flare-950 ring-1 ring-inset ring-black/5",
          ratio,
        )}
      >
        {/* An uploaded file plays natively — no third party involved at all. */}
        {source.kind === "file" ? (
          <video
            controls
            preload="metadata"
            poster={poster ?? undefined}
            className="h-full w-full object-contain"
          >
            <source src={source.src} />
          </video>
        ) : playing ? (
          <iframe
            src={playerUrl(source)}
            title={title || t("blocks.video.name")}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          /* The facade. Nothing from YouTube has loaded at this point. */
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
          >
            {poster && (
              <Image
                src={poster}
                alt={data.posterAlt || ""}
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            )}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-flare-950/70 via-flare-950/10 to-transparent"
            />

            <span
              aria-hidden
              className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900/95 text-flare-500 shadow-xl transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20"
            >
              <PlayIcon className="ml-1 h-7 w-7 md:h-9 md:w-9" />
            </span>

            <span className="sr-only">
              {title ? `${t("blocks.video.play")}: ${title}` : t("blocks.video.play")}
            </span>
          </button>
        )}
      </div>

      {caption && (
        <figcaption className="mt-2.5 text-sm text-ink-400">{caption}</figcaption>
      )}
    </figure>
  );
}

export const videoDefaults = (): VideoData => ({
  url: "",
  poster: null,
  posterAlt: "",
  title: emptyTranslated(),
  caption: emptyTranslated(),
  ratio: "wide",
});
