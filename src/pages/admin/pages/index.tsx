import { useState } from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { DocumentTextIcon, HomeIcon } from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ButtonLink from "@/components/ui/ButtonLink";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { usePages } from "@/hooks/usePages";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import type { Page, PageStatus } from "@/types/content";

/**
 * Every content page.
 *
 * **Shown as a tree, one level deep.** Pages nest one level and no further, so
 * a child is simply indented under its parent — and a page whose parent is
 * missing or unpublished still appears, at the top level, rather than vanishing
 * from the only screen where it could be fixed.
 *
 * Filtering happens in the browser: this is dozens of rows, not thousands, and
 * in-memory search matches all three languages at once.
 */
export default function AdminPages() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | PageStatus>("");

  const { pages, loading } = usePages({ q, status });

  const filtering = q.trim().length > 0 || status !== "";

  // Parents first, each followed by its children. A page whose parent is not in
  // the list — filtered out, or deleted — is treated as top level so it is
  // never hidden by the view.
  const ids = new Set(pages.map((page) => page.id));
  const roots = pages.filter((page) => !page.parentId || !ids.has(page.parentId));
  const childrenOf = (id: number) => pages.filter((page) => page.parentId === id);

  const rows: Array<{ page: Page; depth: number }> = [];
  for (const root of roots) {
    rows.push({ page: root, depth: 0 });
    for (const child of childrenOf(root.id)) rows.push({ page: child, depth: 1 });
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={DocumentTextIcon}
        title={t("pages.title")}
        description={t("pages.description")}
        actions={<ButtonLink href="/admin/pages/new">{t("pages.add")}</ButtonLink>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("pages.search")}
          placeholder={t("pages.search")}
          value={q}
          onChange={(event) => setQ(event.target.value)}
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
        {loading && !pages.length ? (
          <p role="status" className="p-6 text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : rows.length ? (
          <ul className="divide-y divide-gray-100">
            {rows.map(({ page, depth }) => (
              <li key={page.id}>
                <Link
                  href={`/admin/pages/${page.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-3 p-4 transition-colors hover:bg-gray-50"
                  style={{ paddingLeft: depth ? `${depth * 1.75 + 1}rem` : undefined }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {tr(page.title, locale)}
                      </span>
                      {page.isHomepage && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-500/15 px-2 py-0.5 text-[0.68rem] font-semibold text-primary-800">
                          <HomeIcon className="h-3 w-3" aria-hidden />
                          {t("pages.homepage")}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      /{page.slug}
                    </span>
                  </span>

                  <Badge status={page.status}>
                    {page.status === "published"
                      ? t("common.published")
                      : t("common.draft")}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={DocumentTextIcon}
            title={filtering ? t("common.noResults") : t("pages.empty")}
            description={filtering ? t("common.noResultsHint") : t("pages.emptyHint")}
            action={
              !filtering && (
                <ButtonLink href="/admin/pages/new">{t("pages.add")}</ButtonLink>
              )
            }
          />
        )}
      </div>
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
