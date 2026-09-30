import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";

/**
 * The bag in the header, with how many things are in it.
 *
 * On every screen size — on a phone it sits beside the menu button rather than
 * inside the menu, because "what is in my cart" is not a navigation question.
 * The count is in the accessible name, not only in the badge.
 */
export default function CartButton({ className }: { className?: string }) {
  const { t } = useTranslation("common");
  const { count, openDrawer, drawerOpen } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-expanded={drawerOpen}
      aria-label={t("cart.open", { count })}
      className={clsx(
        "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-100 transition-colors hover:bg-white/10 hover:text-white",
        className,
      )}
    >
      <ShoppingBagIcon className="h-6 w-6" aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-acid-500 px-1 text-[0.7rem] font-bold text-ink-950"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
