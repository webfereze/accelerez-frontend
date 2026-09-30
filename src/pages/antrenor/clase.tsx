import { useCallback, useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import PortalLayout, { PortalChecking } from "@/components/portal/PortalLayout";
import { Pill, PortalButton } from "@/components/portal/Field";
import { TRAINER_NAV } from "./index";
import { usePortalAuth } from "@/hooks/usePortalAuth";
import { useTrainerBadges } from "@/hooks/useTrainerBadges";
import { api } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { money } from "@/utils/labels";
import { formatDay } from "@/utils/dates";
import PortalModal from "@/components/portal/Modal";
import ClassFormModal from "@/components/portal/ClassFormModal";
import { weekdayNames } from "@/utils/schedule";
import type { ClassMember, TrainingClass } from "@/types/content";

/**
 * The classes this coach runs.
 *
 * **A coach owns their own classes.** Create, edit and delete are all here —
 * the class is their offer, and asking an editor to change an hour is how a
 * schedule goes stale. What stays with the administrator is what is a decision
 * about the site rather than about the class: the translations, the order of
 * the public list and whether it is promoted on the home page. The note at the
 * foot says exactly that, so nobody hunts for a control that is deliberately
 * elsewhere.
 *
 * Members are a dialog rather than a screen, and each one is marked with
 * whether this coach has accepted them: registering is open to anybody with an
 * account, but only an accepted client gets the meeting link.
 *
 * Drafts are shown, marked as such: a class being written is still on this
 * coach's schedule, and one that disappears from their screen until an editor
 * publishes it is one they turn up to without knowing it exists.
 */
export default function TrainerClasses() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const { user, ready } = usePortalAuth("trainer");
  const badges = useTrainerBadges(ready);

  const [rows, setRows] = useState<TrainingClass[] | null>(null);
  /** Whose member list is open. A dialog, because it is a look, not a screen. */
  const [viewing, setViewing] = useState<TrainingClass | null>(null);
  const [members, setMembers] = useState<ClassMember[] | null>(null);
  /** Null while the form is closed; `null` item inside it means "new". */
  const [editing, setEditing] = useState<{ item: TrainingClass | null } | null>(null);

  const load = useCallback(async () => {
    const { data } = await api.get<TrainingClass[]>("/portal/trainer/classes");
    setRows(data);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  useEffect(() => {
    if (!viewing) return;

    setMembers(null);
    let cancelled = false;

    void api
      .get<ClassMember[]>(`/portal/trainer/classes/${viewing.id}/members`)
      .then(({ data }) => !cancelled && setMembers(data))
      .catch(() => !cancelled && setMembers([]));

    return () => {
      cancelled = true;
    };
  }, [viewing]);

  if (!ready) return <PortalChecking />;

  return (
    <>
      <Head>
        <title>{`${t("portal.trainer.nav.classes")} — ${t("site.name")}`}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PortalLayout
        user={user}
        items={TRAINER_NAV(t, badges)}
        title={t("portal.trainer.classesTitle")}
        lead={t("portal.trainer.classesLead")}
        actions={
          <PortalButton type="button" onClick={() => setEditing({ item: null })}>
            <PlusIcon className="h-4 w-4" aria-hidden />
            {t("portal.trainer.newClass")}
          </PortalButton>
        }
      >
        {rows === null ? (
          <p className="text-sm text-ink-400">{t("portal.loading")}</p>
        ) : rows.length === 0 ? (
          <div className="rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-14 text-center">
            <p className="font-head text-xl text-white">{t("portal.trainer.noClasses")}</p>
            <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">
              {t("portal.trainer.noClassesText")}
            </p>
            <PortalButton
              type="button"
              className="mt-7"
              onClick={() => setEditing({ item: null })}
            >
              <PlusIcon className="h-4 w-4" aria-hidden />
              {t("portal.trainer.newClass")}
            </PortalButton>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {rows.map((item) => (
              <li
                key={item.id}
                className="flex gap-4 rounded-panel border border-white/10 bg-ink-900 p-4"
              >
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-card bg-ink-950">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-head text-2xl text-white/15">
                      {tr(item.title, lang).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-head text-lg text-white">{tr(item.title, lang)}</h2>

                    {item.status === "published" ? (
                      <Pill tone="bg-acid-500/15 text-acid-400 ring-1 ring-inset ring-acid-500/30">
                        {t("common.published")}
                      </Pill>
                    ) : (
                      <Pill tone="bg-white/10 text-ink-300 ring-1 ring-inset ring-white/15">
                        {t("common.draft")}
                      </Pill>
                    )}
                  </div>

                  <dl className="mt-2 space-y-1 text-sm text-ink-300">
                    {tr(item.scheduleText, lang) && (
                      <div>
                        <dt className="sr-only">{t("classes.schedule")}</dt>
                        <dd>{tr(item.scheduleText, lang)}</dd>
                      </div>
                    )}

                    {item.startsOn && (
                      <div className="text-ink-400">
                        <dt className="sr-only">{t("classes.startsOn")}</dt>
                        <dd>
                          {t("classes.startsOnValue", { date: formatDay(item.startsOn, lang) })}
                        </dd>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-400">
                      {item.durationMinutes && (
                        <span className="flex items-center gap-1.5">
                          <ClockIcon className="h-4 w-4" aria-hidden />
                          {t("classes.minutes", { count: item.durationMinutes })}
                        </span>
                      )}

                      {(item.place || item.city) && (
                        <span className="flex items-center gap-1.5">
                          <MapPinIcon className="h-4 w-4" aria-hidden />
                          {[item.place, item.city].filter(Boolean).join(", ")}
                        </span>
                      )}

                      {item.capacity && (
                        <span className="flex items-center gap-1.5">
                          <UserGroupIcon className="h-4 w-4" aria-hidden />
                          {t("classes.places", { count: item.capacity })}
                        </span>
                      )}
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {item.pricePerSession != null && (
                      <span className="font-head text-base text-acid-500">
                        {money(item.pricePerSession, item.currency, lang)}
                        <span className="ml-1 text-xs font-normal text-ink-400">
                          {t("classes.perSession")}
                        </span>
                      </span>
                    )}

                    {item.pricePerMonth != null && (
                      <span className="text-sm text-ink-300">
                        {money(item.pricePerMonth, item.currency, lang)}
                        <span className="ml-1 text-ink-500">{t("classes.perMonth")}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setViewing(item)}
                      className="inline-flex items-center gap-1.5 font-semibold text-acid-400 underline-offset-4 hover:underline"
                    >
                      <UserGroupIcon className="h-4 w-4" aria-hidden />
                      {t("portal.trainer.seeMembers")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditing({ item })}
                      className="inline-flex items-center gap-1.5 text-ink-300 underline-offset-4 hover:text-white hover:underline"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden />
                      {t("actions.edit")}
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(t("portal.trainer.removeClassConfirm"))) return;
                        await api.delete(`/portal/trainer/classes/${item.id}`);
                        await load();
                      }}
                      className="inline-flex items-center gap-1.5 text-ink-500 underline-offset-4 hover:text-flare-400 hover:underline"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                      {t("actions.delete")}
                    </button>

                    {item.status === "published" && (
                      <Link
                        href={`/clase/${slugIn(item.slug, lang)}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-ink-400 underline-offset-4 hover:text-white hover:underline"
                      >
                        {t("portal.trainer.viewClass")}
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows !== null && rows.length > 0 && (
          <p className="mt-8 max-w-2xl text-xs leading-relaxed text-ink-500">
            {t("portal.trainer.classesOwnNote")}
          </p>
        )}

        <PortalModal
          open={Boolean(viewing)}
          onClose={() => setViewing(null)}
          title={viewing ? tr(viewing.title, lang) : ""}
          description={
            viewing
              ? [
                  (viewing.weekdays ?? []).length
                    ? `${weekdayNames(viewing.weekdays ?? [], lang)} · ${viewing.startTime ?? ""}`
                    : tr(viewing.scheduleText, lang),
                  viewing.capacity
                    ? t("classes.places", { count: viewing.capacity })
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : undefined
          }
          size="lg"
        >
          {members === null ? (
            <p className="text-sm text-ink-400">{t("portal.loading")}</p>
          ) : members.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">
              {t("portal.trainer.noMembers")}
            </p>
          ) : (
            <ul className="divide-y divide-white/8">
              {members.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {[member.client?.firstName, member.client?.lastName]
                        .filter(Boolean)
                        .join(" ") || member.client?.email}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-500">
                      {member.client?.email}
                      {member.client?.phone ? ` · ${member.client.phone}` : ""}
                    </span>
                    {member.note && (
                      <span className="mt-1.5 block text-xs text-ink-300">{member.note}</span>
                    )}
                    {member.status === "active" && !member.accepted && (
                      /* Registered, but not a client of this coach yet — so
                         they have no link and no way in until the coach
                         accepts their request. */
                      <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-flare-500/15 px-2.5 py-1 text-[0.68rem] font-semibold text-flare-400">
                        {t("portal.trainer.memberNotAccepted")}
                      </span>
                    )}
                  </span>

                  {member.status === "active" ? (
                    <PortalButton
                      type="button"
                      variant="ghost"
                      onClick={async () => {
                        await api.delete(
                          `/portal/trainer/classes/${viewing?.id}/members/${member.id}`,
                        );
                        const { data } = await api.get<ClassMember[]>(
                          `/portal/trainer/classes/${viewing?.id}/members`,
                        );
                        setMembers(data);
                        await load();
                      }}
                    >
                      {t("portal.trainer.removeMember")}
                    </PortalButton>
                  ) : (
                    /* Kept, not deleted: the row is the record that this
                       person was once in the room. */
                    <span className="text-xs uppercase tracking-wider text-ink-500">
                      {t("portal.trainer.memberLeft")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PortalModal>

        <ClassFormModal
          open={Boolean(editing)}
          item={editing?.item ?? null}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      </PortalLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
