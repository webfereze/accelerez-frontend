import type { ProductCategory, ProductVariant } from "@/types/content";

/** The i18n key for a category's name. */
export const productCategoryKey = (category: ProductCategory) => `shop.category.${category}`;

/**
 * The figure a card leads with: the cheapest variant that has a price.
 *
 * `from` is true when there is more than one price, so the card can say "de la"
 * — a card that shows the one-month price with no qualifier is quoting a
 * three-month customer the wrong figure. Null when nothing is priced yet,
 * which the card shows as "preț la cerere", never as zero.
 */
export function lowestPrice(variants: ProductVariant[] | null | undefined): {
  price: number;
  compareAtPrice: number | null;
  from: boolean;
} | null {
  const priced = (variants ?? []).filter(
    (variant): variant is ProductVariant & { price: number } => variant.price != null,
  );
  if (!priced.length) return null;

  const cheapest = priced.reduce((low, variant) => (variant.price < low.price ? variant : low));
  const distinct = new Set(priced.map((variant) => variant.price)).size > 1;

  return {
    price: cheapest.price,
    compareAtPrice: cheapest.compareAtPrice,
    // "Preț la cerere" next to a priced variant also makes the figure a floor.
    from: distinct || priced.length < (variants ?? []).length,
  };
}
