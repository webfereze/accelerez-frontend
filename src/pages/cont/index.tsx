import { useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import { Pill, PortalButton } from "@/components/portal/Field";
import MonthProgress from "@/components/portal/MonthProgress";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { api } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { ENROLLMENT_TONE, enrollmentStatusKey, money } from "@/utils/labels";
import { formatDay } from "@/utils/dates";
import { formatNext } from "@/utils/schedule";
import type { ClientClass, ClientEnrollment } from "@/types/content";

/**
 * The client's dashboard: every trainer they are enrolled with, and whether
 * each one's material is open right now.
 *
 * **The access state is the headline of every card**, not a detail inside it.
 * "Luna septembrie nu e confirmată" is the single most useful sentence this
 * screen can say, and a client who has to open a sub-page to find it will
 * instead write to support.
 *
 * A client with no enrolment sees the directory, not an empty list: the next
 * step is always the thing on the screen.
 */
export default function ClientDashboard() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { user, ready } = usePortalAuth("client");

  const [rows, setRows] = useState<ClientEnrollment[] | null>(null);
  const [classes, setClasses] = useState<ClientClass[]>([]);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    void api
      .get<ClientEnrollment[]>("/portal/client/overview")
      .then(({ data }) => !cancelled && setRows(data))
      .catch(() => !cancelled && setRows([]));

    void api
      .get<ClientClass[]>("/portal/client/classes")
      .then(({ data }) => !cancelled && setClasses(data))
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [ready]);

  /**
   * The soonest class this person is actually admitted to.
   *
   * A class they registered for but were never accepted into has no link and no
   * confirmed place, so counting it down would promise something nobody agreed
   * to. The API sorts by date; this picks the first accepted one.
   */
  const next = classes.find((row) => row.accepted && row.nextAt);

  if (!ready) return <PortalChecking />;

  return (
    <>
      <Head>
        <title>{`${t("portal.client.title")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={CLIENT_NAV(t)}
        title={t("portal.client.greeting", { name: user?.firstName ?? "" })}
        lead={t("portal.client.lead")}
        actions={
          <Link href="/antrenori">
            <PortalButton variant="ghost" type="button">
              <MagnifyingGlassIcon className="h-4 w-4" aria-hidden />
              {t("portal.client.findTrainer")}
            </PortalButton>
          </Link>
        }
      >
        {/*
          The next session, above everything.

          It is the one question somebody opens this screen for on a Tuesday
          morning, and it is answered by whichever class comes soonest — the
          list is already sorted that way by the API. With no class that has a
          structured schedule there is nothing to show, and nothing is shown,
          rather than a guess.
        */}
        {next && (
          <section className="mb-8 rounded-panel border border-acid-500/25 bg-acid-500/8 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-acid-400">
              {t("portal.client.nextTraining")}
            </p>

            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-head text-2xl text-white">
                {tr(next.trainingClass.title, locale)}
              </h2>
              <p className="font-head text-lg text-acid-400">
                {formatNext(next.nextAt as string, locale ?? "ro", t)}
              </p>
            </div>

            <p className="mt-2 text-sm text-ink-300">
              {[
                next.trainingClass.location === "online"
                  ? t("classes.onlineClass")
                  : [next.trainingClass.place, next.trainingClass.city]
                      .filter(Boolean)
                      .join(", "),
                next.trainingClass.durationMinutes
                  ? t("classes.minutes", { count: next.trainingClass.durationMinutes })
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            {/* The meeting link is only sent to people who joined — see the
                entity — so its presence here is itself the permission. */}
            {next.trainingClass.meetingUrl && (
              <a
                href={next.trainingClass.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-acid-500 px-5 font-head text-sm font-semibold text-ink-950 transition-colors hover:bg-acid-400"
              >
                <VideoCameraIcon className="h-4 w-4" aria-hidden />
                {t("classes.joinOnline")}
              </a>
            )}
          </section>
        )}

        {rows === null ? (
          <p className="text-sm text-ink-400">{t("portal.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-16 text-center">
            <p className="font-head text-xl text-white">{t("portal.client.emptyTitle")}</p>
            <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">
              {t("portal.client.emptyText")}
            </p>
            <Link
              href="/antrenori"
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
            >
              {t("portal.client.findTrainer")}
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {rows.map((row) => (
              <li key={row.id}>
                <EnrollmentCard row={row} locale={locale ?? "ro"} />
              </li>
            ))}
          </ul>
        )}

        {classes.length > 0 && (
          <section className="mt-12">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-head text-xl text-white">{t("portal.client.myClasses")}</h2>
              <Link
                href="/clase"
                className="text-sm text-ink-400 underline-offset-4 hover:text-white hover:underline"
              >
                {t("portal.client.browseClasses")}
              </Link>
            </div>

            {classes.some((row) => !row.accepted) && (
              <p className="mt-4 rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-sm text-flare-300">
                {t("classes.waitingAccept")}
              </p>
            )}

            <ul className="mt-5 divide-y divide-white/8 overflow-hidden rounded-panel border border-white/10">
              {classes.map((row) => (
                <li
                  key={row.membershipId}
                  className="flex flex-wrap items-center gap-3 bg-ink-900 px-5 py-4"
                >
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/clase/${slugIn(row.trainingClass.slug, locale ?? "ro")}`}
                      className="block truncate text-sm font-semibold text-white hover:text-acid-400"
                    >
                      {tr(row.trainingClass.title, locale)}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">
                      {tr(row.trainingClass.scheduleText, locale)}
                    </span>
                  </span>

                  {row.accepted ? (
                    row.nextAt ? (
                      <span className="text-xs text-acid-400">
                        {formatNext(row.nextAt, locale ?? "ro", t)}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-500">{t("classes.noNextDate")}</span>
                    )
                  ) : (
                    /* Joined, but the coach has not accepted them as a client —
                       so there is no link and no confirmed place yet. */
                    <span className="text-xs text-flare-400">
                      {t("classes.waitingShort")}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      await api.delete(`/portal/client/classes/${row.trainingClass.id}/leave`);
                      const { data } = await api.get<ClientClass[]>("/portal/client/classes");
                      setClasses(data);
                    }}
                    className="text-xs text-ink-500 underline-offset-4 hover:text-flare-400 hover:underline"
                  >
                    {t("classes.leave")}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PortalLayout>
    </>
  );
}

