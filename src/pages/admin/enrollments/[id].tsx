import { useCallback, useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ArrowLeftIcon,
  BanknotesIcon,
  RectangleStackIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { EditorSection } from "@/components/admin/RecordEditor";
import Button from "@/components/ui/Button";
import ButtonLink from "@/components/ui/ButtonLink";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Alert from "@/components/ui/Alert";
import { api, apiErrorMessage } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { formatDay, formatRange } from "@/utils/dates";
import {
  enrollmentStatusKey,
  membershipStatusKey,
  money,
  monthKey,
  paymentMethodKey,
} from "@/utils/labels";
import type {
  AccessState,
  Enrollment,
  MembershipPeriod,
  PaymentMethod,
} from "@/types/content";

type Detail = {
  enrollment: Enrollment;
  access: AccessState;
  periods: MembershipPeriod[];
};

/**
 * One enrolment, with the months on it.
 *
 * **An administrator can mark a month here, and it leaves their name on it.**
 * That is the support path — a trainer on holiday, a coach who cannot get into
 * their account, a payment that arrived at the platform by mistake — and
 * `validatedBy` records who pressed the button, because "the client says they
 * paid and the month is still closed" is the question this product will get
 * most often.
 *
 * `CARD` is deliberately absent from the method list: a card payment is
 * something a processor confirms, and letting a person type it would make the
 * one method that is supposed to be evidence mean nothing. The API refuses it
 * too — see `MembershipService`.
 */
export default function AdminEnrollmentDetail() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = router.locale ?? "ro";
  const id = Number(router.query.id);

  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [form, setForm] = useState({
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
    status: "paid",
    amount: "",
    method: "transfer" as PaymentMethod,
    note: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get<Detail>(`/admin/enrollments/${id}`);
      setDetail(data);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("enrollments.loadFailed")));
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markPeriod(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await api.post(`/admin/enrollments/${id}/periods`, {
        year: Number(form.year),
        month: Number(form.month),
        status: form.status,
        amount: form.amount ? Number(form.amount) : undefined,
        method: form.method,
        note: form.note.trim() || undefined,
      });
      setForm((value) => ({ ...value, amount: "", note: "" }));
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("enrollments.markFailed")));
    } finally {
      setSaving(false);
    }
  }

  async function removePeriod(periodId: number) {
    setError(null);
    try {
      await api.delete(`/admin/enrollments/${id}/periods/${periodId}`);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("enrollments.markFailed")));
    }
  }

  const client = detail?.enrollment.client;
  const clientName =
    [client?.firstName, client?.lastName].filter(Boolean).join(" ") || client?.email || "—";

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={RectangleStackIcon}
        title={clientName}
        description={
          detail
            ? t("enrollments.withTrainer", {
                name: detail.enrollment.trainer?.displayName ?? "",
              })
            : t("common.loading")
        }
        actions={
          <ButtonLink href="/admin/enrollments" variant="secondary">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden />
            {t("enrollments.title")}
          </ButtonLink>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}

      {detail && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="space-y-6">
            <EditorSection icon={UserIcon} title={t("enrollments.who")}>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-500">
                    {t("enrollments.client")}
                  </dt>
                  <dd className="mt-1 text-gray-900">{clientName}</dd>
                  <dd className="text-xs text-gray-500">{client?.email}</dd>
                  {client?.phone && <dd className="text-xs text-gray-500">{client.phone}</dd>}
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-500">
                    {t("enrollments.trainer")}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {detail.enrollment.trainer?.displayName}
                  </dd>
                  {detail.enrollment.trainer?.monthlyPrice != null && (
                    <dd className="text-xs text-gray-500">
                      {money(
                        detail.enrollment.trainer.monthlyPrice,
                        detail.enrollment.trainer.currency,
                        locale,
                      )}
                    </dd>
                  )}
                </div>
              </dl>

              {detail.enrollment.goal && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">
                    {t("enrollments.goal")}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-700">
                    {detail.enrollment.goal}
                  </p>
                </div>
              )}
            </EditorSection>

            <EditorSection
              icon={BanknotesIcon}
              title={t("enrollments.months")}
              description={t("enrollments.monthsHint")}
            >
              {detail.periods.length === 0 ? (
                <p className="text-sm text-gray-500">{t("enrollments.noMonths")}</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="pb-2 font-medium">{t("payments.month")}</th>
                      <th className="pb-2 font-medium">{t("payments.status")}</th>
                      <th className="pb-2 font-medium">{t("payments.amount")}</th>
                      <th className="pb-2 font-medium">{t("payments.method")}</th>
                      <th className="pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detail.periods.map((period) => (
                      <tr key={period.id}>
                        <td className="py-2.5 text-gray-900">
                          {formatRange(period.startsOn, period.endsOn, locale)}
                        </td>
                        <td className="py-2.5">
                          <Badge tone={period.status === "paid" ? "brand" : "muted"}>
                            {t(membershipStatusKey(period.status))}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-gray-700">
                          {period.amount != null
                            ? money(period.amount, period.currency, locale)
                            : "—"}
                        </td>
                        <td className="py-2.5 text-gray-500">
                          {period.method ? t(paymentMethodKey(period.method)) : "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => removePeriod(period.id)}
                            className="text-xs font-medium text-red-600 hover:underline"
                          >
                            {t("enrollments.unmark")}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <form onSubmit={markPeriod} className="grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
                <Select
                  label={t("payments.month")}
                  value={form.month}
                  onChange={(event) => setForm((v) => ({ ...v, month: event.target.value }))}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                    <option key={month} value={month}>
                      {t(monthKey(month))}
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  label={t("enrollments.year")}
                  value={form.year}
                  onChange={(event) => setForm((v) => ({ ...v, year: event.target.value }))}
                />
                <Select
                  label={t("payments.status")}
                  value={form.status}
                  onChange={(event) => setForm((v) => ({ ...v, status: event.target.value }))}
                >
                  <option value="paid">{t("membership.paid")}</option>
                  <option value="waived">{t("membership.waived")}</option>
                  <option value="unpaid">{t("membership.unpaid")}</option>
                </Select>
                <Select
                  label={t("payments.method")}
                  value={form.method}
                  onChange={(event) =>
                    setForm((v) => ({ ...v, method: event.target.value as PaymentMethod }))
                  }
                >
                  {/* `card` is not here on purpose — see the class note. */}
                  <option value="transfer">{t("payment.transfer")}</option>
                  <option value="cash">{t("payment.cash")}</option>
                  <option value="other">{t("payment.other")}</option>
                </Select>
                <Input
                  type="number"
                  label={t("payments.amount")}
                  hint={t("enrollments.amountHint")}
                  value={form.amount}
                  onChange={(event) => setForm((v) => ({ ...v, amount: event.target.value }))}
                />
                <Input
                  label={t("enrollments.note")}
                  value={form.note}
                  onChange={(event) => setForm((v) => ({ ...v, note: event.target.value }))}
                />

                <div className="sm:col-span-2">
                  <Button type="submit" loading={saving}>
                    {t("enrollments.mark")}
                  </Button>
                </div>
              </form>
            </EditorSection>
          </div>

          <aside className="space-y-6">
            <EditorSection icon={RectangleStackIcon} title={t("enrollments.state")} compact>
              <div className="flex items-center gap-2">
                <Badge tone={detail.enrollment.status === "active" ? "brand" : "muted"}>
                  {t(enrollmentStatusKey(detail.enrollment.status))}
                </Badge>
              </div>

              <p
                className={clsx(
                  "rounded-lg px-3 py-2.5 text-sm",
                  detail.access.open
                    ? "bg-green-50 text-green-900"
                    : "bg-amber-50 text-amber-900",
                )}
              >
                {detail.access.open && detail.access.endsOn
                  ? t("enrollments.openUntil", {
                      date: formatDay(detail.access.endsOn, locale),
                      count: detail.access.daysLeft,
                    })
                  : detail.access.reason === "not_active"
                    ? t("enrollments.closedNotActive")
                    : t("enrollments.closedUnpaid")}
              </p>

              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">{t("enrollments.requested")}</dt>
                  <dd className="text-gray-900">
                    {new Date(detail.enrollment.createdAt).toLocaleDateString(locale)}
                  </dd>
                </div>
                {detail.enrollment.acceptedAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t("enrollments.accepted")}</dt>
                    <dd className="text-gray-900">
                      {new Date(detail.enrollment.acceptedAt).toLocaleDateString(locale)}
                    </dd>
                  </div>
                )}
              </dl>

              {detail.enrollment.trainer && (
                <Link
                  href={`/admin/trainers/${detail.enrollment.trainer.id}`}
                  className="block text-sm font-medium text-primary-700 hover:underline"
                >
                  {t("enrollments.openTrainer")}
                </Link>
              )}
            </EditorSection>
          </aside>
        </div>
      )}
    </AdminLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
