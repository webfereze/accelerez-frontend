import { useState } from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { RectangleStackIcon } from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/admin/Pagination";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { usePagedList } from "@/hooks/usePagedList";
import { translations } from "@/utils/i18n";
import { enrollmentStatusKey } from "@/utils/labels";
import { ENROLLMENT_STATUSES, type Enrollment, type EnrollmentStatus } from "@/types/content";

/**
 * Who trains with whom — every enrolment on the platform.
 *
 * **This screen is oversight, not operation.** Accepting a client, writing them
 * a plan and marking their month paid is the trainer's work and happens in
 * their own portal; an administrator comes here to answer a question — "did
 * this person actually sign up", "why is their account closed", "has anybody
 * paid this month" — and occasionally to act for a trainer who cannot.
 *
 * Pending requests lead the list because they are the only state where somebody
 * is waiting on somebody else. The rest is history.
 */
export default function AdminEnrollments() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [status, setStatus] = useState<"" | EnrollmentStatus>("");

  const list = usePagedList<Enrollment>("/admin/enrollments", {
    params: { status: status || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "";

  const name = (row: Enrollment) =>
    [row.client?.firstName, row.client?.lastName].filter(Boolean).join(" ") ||
    row.client?.email ||
    "—";

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={RectangleStackIcon}
        title={t("enrollments.title")}
        description={t("enrollments.description")}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("enrollments.search")}
          placeholder={t("enrollments.search")}
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
        />
        <Select
          srOnlyLabel
          label={t("enrollments.allStatuses")}
          value={status}
          onChange={(event) => setStatus(event.target.value as "" | EnrollmentStatus)}
        >
          <option value="">{t("enrollments.allStatuses")}</option>
          {ENROLLMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(enrollmentStatusKey(value))}
            </option>
          ))}
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
              <li key={row.id}>
                <Link
                  href={`/admin/enrollments/${row.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-3 p-4 transition-colors hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {name(row)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {[
                        row.client?.email,
                        row.trainer?.displayName
                          ? `→ ${row.trainer.displayName}`
                          : undefined,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>

                  <span className="shrink-0 text-xs text-gray-500">
                    {new Date(row.createdAt).toLocaleDateString(locale ?? "ro", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>

                  <Badge tone={row.status === "pending" ? "brand" : "muted"}>
                    {t(enrollmentStatusKey(row.status))}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={RectangleStackIcon}
            title={filtering ? t("enrollments.noMatch") : t("enrollments.emptyTitle")}
            description={filtering ? undefined : t("enrollments.emptyText")}
          />
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
