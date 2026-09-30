import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import Breadcrumb from "@/components/public/Breadcrumb";
import BlockRenderer from "@/components/public/BlockRenderer";
import AddToCart from "@/components/public/AddToCart";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { productCategoryKey } from "@/utils/shop";
import { fetchChrome, fetchProduct, fetchProductSlugs, type SiteChrome } from "@/utils/site";
import { LOCALES, type Locale, type Product } from "@/types/content";

type Props = { item: Product; chrome: SiteChrome };

/**
 * One product: what it is on the left, the price and "add to cart" on the right.
 *
 * The button is in the first screen on a desktop and straight after the
 * picture and the summary on a phone — the client wants what is for sale in front, and
 * a buy button three scrolls down is a shop with the till in the back room.
 * The long description (blocks) follows underneath for whoever wants it.
 */
export default function ProductDetail({ item, chrome }: Props) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const siteName = chrome.site.name?.trim() || t("site.name");
  const title = tr(item.title, lang);
  const excerpt = tr(item.excerpt, lang);

  const alternates = Object.fromEntries(
    LOCALES.flatMap((code) => {
      const slug = item.slug?.[code];
      const live = (item.publishedLocales ?? ["ro"]).includes(code);
      return slug && live ? [[code, `/magazin/${slug}`]] : [];
    }),
  ) as Partial<Record<Locale, string>>;

  return (
    <>
      <Seo
        title={`${tr(item.seoTitle, lang) || title} — ${siteName}`}
        description={tr(item.seoDescription, lang) || excerpt}
        image={item.image}
        imageAlt={item.imageAlt}
        noindex={item.noindex}
        locales={item.publishedLocales ?? undefined}
        alternates={alternates}
      />

      <PublicLayout chrome={chrome} alternates={alternates}>
        <div className="site-container pb-16 pt-8 md:pt-12">
          <Breadcrumb
            items={[{ label: t("shop.title"), href: "/magazin" }, { label: title }]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-14">
            <div>
              {item.image && (
                <div className="relative aspect-4/3 overflow-hidden rounded-panel bg-ink-900">
                  <Image
                    src={item.image}
                    alt={item.imageAlt ?? ""}
                    fill
                    sizes="(min-width: 1024px) 55vw, 100vw"
                    priority
                    className="object-cover"
                  />
                </div>
              )}

              <p className="mt-8 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-acid-400">
                {t(productCategoryKey(item.category))}
              </p>
              <h1 className="mt-3 font-head text-4xl uppercase tracking-tight text-white md:text-5xl">
                {title}
              </h1>

              {excerpt && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-300 md:text-lg">
                  {excerpt}
                </p>
              )}

              {item.trainer && (
                <p className="mt-5 text-sm text-ink-400">
                  <Link
                    href={`/antrenori/${slugIn(item.trainer.slug, lang)}`}
                    className="underline decoration-white/20 underline-offset-4 hover:text-acid-400"
                  >
                    {t("shop.by", { name: item.trainer.displayName })}
                  </Link>
                </p>
              )}
            </div>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="rounded-panel border border-white/10 bg-ink-900 p-6">
                <AddToCart product={item} />
              </div>
            </aside>
          </div>
        </div>

        {(item.content ?? []).length > 0 && (
          <BlockRenderer blocks={item.content ?? []} locale={lang} />
        )}
      </PublicLayout>
    </>
  );
}

/** One path per language the product is actually written in — never a fallback. */
export const getStaticPaths: GetStaticPaths = async () => {
  const rows = (await fetchProductSlugs()) ?? [];

  return {
    paths: rows.flatMap((row) =>
      (row.locales ?? ["ro"]).flatMap((locale) => {
        const slug = row.slug?.[locale];
        return slug ? [{ params: { slug }, locale }] : [];
      }),
    ),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params, locale }) => {
  const slug = String(params?.slug ?? "");

  const [item, chrome] = await Promise.all([fetchProduct(slug, locale ?? "ro"), fetchChrome()]);
  if (!item) return { notFound: true, revalidate: 60 };

  return {
    props: { item, chrome, ...(await translations(locale, ["common"])) },
    // Short: a price changed in the admin should reach the page quickly.
    revalidate: 60,
  };
};
