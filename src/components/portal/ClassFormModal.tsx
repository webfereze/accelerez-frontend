import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import PortalModal from "./Modal";
import { Field, PortalButton, SelectInput, TextArea, TextInput } from "./Field";
import { api, apiErrorMessage } from "@/utils/api";
import { specializationKey } from "@/utils/labels";
import { SPECIALIZATIONS, type Specialization, type TrainingClass } from "@/types/content";

/**
 * A trainer creating or editing one of their own classes.
 *
 * **Romanian only, on purpose.** A coach writing their own class writes it once,
 * in their own language; the Hungarian and English versions are an editorial job
 * and live in the admin, where somebody can be asked to do them. Asking a
 * trainer to fill three tabs before their Tuesday session exists is how the
 * feature goes unused — the same reasoning as the profile screen.
 *
 * **The weekdays are why this form is worth having.** They are what turns "marți
 * și joi" into a date the client's account can count down to; the sentence
 * beside them is what carries the nuance neither field can.
 *
 * Two fields are missing and both belong to the platform: whether the class
 * leads the home page, and where it sits against every other class. See
 * `UpdateOwnClassDto`.
 */

type Draft = {
  title: string;
  excerpt: string;
  scheduleText: string;
  weekdays: number[];
  startTime: string;
  durationMinutes: string;
  location: TrainingClass["location"];
  place: string;
  city: string;
  meetingUrl: string;
  pricePerSession: string;
  pricePerMonth: string;
  currency: string;
  capacity: string;
  specializations: Specialization[];
  image: string;
  status: "draft" | "published";
};

const EMPTY: Draft = {
  title: "",
  excerpt: "",
  scheduleText: "",
  weekdays: [],
  startTime: "",
  durationMinutes: "",
  location: "gym",
  place: "",
  city: "",
  meetingUrl: "",
  pricePerSession: "",
  pricePerMonth: "",
  currency: "RON",
  capacity: "",
  specializations: [],
  image: "",
  status: "draft",
};

