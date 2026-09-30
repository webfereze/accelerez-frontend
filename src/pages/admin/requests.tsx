import { useState } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/admin/Pagination";
import Fact from "@/components/admin/Fact";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import { usePagedList } from "@/hooks/usePagedList";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import {
  REQUEST_STATUSES,
  type ContactRequest,
  type RequestStatus,
} from "@/types/content";

/**
 * The enquiries the contact form produced.
 *
 * **A worklist, not an archive.** New enquiries lead, each row expands in place
 * to show the message and the hidden fields, and the two things anybody
 * actually does here — mark it handled, write a note about what happened — are
 * on the row itself. Opening a detail page to change one dropdown is the
 * pattern that makes a shared inbox go unused.
 *
 * **`sourceUrl` is shown.** The blueprint asks the form to carry where it was
 * sent from (ch. 09) so an answer can start from what the person was reading,
 * and that is only useful if whoever answers can see it. It is captured
 * invisibly from the sender and shown plainly here, which is the right way
 * round.
 *
 * Status and note save immediately — there is no Save button on a worklist, and
 * a triage screen that could lose a decision to a missed click is one nobody
 * trusts with real enquiries.
 */
export default function AdminRequests() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [status, setStatus] = useState<"" | RequestStatus>("");
  const [error, setError] = useState<string | null>(null);

  const list = usePagedList<ContactRequest>("/admin/contact-requests", {
    params: { status: status || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "";

  const update = async (row: ContactRequest, patch: Partial<ContactRequest>) => {
    try {
      await api.patch(`/admin/contact-requests/${row.id}`, patch);
      setError(null);
      await list.reload();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("requests.failed")));
    }
  };

  const when = (value: string) =>
    new Date(value).toLocaleString(locale ?? "ro", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={InboxArrowDownIcon}
        title={t("requests.title")}
        description={t("requests.description")}
      />

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("requests.search")}
          placeholder={t("requests.search")}
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
        />
        <Select
          srOnlyLabel
          label={t("common.statusAll")}
          value={status}
          onChange={(event) => setStatus(event.target.value as "" | RequestStatus)}
        >
          <option value="">{t("common.statusAll")}</option>
          {REQUEST_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`requestStatus.${value}`)}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-3">
        {list.loading && !list.rows.length ? (
          <p role="status" className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : list.rows.length ? (
          list.rows.map((row) => (
            <CollapsiblePanel
              key={row.id}
              icon={InboxArrowDownIcon}
              title={`${row.name} · ${row.email}`}
              description={when(row.createdAt)}
              badge={
                <span
                  className={clsx(
                    "shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide",
                    row.status === "new"
                      ? "bg-gray-900 text-white"
                      : row.status === "handled"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-gray-100 text-gray-500",
                  )}
                >
                  {t(`requestStatus.${row.status}`)}
                </span>
              }
            >
              <div className="space-y-4">
                <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                  {row.message}
                </p>

                <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {row.phone && <Fact label={t("blocks.contactPanel.phone")} value={row.phone} />}
                  {row.company && <Fact label={t("requests.company")} value={row.company} />}
                  {row.goal && (
                    <Fact
                      label={t("blocks.contactPanel.subject")}
                      value={t(`spec.${row.goal}`)}
                    />
                  )}
                  <Fact label={t("requests.locale")} value={row.locale} />
                  {row.sourceUrl && (
                    <Fact label={t("requests.sourceUrl")} value={row.sourceUrl} wide />
                  )}
                </dl>

                <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                  <Select
                    label={t("common.status")}
                    value={row.status}
                    onChange={(event) =>
                      update(row, { status: event.target.value as RequestStatus })
                    }
                  >
                    {REQUEST_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {t(`requestStatus.${value}`)}
                      </option>
                    ))}
                  </Select>

                  <Textarea
                    label={t("requests.note")}
                    hint={t("requests.noteHint")}
                    rows={2}
                    defaultValue={row.note ?? ""}
                    onBlur={(event) => {
                      if (event.target.value === (row.note ?? "")) return;
                      void update(row, { note: event.target.value || null });
                    }}
                  />
                </div>
              </div>
            </CollapsiblePanel>
          ))
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white">
            <EmptyState
              icon={InboxArrowDownIcon}
              title={filtering ? t("common.noResults") : t("requests.empty")}
              description={filtering ? t("common.noResultsHint") : t("requests.emptyHint")}
            />
          </div>
        )}
      </div>

      <Pagination
        page={list.page}
        pages={list.pages}
        total={list.total}
        onChange={list.setPage}
      />
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
