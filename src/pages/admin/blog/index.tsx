import { useState } from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { NewspaperIcon, StarIcon } from "@heroicons/react/24/outline";
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
import type { PageStatus, Post } from "@/types/content";

/**
 * The blog, in the admin.
 *
 * Ordered by the date the article is *of*, newest first — and drafts, which
 * have no such date, sort by when they were created rather than sinking to the
 * bottom of the very screen where they still need working on. That ordering is
 * the API's; this screen only shows it.
 */
export default function AdminBlog() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [status, setStatus] = useState<"" | PageStatus>("");

  const list = usePagedList<Post>("/admin/posts", {
    params: { status: status || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "";

  const when = (post: Post) =>
    post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString(locale ?? "ro", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={NewspaperIcon}
        title={t("blog.title")}
        description={t("blog.description")}
        actions={<ButtonLink href="/admin/blog/new">{t("blog.add")}</ButtonLink>}
      />

      {/* Filters above the list, always. */}
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("blog.search")}
          placeholder={t("blog.search")}
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
            {list.rows.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="flex min-h-11 flex-wrap items-center gap-3 p-4 transition-colors hover:bg-gray-50"
                >
                  {post.coverImage && (
                    <span className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImage}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {tr(post.title, locale)}
                      </span>
                      {post.isFeatured && (
                        // A word beside the icon, not the icon alone: a star is
                        // the same as nothing to a colour-blind reader and in a
                        // screenshot.
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-500/15 px-2 py-0.5 text-[0.68rem] font-semibold text-accent-800">
                          <StarIcon className="h-3 w-3" aria-hidden />
                          {t("blog.featured")}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {[when(post), post.author, `/${post.slug?.ro ?? ""}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>

                  <Badge status={post.status}>
                    {post.status === "published" ? t("common.published") : t("common.draft")}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={NewspaperIcon}
            title={filtering ? t("common.noResults") : t("blog.empty")}
            description={filtering ? t("common.noResultsHint") : t("blog.emptyHint")}
            action={
              !filtering && <ButtonLink href="/admin/blog/new">{t("blog.add")}</ButtonLink>
            }
          />
        )}
      </div>

      {/* Not `{...list}` — `Pagination` takes `onChange` and the hook returns
          `setPage`, so spreading silently gives a dead control. */}
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