export default function ClassFormModal({
  open,
  item,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** Null when creating. */
  item: TrainingClass | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on every open, or editing one class then creating another carries
  // the first one's fields into the new form.
  useEffect(() => {
    if (!open) return;
    setError(null);

    setDraft(
      item
        ? {
            title: item.title?.ro ?? "",
            excerpt: item.excerpt?.ro ?? "",
            scheduleText: item.scheduleText?.ro ?? "",
            weekdays: item.weekdays ?? [],
            startTime: item.startTime ?? "",
            durationMinutes: item.durationMinutes ? String(item.durationMinutes) : "",
            location: item.location ?? "gym",
            place: item.place ?? "",
            city: item.city ?? "",
            meetingUrl: item.meetingUrl ?? "",
            pricePerSession: item.pricePerSession != null ? String(item.pricePerSession) : "",
            pricePerMonth: item.pricePerMonth != null ? String(item.pricePerMonth) : "",
            currency: item.currency ?? "RON",
            capacity: item.capacity != null ? String(item.capacity) : "",
            specializations: item.specializations ?? [],
            image: item.image ?? "",
            status: item.status === "published" ? "published" : "draft",
          }
        : EMPTY,
    );
  }, [open, item]);

  const patch = (changes: Partial<Draft>) => setDraft((value) => ({ ...value, ...changes }));

  async function upload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post<{ url: string }>("/upload/image", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      patch({ image: data.url });
    } catch (caught) {
      setError(apiErrorMessage(caught, t("messages.uploadFailed")));
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const payload = {
      title: { ro: draft.title.trim() },
      excerpt: { ro: draft.excerpt.trim() },
      scheduleText: { ro: draft.scheduleText.trim() },
      weekdays: draft.weekdays,
      startTime: draft.startTime || null,
      durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : null,
      location: draft.location,
      place: draft.location === "online" ? null : draft.place.trim() || null,
      city: draft.location === "online" ? null : draft.city.trim() || null,
      meetingUrl: draft.location === "online" ? draft.meetingUrl.trim() || null : null,
      // Empty becomes null, never 0 — "no stated price" is not "free".
      pricePerSession: draft.pricePerSession ? Number(draft.pricePerSession) : null,
      pricePerMonth: draft.pricePerMonth ? Number(draft.pricePerMonth) : null,
      currency: draft.currency || "RON",
      capacity: draft.capacity ? Number(draft.capacity) : null,
      specializations: draft.specializations,
      image: draft.image || null,
      status: draft.status,
      publishedLocales: ["ro"],
    };

    try {
      if (item) {
        await api.put(`/portal/trainer/classes/${item.id}`, payload);
      } else {
        await api.post("/portal/trainer/classes", payload);
      }
      await onSaved();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("portal.trainer.classSaveFailed")));
    } finally {
      setBusy(false);
    }
  }

  const online = draft.location === "online";

  return (
    <PortalModal
      open={open}
      onClose={onClose}
      title={item ? t("portal.trainer.editClass") : t("portal.trainer.newClass")}
      description={t("portal.trainer.classFormHint")}
      size="lg"
    >
      <form onSubmit={save} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
            {error}
          </p>
        )}

        <Field label={t("classes.name")} required>
          <TextInput
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
            required
            minLength={2}
            autoFocus
          />
        </Field>

        <Field label={t("classes.excerptLabel")} hint={t("classes.excerptHint")}>
          <TextArea
            value={draft.excerpt}
            onChange={(event) => patch({ excerpt: event.target.value })}
            rows={3}
          />
        </Field>

        {/* The days and the time are what "next training" is computed from. */}
        <div>
          <p className="mb-2 text-sm font-medium text-ink-200">{t("classes.days")}</p>
          <ul className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const on = draft.weekdays.includes(day);
              return (
                <li key={day}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      patch({
                        weekdays: on
                          ? draft.weekdays.filter((value) => value !== day)
                          : [...draft.weekdays, day].sort((a, b) => a - b),
                      })
                    }
                    className={clsx(
                      "min-h-10 min-w-12 rounded-full px-3 text-xs font-medium transition-colors",
                      on
                        ? "bg-acid-500 text-ink-950"
                        : "border border-white/12 text-ink-300 hover:border-white/30 hover:text-white",
                    )}
                  >
                    {t(`weekday.${day}`)}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-ink-500">{t("classes.daysHint")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("classes.startTime")}>
            <TextInput
              type="time"
              value={draft.startTime}
              onChange={(event) => patch({ startTime: event.target.value })}
            />
          </Field>
          <Field label={t("classes.duration")} hint={t("classes.durationHint")}>
            <TextInput
              type="number"
              value={draft.durationMinutes}
              onChange={(event) => patch({ durationMinutes: event.target.value })}
            />
          </Field>
          <Field label={t("classes.capacity")} hint={t("classes.capacityHint")}>
            <TextInput
              type="number"
              value={draft.capacity}
              onChange={(event) => patch({ capacity: event.target.value })}
            />
          </Field>
        </div>

        <Field label={t("classes.schedule")} hint={t("classes.scheduleHint")}>
          <TextInput
            value={draft.scheduleText}
            onChange={(event) => patch({ scheduleText: event.target.value })}
            placeholder="Marți și joi · 18:00"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("classes.locationLabel")}>
            <SelectInput
              value={draft.location}
              onChange={(event) =>
                patch({ location: event.target.value as TrainingClass["location"] })
              }
            >
              <option value="gym">{t("classes.location.gym")}</option>
              <option value="outdoor">{t("classes.location.outdoor")}</option>
              <option value="online">{t("classes.location.online")}</option>
              <option value="other">{t("classes.location.other")}</option>
            </SelectInput>
          </Field>

          {online ? (
            <div className="sm:col-span-2">
              <Field label={t("classes.meetingUrl")} hint={t("classes.meetingUrlHint")}>
                <TextInput
                  type="url"
                  value={draft.meetingUrl}
                  onChange={(event) => patch({ meetingUrl: event.target.value })}
                  placeholder="https://meet.google.com/…"
                />
              </Field>
            </div>
          ) : (
            <>
              <Field label={t("classes.place")}>
                <TextInput
                  value={draft.place}
                  onChange={(event) => patch({ place: event.target.value })}
                />
              </Field>
              <Field label={t("trainers.city")}>
                <TextInput
                  value={draft.city}
                  onChange={(event) => patch({ city: event.target.value })}
                />
              </Field>
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("classes.pricePerSession")}>
            <TextInput
              type="number"
              value={draft.pricePerSession}
              onChange={(event) => patch({ pricePerSession: event.target.value })}
            />
          </Field>
          <Field label={t("classes.pricePerMonth")}>
            <TextInput
              type="number"
              value={draft.pricePerMonth}
              onChange={(event) => patch({ pricePerMonth: event.target.value })}
            />
          </Field>
          <Field label={t("trainers.currency")}>
            <TextInput
              value={draft.currency}
              onChange={(event) => patch({ currency: event.target.value.toUpperCase() })}
            />
          </Field>
        </div>
        <p className="-mt-2 text-xs text-ink-500">{t("classes.priceHint")}</p>

        <div>
          <p className="mb-2 text-sm font-medium text-ink-200">
            {t("trainers.specializations")}
          </p>
          <ul className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((value) => {
              const on = draft.specializations.includes(value);
              return (
                <li key={value}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      patch({
                        specializations: on
                          ? draft.specializations.filter((row) => row !== value)
                          : [...draft.specializations, value],
                      })
                    }
                    className={clsx(
                      "min-h-9 rounded-full px-3.5 text-xs font-medium transition-colors",
                      on
                        ? "bg-acid-500 text-ink-950"
                        : "border border-white/12 text-ink-300 hover:border-white/30 hover:text-white",
                    )}
                  >
                    {t(specializationKey(value))}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <Field label={t("classes.imageLabel")} hint={t("classes.imageHintPortal")}>
          <div className="flex items-center gap-4">
            {draft.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.image}
                alt=""
                className="h-20 w-16 rounded-card object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => upload(event.target.files?.[0] ?? null)}
              className="block w-full text-sm text-ink-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
            />
          </div>
        </Field>

        <Field label={t("payments.status")} hint={t("classes.statusHint")}>
          <SelectInput
            value={draft.status}
            onChange={(event) => patch({ status: event.target.value as Draft["status"] })}
          >
            <option value="draft">{t("common.draft")}</option>
            <option value="published">{t("common.published")}</option>
          </SelectInput>
        </Field>

        <div className="flex flex-wrap gap-2 pt-1">
          <PortalButton type="submit" loading={busy || uploading}>
            {busy ? t("actions.saving") : t("actions.save")}
          </PortalButton>
          <PortalButton type="button" variant="ghost" onClick={onClose}>
            {t("actions.cancel")}
          </PortalButton>
        </div>
      </form>
    </PortalModal>
  );
}
