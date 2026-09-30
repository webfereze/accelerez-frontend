import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import QuantityStepper from "@/components/public/QuantityStepper";
import { useCart } from "@/contexts/CartContext";
import { tr } from "@/utils/localized";
import { money } from "@/utils/labels";
import type { Product, ProductVariant } from "@/types/content";

/**
 * The panel beside a product: pick a variant, how many, into the cart.
 *
 * The price shown is the one of the variant picked, large, above the button —
 * the number a visitor is agreeing to is the last thing they read before
 * pressing it. Adding opens the cart drawer, so "added" is seen, not assumed.
 */
export default function AddToCart({ product }: { product: Product }) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";
  const cart = useCart();

  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants.find((item) => item.id === variantId) ?? null;
  const delivery = tr(product.deliveryNote, lang);

  const add = () => {
    if (!variant) return;
    cart.add({ productId: product.id, variantId: variant.id, quantity });
    setQuantity(1);
    cart.openDrawer();
  };

  return (
    <div className="space-y-6">
      {variant && (
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="font-head text-4xl text-white">
            {variant.price != null
              ? money(variant.price, product.currency, lang)
              : t("shop.priceOnRequest")}
          </span>
          {variant.compareAtPrice != null && (
            <s className="text-lg text-ink-500">
              {money(variant.compareAtPrice, product.currency, lang)}
            </s>
          )}
        </p>
      )}

      {product.variants.length > 1 && (
        <fieldset>
          <legend className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-300">
            {t("shop.form.variant")}
          </legend>
          <div className="grid gap-2">
            {product.variants.map((item) => (
              <VariantOption
                key={item.id}
                variant={item}
                currency={product.currency}
                checked={item.id === variantId}
                onSelect={() => setVariantId(item.id)}
              />
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} label={tr(product.title, lang)} />
        <button
          type="button"
          onClick={add}
          disabled={!variant}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-full bg-acid-500 px-6 font-head text-[0.95rem] font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-60"
        >
          <ShoppingBagIcon className="h-5 w-5" aria-hidden />
          {t("cart.add")}
        </button>
      </div>

      <p className="rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-xs leading-relaxed text-flare-200">
        {t("shop.form.reservation")}
        {delivery && <> {delivery}</>}
      </p>
    </div>
  );
}

function VariantOption({
  variant,
  currency,
  checked,
  onSelect,
}: {
  variant: ProductVariant;
  currency: string;
  checked: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  return (
    <label
      className={clsx(
        "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-card border px-4 py-3 transition-colors",
        checked
          ? "border-acid-500 bg-acid-500/10"
          : "border-white/15 bg-ink-900 hover:border-white/30",
      )}
    >
      <span className="flex items-center gap-3">
        <input
          type="radio"
          name="variant"
          value={variant.id}
          checked={checked}
          onChange={onSelect}
          className="h-4 w-4 accent-acid-500"
        />
        <span className="text-sm font-medium text-white">{tr(variant.label, lang)}</span>
      </span>

      <span className="text-right">
        {variant.price != null ? (
          <>
            <span className="font-head text-base text-acid-500">
              {money(variant.price, currency, lang)}
            </span>
            {variant.compareAtPrice != null && (
              <s className="ml-2 text-xs text-ink-500">
                {money(variant.compareAtPrice, currency, lang)}
              </s>
            )}
          </>
        ) : (
          <span className="text-xs text-ink-400">{t("shop.priceOnRequest")}</span>
        )}
      </span>
    </label>
  );
}
