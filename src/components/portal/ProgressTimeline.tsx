import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ArrowsRightLeftIcon,
  CameraIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassPlusIcon,
  ScaleIcon,
} from "@heroicons/react/24/outline";
import PortalModal from "./Modal";
import { PortalButton, TextArea } from "./Field";
import type { ProgressEntry } from "@/types/content";

/**
 * The client's journey, as a vertical timeline with a before/after comparison
 * above it.
 *
 * **The comparison is a pair the reader chooses, not a pair the product picks.**
 * The default is the first photograph against the latest — the story everyone
 * wants — but the two ends are selectable, because after a year the interesting
 * question is usually "this month against three months ago" and a fixed pair
 * answers it never. Both selects list only the entries that actually carry a
 * photograph, so the comparison cannot land on an empty frame.
 *
 * **The weight delta is coloured by direction, not by judgement.** Down is not
 * "good": a client gaining muscle is doing exactly what they came for. So the
 * arrow and the sign carry the meaning and the colour stays neutral — the one
 * place in this product where the neon would be lying.
 *
 * Milestones from elsewhere in the enrolment — the account being created, the
 * trainer accepting, each month confirmed — are passed in as `milestones` and
 * merged into the same spine, because a timeline that shows only photographs
 * makes the first three months look empty when they were the months that
 * mattered.
 */

export type Milestone = {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  label: string;
  detail?: string;
  tone?: "neutral" | "good" | "attention";
};

export default function ProgressTimeline({
  entries,
  milestones = [],
  locale = "ro",
  onEdit,
  onComment,
}: {
  entries: ProgressEntry[];
  milestones?: Milestone[];
  locale?: string;
  /** The client's own edit affordance. Absent on the trainer's view. */
  onEdit?: (entry: ProgressEntry) => void;
  /**
   * The trainer's remark. Absent on the client's own view.
   *
   * Takes the text as well as the entry: the dialog that collects it lives
   * here, so every screen that shows a timeline gets the same one instead of
   * each inventing its own — which is how one of them ended up on
   * `window.prompt`.
   */
  onComment?: (entry: ProgressEntry, body: string) => Promise<void>;
}) {
  const { t } = useTranslation("common");

  /** The photograph being looked at full size, and the entry being commented. */
  const [zoomed, setZoomed] = useState<{ url: string; date: string } | null>(null);
  const [commenting, setCommenting] = useState<ProgressEntry | null>(null);

  const withPhotos = useMemo(
    () => entries.filter((entry) => (entry.photos?.length ?? 0) > 0),
    [entries],
  );

  const [beforeId, setBeforeId] = useState<number | null>(withPhotos[0]?.id ?? null);
  const [afterId, setAfterId] = useState<number | null>(
    withPhotos[withPhotos.length - 1]?.id ?? null,
  );

  const before = withPhotos.find((entry) => entry.id === beforeId) ?? withPhotos[0];
  const after =
    withPhotos.find((entry) => entry.id === afterId) ?? withPhotos[withPhotos.length - 1];

  // Newest first on the spine: the most recent entry is the one being looked
  // for, and a timeline that opens at the beginning makes somebody scroll past
  // their whole history to see last week.
  const rows = useMemo(() => {
    const points = [
      ...entries.map((entry) => ({ kind: "entry" as const, date: entry.takenAt, entry })),
      ...milestones.map((milestone) => ({
        kind: "milestone" as const,
        date: milestone.date,
        milestone,
      })),
    ];

    return points.sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, milestones]);

  const dateFormat = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const shortFormat = new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : locale, {
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      {before && after && before.id !== after.id && (
        <section className="rounded-panel border border-white/10 bg-ink-900 p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 font-head text-xl text-white">
              <ArrowsRightLeftIcon className="h-5 w-5 text-acid-500" aria-hidden />
              {t("progress.comparison")}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <PhotoSelect
                value={before.id}
                options={withPhotos}
                format={shortFormat}
                onChange={setBeforeId}
                label={t("progress.before")}
              />
              <span className="text-ink-500" aria-hidden>
                →
              </span>
              <PhotoSelect
                value={after.id}
                options={withPhotos}
                format={shortFormat}
                onChange={setAfterId}
                label={t("progress.after")}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <ComparisonSide
              entry={before}
              label={t("progress.before")}
              format={dateFormat}
              onZoom={(url) => setZoomed({ url, date: before.takenAt })}
            />
            <ComparisonSide
              entry={after}
              label={t("progress.after")}
              format={dateFormat}
              onZoom={(url) => setZoomed({ url, date: after.takenAt })}
            />
          </div>

          {before.weightKg != null && after.weightKg != null && (
            <p className="mt-5 flex flex-wrap items-baseline gap-2 border-t border-white/10 pt-5">
              <span className="font-head text-3xl text-white">
                {formatDelta(after.weightKg - before.weightKg)}
              </span>
              <span className="text-sm text-ink-400">
                {t("progress.betweenDates", {
                  from: dateFormat.format(new Date(before.takenAt)),
                  to: dateFormat.format(new Date(after.takenAt)),
                })}
              </span>
            </p>
          )}
        </section>
      )}

      <ol className="relative mt-8 border-l border-white/10 pl-6">
        {rows.map((row) => {
          const key =
            row.kind === "entry" ? `entry-${row.entry.id}` : `milestone-${row.milestone.id}`;

          return (
            <li key={key} className="relative pb-8 last:pb-0">
              <span
                aria-hidden
                className={clsx(
                  "absolute -left-[1.6875rem] top-1.5 h-3 w-3 rounded-full ring-4 ring-ink-950",
                  row.kind === "milestone"
                    ? toneDot(row.milestone.tone)
                    : "bg-white/30",
                )}
              />

              <p className="text-xs uppercase tracking-wider text-ink-500">
                {dateFormat.format(new Date(row.date))}
              </p>

              {row.kind === "milestone" ? (
                <div className="mt-1.5">
                  <p className="font-head text-base text-white">{row.milestone.label}</p>
                  {row.milestone.detail && (
                    <p className="mt-1 text-sm text-ink-400">{row.milestone.detail}</p>
                  )}
                </div>
              ) : (
                <EntryCard
                  entry={row.entry}
                  onEdit={onEdit}
                  onComment={onComment ? () => setCommenting(row.entry) : undefined}
                  onZoom={(url) => setZoomed({ url, date: row.entry.takenAt })}
                />
              )}
            </li>
          );
        })}

        {rows.length === 0 && (
          <li className="text-sm text-ink-400">{t("progress.empty")}</li>
        )}
      </ol>

      {/* A photograph of somebody's own body is looked at closely or not at
          all; a 80px thumbnail is a filing system, not a view of it. */}
      <PortalModal
        open={Boolean(zoomed)}
        onClose={() => setZoomed(null)}
        title={zoomed ? dateFormat.format(new Date(zoomed.date)) : ""}
        size="lg"
      >
        {zoomed && (
          // Not `next/image`: the dialog has no fixed box to fill, and the
          // point is to see the photograph at whatever size it actually is.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={zoomed.url}
            alt=""
            className="mx-auto max-h-[70vh] w-auto rounded-card object-contain"
          />
        )}
      </PortalModal>

      <CommentDialog
        entry={commenting}
        onClose={() => setCommenting(null)}
        onSubmit={async (entry, body) => {
          await onComment?.(entry, body);
          setCommenting(null);
        }}
        format={dateFormat}
      />
    </div>
  );
}

