import { useCallback, useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { BellAlertIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import { Pill, SelectInput, TextInput } from "@/components/portal/Field";
import { TRAINER_NAV } from "../index";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { useTrainerBadges } from "@/hooks/useTrainerBadges";
import { api } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { ENROLLMENT_TONE, enrollmentStatusKey } from "@/utils/labels";
import { formatDay } from "@/utils/dates";
import { ENROLLMENT_STATUSES, type Enrollment, type EnrollmentStatus } from "@/types/content";

type Row = Enrollment & { unreadMessages?: number; pendingVideos?: number };

/**
 * One dot, not three.
 *
 * A row can be waiting on the coach for two reasons — an unread message and an
 * unanswered recording — and a badge per reason turns a list of clients into a
 * dashboard. The dot says "something here", the row opens, and the tabs inside
 * say which.
 */
function waitingOn(row: Row): number {
  return (row.unreadMessages ?? 0) + (row.pendingVideos ?? 0);
}

/**
 * A trainer's clients.
 *
 * **The column that matters is the month**, not the name: a coach scanning this
 * list is looking for who has not paid and who is waiting on an answer, and
 * both are states rather than people. The name is how they recognise the row
 * once the state has caught their eye.
 */
export default function TrainerClients() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { user, ready } = usePortalAuth("trainer");
  const badges = useTrainerBadges(ready);

  const [rows, setRows] = useState<Row[] | null>(null);
  const [status, setStatus] = useState<"" | EnrollmentStatus>("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const { data } = await api.get<{ rows: Row[] }>("/portal/trainer/clients", {
      params: { status: status || undefined, search: search || undefined, perPage: 100 },
    });
    setRows(data.rows);
  }, [status, search]);

  useEffect(() => {
    if (!ready) return;
    // Debounced so typing a name is not one request per keystroke.
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [ready, load]);

  if (!ready) return <PortalChecking />;

  const name = (row: Row) =>
    [row.client?.firstName, row.client?.lastName].filter(Boolean).join(" ") ||
    row.client?.email ||
    "—";

  return (
    <>
      <Head>
        <title>{`${t("portal.trainer.nav.clients")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={TRAINER_NAV(t, badges)}
        title={t("portal.trainer.clientsTitle")}
        lead={t("portal.trainer.clientsLead")}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">{t("portal.trainer.searchClients")}</span>
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500"
              aria-hidden
            />
            <TextInput
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("portal.trainer.searchClients")}
              className="pl-12"
            />
          </label>

          <SelectInput
            value={status}
            onChange={(event) => setStatus(event.target.value as "" | EnrollmentStatus)}
            className="sm:w-56"
          >
            <option value="">{t("enrollments.allStatuses")}</option>
            {ENROLLMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {t(enrollmentStatusKey(value))}
              </option>
            ))}
          </SelectInput>
        </div>

        {rows === null ? (
          <p className="mt-8 text-sm text-ink-400">{t("portal.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="mt-8 rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-14 text-center">
            <p className="font-head text-xl text-white">{t("portal.trainer.noClientsTitle")}</p>
            <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">
              {t("portal.trainer.noClientsText")}
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-white/8 overflow-hidden rounded-panel border border-white/10">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/antrenor/cursanti/${row.client?.slug ?? row.id}`}
                  className="flex flex-wrap items-center gap-3 bg-ink-900 px-5 py-4 transition-colors hover:bg-ink-800"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">
                        {name(row)}
                      </span>
                      {waitingOn(row) > 0 && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-flare-500 px-2 py-0.5 text-[0.68rem] font-semibold text-white"
                          title={[
                            row.unreadMessages
                              ? t("portal.trainer.badgeMessages", { count: row.unreadMessages })
                              : null,
                            row.pendingVideos
                              ? t("portal.trainer.badgeVideos", { count: row.pendingVideos })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        >
                          <BellAlertIcon className="h-3 w-3" aria-hidden />
                          {waitingOn(row)}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">
                      {row.client?.email}
                    </span>
                  </span>

                  {row.access && row.status === "active" && (
                    <span
                      className={
                        row.access.open
                          ? "text-xs text-acid-400"
                          : "text-xs text-flare-400"
                      }
                    >
                      {row.access.open
                        ? t("portal.trainer.daysLeft", { count: row.access.daysLeft })
                        : row.access.lastEndedOn
                          ? t("portal.trainer.expiredOn", {
                              date: formatDay(row.access.lastEndedOn, locale ?? "ro"),
                            })
                          : t("portal.trainer.noPeriod")}
                    </span>
                  )}

                  <Pill tone={ENROLLMENT_TONE[row.status] ?? ENROLLMENT_TONE.ended}>
                    {t(enrollmentStatusKey(row.status))}
                  </Pill>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PortalLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
