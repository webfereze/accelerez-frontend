import { useTranslation } from "next-i18next/pages";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import { emptyTranslated } from "@/utils/localized";
import type { Translated } from "@/types/content";

/** A variant as the form edits it: prices are the strings the inputs hold. */
export type VariantDraft = {
  id: string;
  label: Translated;
  price: string;
  compareAtPrice: string;
};

let counter = 0;
/** Stable once made. An order points at it, so it never changes on a rename. */
export const newVariantId = () => `v-${Date.now().toString(36)}-${counter++}`;

export const emptyVariant = (): VariantDraft => ({
  id: newVariantId(),
  label: emptyTranslated(),
  price: "",
  compareAtPrice: "",
});

/**
 * The ways a product is sold — "1 lună", "3 luni", "Sală", "Acasă" — each with
 * its own price.
 *
 * **The order of the list is the order on the page**, and the first one is
 * what the order form has selected when it opens, which is why the rows move.
 * An empty price is "preț la cerere", stated as such on the site; it is never
 * sent as zero.
 */
export default function VariantsField({
  value,
  currency,
  onChange,
}: {
  value: VariantDraft[];
  currency: string;
  onChange: (next: VariantDraft[]) => void;
}) {
  const { t } = useTranslation("common");

  const patch = (id: string, next: Partial<VariantDraft>) =>
    onChange(value.map((row) => (row.id === id ? { ...row, ...next } : row)));

  const move = (index: number, by: -1 | 1) => {
    const next = [...value];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {value.map((row, index) => (
          <li key={row.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("shop.admin.variant", { index: index + 1 })}
                {index === 0 && value.length > 1 && (
                  <span className="ml-2 normal-case tracking-normal text-gray-400">
                    {t("shop.admin.variantDefault")}
                  </span>
                )}
              </span>
              <span className="flex gap-1">
                <IconButton
                  label={t("shop.admin.moveUp")}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUpIcon className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={t("shop.admin.moveDown")}
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDownIcon className="h-4 w-4" />
                </IconButton>
                <IconButton
                  label={t("shop.admin.removeVariant", { index: index + 1 })}
                  // A product with no variant cannot be ordered — the API
                  // refuses it, so the last row cannot be removed here either.
                  disabled={value.length === 1}
                  onClick={() => onChange(value.filter((item) => item.id !== row.id))}
                  danger
                >
                  <TrashIcon className="h-4 w-4" />
                </IconButton>
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_9rem]">
              <TranslatedField
                label={t("shop.admin.variantLabel")}
                hint={index === 0 ? t("shop.admin.variantLabelHint") : undefined}
                value={row.label}
                onChange={(label) => patch(row.id, { label })}
                required
              />
              <Input
                type="number"
                min={0}
                step="1"
                label={`${t("shop.admin.price")} (${currency})`}
                placeholder={t("shop.priceOnRequest")}
                value={row.price}
                onChange={(event) => patch(row.id, { price: event.target.value })}
              />
              <Input
                type="number"
                min={0}
                step="1"
                label={t("shop.admin.compareAtPrice")}
                hint={t("shop.admin.compareAtPriceHint")}
                value={row.compareAtPrice}
                onChange={(event) => patch(row.id, { compareAtPrice: event.target.value })}
              />
            </div>
          </li>
        ))}
      </ul>

      <Button variant="secondary" onClick={() => onChange([...value, emptyVariant()])}>
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("shop.admin.addVariant")}
      </Button>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent ${
        danger ? "hover:text-red-600" : "hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
