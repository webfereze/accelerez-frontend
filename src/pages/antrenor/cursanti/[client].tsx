import { useCallback, useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ArrowLeftIcon, PlusIcon } from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import MessageThread from "@/components/portal/MessageThread";
import ProgressTimeline from "@/components/portal/ProgressTimeline";
import MonthProgress from "@/components/portal/MonthProgress";
import VideoCard from "@/components/portal/VideoCard";
import VideoModal from "@/components/portal/VideoModal";
import {
  Field,
  Pill,
  PortalButton,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/portal/Field";
import { TRAINER_NAV } from "../index";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { useTrainerBadges } from "@/hooks/useTrainerBadges";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { formatRange } from "@/utils/dates";
import {
  ENROLLMENT_TONE,
  MEMBERSHIP_TONE,
  enrollmentStatusKey,
  membershipStatusKey,
  money,
  resourceTypeKey,
  videoStatusKey,
} from "@/utils/labels";
import {
  RESOURCE_TYPES,
  type ClientVideo,
  type Enrollment,
  type MembershipPeriod,
  type Message,
  type ProgressEntry,
  type ResourceType,
  type TrainingResource,
} from "@/types/content";

type Detail = {
  enrollment: Enrollment;
  periods: MembershipPeriod[];
  resources: TrainingResource[];
  videos: ClientVideo[];
  progress: ProgressEntry[];
  messages: Message[];
};

type Tab = "messages" | "material" | "videos" | "progress" | "months";

/**
 * One client, and everything the trainer does with them.
 *
 * **Messages first.** Of the five tabs this is the one opened twenty times a
 * week; the rest are opened when something changes. A screen that opens on the
 * payment history is a screen that makes a coach feel like a bookkeeper.
 *
 * Accepting, pausing and ending the collaboration live in the header rather
 * than inside a tab, because they are decisions about the relationship and not
 * about any one part of it.
 */
export default function TrainerClientDetail() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = router.locale ?? "ro";
  const { user, ready } = usePortalAuth("trainer");
  const badges = useTrainerBadges(ready);

  /** The client's handle, not an id — see the note on the client's own screen. */
  const handle = typeof router.query.client === "string" ? router.query.client : "";
  const [tab, setTab] = useState<Tab>("messages");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!handle) return;
    try {
      const { data } = await api.get<Detail>(`/portal/trainer/clients/${handle}`);
      setDetail(data);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("portal.trainer.loadFailed")));
    }
  }, [handle, t]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function setStatus(status: string) {
    setBusy(true);
    try {
      await api.patch(`/portal/trainer/clients/${handle}`, { status });
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("portal.trainer.actionFailed")));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <PortalChecking />;

  const client = detail?.enrollment.client;
  const name =
    [client?.firstName, client?.lastName].filter(Boolean).join(" ") || client?.email || "";
  const status = detail?.enrollment.status;
  /** Recordings this coach still owes an answer on. */
  const pendingVideos = (detail?.videos ?? []).filter((v) => v.status === "pending").length;

  return (
    <>
      <Head>
        <title>{`${name} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={TRAINER_NAV(t, badges)}
        title={name || t("portal.loading")}
        lead={client?.email}
        actions={
          <>
            <Link href="/antrenor/cursanti">
              <PortalButton variant="ghost" type="button">
                <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                {t("actions.back")}
              </PortalButton>
            </Link>

            {status === "pending" && (
              <>
                <PortalButton type="button" onClick={() => setStatus("active")} loading={busy}>
                  {t("portal.trainer.accept")}
                </PortalButton>
                <PortalButton
                  type="button"
                  variant="ghost"
                  onClick={() => setStatus("declined")}
                  disabled={busy}
                >
                  {t("portal.trainer.decline")}
                </PortalButton>
              </>
            )}

            {status === "active" && (
              <PortalButton
                type="button"
                variant="ghost"
                onClick={() => setStatus("paused")}
                disabled={busy}
              >
                {t("portal.trainer.pause")}
              </PortalButton>
            )}

            {status === "paused" && (
              <PortalButton type="button" onClick={() => setStatus("active")} disabled={busy}>
                {t("portal.trainer.resume")}
              </PortalButton>
            )}
          </>
        }
      >
        {error && (
          <p role="alert" className="mb-5 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-3 text-sm text-flare-300">
            {error}
          </p>
        )}

        {detail && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Pill tone={ENROLLMENT_TONE[detail.enrollment.status] ?? ENROLLMENT_TONE.ended}>
                {t(enrollmentStatusKey(detail.enrollment.status))}
              </Pill>

              {detail.enrollment.goal && (
                <p className="text-sm text-ink-400">{t("portal.trainer.hasGoal")}</p>
              )}
            </div>

            {detail.enrollment.goal && (
              <p className="mt-3 whitespace-pre-line rounded-card border border-white/10 bg-ink-900 px-4 py-3 text-sm leading-relaxed text-ink-200">
                {detail.enrollment.goal}
              </p>
            )}

            {/* The same bar the client sees, so both sides are looking at the
                same number when one of them asks about it. */}
            {detail.enrollment.access && (
              <MonthProgress access={detail.enrollment.access} className="mt-5 max-w-lg" />
            )}

            <nav className="mt-7 flex flex-wrap gap-2 border-b border-white/10 pb-3">
              {(
                [
                  ["messages", t("portal.trainer.tab.messages"), 0],
                  ["material", t("portal.trainer.tab.material"), 0],
                  ["videos", t("portal.trainer.tab.videos"), pendingVideos],
                  ["progress", t("portal.trainer.tab.progress"), 0],
                  ["months", t("portal.trainer.tab.months"), 0],
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
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-flare-500 px-1.5 text-[0.68rem] font-semibold text-white">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-7">
              {tab === "messages" && user && (
                <MessageThread
                  path={`/portal/trainer/clients/${handle}`}
                  messages={detail.messages}
                  currentUserId={user.id}
                  onSent={(messages) => setDetail((d) => (d ? { ...d, messages } : d))}
                  emptyHint={t("messages.trainerEmpty")}
                />
              )}

              {tab === "material" && (
                <MaterialTab
                  enrollmentId={handle}
                  resources={detail.resources}
                  onChanged={load}
                />
              )}

              {tab === "videos" && (
                <VideosTab
                  videos={detail.videos}
                  currentUserId={user?.id ?? 0}
                  onChanged={load}
                />
              )}

              {tab === "progress" && (
                <ProgressTimeline
                  entries={detail.progress}
                  locale={locale}
                  onComment={async (entry, note) => {
                    await api.patch(`/portal/trainer/clients/${handle}/progress/${entry.id}`, {
                      trainerNote: note,
                    });
                    await load();
                  }}
                />
              )}

              {tab === "months" && (
                <MonthsTab
                  enrollmentId={handle}
                  periods={detail.periods}
                  price={detail.enrollment.trainer?.monthlyPrice ?? null}
                  currency={detail.enrollment.trainer?.currency ?? "RON"}
                  locale={locale}
                  onChanged={load}
                />
              )}
            </div>
          </>
        )}
      </PortalLayout>
    </>
  );
}

// --- material --------------------------------------------------------------

/**
 * What this client has been given, and the form that adds more.
 *
 * The form is inline rather than behind a modal: adding a link to somebody's
 * plan is a ten-second job a coach does while looking at what is already there.
 */
function MaterialTab({
  enrollmentId,
  resources,
  onChanged,
}: {
  enrollmentId: string;
  resources: TrainingResource[];
  onChanged: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "video" as ResourceType,
    title: "",
    description: "",
    url: "",
    body: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsBody = form.type === "diet" || form.type === "tip";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.post("/portal/trainer/resources", {
        type: form.type,
        visibility: "client",
        enrollmentId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        url: needsBody ? undefined : form.url.trim() || undefined,
        body: needsBody ? form.body : undefined,
      });

      setForm({ type: "video", title: "", description: "", url: "", body: "" });
      setOpen(false);
      await onChanged();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("portal.trainer.resourceFailed")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-400">{t("portal.trainer.materialLead")}</p>
        <PortalButton type="button" onClick={() => setOpen((v) => !v)}>
          <PlusIcon className="h-4 w-4" aria-hidden />
          {open ? t("actions.cancel") : t("portal.trainer.addMaterial")}
        </PortalButton>
      </div>

      {open && (
        <form onSubmit={submit} className="mb-7 rounded-panel border border-white/10 bg-ink-900 p-5">
          {error && (
            <p role="alert" className="mb-4 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <Field label={t("portal.trainer.resourceType")}>
              <SelectInput
                value={form.type}
                onChange={(event) =>
                  setForm((v) => ({ ...v, type: event.target.value as ResourceType }))
                }
              >
                {RESOURCE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(resourceTypeKey(value))}
                  </option>
                ))}
              </SelectInput>
            </Field>

            <Field label={t("portal.trainer.resourceTitle")} required>
              <TextInput
                value={form.title}
                onChange={(event) => setForm((v) => ({ ...v, title: event.target.value }))}
                required
                minLength={2}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label={t("portal.trainer.resourceDescription")}>
              <TextInput
                value={form.description}
                onChange={(event) => setForm((v) => ({ ...v, description: event.target.value }))}
              />
            </Field>
          </div>

          <div className="mt-4">
            {needsBody ? (
              <Field label={t("portal.trainer.resourceBody")} hint={t("portal.trainer.resourceBodyHint")} required>
                <TextArea
                  value={form.body}
                  onChange={(event) => setForm((v) => ({ ...v, body: event.target.value }))}
                  rows={8}
                  required
                />
              </Field>
            ) : (
              <Field label={t("portal.trainer.resourceUrl")} hint={t("portal.trainer.resourceUrlHint")} required>
                <TextInput
                  type="url"
                  value={form.url}
                  onChange={(event) => setForm((v) => ({ ...v, url: event.target.value }))}
                  placeholder="https://"
                  required
                />
              </Field>
            )}
          </div>

          <PortalButton type="submit" loading={busy} className="mt-5">
            {t("actions.save")}
          </PortalButton>
        </form>
      )}

      {resources.length === 0 ? (
        <p className="text-sm text-ink-400">{t("portal.trainer.noMaterial")}</p>
      ) : (
        <ul className="space-y-3">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-white/10 bg-ink-900 p-4"
            >
              <div className="min-w-0">
                <p className="font-head text-base text-white">{resource.title}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-500">
                  {t(resourceTypeKey(resource.type))}
                  {resource.seenAt ? ` · ${t("portal.trainer.seen")}` : ` · ${t("portal.trainer.unseen")}`}
                </p>
                {resource.description && (
                  <p className="mt-2 text-sm text-ink-300">{resource.description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  await api.delete(`/portal/trainer/resources/${resource.id}`);
                  await onChanged();
                }}
                className="text-xs text-flare-400 underline-offset-4 hover:underline"
              >
                {t("actions.delete")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- videos ----------------------------------------------------------------

/**
 * The client's recordings, from the coach's side.
 *
 * The same tile and the same dialog the client sees — one way of looking at a
 * recording, not two. The trainer's remark is written in that dialog and is
 * what marks the video answered, so there is no separate "reply" form and no
 * status to remember to set.
 */
function VideosTab({
  videos,
  currentUserId,
  onChanged,
}: {
  videos: ClientVideo[];
  currentUserId: number;
  onChanged: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const [viewing, setViewing] = useState<ClientVideo | null>(null);

  if (videos.length === 0) {
    return <p className="text-sm text-ink-400">{t("portal.trainer.noVideos")}</p>;
  }

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <li key={video.id}>
            <VideoCard
              video={video}
              // For the coach, "waiting" is a video nobody has answered — a
              // stronger signal than "not opened", since watching one and
              // still owing an answer is the normal case.
              unread={video.status === "pending"}
              onOpen={() => setViewing(video)}
            />
          </li>
        ))}
      </ul>

      <VideoModal
        video={viewing}
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        commentsPath={`/portal/trainer/videos/${viewing?.id}`}
        currentUserId={currentUserId}
        onChanged={onChanged}
      />
    </div>
  );
}

// --- months ----------------------------------------------------------------

/**
 * The switch that opens the client's area.
 *
 * Defaults to the current month and the trainer's own price, because that is
 * the case ninety-nine times in a hundred — and a form that makes somebody
 * re-type both every month is a form they stop using.
 */
function MonthsTab({
  enrollmentId,
  periods,
  price,
  currency,
  locale,
  onChanged,
}: {
  enrollmentId: string;
  periods: MembershipPeriod[];
  price: number | null;
  currency: string;
  locale: string;
  onChanged: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const [form, setForm] = useState({
    // Empty means "continue from the last period" — the normal case.
    startsOn: "",
    status: "paid",
    method: "transfer",
    amount: price != null ? String(price) : "",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mark(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await api.post(`/portal/trainer/clients/${enrollmentId}/periods`, {
        startsOn: form.startsOn || undefined,
        status: form.status,
        method: form.method,
        amount: form.amount ? Number(form.amount) : undefined,
        note: form.note.trim() || undefined,
      });
      await onChanged();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("portal.trainer.markFailed")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={mark} className="rounded-panel border border-white/10 bg-ink-900 p-5">
        <h2 className="font-head text-lg text-white">{t("portal.trainer.markTitle")}</h2>
        <p className="mt-1.5 text-sm text-ink-400">{t("portal.trainer.markLead")}</p>

        {error && (
          <p role="alert" className="mt-4 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
            {error}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {/* No month picker: a period is 28 days from where it starts, and the
              start continues from the last one unless somebody backdates it.
              See the API's `period.ts`. */}
          <Field label={t("portal.trainer.startsOn")} hint={t("portal.trainer.startsOnHint")}>
            <TextInput
              type="date"
              value={form.startsOn}
              onChange={(event) => setForm((v) => ({ ...v, startsOn: event.target.value }))}
            />
          </Field>

          <Field label={t("payments.amount")}>
            <TextInput
              type="number"
              value={form.amount}
              onChange={(event) => setForm((v) => ({ ...v, amount: event.target.value }))}
            />
          </Field>

          <Field label={t("payments.status")}>
            <SelectInput
              value={form.status}
              onChange={(event) => setForm((v) => ({ ...v, status: event.target.value }))}
            >
              <option value="paid">{t("membership.paid")}</option>
              <option value="waived">{t("membership.waived")}</option>
              <option value="unpaid">{t("membership.unpaid")}</option>
            </SelectInput>
          </Field>

          <Field label={t("payments.method")}>
            <SelectInput
              value={form.method}
              onChange={(event) => setForm((v) => ({ ...v, method: event.target.value }))}
            >
              {/* `card` is absent on purpose — a card payment is something a
                  processor confirms, never something a person types. */}
              <option value="transfer">{t("payment.transfer")}</option>
              <option value="cash">{t("payment.cash")}</option>
              <option value="other">{t("payment.other")}</option>
            </SelectInput>
          </Field>

          <Field label={t("enrollments.note")}>
            <TextInput
              value={form.note}
              onChange={(event) => setForm((v) => ({ ...v, note: event.target.value }))}
            />
          </Field>
        </div>

        <PortalButton type="submit" loading={busy} className="mt-5">
          {t("portal.trainer.markMonth")}
        </PortalButton>
      </form>

      {periods.length > 0 && (
        <ul className="mt-7 divide-y divide-white/8 overflow-hidden rounded-panel border border-white/10">
          {periods.map((period) => (
            <li
              key={period.id}
              className="flex flex-wrap items-center gap-3 bg-ink-900 px-5 py-4"
            >
              <span className="min-w-0 flex-1 text-sm text-white">
                {formatRange(period.startsOn, period.endsOn, locale)}
              </span>
              <Pill tone={MEMBERSHIP_TONE[period.status] ?? MEMBERSHIP_TONE.unpaid}>
                {t(membershipStatusKey(period.status))}
              </Pill>
              <span className="text-sm text-ink-300">
                {period.amount != null ? money(period.amount, period.currency, locale) : "—"}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await api.delete(
                    `/portal/trainer/clients/${enrollmentId}/periods/${period.id}`,
                  );
                  await onChanged();
                }}
                className="text-xs text-flare-400 underline-offset-4 hover:underline"
              >
                {t("enrollments.unmark")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
