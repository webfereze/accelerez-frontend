import { useState } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowDownTrayIcon,
  InboxArrowDownIcon,
  NoSymbolIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/admin/Pagination";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { usePagedList } from "@/hooks/usePagedList";
import { useConfirm } from "@/hooks/useConfirm";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";

type Subscriber = {
  id: number;
  email: string;
  name: string | null;
  locale: string;
  source: string | null;
  status: "active" | "unsubscribed";
  consentedAt: string;
  unsubscribedAt: string | null;
  createdAt: string;
};

/**
 * Who has asked to hear from the association.
 *
 * **Two different removals, and the difference matters.** Unsubscribing keeps
 * the row and marks it — so the person stays opted out even if an old list is
 * imported again next year. Deleting removes the record entirely, which is what
 * an erasure request needs and nothing else should use.
 *
 * `consentedAt` is shown on every row because it is the thing that makes the
 * address lawful to hold: a list the association cannot date is a list it
 * cannot use.
 *
 * The export is built in the browser from what the API returns, so there is no
 * second CSV format on the server to keep in step.
 */
export default function AdminSubscribers() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { confirm, dialog, done } = useConfirm();

  const [status, setStatus] = useState<"" | "active" | "unsubscribed">("");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const list = usePagedList<Subscriber>("/admin/subscribers", {
    params: { status: status || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "";

  const when = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(locale ?? "ro", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const unsubscribe = async (row: Subscriber) => {
    const answered = await confirm({
      title: t("subscribers.unsubscribeTitle"),
      message: t("subscribers.unsubscribeMessage", { email: row.email }),
      confirmLabel: t("subscribers.unsubscribe"),
    });
    if (!answered) return;

    try {
      await api.patch(`/admin/subscribers/${row.id}/unsubscribe`);
      await list.reload();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("subscribers.actionFailed")));
    } finally {
      done();
    }
  };

  const remove = async (row: Subscriber) => {
    const answered = await confirm({
      title: t("subscribers.deleteTitle"),
      message: t("subscribers.deleteMessage", { email: row.email }),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!answered) return;

    try {
      await api.delete(`/admin/subscribers/${row.id}`);
      await list.reload();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("subscribers.actionFailed")));
    } finally {
      done();
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    setError(null);

    try {
      const { data } = await api.get<
        Array<{ email: string; name: string | null; locale: string; source: string | null; consentedAt: string }>
      >("/admin/subscribers/export");

      const escape = (value: unknown) => {
        const text = value == null ? "" : String(value);
        // Quote anything containing a separator, a quote or a newline, and
        // double the quotes inside — the whole of CSV escaping.
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
      };

      const header = ["email", "name", "locale", "source", "consentedAt"];
      const csv = [
        header.join(","),
        ...data.map((row) => header.map((key) => escape(row[key as keyof typeof row])).join(",")),
      ].join("\n");

      // A BOM, so Excel opens UTF-8 correctly instead of mangling every ă and ț.
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `abonati-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("subscribers.exportFailed")));
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={InboxArrowDownIcon}
        title={t("subscribers.title")}
        description={t("subscribers.description")}
        actions={
          <Button variant="secondary" onClick={exportCsv} loading={exporting}>
            <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
            {t("subscribers.export")}
          </Button>
        }
      />

      {error && (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("subscribers.search")}
          placeholder={t("subscribers.search")}
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
        />
        <Select
          srOnlyLabel
          label={t("subscribers.statusAll")}
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as "" | "active" | "unsubscribed")
          }
        >
          <option value="">{t("subscribers.statusAll")}</option>
          <option value="active">{t("subscribers.active")}</option>
          <option value="unsubscribed">{t("subscribers.unsubscribed")}</option>
        </Select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {list.loading && !list.rows.length ? (
          <p role="status" className="p-6 text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : list.rows.length ? (
          <ul className="divide-y divide-gray-100">
            {list.rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">
                    {row.email}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {[
                      row.name,
                      row.source,
                      row.locale?.toUpperCase(),
                      t("subscribers.consentedOn", { date: when(row.consentedAt) }),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>

                <Badge status={row.status === "active" ? "published" : "draft"}>
                  {row.status === "active"
                    ? t("subscribers.active")
                    : t("subscribers.unsubscribed")}
                </Badge>

                <span className="flex items-center gap-1">
                  {row.status === "active" && (
                    <Button
                      variant="ghost"
                      aria-label={t("subscribers.unsubscribe")}
                      onClick={() => unsubscribe(row)}
                    >
                      <NoSymbolIcon className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    aria-label={t("common.delete")}
                    onClick={() => remove(row)}
                  >
                    <TrashIcon className="h-4 w-4" aria-hidden />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={InboxArrowDownIcon}
            title={filtering ? t("common.noResults") : t("subscribers.empty")}
            description={
              filtering ? t("common.noResultsHint") : t("subscribers.emptyHint")
            }
          />
        )}
      </div>

      <Pagination
        page={list.page}
        pages={list.pages}
        total={list.total}
        onChange={list.setPage}
      />

      {dialog}
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
