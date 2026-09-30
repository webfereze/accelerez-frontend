import { useState } from "react";
import type { GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
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
import { lowestPrice, productCategoryKey } from "@/utils/shop";
import {
  PRODUCT_CATEGORIES,
  type PageStatus,
  type Product,
  type ProductCategory,
} from "@/types/content";

/** The shop's products, in the admin. Same list as the classes, plus a category filter. */
export default function AdminProducts() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const [status, setStatus] = useState<"" | PageStatus>("");
  const [category, setCategory] = useState<"" | ProductCategory>("");

  const list = usePagedList<Product>("/admin/products", {
    params: { status: status || undefined, category: category || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "" || category !== "";

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={ShoppingBagIcon}
        title={t("shop.admin.title")}
        description={t("shop.admin.description")}
        actions={<ButtonLink href="/admin/products/new">{t("shop.admin.add")}</ButtonLink>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_11rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("shop.admin.search")}
          placeholder={t("shop.admin.search")}
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
        />
        <Select
          srOnlyLabel
          label={t("shop.admin.category")}
          value={category}
          onChange={(event) => setCategory(event.target.value as "" | ProductCategory)}
        >
          <option value="">{t("shop.all")}</option>
          {PRODUCT_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {t(productCategoryKey(value))}
            </option>
          ))}
        </Select>
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
            {list.rows.map((item) => {
              const price = lowestPrice(item.variants);

              return (
                <li key={item.id}>
                  <Link
                    href={`/admin/products/${item.id}`}
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
                        {tr(item.title, lang)}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-gray-500">
                        {t(productCategoryKey(item.category))} ·{" "}
                        {t("shop.admin.variantCount", { count: item.variants?.length ?? 0 })}
                      </span>
                    </span>

                    <span className="shrink-0 text-xs text-gray-500">
                      {price
                        ? `${price.from ? `${t("shop.from")} ` : ""}${money(price.price, item.currency, lang)}`
                        : t("shop.priceOnRequest")}
                    </span>

                    <Badge status={item.status}>
                      {t(item.status === "published" ? "common.published" : "common.draft")}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={ShoppingBagIcon}
            title={filtering ? t("common.noResults") : t("shop.admin.emptyTitle")}
            description={filtering ? undefined : t("shop.admin.emptyText")}
          />
        )}
      </div>

      <Pagination page={list.page} pages={list.pages} total={list.total} onChange={list.setPage} />
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
