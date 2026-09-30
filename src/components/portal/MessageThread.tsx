import { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  DocumentTextIcon,
  LinkIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { api, apiErrorMessage } from "@/utils/api";
import { PortalButton, TextArea } from "./Field";
import type { Message, MessageAttachment } from "@/types/content";

/**
 * The conversation between a client and their trainer.
 *
 * One component for both sides, because a thread is symmetrical: the only
 * difference is which messages are "mine", and that is one prop. Two components
 * would be two places to fix the day attachments gain a type.
 *
 * **Attachments upload before the message is sent, and the message is what
 * carries them.** A failed upload therefore loses a file, not the sentence
 * somebody just typed — and a video that takes a minute does not hold the text
 * box hostage while it goes.
 *
 * It polls rather than holding a socket. A coach and a client exchange a few
 * messages a day, not a few a second; a refresh every fifteen seconds is
 * indistinguishable from live at that rate and costs no connection to keep
 * alive, no reconnect logic and no second server to run. When this product has
 * live coaching it will need sockets — and that is a different feature, not a
 * better version of this one.
 */
export default function MessageThread({
  path,
  messages,
  currentUserId,
  onSent,
  emptyHint,
}: {
  /** Where to GET the thread and POST to it, e.g. `/portal/client/enrollments/3`. */
  path: string;
  messages: Message[];
  currentUserId: number;
  onSent: (messages: Message[]) => void;
  emptyHint?: string;
}) {
  const { t } = useTranslation("common");

  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Newest at the bottom, like every thread anybody has ever read.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Fifteen seconds — see the class note on why this is not a socket.
  useEffect(() => {
    const timer = setInterval(() => {
      void api
        .get<Message[]>(`${path}/messages`)
        .then(({ data }) => onSent(data))
        .catch(() => undefined);
    }, 15000);

    return () => clearInterval(timer);
  }, [path, onSent]);

  async function attach(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      const endpoint = isVideo ? "/upload/video" : isImage ? "/upload/image" : "/upload/document";

      const form = new FormData();
      form.append("file", file);

      const { data } = await api.post<{ url: string; name: string; size: number; mimeType: string }>(
        endpoint,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setAttachments((current) => [
        ...current,
        {
          kind: isVideo ? "video" : isImage ? "image" : "document",
          url: data.url,
          name: data.name,
          size: data.size,
          mimeType: data.mimeType,
        },
      ]);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("messages.uploadFailed")));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() && attachments.length === 0) return;

    setBusy(true);
    setError(null);

    try {
      await api.post(`${path}/messages`, {
        body: body.trim() || undefined,
        attachments: attachments.length ? attachments : undefined,
      });

      setBody("");
      setAttachments([]);

      const { data } = await api.get<Message[]>(`${path}/messages`);
      onSent(data);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("messages.sendFailed")));
    } finally {
      setBusy(false);
    }
  }

  const time = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex h-full flex-col">
      <div className="max-h-[28rem] min-h-40 flex-1 space-y-3 overflow-y-auto rounded-panel border border-white/10 bg-ink-900 p-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-500">
            {emptyHint ?? t("messages.empty")}
          </p>
        )}

        {messages.map((message) => {
          const mine = message.senderId === currentUserId;

          return (
            <div
              key={message.id}
              className={clsx("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={clsx(
                  "max-w-[80%] rounded-card px-4 py-3 text-sm leading-relaxed",
                  mine
                    ? "bg-acid-500/15 text-ink-100 ring-1 ring-inset ring-acid-500/25"
                    : "bg-white/5 text-ink-200 ring-1 ring-inset ring-white/10",
                )}
              >
                {!mine && message.sender && (
                  <p className="mb-1 text-xs font-semibold text-ink-400">
                    {[message.sender.firstName, message.sender.lastName]
                      .filter(Boolean)
                      .join(" ") || message.sender.email}
                  </p>
                )}

                {message.body && <p className="whitespace-pre-line">{message.body}</p>}

                {(message.attachments ?? []).length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {(message.attachments ?? []).map((file) => (
                      <li key={file.url}>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg bg-ink-950/60 px-3 py-2 text-xs text-acid-400 underline-offset-4 hover:underline"
                        >
                          <AttachmentIcon kind={file.kind} />
                          {file.name ?? t(`messages.kind.${file.kind}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}

                <p className="mt-1.5 text-[0.68rem] text-ink-500">{time(message.createdAt)}</p>
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
          {error}
        </p>
      )}

      {attachments.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <li
              key={file.url}
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-ink-200"
            >
              <AttachmentIcon kind={file.kind} />
              {file.name ?? file.kind}
              <button
                type="button"
                onClick={() =>
                  setAttachments((current) => current.filter((_, i) => i !== index))
                }
                aria-label={t("actions.cancel")}
                className="text-ink-500 hover:text-white"
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={send} className="mt-3 flex items-end gap-2">
        <TextArea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={t("messages.placeholder")}
          rows={2}
          className="flex-1"
          onKeyDown={(event) => {
            // Enter sends, Shift+Enter breaks the line — the convention every
            // chat has trained everybody into.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(event as unknown as React.FormEvent);
            }
          }}
        />

        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(event) => attach(event.target.files)}
        />

        <PortalButton
          type="button"
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          loading={uploading}
          aria-label={t("messages.attach")}
          className="shrink-0"
        >
          <PaperClipIcon className="h-4 w-4" aria-hidden />
        </PortalButton>

        <PortalButton type="submit" loading={busy} className="shrink-0">
          <PaperAirplaneIcon className="h-4 w-4" aria-hidden />
          {t("messages.send")}
        </PortalButton>
      </form>
    </div>
  );
}

function AttachmentIcon({ kind }: { kind: MessageAttachment["kind"] }) {
  const Icon =
    kind === "video"
      ? VideoCameraIcon
      : kind === "image"
        ? PhotoIcon
        : kind === "link"
          ? LinkIcon
          : DocumentTextIcon;

  return <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />;
}