/**
 * The trainer's remark on one point.
 *
 * A dialog rather than a prompt: a remark on somebody's progress is two
 * sentences with a line break in them, and `window.prompt` gives one line, no
 * formatting, no cancel that means anything, and a look that belongs to 1998.
 */
function CommentDialog({
  entry,
  onClose,
  onSubmit,
  format,
}: {
  entry: ProgressEntry | null;
  onClose: () => void;
  onSubmit: (entry: ProgressEntry, body: string) => Promise<void>;
  format: Intl.DateTimeFormat;
}) {
  const { t } = useTranslation("common");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  // Opening it on a different point must not carry the previous text over.
  useEffect(() => {
    setBody(entry?.trainerNote ?? "");
  }, [entry]);

  return (
    <PortalModal
      open={Boolean(entry)}
      onClose={onClose}
      title={t("progress.commentTitle")}
      description={entry ? format.format(new Date(entry.takenAt)) : undefined}
    >
      {entry && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            try {
              await onSubmit(entry, body.trim());
            } finally {
              setBusy(false);
            }
          }}
        >
          {/* What the client wrote, so the remark answers it rather than
              floating beside it. */}
          {entry.note && (
            <p className="mb-4 rounded-card bg-white/5 px-4 py-3 text-sm leading-relaxed text-ink-300">
              {entry.note}
            </p>
          )}

          <TextArea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={5}
            placeholder={t("progress.commentPlaceholder")}
            autoFocus
          />

          <div className="mt-4 flex gap-2">
            <PortalButton type="submit" loading={busy}>
              {t("actions.save")}
            </PortalButton>
            <PortalButton type="button" variant="ghost" onClick={onClose}>
              {t("actions.cancel")}
            </PortalButton>
          </div>
        </form>
      )}
    </PortalModal>
  );
}

