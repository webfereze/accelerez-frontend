import { useTranslation } from "next-i18next/pages";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import ProductCard from "@/components/public/ProductCard";
import { emptyTranslated, tr } from "@/utils/localized";
import { productCategoryKey } from "@/utils/shop";
import { PRODUCT_CATEGORIES, type ProductCategory, type Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Products from the shop, on any page — the home page's "what is for sale".
 *
 * **A window onto the shop, carrying no products of its own.** The products,
 * their prices and their pictures live in `/admin/products`; this block only
 * decides which of them to show (the featured ones, one category, how many)
 * and what to say above them. A price typed into a page block would be a
 * second price for the same thing, and the day the two disagree the customer
 * is quoted one and charged the other.
 *
 * The page fetches the products once and passes them down — see
 * `BlockContext`. With nothing published the block renders nothing.
 */

export type ProductGridData = {
  eyebrow: Translated;
  title: Translated;
  lead: Translated;
  /** A cap. Four fill a row at desktop width. */
  count: number;
  /** Only the products ticked "on the home page". */
  featuredOnly: boolean;
  /** Empty means every category. */
  category: ProductCategory | "";
  linkLabel: Translated;
  /** How buying works today, under the grid. */
  note: Translated;
};

export function ProductGridEditor({ data, onChange }: BlockEditorProps<ProductGridData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
        {t("blocks.productGrid.hint")}
      </p>

      <TranslatedField
        label={t("blocks.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />
      <TranslatedField
        label={t("blocks.productGrid.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />
      <TranslatedField
        label={t("blocks.lead")}
        value={data.lead ?? emptyTranslated()}
        onChange={(lead) => onChange({ ...data, lead })}
        multiline
        rows={2}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label={t("blocks.productGrid.category")}
          value={data.category ?? ""}
          onChange={(event) =>
            onChange({ ...data, category: event.target.value as ProductGridData["category"] })
          }
        >
          <option value="">{t("shop.all")}</option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(productCategoryKey(category))}
            </option>
          ))}
        </Select>
        <Input
          label={t("blocks.productGrid.count")}
          type="number"
          min={1}
          max={12}
          value={String(data.count ?? 4)}
          onChange={(event) => onChange({ ...data, count: Number(event.target.value) || 4 })}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={data.featuredOnly ?? true}
          onChange={(event) => onChange({ ...data, featuredOnly: event.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        {t("blocks.productGrid.featuredOnly")}
      </label>

      <TranslatedField
        label={t("blocks.productGrid.linkLabel")}
        value={data.linkLabel ?? emptyTranslated()}
        onChange={(linkLabel) => onChange({ ...data, linkLabel })}
      />
      <TranslatedField
        label={t("blocks.productGrid.note")}
        hint={t("blocks.productGrid.noteHint")}
        value={data.note ?? emptyTranslated()}
        onChange={(note) => onChange({ ...data, note })}
        multiline
        rows={2}
      />
    </div>
  );
}

export function ProductGridRenderer({ data, locale, context }: BlockRendererProps<ProductGridData>) {
  const products = (context?.products ?? [])
    .filter((item) => !(data.featuredOnly ?? true) || item.isFeatured)
    .filter((item) => !data.category || item.category === data.category)
    .slice(0, Math.min(12, Math.max(1, data.count ?? 4)));

  if (products.length === 0) return null;

  const linkLabel = tr(data.linkLabel, locale);
  const note = tr(data.note, locale);

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.lead, locale)}
        className="mb-12"
      />

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((item, index) => (
          <Reveal as="li" key={item.id} delay={index * 70}>
            <ProductCard item={item} />
          </Reveal>
        ))}
      </ul>

      {(linkLabel || note) && (
        <div className="mt-12 flex flex-col items-center gap-5 text-center">
          {linkLabel && (
            <Link
              href={data.category ? `/magazin?categorie=${data.category}` : "/magazin"}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:border-acid-500 hover:text-acid-400"
            >
              {linkLabel}
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Link>
          )}
          {note && <p className="max-w-2xl text-sm leading-relaxed text-ink-400">{note}</p>}
        </div>
      )}
    </section>
  );
}

export const productGridDefaults = (): ProductGridData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  lead: emptyTranslated(),
  count: 4,
  featuredOnly: true,
  category: "",
  linkLabel: emptyTranslated(),
  note: emptyTranslated(),
});
