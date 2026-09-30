import { useCallback, useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
  LinkIcon,
  PlayCircleIcon,
  TableCellsIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import ProgressTimeline, { type Milestone } from "@/components/portal/ProgressTimeline";
import MessageThread from "@/components/portal/MessageThread";
import MonthProgress from "@/components/portal/MonthProgress";
import PortalModal from "@/components/portal/Modal";
import VideoCard from "@/components/portal/VideoCard";
import VideoModal from "@/components/portal/VideoModal";
import { Field, Pill, PortalButton, TextArea, TextInput } from "@/components/portal/Field";
import { CLIENT_NAV } from "./index";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { formatDay, formatRange } from "@/utils/dates";
import {
  MEMBERSHIP_TONE,
  membershipStatusKey,
  money,
  paymentMethodKey,
  resourceTypeKey,
  videoStatusKey,
} from "@/utils/labels";
import type {
  ClientEnrollment,
  ClientVideo,
  MembershipPeriod,
  Message,
  ProgressEntry,
  TrainingResource,
} from "@/types/content";

type Tab = "messages" | "plan" | "progress" | "videos" | "payments";

/**
 * Everything one enrolment contains, in four tabs.
 *
 * **The paywall is shown, not hidden.** When the month is not confirmed the
 * plan tab says which month and what to do about it rather than rendering an
 * empty list — a client who sees nothing assumes the product is broken, and a
 * client who sees "luna septembrie nu e confirmată" writes to their trainer,
 * which is the action that actually fixes it.
 *
 * **Two of the four tabs stay open when the month does not.** The timeline is
 * the client's own record of their own body and their payment history is a
 * record of what they paid; withholding either because they stopped paying
 * would be holding their own data hostage. Only what the *trainer* produces is
 * behind the month.
 */
export default function ClientEnrollmentScreen() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = router.locale ?? "ro";
  const { user, ready } = usePortalAuth("client");

  /**
   * The trainer's slug, not an enrolment id.
   *
   * An id in a URL invites somebody to try the next number, and leaks how many
   * accounts exist even though the route refuses them. The API accepts either
   * form and resolves ownership from the token — see `findForClient`.
   */
  const handle = typeof router.query.trainer === "string" ? router.query.trainer : "";
  // Messages first: it is the tab opened every week, and the plan is the one
  // opened when something changes.
  const [tab, setTab] = useState<Tab>("messages");

  const [enrollment, setEnrollment] = useState<ClientEnrollment | null>(null);
  const [resources, setResources] = useState<TrainingResource[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [videos, setVideos] = useState<ClientVideo[]>([]);
  const [periods, setPeriods] = useState<MembershipPeriod[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const load = useCallback(async () => {
    if (!handle) return;

    const [detail, prog, vids, pers, msgs] = await Promise.all([
      api.get<ClientEnrollment>(`/portal/client/enrollments/${handle}`).then((r) => r.data),
      api.get<ProgressEntry[]>(`/portal/client/enrollments/${handle}/progress`).then((r) => r.data),
      api.get<ClientVideo[]>(`/portal/client/enrollments/${handle}/videos`).then((r) => r.data),
      api.get<MembershipPeriod[]>(`/portal/client/enrollments/${handle}/periods`).then((r) => r.data),
      // Not paywalled — talking is how the month gets sorted out in the first
      // place. See `MessageEntity`.
      api.get<Message[]>(`/portal/client/enrollments/${handle}/messages`).then((r) => r.data),
    ]);

    setEnrollment(detail);
    setProgress(prog);
    setVideos(vids);
    setPeriods(pers);
    setMessages(msgs);

    // The one call that is allowed to fail: a 403 here *is* the paywall, and it
    // carries the sentence the client should read.
    try {
      const { data } = await api.get<TrainingResource[]>(
        `/portal/client/enrollments/${handle}/resources`,
      );
      setResources(data);
      setLocked(false);
    } catch {
      setResources([]);
      setLocked(true);
    }
  }, [handle]);

  useEffect(() => {
    if (!ready || !handle) return;
    void load();
  }, [ready, handle, load]);

  if (!ready) return <PortalChecking />;

  const access = enrollment?.access;

  /** Material the client has never opened — see the note on the tabs. */
  const unseenResources = (resources ?? []).filter((row) => !row.seenAt).length;
  /** Recordings whose reply is newer than the last time they were opened. */
  const unseenReplies = videos.filter(hasUnseenReply).length;
  const milestones: Milestone[] = enrollment
    ? [
        {
          id: "created",
          date: enrollment.createdAt.slice(0, 10),
          label: t("progress.milestone.requested", { name: enrollment.trainer.displayName }),
          tone: "neutral",
        },
        ...(enrollment.acceptedAt
          ? [
              {
                id: "accepted",
                date: enrollment.acceptedAt.slice(0, 10),
                label: t("progress.milestone.accepted"),
                tone: "good" as const,
              },
            ]
          : []),
        ...periods
          .filter((period) => period.status === "paid" || period.status === "waived")
          .map((period) => ({
            id: `period-${period.id}`,
            date: (period.paidAt ?? period.startsOn).slice(0, 10),
            label: t("progress.milestone.period", {
              range: formatRange(period.startsOn, period.endsOn, locale),
            }),
            detail: period.amount ? money(period.amount, period.currency, locale) : undefined,
            tone: "good" as const,
          })),
      ]
    : [];

  return (
    <>
      <Head>
        <title>{`${enrollment?.trainer.displayName ?? ""} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={CLIENT_NAV(t)}
        title={enrollment?.trainer.displayName ?? t("portal.loading")}
        lead={t("portal.client.enrollmentLead")}
        actions={
          <Link href="/cont">
            <PortalButton variant="ghost" type="button">
              <ArrowLeftIcon className="h-4 w-4" aria-hidden />
              {t("actions.back")}
            </PortalButton>
          </Link>
        }
      >
        {access && <MonthProgress access={access} className="mb-4" />}

        {access && (
          <p
            className={clsx(
              "rounded-card px-4 py-3 text-sm",
              access.open
                ? "border border-acid-500/25 bg-acid-500/10 text-acid-300"
                : "border border-flare-500/25 bg-flare-500/10 text-flare-300",
            )}
          >
            {access.open && access.endsOn
              ? t("portal.client.openUntil", {
                  date: formatDay(access.endsOn, locale),
                  count: access.daysLeft,
                })
              : access.reason === "not_active"
                ? t("portal.client.notActive")
                : t("portal.client.noPeriod", {
                    price: enrollment?.trainer.monthlyPrice
                      ? money(
                          enrollment.trainer.monthlyPrice,
                          enrollment.trainer.currency,
                          locale,
                        )
                      : "",
                  })}
          </p>
        )}

        {/*
          A dot means "there is something here you have not seen".

          Counted from what is already loaded rather than from a separate
          endpoint: an unopened piece of material has no `seenAt`, and a
          recording with a reply newer than the last time it was opened is
          unread. Both clear themselves the moment the thing is opened, because
          opening it is what stamps the timestamp — see the API.
        */}
        <nav className="mt-7 flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {(
            [
              ["messages", t("portal.client.tab.messages"), 0],
              ["plan", t("portal.client.tab.plan"), unseenResources],
              ["progress", t("portal.client.tab.progress"), 0],
              ["videos", t("portal.client.tab.videos"), unseenReplies],
              ["payments", t("portal.client.tab.payments"), 0],
            ] as const
          ).map(([key, label, badge]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-current={tab === key ? "page" : undefined}
              className={clsx(
                "relative min-h-10 rounded-full px-4 text-sm font-medium transition-colors",
                tab === key
                  ? "bg-white/10 text-white"
                  : "text-ink-400 hover:bg-white/5 hover:text-white",
              )}
            >
              {label}
              {badge > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-flare-500 px-1.5 text-[0.68rem] font-semibold text-white"
                  aria-label={t("portal.client.unseen", { count: badge })}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-7">
          {tab === "messages" && user && (
            <MessageThread
              path={`/portal/client/enrollments/${handle}`}
              messages={messages}
              currentUserId={user.id}
              onSent={setMessages}
              emptyHint={t("messages.clientEmpty")}
            />
          )}

          {tab === "plan" && (
            <PlanTab resources={resources} locked={locked} access={access ?? null} />
          )}

          {tab === "progress" && (
            <ProgressTab
              enrollmentId={handle}
              entries={progress}
              milestones={milestones}
              locale={locale}
              onChanged={load}
            />
          )}

          {tab === "videos" && (
            <VideosTab
              enrollmentId={handle}
              videos={videos}
              canUpload={Boolean(access?.open)}
              currentUserId={user?.id ?? 0}
              onChanged={load}
            />
          )}

          {tab === "payments" && <PaymentsTab periods={periods} locale={locale} />}
        </div>
      </PortalLayout>
    </>
  );
}

// --- the plan --------------------------------------------------------------

function PlanTab({
  resources,
  locked,
  access,
}: {
  resources: TrainingResource[] | null;
  locked: boolean;
  access: ClientEnrollment["access"] | null;
}) {
  const { t } = useTranslation("common");

  if (locked) {
    return (
      <div className="rounded-panel border border-dashed border-flare-500/30 bg-flare-500/5 px-6 py-14 text-center">
        <p className="font-head text-xl text-white">{t("portal.client.lockedTitle")}</p>
        <p className="mx-auto mt-3 max-w-prose text-sm text-ink-300">
          {access?.reason === "not_active"
            ? t("portal.client.lockedNotActive")
            : t("portal.client.lockedText")}
        </p>
      </div>
    );
  }

  if (!resources) return <p className="text-sm text-ink-400">{t("portal.loading")}</p>;

  if (resources.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-14 text-center">
        <p className="font-head text-xl text-white">{t("portal.client.noPlanTitle")}</p>
        <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">
          {t("portal.client.noPlanText")}
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {resources.map((resource) => (
        <li key={resource.id}>
          <ResourceCard resource={resource} />
        </li>
      ))}
    </ul>
  );
}

/**
 * One piece of material.
 *
 * The type decides the shape, not just the icon: a diet is read on the page, a
 * spreadsheet opens in Google's viewer, a video opens where it lives. Guessing
 * from the URL works until a trainer pastes a Drive link to a video.
 */
function ResourceCard({ resource }: { resource: TrainingResource }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  const Icon =
    resource.type === "video"
      ? PlayCircleIcon
      : resource.type === "sheet"
        ? TableCellsIcon
        : resource.type === "document"
          ? DocumentTextIcon
          : resource.type === "link"
            ? LinkIcon
            : ChatBubbleBottomCenterTextIcon;

  const isReadable = resource.type === "diet" || resource.type === "tip";
  const href = resource.url ?? resource.filePath ?? null;

  return (
    <article className="flex h-full flex-col rounded-panel border border-white/10 bg-ink-900 p-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-acid-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="font-head text-base text-white">{resource.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-wider text-ink-500">
            {t(resourceTypeKey(resource.type))}
            {resource.visibility === "library" ? ` · ${t("resource.library")}` : ""}
          </p>
        </div>
      </div>

      {resource.description && (
        <p className="mt-3 text-sm leading-relaxed text-ink-300">{resource.description}</p>
      )}

      {isReadable && resource.body && (
        <>
          {open && (
            <div
              className="mt-4 max-w-none text-sm leading-relaxed text-ink-200 [&_h3]:mt-4 [&_h3]:font-head [&_h3]:text-base [&_h3]:text-white [&_li]:mt-1 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: resource.body }}
            />
          )}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="mt-4 self-start text-sm font-semibold text-acid-400 underline-offset-4 hover:underline"
          >
            {open ? t("actions.collapse") : t("actions.read")}
          </button>
        </>
      )}

      {!isReadable && href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold text-white transition-colors hover:border-acid-500 hover:text-acid-400"
        >
          {t("actions.open")}
          <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
        </a>
      )}
    </article>
  );
}

// --- the timeline ----------------------------------------------------------

function ProgressTab({
  enrollmentId,
  entries,
  milestones,
  locale,
  onChanged,
}: {
  enrollmentId: string;
  entries: ProgressEntry[];
  milestones: Milestone[];
  locale: string;
  onChanged: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-400">{t("progress.lead")}</p>
        <PortalButton type="button" onClick={() => setAdding((value) => !value)}>
          {adding ? t("actions.cancel") : t("progress.add")}
        </PortalButton>
      </div>

      {adding && (
        <ProgressForm
          enrollmentId={enrollmentId}
          onDone={async () => {
            setAdding(false);
            await onChanged();
          }}
        />
      )}

      <ProgressTimeline entries={entries} milestones={milestones} locale={locale} />
    </div>
  );
}

/**
 * Adding a point.
 *
 * The photographs upload first, one at a time, and only then is the row saved —
 * two steps rather than one multipart request, so a failed upload does not take
 * the weight and the note with it.
 */
function ProgressForm({
  enrollmentId,
  onDone,
}: {
  enrollmentId: string;
  onDone: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const photos: Array<{ url: string; pose?: "front" }> = [];

      for (const file of Array.from(files ?? []).slice(0, 3)) {
        const body = new FormData();
        body.append("file", file);
        const { data } = await api.post<{ url: string }>("/upload/image", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        photos.push({ url: data.url, pose: "front" });
      }

      await api.post(`/portal/client/enrollments/${enrollmentId}/progress`, {
        takenAt,
        photos,
        weightKg: weight ? Number(weight) : undefined,
        measurements: waist ? { waist: Number(waist) } : undefined,
        note: note.trim() || undefined,
      });

      await onDone();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("progress.saveFailed")));
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-8 rounded-panel border border-white/10 bg-ink-900 p-5 md:p-6"
    >
      {error && (
        <p role="alert" className="mb-4 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-3 text-sm text-flare-300">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("progress.date")} hint={t("progress.dateHint")} required>
          <TextInput
            type="date"
            value={takenAt}
            onChange={(event) => setTakenAt(event.target.value)}
            required
          />
        </Field>
        <Field label={t("progress.weight")}>
          <TextInput
            type="number"
            step="0.1"
            min="20"
            max="400"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </Field>
        <Field label={t("progress.waist")}>
          <TextInput
            type="number"
            step="0.5"
            value={waist}
            onChange={(event) => setWaist(event.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label={t("progress.photos")} hint={t("progress.photosHint")}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(event.target.files)}
            className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
          />
        </Field>
        <Field label={t("progress.note")}>
          <TextArea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </Field>
      </div>

      <PortalButton type="submit" loading={busy} className="mt-5">
        {busy ? t("actions.saving") : t("actions.save")}
      </PortalButton>
    </form>
  );
}

// --- videos ----------------------------------------------------------------

/**
 * The client's recordings.
 *
 * **Both the form and the player are dialogs.** The form used to sit above the
 * list taking a screen of space for something done twice a week, and the player
 * used to be a link that navigated away — which, for a QuickTime file, meant
 * the browser downloaded it instead of playing it. A tile that opens a player
 * where the list is solves both.
 */
function VideosTab({
  enrollmentId,
  videos,
  canUpload,
  currentUserId,
  onChanged,
}: {
  enrollmentId: string;
  videos: ClientVideo[];
  canUpload: boolean;
  currentUserId: number;
  onChanged: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const [sending, setSending] = useState(false);
  const [viewing, setViewing] = useState<ClientVideo | null>(null);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-400">{t("video.tabLead")}</p>

        {canUpload ? (
          <PortalButton type="button" onClick={() => setSending(true)}>
            <VideoCameraIcon className="h-4 w-4" aria-hidden />
            {t("video.sendTitle")}
          </PortalButton>
        ) : (
          <p className="rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
            {t("video.lockedUpload")}
          </p>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-14 text-center">
          <p className="font-head text-xl text-white">{t("video.emptyTitle")}</p>
          <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">{t("video.empty")}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <li key={video.id}>
              <VideoCard
                video={video}
                unread={hasUnseenReply(video)}
                onOpen={() => setViewing(video)}
              />
            </li>
          ))}
        </ul>
      )}

      <SendVideoModal
        open={sending}
        onClose={() => setSending(false)}
        enrollmentId={enrollmentId}
        onSent={async () => {
          setSending(false);
          await onChanged();
        }}
      />

      <VideoModal
        video={viewing}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        commentsPath={`/portal/client/enrollments/${enrollmentId}/videos/${viewing?.id}`}
        currentUserId={currentUserId}
        onChanged={onChanged}
      />
    </div>
  );
}

/**
 * Whether the trainer has said something the client has not opened yet.
 *
 * Computed from `clientSeenAt` against the review timestamp rather than from
 * the status, because a trainer's *second* remark on an already-answered video
 * is still something new — see `ClientVideoService.unreadForClient`.
 */
function hasUnseenReply(video: ClientVideo): boolean {
  const answeredAt = video.reviewedAt ?? null;
  if (!answeredAt) return false;
  return !video.clientSeenAt || new Date(video.clientSeenAt) < new Date(answeredAt);
}

/** Sending one. A dialog, because it is a two-field job done twice a week. */
function SendVideoModal({
  open,
  onClose,
  enrollmentId,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  enrollmentId: string;
  onSent: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      let filePath: string | undefined;
      let fileSize: number | undefined;
      let mimeType: string | undefined;

      // The file goes first and the record second: a failed upload must not
      // take the title and the note with it.
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const { data } = await api.post<{ url: string; size: number; mimeType: string }>(
          "/upload/video",
          body,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        filePath = data.url;
        fileSize = data.size;
        mimeType = data.mimeType;
      }

      await api.post(`/portal/client/enrollments/${enrollmentId}/videos`, {
        enrollmentId: 0,
        title: title.trim(),
        note: note.trim() || undefined,
        filePath,
        fileSize,
        mimeType,
        url: url.trim() || undefined,
      });

      setTitle("");
      setNote("");
      setUrl("");
      setFile(null);
      await onSent();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("video.saveFailed")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalModal
      open={open}
      onClose={onClose}
      title={t("video.sendTitle")}
      description={t("video.sendLead")}
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
            {error}
          </p>
        )}

        <Field label={t("video.title")} required>
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={2}
            autoFocus
          />
        </Field>

        <Field label={t("video.file")} hint={t("video.fileHint")}>
          <input
            type="file"
            accept="video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
          />
        </Field>

        <Field label={t("video.url")} hint={t("video.urlHint")}>
          <TextInput
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://youtu.be/…"
          />
        </Field>

        <Field label={t("video.note")} hint={t("video.noteHint")}>
          <TextArea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
        </Field>

        <div className="flex gap-2">
          <PortalButton type="submit" loading={busy}>
            {busy ? t("actions.sending") : t("video.send")}
          </PortalButton>
          <PortalButton type="button" variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </PortalButton>
        </div>
      </form>
    </PortalModal>
  );
}

// --- payments --------------------------------------------------------------

function PaymentsTab({
  periods,
  locale,
}: {
  periods: MembershipPeriod[];
  locale: string;
}) {
  const { t } = useTranslation("common");

  if (periods.length === 0) {
    return <p className="text-sm text-ink-400">{t("portal.client.noPayments")}</p>;
  }

  return (
    <div className="overflow-hidden rounded-panel border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-wider text-ink-400">
          <tr>
            <th className="px-4 py-3 font-medium">{t("payments.month")}</th>
            <th className="px-4 py-3 font-medium">{t("payments.status")}</th>
            <th className="px-4 py-3 font-medium">{t("payments.amount")}</th>
            <th className="px-4 py-3 font-medium">{t("payments.method")}</th>
            <th className="px-4 py-3 font-medium">{t("payments.paidAt")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/8">
          {periods.map((period) => (
            <tr key={period.id} className="bg-ink-900">
              <td className="px-4 py-3 text-white">
                {formatRange(period.startsOn, period.endsOn, locale)}
              </td>
              <td className="px-4 py-3">
                <Pill tone={MEMBERSHIP_TONE[period.status] ?? MEMBERSHIP_TONE.unpaid}>
                  {t(membershipStatusKey(period.status))}
                </Pill>
              </td>
              <td className="px-4 py-3 text-ink-200">
                {period.amount != null ? money(period.amount, period.currency, locale) : "—"}
              </td>
              <td className="px-4 py-3 text-ink-300">
                {period.method ? t(paymentMethodKey(period.method)) : "—"}
              </td>
              <td className="px-4 py-3 text-ink-400">
                {period.paidAt ? new Date(period.paidAt).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Client-side only: the enrolment belongs to whoever is signed in, so there is
 * nothing to prerender and nothing that should be cached at the edge.
 */
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
