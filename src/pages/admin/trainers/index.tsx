import { useState } from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { IdentificationIcon } from "@heroicons/react/24/outline";
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
import { money } from "@/utils/labels";
import type { PageStatus, Trainer } from "@/types/content";

/**
 * The trainers, in the admin.
 *
 * **This is the admission gate of the whole product.** Registration on the
 * public site creates clients and nothing else, so every coach in the directory
 * arrived through this screen — which is why the API behind it is
 * `@Roles(ADMIN)` rather than `StaffGuard`: an editor manages content, and an
 * account that can sign in is not content.
 *
 * The row says three things an administrator actually checks: whether the
 * profile is published, whether the coach is still taking clients, and what
 * they charge. The e-mail is shown because it is the login, and "which address
 * did we create for them" is the question support gets.
 */
export default function AdminTrainers() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [status, setStatus] = useState<"" | PageStatus>("");

  const list = usePagedList<Trainer>("/admin/trainers", {
    params: { status: status || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "";

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={IdentificationIcon}
        title={t("trainers.adminTitle")}
        description={t("trainers.adminDescription")}
        actions={<ButtonLink href="/admin/trainers/new">{t("trainers.add")}</ButtonLink>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("trainers.searchAdmin")}
          placeholder={t("trainers.searchAdmin")}
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
            {list.rows.map((trainer) => (
              <li key={trainer.id}>
                <Link
                  href={`/admin/trainers/${trainer.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-3 p-4 transition-colors hover:bg-gray-50"
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {trainer.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={trainer.photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-gray-900">
                      {trainer.displayName}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {[trainer.user?.email, trainer.city].filter(Boolean).join(" · ")}
                    </span>
                  </span>

                  {trainer.monthlyPrice != null && (
                    <span className="shrink-0 text-xs text-gray-500">
                      {money(trainer.monthlyPrice, trainer.currency, locale ?? "ro")}
                    </span>
                  )}

                  {!trainer.isAcceptingClients && (
                    <Badge tone="muted">{t("trainers.closedList")}</Badge>
                  )}

                  {/* The dot is the status; `Badge` paints it from `status`. */}
                  <Badge status={trainer.status}>
                    {t(trainer.status === "published" ? "common.published" : "common.draft")}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={IdentificationIcon}
            title={filtering ? t("trainers.noMatchTitle") : t("trainers.adminEmptyTitle")}
            description={
              filtering ? t("trainers.noMatchText") : t("trainers.adminEmptyText")
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
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
