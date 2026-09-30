import { useTranslation } from "next-i18next/pages";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

/**
 * Plays whatever a client actually sent.
 *
 * Three cases, and they are genuinely different elements:
 *
 * - **A file we host** — a `<video>` element.
 * - **A YouTube or Vimeo link** — their iframe. An unlisted YouTube video is
 *   the fallback this product deliberately offers for recordings too large to
 *   upload, so it has to play here rather than send the viewer away.
 * - **Anything else** — a link, because guessing at an unknown host's embed URL
 *   produces a blank frame with no explanation.
 *
 * **`.mov` is announced as mp4 on purpose.** Phones and macOS produce QuickTime
 * containers holding H.264, which every browser can decode — but Chrome refuses
 * a source typed `video/quicktime` and downloads the file instead, which is
 * what a client sees as "it made me save it". The `type` attribute is a hint
 * to the browser, not a claim about the bytes, and the bytes are playable.
 * A file it genuinely cannot decode falls back to the download link below it.
 */
export default function VideoPlayer({
  url,
  mimeType,
  poster,
}: {
  url: string;
  mimeType?: string | null;
  poster?: string | null;
}) {
  const { t } = useTranslation("common");
  const embed = embedUrl(url);

  if (embed) {
    return (
      <div className="aspect-video overflow-hidden rounded-card bg-black">
        <iframe
          src={embed}
          title={t("video.player")}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  if (!isPlayableFile(url, mimeType)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:border-acid-500 hover:text-acid-400"
      >
        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
        {t("video.openFile")}
      </a>
    );
  }

  return (
    <div>
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster ?? undefined}
        className="aspect-video w-full rounded-card bg-black"
      >
        <source src={url} type={playbackType(url, mimeType)} />
      </video>

      {/* The way out when the browser cannot decode this particular file. */}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-400 underline-offset-4 hover:text-white hover:underline"
      >
        <ArrowDownTrayIcon className="h-3.5 w-3.5" aria-hidden />
        {t("video.download")}
      </a>
    </div>
  );
}

/** YouTube and Vimeo watch URLs, as their embeddable form. */
export function embedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return `https://www.youtube.com/embed${parsed.pathname}`;
    }
    if (host.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
    if (host.endsWith("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    /* Not a URL we can parse — treated as a plain link. */
  }

  return null;
}

const PLAYABLE = ["mp4", "mov", "m4v", "webm", "ogg", "ogv"];

function extensionOf(url: string): string {
  return url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
}

function isPlayableFile(url: string, mimeType?: string | null): boolean {
  if (mimeType?.startsWith("video/")) return true;
  return PLAYABLE.includes(extensionOf(url));
}

/** See the class note on why QuickTime is announced as mp4. */
function playbackType(url: string, mimeType?: string | null): string {
  const extension = extensionOf(url);
  if (extension === "webm") return "video/webm";
  if (mimeType && mimeType !== "video/quicktime") return mimeType;
  return "video/mp4";
}
