import { useTranslation } from "next-i18next/pages";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { MAX_QUANTITY } from "@/contexts/CartContext";

/** − 2 + — how many. The minus at one is disabled; removing is its own button. */
export default function QuantityStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  /** What is being counted, for a screen reader: the product's name. */
  label: string;
}) {
  const { t } = useTranslation("common");

  const button =
    "flex h-9 w-9 items-center justify-center rounded-full text-ink-200 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div
      role="group"
      aria-label={t("cart.quantityOf", { name: label })}
      className="inline-flex items-center rounded-full border border-white/15"
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={t("cart.decrease")}
        className={button}
      >
        <MinusIcon className="h-4 w-4" aria-hidden />
      </button>
      <span aria-live="polite" className="min-w-7 text-center text-sm font-medium text-white">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label={t("cart.increase")}
        className={button}
      >
        <PlusIcon className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