function EnrollmentCard({ row, locale }: { row: ClientEnrollment; locale: string }) {
  const { t } = useTranslation("common");
  const open = row.access.open;

  return (
    <article className="flex h-full flex-col rounded-panel border border-white/10 bg-ink-900 p-5">
      <div className="flex items-start gap-4">
        {row.trainer.photo ? (
          <Image
            src={row.trainer.photo}
            alt={row.trainer.displayName}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <UserCircleIcon className="h-14 w-14 text-ink-700" aria-hidden />
        )}

        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-head text-lg text-white">
            {row.trainer.displayName}
            {row.unreadMessages > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-flare-500 px-1.5 text-[0.68rem] font-semibold text-white">
                {row.unreadMessages}
              </span>
            )}
          </h2>
          {tr(row.trainer.headline, locale) && (
            <p className="mt-1 line-clamp-2 text-sm text-ink-400">
              {tr(row.trainer.headline, locale)}
            </p>
          )}
        </div>

        <Pill tone={ENROLLMENT_TONE[row.status] ?? ENROLLMENT_TONE.ended}>
          {t(enrollmentStatusKey(row.status))}
        </Pill>
      </div>

      {/* How much of the month is left, in the same shape on every screen. */}
      <MonthProgress access={row.access} className="mt-5" />

      {/* The sentence this screen exists for. */}
      <p
        className={clsxTone(open)}
      >
        {open && row.access.endsOn
          ? t("portal.client.openUntil", {
              date: formatDay(row.access.endsOn, locale),
              count: row.access.daysLeft,
            })
          : row.access.reason === "not_active"
            ? t("portal.client.notActive")
            : t("portal.client.noPeriod", {
                price: row.trainer.monthlyPrice
                  ? money(row.trainer.monthlyPrice, row.trainer.currency, locale)
                  : "",
              })}
      </p>

      <div className="mt-auto pt-5">
        <Link
          href={`/cont/${slugIn(row.trainer.slug, locale)}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:border-acid-500 hover:text-acid-400"
        >
          {open ? t("portal.client.openPlan") : t("portal.client.openDetails")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

/** Neon when the month is settled, pink when somebody has to act. */
function clsxTone(open: boolean): string {
  return open
    ? "mt-4 rounded-card border border-acid-500/25 bg-acid-500/10 px-4 py-3 text-sm text-acid-300"
    : "mt-4 rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-sm text-flare-300";
}

/** The client's rail. Exported so the enrolment screen shows the same one. */
export const CLIENT_NAV = (t: (key: string) => string) => [
  { href: "/cont", label: t("portal.client.nav.home"), Icon: HomeIcon },
  { href: "/antrenori", label: t("portal.client.nav.directory"), Icon: MagnifyingGlassIcon },
];

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
