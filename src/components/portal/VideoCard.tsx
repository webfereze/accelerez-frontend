import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ChatBubbleLeftRightIcon,
  PlayIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import { Pill } from "./Field";
import { videoStatusKey } from "@/utils/labels";
import type { ClientVideo } from "@/types/content";

/**
 * One recording, as a tile you press.
 *
 * **The whole tile is the button.** A thumbnail with a separate "watch" link
 * beside it gives one destination two focus stops, and everybody clicks the
 * picture anyway.
 *
 * The frame is a placeholder rather than a real thumbnail: pulling a frame out
 * of the file means either decoding video in the browser or a job on the
 * server, and neither is worth it for a list a client opens twice a week. What
 * it does show is what a reader actually needs to pick between two recordings —
 * the title, when it was sent, and whether the trainer has answered.
 */
export default function VideoCard({
  video,
  unread = false,
  onOpen,
}: {
  video: ClientVideo;
  /** A reply the reader has not seen — the reason for the dot. */
  unread?: boolean;
  onOpen: () => void;
}) {
  const { t } = useTranslation("common");
  const answered = video.status !== "pending";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col overflow-hidden rounded-card border border-white/10 bg-ink-900 text-left transition-colors hover:border-acid-500/50 focus-visible:border-acid-500"
    >
      {/* The ratio is an inline style, not `aspect-video`: this is a `<span>`
          because a `<button>` may only contain phrasing content, and the
          utility produced no height on an inline-level box — the placeholder
          collapsed and the play badge floated over the corner. */}
      <span
        className="relative block w-full bg-ink-950"
        style={{ aspectRatio: "16 / 9" }}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <VideoCameraIcon className="h-10 w-10 text-white/10" aria-hidden />
        </span>

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-acid-500/90 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none">
            <PlayIcon className="ml-0.5 h-6 w-6 text-ink-950" aria-hidden />
          </span>
        </span>

        {unread && (
          // Pink, because it means somebody is waiting on the reader — the
          // neon is the colour of things being fine.
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-flare-500 px-2.5 py-1 text-[0.68rem] font-semibold text-white">
            <ChatBubbleLeftRightIcon className="h-3 w-3" aria-hidden />
            {t("video.newReply")}
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col p-4">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate font-head text-base text-white">
              {video.title}
            </span>
            <span className="mt-0.5 block text-xs text-ink-500">
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
          </span>

          <Pill
            tone={clsx(
              answered
                ? "bg-acid-500/15 text-acid-400 ring-1 ring-inset ring-acid-500/30"
                : "bg-flare-500/15 text-flare-400 ring-1 ring-inset ring-flare-500/30",
            )}
          >
            {t(videoStatusKey(video.status))}
          </Pill>
        </span>

        {video.note && (
          <span className="mt-2.5 line-clamp-2 text-sm text-ink-300">{video.note}</span>
        )}
      </span>
    </button>
  );
}
