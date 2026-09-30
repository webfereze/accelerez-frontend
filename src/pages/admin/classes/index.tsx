import { useState } from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { RectangleGroupIcon } from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/admin/Pagination";
import ButtonLink from "@/components/ui/ButtonLink";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { usePagedList } from "@/hooks/usePagedList";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { money } from "@/utils/labels";
import type { PageStatus, TrainingClass } from "@/types/content";

/** The classes, in the admin. Editors may manage them — they are copy, not accounts. */
export default function AdminClasses() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [status, setStatus] = useState<"" | PageStatus>("");

  const list = usePagedList<TrainingClass>("/admin/classes", {
    params: { status: status || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "";

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={RectangleGroupIcon}
        title={t("classes.adminTitle")}
        description={t("classes.adminDescription")}
        actions={<ButtonLink href="/admin/classes/new">{t("classes.add")}</ButtonLink>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("classes.searchAdmin")}
          placeholder={t("classes.searchAdmin")}
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
        />
        <Select
          srOnlyLabel
          label={t("common.statusAll")}
          value={status}
          onChange={(event) => setStatus(event.target.value as "" | PageStatus)}
        >
          <option value="">{t("common.statusAll")}</option>
          <option value="draft">{t("common.draft")}</option>
          <option value="published">{t("common.published")}</option>
        </Select>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {list.loading && !list.rows.length ? (
          <p role="status" className="p-6 text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : list.rows.length ? (
          <ul className="divide-y divide-gray-100">
            {list.rows.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/classes/${item.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-3 p-4 transition-colors hover:bg-gray-50"
                >
                  {item.image && (
                    <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {tr(item.title, locale)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {[tr(item.scheduleText, locale), item.city].filter(Boolean).join(" · ")}
                    </span>
                  </span>

                  {item.pricePerSession != null && (
                    <span className="shrink-0 text-xs text-gray-500">
                      {money(item.pricePerSession, item.currency, locale ?? "ro")}
                    </span>
                  )}

                  <Badge status={item.status}>
                    {t(item.status === "published" ? "common.published" : "common.draft")}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={RectangleGroupIcon}
            title={filtering ? t("classes.noMatchTitle") : t("classes.emptyTitle")}
            description={filtering ? undefined : t("classes.emptyText")}
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
