import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import Drawer from "@/components/public/Drawer";
import CartLines, { CartTotal } from "@/components/public/CartLines";
import { useCart } from "@/contexts/CartContext";

/**
 * The bag in the header opens this: what is in the cart, the total, and the
 * way to the checkout. It also opens by itself when something is added, so
 * "added" is something the visitor sees happen rather than has to trust.
 */
export default function CartDrawer() {
  const { t } = useTranslation("common");
  const cart = useCart();
  const empty = cart.items.length === 0;

  return (
    <Drawer
      open={cart.drawerOpen}
      onClose={cart.closeDrawer}
      label={t("cart.title")}
      header={
        <p className="font-head text-2xl text-white">
          {t("cart.title")}
          {!empty && <span className="ml-2 text-base text-ink-400">({cart.count})</span>}
        </p>
      }
    >
      {cart.removed > 0 && (
        <p role="status" className="mb-4 rounded-card bg-flare-500/10 px-4 py-3 text-xs text-flare-200">
          {t("cart.removedUnavailable")}
        </p>
      )}

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <ShoppingBagIcon className="h-12 w-12 text-ink-600" aria-hidden />
          <p className="mt-4 font-head text-xl text-white">{t("cart.emptyTitle")}</p>
          <p className="mt-2 text-sm text-ink-400">{t("cart.emptyText")}</p>
          <Link
            href="/magazin"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-acid-500 px-6 font-head text-sm font-medium text-ink-950 transition-colors hover:bg-white"
          >
            {t("cart.toShop")}
          </Link>
        </div>
      ) : (
        <>
          <CartLines compact />

          <div className="mt-auto space-y-4 border-t border-white/10 pt-6">
            <CartTotal />
            <Link
              href="/cos"
              className="flex min-h-12 w-full items-center justify-center rounded-full bg-acid-500 font-head text-[0.95rem] font-medium text-ink-950 transition-colors hover:bg-white"
            >
              {t("cart.checkout")}
            </Link>
            <button
              type="button"
              onClick={cart.closeDrawer}
              className="block w-full text-center text-sm text-ink-400 transition-colors hover:text-white"
            >
              {t("cart.continue")}
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
