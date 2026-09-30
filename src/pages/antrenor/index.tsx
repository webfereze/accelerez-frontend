import { useCallback, useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  RectangleGroupIcon,
  RectangleStackIcon,
  UserGroupIcon,
  UserIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import { Pill, PortalButton } from "@/components/portal/Field";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { api } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { ENROLLMENT_TONE, enrollmentStatusKey } from "@/utils/labels";
import { formatDay } from "@/utils/dates";
import type { Enrollment, TrainerOverview } from "@/types/content";

type Overview = TrainerOverview & { unreadMessages: number };
type ClientRow = Enrollment & { unreadMessages?: number };

/**
 * The trainer's dashboard.
 *
 * **Four numbers, and each one is somebody waiting.** Requests nobody has
 * answered, months nobody has confirmed, videos nobody has replied to, messages
 * nobody has read — a coach opens this screen to find out what they owe
 * somebody, and anything that is not that is noise on it.
 *
 * Pending requests are listed in full rather than counted, because accepting a
 * client is one tap and burying it behind a second screen is how a request sits
 * for three days.
 */
export default function TrainerDashboard() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { user, ready } = usePortalAuth("trainer");

  const [overview, setOverview] = useState<Overview | null>(null);
  const [pending, setPending] = useState<ClientRow[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [summary, requests] = await Promise.all([
      api.get<Overview>("/portal/trainer/overview").then((r) => r.data),
      api
        .get<{ rows: ClientRow[] }>("/portal/trainer/clients", {
          params: { status: "pending", perPage: 20 },
        })
        .then((r) => r.data.rows),
    ]);

    setOverview(summary);
    setPending(requests);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function answer(id: number, status: "active" | "declined") {
    setBusy(id);
    try {
      await api.patch(`/portal/trainer/clients/${id}`, { status });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (!ready) return <PortalChecking />;

  return (
    <>
      <Head>
        <title>{`${t("portal.trainer.title")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={TRAINER_NAV(t, overview)}
        title={t("portal.trainer.greeting", { name: user?.firstName ?? "" })}
        lead={t("portal.trainer.lead")}
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={t("portal.trainer.activeClients")}
            value={overview?.active ?? 0}
            Icon={UserGroupIcon}
            href="/antrenor/cursanti"
          />
          <Stat
            label={t("portal.trainer.unpaid")}
            value={overview?.unpaidThisMonth ?? 0}
            Icon={BanknotesIcon}
            href="/antrenor/cursanti"
            urgent={(overview?.unpaidThisMonth ?? 0) > 0}
          />
          <Stat
            label={t("portal.trainer.pendingVideos")}
            value={overview?.pendingVideos ?? 0}
            Icon={VideoCameraIcon}
            href="/antrenor/cursanti"
            urgent={(overview?.pendingVideos ?? 0) > 0}
          />
          <Stat
            label={t("portal.trainer.unreadMessages")}
            value={overview?.unreadMessages ?? 0}
            Icon={ChatBubbleLeftRightIcon}
            href="/antrenor/cursanti"
            urgent={(overview?.unreadMessages ?? 0) > 0}
          />
        </ul>

        {pending.length > 0 && (
          <section className="mt-10">
            <h2 className="font-head text-xl text-white">
              {t("portal.trainer.requests", { count: pending.length })}
            </h2>
            <p className="mt-1.5 text-sm text-ink-400">{t("portal.trainer.requestsLead")}</p>

            <ul className="mt-5 space-y-4">
              {pending.map((row) => (
                <li
                  key={row.id}
                  className="rounded-panel border border-flare-500/20 bg-ink-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-head text-base text-white">
                        {[row.client?.firstName, row.client?.lastName]
                          .filter(Boolean)
                          .join(" ") || row.client?.email}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">{row.client?.email}</p>
                    </div>
                    <Pill tone={ENROLLMENT_TONE.pending}>
                      {t(enrollmentStatusKey("pending"))}
                    </Pill>
                  </div>

                  {row.goal && (
                    <p className="mt-3 whitespace-pre-line rounded-card bg-white/5 px-4 py-3 text-sm leading-relaxed text-ink-200">
                      {row.goal}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <PortalButton
                      type="button"
                      onClick={() => answer(row.id, "active")}
                      loading={busy === row.id}
                    >
                      {t("portal.trainer.accept")}
                    </PortalButton>
                    <PortalButton
                      type="button"
                      variant="ghost"
                      onClick={() => answer(row.id, "declined")}
                      disabled={busy === row.id}
                    >
                      {t("portal.trainer.decline")}
                    </PortalButton>
                    <Link href={`/antrenor/cursanti/${row.client?.slug ?? row.id}`}>
                      <PortalButton type="button" variant="ghost">
                        {t("portal.trainer.open")}
                      </PortalButton>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(overview?.unpaidClients?.length ?? 0) > 0 && (
          <section className="mt-10">
            <h2 className="font-head text-xl text-white">{t("portal.trainer.chase")}</h2>
            <p className="mt-1.5 text-sm text-ink-400">{t("portal.trainer.chaseLead")}</p>

            <ul className="mt-5 divide-y divide-white/8 overflow-hidden rounded-panel border border-white/10">
              {(overview?.unpaidClients ?? []).map((row) => (
                <li
                  key={row.enrollmentId}
                  className="flex flex-wrap items-center gap-3 bg-ink-900 px-5 py-4"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {row.name}
                    </span>
                    <span className="block truncate text-xs text-ink-500">{row.email}</span>
                  </span>

                  <span className="text-xs text-flare-400">
                    {row.lastEndedOn
                      ? t("portal.trainer.expiredOn", {
                          date: formatDay(row.lastEndedOn, locale ?? "ro"),
                        })
                      : t("portal.trainer.noPeriod")}
                  </span>

                  <Link
                    href={`/antrenor/cursanti/${row.slug ?? row.enrollmentId}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs font-semibold text-white transition-colors hover:border-acid-500 hover:text-acid-400"
                  >
                    {t("portal.trainer.markMonth")}
                    <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {overview && overview.active === 0 && pending.length === 0 && (
          <div className="mt-10 rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-14 text-center">
            <p className="font-head text-xl text-white">{t("portal.trainer.emptyTitle")}</p>
            <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">
              {t("portal.trainer.emptyText")}
            </p>
          </div>
        )}
      </PortalLayout>
    </>
  );
}

function Stat({
  label,
  value,
  Icon,
  href,
  urgent = false,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
  urgent?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-panel border border-white/10 bg-ink-900 p-5 transition-colors hover:border-white/25"
      >
        <Icon className={urgent ? "h-5 w-5 text-flare-400" : "h-5 w-5 text-acid-500"} aria-hidden />
        <p className="mt-3 font-head text-3xl text-white">{value}</p>
        <p className="mt-1 text-sm text-ink-400">{label}</p>
      </Link>
    </li>
  );
}

/**
 * The trainer's rail. Exported so every trainer screen shows the same one, with
 * the same badges — a count that appears on one screen and not the next is a
 * count nobody trusts.
 */
export const TRAINER_NAV = (
  t: (key: string) => string,
  overview?: { unreadMessages?: number; pendingVideos?: number; pending?: number } | null,
) => [
  { href: "/antrenor", label: t("portal.trainer.nav.home"), Icon: HomeIcon },
  {
    href: "/antrenor/cursanti",
    label: t("portal.trainer.nav.clients"),
    Icon: UserGroupIcon,
    // Everything waiting on the coach, in one number: unread messages,
    // unanswered recordings and requests nobody has answered.
    badge:
      (overview?.unreadMessages ?? 0) +
        (overview?.pendingVideos ?? 0) +
        (overview?.pending ?? 0) || undefined,
  },
  {
    href: "/antrenor/calendar",
    label: t("portal.trainer.nav.calendar"),
    Icon: CalendarDaysIcon,
  },
  { href: "/antrenor/clase", label: t("portal.trainer.nav.classes"), Icon: RectangleGroupIcon },
  { href: "/antrenor/materiale", label: t("portal.trainer.nav.library"), Icon: RectangleStackIcon },
  { href: "/antrenor/profil", label: t("portal.trainer.nav.profile"), Icon: UserIcon },
];

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
