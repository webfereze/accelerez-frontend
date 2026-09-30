import { useMemo } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import Reveal from "@/components/public/Reveal";
import PageHeading from "@/components/public/PageHeading";
import PublicEmpty from "@/components/public/PublicEmpty";
import FilterBar from "@/components/public/FilterBar";
import ProductCard from "@/components/public/ProductCard";
import { translations } from "@/utils/i18n";
import { productCategoryKey } from "@/utils/shop";
import { fetchChrome, fetchProducts, type SiteChrome } from "@/utils/site";
import { PRODUCT_CATEGORIES, type Product } from "@/types/content";

type Props = { products: Product[]; chrome: SiteChrome };

/**
 * The shop.
 *
 * Every published product is fetched at build time and filtered in the
 * browser, like the classes: tens of rows, and a category tap should not cost a
 * request. The category travels in the address (`?categorie=`) so a filtered
 * shop can be linked to — "the meal plans" from an Instagram bio.
 */
export default function ShopIndex({ products, chrome }: Props) {
  const { t } = useTranslation("common");
  const { query } = useRouter();

  const active = typeof query.categorie === "string" ? query.categorie : "";

  const filtered = useMemo(
    () =>
      active ? products.filter((item) => item.category === active) : products,
    [products, active],
  );

  const siteName = chrome.site.name?.trim() || t("site.name");

  return (
    <>
      <Seo
        title={`${t("shop.title")} — ${siteName}`}
        description={t("shop.lead")}
      />

      <PublicLayout chrome={chrome}>
        <PageHeading
          eyebrow={t("shop.eyebrow")}
          title={t("shop.title")}
          lead={t("shop.lead")}
        />

        {/* `FilterBar` pulls itself up by its own margin to sit on the edge of
            a banner; under a plain heading it needs the room back. */}
        {products.length > 0 && (
          <div className="pt-16 md:pt-20">
            <FilterBar
              filters={PRODUCT_CATEGORIES.map((category) => ({
                value: category,
                label: t(productCategoryKey(category)),
                count: products.filter((item) => item.category === category)
                  .length,
              }))}
              active={active}
              basePath="/magazin"
              param="categorie"
              allLabel={t("shop.all")}
              totalCount={products.length}
            />
          </div>
        )}

        <div className="site-container pb-24 pt-12">
          {filtered.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((item, index) => (
                <Reveal as="li" key={item.id} delay={Math.min(index, 6) * 50}>
                  <ProductCard item={item} priority={index < 4} />
                </Reveal>
              ))}
            </ul>
          ) : (
            <PublicEmpty
              title={t("shop.emptyTitle")}
              hint={t("shop.emptyText")}
            />
          )}

          <p className="mx-auto mt-14 max-w-2xl text-center text-sm leading-relaxed text-ink-400">
            {t("shop.reservationNote")}
          </p>
        </div>
      </PublicLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const [list, chrome] = await Promise.all([
    fetchProducts({ locale: locale ?? "ro", perPage: 100 }),
    fetchChrome(),
  ]);

  return {
    props: {
      products: list?.rows ?? [],
      chrome,
      ...(await translations(locale, ["common"])),
    },
    revalidate: 300,
  };
};
