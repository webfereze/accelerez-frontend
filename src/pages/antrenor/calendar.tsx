import { useCallback, useEffect, useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import { Pill } from "@/components/portal/Field";
import { TRAINER_NAV } from "./index";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { useTrainerBadges } from "@/hooks/useTrainerBadges";
import { api } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import type { AgendaOccurrence } from "@/types/content";

/** How far ahead the coach can look. Two weeks is the default — see below. */
const WINDOWS = [7, 14, 30];

/**
 * The trainer's calendar: every time one of their classes runs, in order.
 *
 * **Two weeks by default, not a month grid.** A month grid is the shape a
 * calendar takes when most days have something on them; a coach with three
 * weekly classes would get a page of empty boxes and four small ones with text
 * in. What they actually ask is "what have I got, and who is coming" — which is
 * a list, with the days that have nothing on them left out entirely.
 *
 * Occurrences are computed from each class's schedule — see `AgendaService`.
 * A class with no weekdays and no hour has no dates and appears nowhere here;
 * the note at the foot says so, because the alternative is a coach who thinks
 * the calendar is broken when it is the class that is unscheduled.
 *
 * **The attendee list separates accepted from merely registered.** Anybody with
 * an account can join a class, but only a client this coach has accepted gets
 * the link and the way in. The number in the header is the one that will turn
 * up; the pink chip is the one waiting on the coach.
 */
export default function TrainerCalendar() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const { user, ready } = usePortalAuth("trainer");
  const badges = useTrainerBadges(ready);

  const [days, setDays] = useState(14);
  const [rows, setRows] = useState<AgendaOccurrence[] | null>(null);
  /** Which occurrence has its attendee list open, by `classId` + `at`. */
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async (window: number) => {
    setRows(null);
    const { data } = await api.get<AgendaOccurrence[]>("/portal/trainer/agenda", {
      params: { days: window },
    });
    setRows(data);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void load(days);
  }, [ready, days, load]);

  /** The list, cut into days — the heading is the day, the rows are the hours. */
  const grouped = useMemo(() => {
    const out: Array<{ day: string; items: AgendaOccurrence[] }> = [];

    for (const row of rows ?? []) {
      const last = out[out.length - 1];
      if (last && last.day === row.day) last.items.push(row);
      else out.push({ day: row.day, items: [row] });
    }

    return out;
  }, [rows]);

  if (!ready) return <PortalChecking />;

  return (
    <>
      <Head>
        <title>{`${t("portal.trainer.nav.calendar")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={TRAINER_NAV(t, badges)}
        title={t("portal.trainer.calendarTitle")}
        lead={t("portal.trainer.calendarLead")}
        actions={
          <div className="flex items-center gap-1 rounded-full border border-white/12 p-1">
            {WINDOWS.map((window) => (
              <button
                key={window}
                type="button"
                onClick={() => setDays(window)}
                aria-pressed={days === window}
                className={
                  days === window
                    ? "rounded-full bg-acid-500 px-3.5 py-1.5 text-xs font-semibold text-ink-950"
                    : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink-400 transition-colors hover:text-white"
                }
              >
                {t("portal.trainer.nextDays", { count: window })}
              </button>
            ))}
          </div>
        }
      >
        {rows === null ? (
          <p className="text-sm text-ink-400">{t("portal.loading")}</p>
        ) : grouped.length === 0 ? (
          <div className="rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-14 text-center">
            <p className="font-head text-xl text-white">{t("portal.trainer.noAgenda")}</p>
            <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">
              {t("portal.trainer.noAgendaText")}
            </p>
            <Link
              href="/antrenor/clase"
              className="mt-7 inline-flex min-h-11 items-center rounded-full bg-acid-500 px-6 text-sm font-semibold text-ink-950 transition-colors hover:bg-acid-400"
            >
              {t("portal.trainer.nav.classes")}
            </Link>
          </div>
        ) : (
          <ol className="space-y-9">
            {grouped.map((group) => (
              <li key={group.day}>
                <h2 className="flex flex-wrap items-baseline gap-3 border-b border-white/10 pb-2">
                  <span className="font-head text-lg text-white">
                    {longDay(group.day, lang)}
                  </span>
                  {relativeDay(group.day, t) && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-acid-400">
                      {relativeDay(group.day, t)}
                    </span>
                  )}
                </h2>

                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => {
                    const key = `${item.classId}-${item.at}`;
                    const expanded = open === key;

                    return (
                      <li
                        key={key}
                        className="rounded-panel border border-white/10 bg-ink-900 p-4"
                      >
                        <div className="flex flex-wrap items-start gap-4">
                          {/* The hour first and largest: on a day with three
                              classes it is the only thing being compared. */}
                          <span className="font-head text-2xl leading-none text-acid-500">
                            {item.time}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h3 className="font-head text-lg text-white">
                                {item.status === "published" ? (
                                  <Link
                                    href={`/clase/${slugIn(item.slug, lang)}`}
                                    target="_blank"
                                    className="underline-offset-4 hover:underline"
                                  >
                                    {tr(item.title, lang)}
                                  </Link>
                                ) : (
                                  tr(item.title, lang)
                                )}
                              </h3>

                              {item.status === "draft" && (
                                <Pill tone="bg-white/10 text-ink-300 ring-1 ring-inset ring-white/15">
                                  {t("common.draft")}
                                </Pill>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-400">
                              {item.durationMinutes && (
                                <span className="flex items-center gap-1.5">
                                  <ClockIcon className="h-4 w-4" aria-hidden />
                                  {t("classes.minutes", { count: item.durationMinutes })}
                                </span>
                              )}

                              {item.location === "online" ? (
                                <span className="flex items-center gap-1.5 text-ink-300">
                                  <VideoCameraIcon className="h-4 w-4" aria-hidden />
                                  {t("classes.onlineClass")}
                                </span>
                              ) : (
                                (item.place || item.city) && (
                                  <span className="flex items-center gap-1.5">
                                    <MapPinIcon className="h-4 w-4" aria-hidden />
                                    {[item.place, item.city].filter(Boolean).join(", ")}
                                  </span>
                                )
                              )}

                              <button
                                type="button"
                                onClick={() => setOpen(expanded ? null : key)}
                                aria-expanded={expanded}
                                className="flex items-center gap-1.5 font-semibold text-acid-400 underline-offset-4 hover:underline"
                              >
                                <UserGroupIcon className="h-4 w-4" aria-hidden />
                                {item.capacity
                                  ? t("portal.trainer.comingOf", {
                                      count: item.acceptedCount,
                                      capacity: item.capacity,
                                    })
                                  : t("portal.trainer.coming", { count: item.acceptedCount })}
                              </button>

                              {/* Only the coach ever sees this, and only for
                                  an online class — it is the room they open. */}
                              {item.location === "online" && item.meetingUrl && (
                                <a
                                  href={item.meetingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
                                >
                                  {t("classes.joinOnline")}
                                </a>
                              )}
                            </div>

                            {expanded && (
                              <ul className="mt-4 space-y-2 border-t border-white/8 pt-4">
                                {item.attendees.length === 0 ? (
                                  <li className="text-sm text-ink-500">
                                    {t("portal.trainer.noMembers")}
                                  </li>
                                ) : (
                                  item.attendees.map((person) => (
                                    <li
                                      key={person.memberId}
                                      className="flex flex-wrap items-center gap-3"
                                    >
                                      <span className="flex-1 truncate text-sm text-white">
                                        {person.name}
                                      </span>

                                      {person.accepted ? (
                                        <Pill tone="bg-acid-500/15 text-acid-400 ring-1 ring-inset ring-acid-500/30">
                                          {t("portal.trainer.memberAccepted")}
                                        </Pill>
                                      ) : (
                                        <Pill tone="bg-flare-500/15 text-flare-400 ring-1 ring-inset ring-flare-500/30">
                                          {t("portal.trainer.memberNotAccepted")}
                                        </Pill>
                                      )}
                                    </li>
                                  ))
                                )}
                              </ul>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        )}

        {rows !== null && (
          <p className="mt-10 max-w-2xl text-xs leading-relaxed text-ink-500">
            {t("portal.trainer.calendarNote")}
          </p>
        )}
      </PortalLayout>
    </>
  );
}

/** `marți, 23 septembrie` — the weekday first, because that is how it is read. */
function longDay(value: string, locale: string): string {
  const [year, month, day] = value.split("-").map(Number);

  return new Intl.DateTimeFormat(locale === "ro" ? "ro-RO" : locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, (month ?? 1) - 1, day ?? 1));
}

/** "Azi" / "Mâine", or nothing. Compared as day strings, never as instants. */
function relativeDay(value: string, t: (key: string) => string): string | null {
  const now = new Date();
  const asDay = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

  if (value === asDay(now)) return t("schedule.todayShort");

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (value === asDay(tomorrow)) return t("schedule.tomorrowShort");

  return null;
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
