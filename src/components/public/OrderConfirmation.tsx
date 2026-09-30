import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { money } from "@/utils/labels";
import type { OrderReceipt } from "@/types/content";

/**
 * After checking out: the reference, what was ordered and the total — all as
 * the server recorded them — and what happens next. The reference is the
 * largest thing on it because it is what the customer writes on a transfer.
 */
export default function OrderConfirmation({ receipt }: { receipt: OrderReceipt }) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  return (
    <div role="status" className="mx-auto max-w-xl text-center">
      <CheckCircleIcon className="mx-auto h-14 w-14 text-acid-500" aria-hidden />
      <h1 className="mt-5 font-head text-4xl text-white">{t("shop.form.thanks")}</h1>
      <p className="mt-3 text-ink-300">{t("cart.receivedLead")}</p>

      <p className="mt-8 rounded-card border border-white/10 bg-ink-900 px-6 py-5">
        <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-400">
          {t("shop.form.reference")}
        </span>
        <span className="mt-1 block font-head text-3xl tracking-wider text-acid-500">
          {receipt.reference}
        </span>
      </p>

      <ul className="mt-6 divide-y divide-white/10 text-left text-sm">
        {receipt.lines.map((line) => (
          <li key={`${line.productId}:${line.variantId}`} className="flex justify-between gap-4 py-3">
            <span className="text-ink-200">
              {line.quantity > 1 && `${line.quantity} × `}
              {[line.productTitle, line.variantLabel].filter(Boolean).join(" · ")}
            </span>
            <span className="shrink-0 text-ink-300">
              {line.unitPrice != null
                ? money(line.unitPrice * line.quantity, receipt.currency, lang)
                : t("shop.priceOnRequest")}
            </span>
          </li>
        ))}
      </ul>

      {receipt.total != null && (
        <p className="mt-4 flex justify-between border-t border-white/10 pt-4 font-head text-xl text-white">
          <span>{t("cart.total")}</span>
          <span>{money(receipt.total, receipt.currency, lang)}</span>
        </p>
      )}
      {receipt.hasPriceOnRequest && (
        <p className="mt-1 text-right text-xs text-ink-400">{t("cart.plusOnRequest")}</p>
      )}

      <p className="mt-8 text-sm leading-relaxed text-ink-400">{t("shop.form.next")}</p>

      <Link
        href="/magazin"
        className="mt-8 inline-flex min-h-11 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:border-acid-500 hover:text-acid-400"
      >
        {t("cart.toShop")}
      </Link>
    </div>
  );
}
