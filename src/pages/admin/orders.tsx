import { useState } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
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
import { money } from "@/utils/labels";
import { ORDER_STATUSES, type Order, type OrderStatus } from "@/types/content";

/** One colour per state, so a page of orders reads before a word of it does. */
const STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-gray-900 text-white",
  confirmed: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-700",
};

/**
 * The shop's orders.
 *
 * **A worklist, like the contact requests** — the same screen shape, because
 * it is the same job: something arrived, somebody answers it, and the status
 * says how far it has got. New orders lead; each row opens in place with the
 * contact details and what was asked for; status and note save on change.
 *
 * Today the status is moved by hand — "paid" when the transfer is seen,
 * "delivered" when the plan is sent. When card payment arrives, "paid" is set
 * by the payment instead, and this screen does not change.
 */
export default function AdminOrders() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [error, setError] = useState<string | null>(null);

  const list = usePagedList<Order>("/admin/orders", {
    params: { status: status || undefined },
  });

  const filtering = list.search.trim().length > 0 || status !== "";

  const update = async (row: Order, patch: Partial<Order>) => {
    try {
      await api.patch(`/admin/orders/${row.id}`, patch);
      setError(null);
      await list.reload();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("shop.orders.failed")));
    }
  };

  const when = (value: string) =>
    new Date(value).toLocaleString(lang, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={ClipboardDocumentListIcon}
        title={t("shop.orders.title")}
        description={t("shop.orders.description")}
      />

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <Input
          srOnlyLabel
          type="search"
          label={t("shop.orders.search")}
          placeholder={t("shop.orders.search")}
          value={list.search}
          onChange={(event) => list.setSearch(event.target.value)}
        />
        <Select
          srOnlyLabel
          label={t("common.statusAll")}
          value={status}
          onChange={(event) => setStatus(event.target.value as "" | OrderStatus)}
        >
          <option value="">{t("common.statusAll")}</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`shop.orderStatus.${value}`)}
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
          list.rows.map((row) => {
            const summary = row.items
              .map(
                (line) =>
                  `${line.quantity > 1 ? `${line.quantity} × ` : ""}${[line.productTitle, line.variantLabel].filter(Boolean).join(" · ")}`,
              )
              .join(", ");
            const total =
              row.total != null
                ? `${money(row.total, row.currency, lang)}${row.hasPriceOnRequest ? ` + ${t("shop.priceOnRequest").toLowerCase()}` : ""}`
                : t("shop.priceOnRequest");

            return (
              <CollapsiblePanel
                key={row.id}
                icon={ClipboardDocumentListIcon}
                title={`${row.reference} · ${row.name}`}
                description={`${when(row.createdAt)} · ${total} · ${summary}`}
                badge={
                  <span
                    className={clsx(
                      "shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wide",
                      STATUS_TONE[row.status],
                    )}
                  >
                    {t(`shop.orderStatus.${row.status}`)}
                  </span>
                }
              >
                <div className="space-y-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-4 font-medium">{t("shop.orders.product")}</th>
                        <th className="py-2 pr-4 text-right font-medium">{t("shop.orders.quantity")}</th>
                        <th className="py-2 text-right font-medium">{t("shop.admin.price")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {row.items.map((line) => (
                        <tr key={`${line.productId}:${line.variantId}`}>
                          <td className="py-2 pr-4 text-gray-900">
                            {line.productTitle}
                            {line.variantLabel && (
                              <span className="text-gray-500"> · {line.variantLabel}</span>
                            )}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-700">{line.quantity}</td>
                          <td className="py-2 text-right text-gray-700">
                            {line.unitPrice != null
                              ? money(line.unitPrice * line.quantity, row.currency, lang)
                              : t("shop.priceOnRequest")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 font-semibold text-gray-900">
                        <td className="py-2 pr-4" colSpan={2}>
                          {t("cart.total")}
                        </td>
                        <td className="py-2 text-right">{total}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    <Fact label={t("shop.form.email")}>
                      <a href={`mailto:${row.email}`} className="text-gray-900 underline">
                        {row.email}
                      </a>
                    </Fact>
                    <Fact label={t("shop.form.phone")}>
                      <a href={`tel:${row.phone.replace(/\s/g, "")}`} className="text-gray-900 underline">
                        {row.phone}
                      </a>
                    </Fact>
                    <Fact label={t("requests.locale")} value={row.locale} />
                    {row.paidAt && <Fact label={t("shop.orders.paidAt")} value={when(row.paidAt)} />}
                    {row.sourceUrl && (
                      <Fact label={t("requests.sourceUrl")} value={row.sourceUrl} wide />
                    )}
                  </dl>

                  {row.message && (
                    <p className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-800">
                      {row.message}
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                    <Select
                      label={t("common.status")}
                      value={row.status}
                      onChange={(event) =>
                        update(row, { status: event.target.value as OrderStatus })
                      }
                    >
                      {ORDER_STATUSES.map((value) => (
                        <option key={value} value={value}>
                          {t(`shop.orderStatus.${value}`)}
                        </option>
                      ))}
                    </Select>

                    <Textarea
                      label={t("requests.note")}
                      hint={t("shop.orders.noteHint")}
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
            );
          })
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white">
            <EmptyState
              icon={ClipboardDocumentListIcon}
              title={filtering ? t("common.noResults") : t("shop.orders.empty")}
              description={filtering ? t("common.noResultsHint") : t("shop.orders.emptyHint")}
            />
          </div>
        )}
      </div>

      <Pagination page={list.page} pages={list.pages} total={list.total} onChange={list.setPage} />
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
