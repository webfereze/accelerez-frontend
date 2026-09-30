import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { TrashIcon } from "@heroicons/react/24/outline";
import QuantityStepper from "@/components/public/QuantityStepper";
import { useCart } from "@/contexts/CartContext";
import { money } from "@/utils/labels";

/**
 * The cart's lines — in the drawer and on the checkout page.
 *
 * Names and prices are the server's quote; the quantity shown is the cart's
 * own, so a tap on + moves the number at once and the price catches up when
 * the new quote arrives, rather than the stepper feeling stuck for a round
 * trip.
 */
export default function CartLines({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";
  const cart = useCart();

  const lines = cart.quote?.lines ?? [];

  return (
    <ul className="divide-y divide-white/10">
      {lines.map((line) => {
        const quantity =
          cart.items.find(
            (item) => item.productId === line.productId && item.variantId === line.variantId,
          )?.quantity ?? line.quantity;

        return (
          <li
            key={`${line.productId}:${line.variantId}`}
            className={clsx("flex gap-4", compact ? "py-4" : "py-6")}
          >
            <Link
              href={line.slug ? `/magazin/${line.slug}` : "/magazin"}
              className={clsx(
                "relative shrink-0 overflow-hidden rounded-card bg-ink-800",
                compact ? "h-20 w-16" : "h-28 w-24",
              )}
            >
              {line.image && (
                <Image src={line.image} alt="" fill sizes="96px" className="object-cover" />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={line.slug ? `/magazin/${line.slug}` : "/magazin"}
                    className={clsx(
                      "font-head leading-snug text-white hover:text-acid-400",
                      compact ? "text-base" : "text-lg",
                    )}
                  >
                    {line.productTitle}
                  </Link>
                  {line.variantLabel && (
                    <p className="mt-0.5 text-sm text-ink-400">{line.variantLabel}</p>
                  )}
                </div>

                <p className="shrink-0 text-right">
                  {line.unitPrice != null ? (
                    <span className="font-head text-base text-acid-500">
                      {money(line.unitPrice * quantity, cart.quote?.currency, lang)}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">{t("shop.priceOnRequest")}</span>
                  )}
                  {line.unitPrice != null && quantity > 1 && (
                    <span className="block text-xs text-ink-500">
                      {t("cart.each", { price: money(line.unitPrice, cart.quote?.currency, lang) })}
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                <QuantityStepper
                  value={quantity}
                  label={line.productTitle}
                  onChange={(next) => cart.setQuantity(line.productId, line.variantId, next)}
                />
                <button
                  type="button"
                  onClick={() => cart.remove(line.productId, line.variantId)}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-xs text-ink-400 transition-colors hover:text-flare-400"
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  {t("cart.remove")}
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** "Total: 697 lei", and a line under it when some product has no price yet. */
export function CartTotal() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { quote } = useCart();

  if (!quote || !quote.lines.length) return null;

  return (
    <div>
      <p className="flex items-baseline justify-between gap-4">
        <span className="text-sm uppercase tracking-[0.14em] text-ink-300">{t("cart.total")}</span>
        <span className="font-head text-2xl text-white">
          {quote.total != null ? money(quote.total, quote.currency, locale ?? "ro") : "—"}
        </span>
      </p>
      {quote.hasPriceOnRequest && (
        <p className="mt-1 text-xs text-ink-400">{t("cart.plusOnRequest")}</p>
      )}
    </div>
  );
}