function ComparisonSide({
  entry,
  label,
  format,
  onZoom,
}: {
  entry: ProgressEntry;
  label: string;
  format: Intl.DateTimeFormat;
  onZoom: (url: string) => void;
}) {
  const photo = entry.photos?.[0];

  return (
    <figure className="overflow-hidden rounded-card border border-white/10 bg-ink-950">
      <button
        type="button"
        onClick={() => photo && onZoom(photo.url)}
        disabled={!photo}
        className="relative block aspect-3/4 w-full"
      >
        {photo ? (
          <Image
            src={photo.url}
            alt={label}
            fill
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-ink-600">
            <CameraIcon className="h-8 w-8" aria-hidden />
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ink-950/80 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-white">
          {label}
        </span>
      </button>

      <figcaption className="flex items-baseline justify-between gap-3 px-4 py-3">
        <span className="text-xs text-ink-400">{format.format(new Date(entry.takenAt))}</span>
        {entry.weightKg != null && (
          <span className="font-head text-lg text-white">{entry.weightKg} kg</span>
        )}
      </figcaption>
    </figure>
  );
}

function EntryCard({
  entry,
  onEdit,
  onComment,
  onZoom,
}: {
  entry: ProgressEntry;
  onEdit?: (entry: ProgressEntry) => void;
  onComment?: () => void;
  onZoom: (url: string) => void;
}) {
  const { t } = useTranslation("common");
  const measurements = Object.entries(entry.measurements ?? {});

  return (
    <div className="mt-2 rounded-card border border-white/10 bg-ink-900 p-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {entry.weightKg != null && (
          <p className="flex items-baseline gap-2">
            <ScaleIcon className="h-4 w-4 self-center text-ink-500" aria-hidden />
            <span className="font-head text-xl text-white">{entry.weightKg} kg</span>
            {entry.deltaFromPrevious != null && entry.deltaFromPrevious !== 0 && (
              <span className="text-xs text-ink-400">{formatDelta(entry.deltaFromPrevious)}</span>
            )}
          </p>
        )}

        {measurements.map(([key, value]) => (
          <p key={key} className="text-sm text-ink-300">
            <span className="text-ink-500">{t(`progress.measure.${key}`, key)}</span>{" "}
            {value} cm
          </p>
        ))}
      </div>

      {(entry.photos?.length ?? 0) > 0 && (
        <ul className="mt-4 flex gap-2">
          {(entry.photos ?? []).map((photo) => (
            <li key={photo.url}>
              <button
                type="button"
                onClick={() => onZoom(photo.url)}
                aria-label={t("progress.enlarge")}
                className="group relative block h-28 w-24 overflow-hidden rounded-lg border border-white/10 transition-colors hover:border-acid-500"
              >
                <Image
                  src={photo.url}
                  alt={photo.pose ?? ""}
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-ink-950/0 transition-colors group-hover:bg-ink-950/40">
                  <MagnifyingGlassPlusIcon
                    className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {entry.note && <p className="mt-3 text-sm leading-relaxed text-ink-300">{entry.note}</p>}

      {entry.trainerNote && (
        <p className="mt-3 flex gap-2 rounded-lg bg-acid-500/8 px-3 py-2.5 text-sm leading-relaxed text-acid-200 ring-1 ring-inset ring-acid-500/20">
          <ChatBubbleBottomCenterTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-acid-500" aria-hidden />
          {entry.trainerNote}
        </p>
      )}

      {(onEdit || onComment) && (
        <div className="mt-3 flex gap-3 text-xs">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(entry)}
              className="min-h-8 text-ink-400 underline-offset-4 hover:text-white hover:underline"
            >
              {t("actions.edit")}
            </button>
          )}
          {onComment && (
            <button
              type="button"
              onClick={onComment}
              className="min-h-8 text-acid-400 underline-offset-4 hover:underline"
            >
              {entry.trainerNote ? t("progress.editComment") : t("progress.addComment")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PhotoSelect({
  value,
  options,
  format,
  onChange,
  label,
}: {
  value: number;
  options: ProgressEntry[];
  format: Intl.DateTimeFormat;
  onChange: (id: number) => void;
  label: string;
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 rounded-full border border-white/12 bg-ink-950 px-3 text-xs text-white focus:border-acid-500 focus:outline-none"
      >
        {options.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {format.format(new Date(entry.takenAt))}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * `-6 kg`, `+1.4 kg`, `0 kg`.
 *
 * Signed and uncoloured on purpose — see the class note: down is not "good",
 * and a green minus sign tells a client gaining muscle that they are failing.
 */
function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded} kg`;
}

function toneDot(tone: Milestone["tone"]): string {
  if (tone === "good") return "bg-acid-500";
  if (tone === "attention") return "bg-flare-500";
  return "bg-ink-500";
}
