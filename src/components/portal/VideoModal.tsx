import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import PortalModal from "./Modal";
import VideoPlayer from "./VideoPlayer";
import { PortalButton, TextArea } from "./Field";
import { api, apiErrorMessage } from "@/utils/api";
import type { ClientVideo } from "@/types/content";

export type VideoComment = {
  id: number;
  authorId: number | null;
  body: string;
  createdAt: string;
  author?: { firstName: string | null; lastName: string | null; email: string } | null;
};

/**
 * One recording, played, with the conversation about it underneath.
 *
 * **The remarks live on the video, not in the general thread.** A correction is
 * about *this* set — "cotul intră la a treia repetare" means nothing three
 * weeks later in a chat log, and everything beside the clip it refers to.
 *
 * One component for both sides: the only difference is which endpoint it talks
 * to and whose remark marks the video answered, and both are props. A trainer's
 * remark flips the status; a client's does not, or the coach's inbox would
 * empty itself.
 */
export default function VideoModal({
  video,
  open,
  onClose,
  commentsPath,
  currentUserId,
  onChanged,
}: {
  video: ClientVideo | null;
  open: boolean;
  onClose: () => void;
  /** Where the remarks are read and written, without the trailing segment. */
  commentsPath: string;
  currentUserId: number;
  onChanged?: () => void;
}) {
  const { t } = useTranslation("common");

  const [comments, setComments] = useState<VideoComment[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!video) return;
    try {
      const { data } = await api.get<VideoComment[]>(`${commentsPath}/comments`);
      setComments(data);
    } catch {
      setComments([]);
    }
  }, [commentsPath, video]);

  useEffect(() => {
    if (!open || !video) return;
    setBody("");
    setError(null);
    void load();
  }, [open, video, load]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;

    setBusy(true);
    setError(null);

    try {
      await api.post(`${commentsPath}/comments`, { body: body.trim() });
      setBody("");
      await load();
      // The status may have flipped to answered, and the list behind the
      // dialog is showing the old one.
      onChanged?.();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("video.commentFailed")));
    } finally {
      setBusy(false);
    }
  }

  const source = video?.url ?? video?.filePath ?? null;

  return (
    <PortalModal
      open={open && Boolean(video)}
      onClose={onClose}
      title={video?.title ?? ""}
      description={video ? new Date(video.createdAt).toLocaleString() : undefined}
      size="lg"
    >
      {video && (
        <>
          {source ? (
            <VideoPlayer url={source} mimeType={video.mimeType} />
          ) : (
            <p className="text-sm text-ink-400">{t("video.missing")}</p>
          )}

          {video.note && (
            <p className="mt-4 rounded-card bg-white/5 px-4 py-3 text-sm leading-relaxed text-ink-200">
              {video.note}
            </p>
          )}

          <section className="mt-6 border-t border-white/10 pt-5">
            <h3 className="flex items-center gap-2 font-head text-base text-white">
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4 text-acid-500" aria-hidden />
              {t("video.comments")}
            </h3>

            <ul className="mt-4 space-y-3">
              {comments.length === 0 && (
                <li className="text-sm text-ink-500">{t("video.noComments")}</li>
              )}

              {comments.map((comment) => {
                const mine = comment.authorId === currentUserId;
                const name =
                  [comment.author?.firstName, comment.author?.lastName]
                    .filter(Boolean)
                    .join(" ") || comment.author?.email;

                return (
                  <li
                    key={comment.id}
                    className={
                      mine
                        ? "rounded-card bg-acid-500/10 px-4 py-3 ring-1 ring-inset ring-acid-500/20"
                        : "rounded-card bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10"
                    }
                  >
                    <p className="text-xs font-semibold text-ink-400">
                      {mine ? t("video.you") : (name ?? t("video.trainer"))}
                      <span className="ml-2 font-normal text-ink-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-200">
                      {comment.body}
                    </p>
                  </li>
                );
              })}
            </ul>

            {error && (
              <p role="alert" className="mt-4 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
                {error}
              </p>
            )}

            <form onSubmit={send} className="mt-4">
              <TextArea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={3}
                placeholder={t("video.commentPlaceholder")}
              />
              <PortalButton type="submit" loading={busy} className="mt-3">
                {t("video.addComment")}
              </PortalButton>
            </form>
          </section>
        </>
      )}
    </PortalModal>
  );
}
