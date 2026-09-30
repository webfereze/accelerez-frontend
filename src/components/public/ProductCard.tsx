import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { money } from "@/utils/labels";
import { lowestPrice, productCategoryKey } from "@/utils/shop";
import type { Product } from "@/types/content";

/**
 * A product in the shop grid and on the home page.
 *
 * The whole card is the link — one target, like the class cards — and the
 * price sits last, just above "Comandă", because by then the reader knows what
 * the figure is for. With several variants it reads "de la", see `lowestPrice`.
 */
export default function ProductCard({
  item,
  priority = false,
}: {
  item: Product;
  priority?: boolean;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const title = tr(item.title, lang);
  const excerpt = tr(item.excerpt, lang);
  const ribbon = tr(item.ribbon, lang);
  const price = lowestPrice(item.variants);

  return (
    <article className="group h-full">
      <Link
        href={`/magazin/${slugIn(item.slug, lang)}`}
        className="flex h-full flex-col overflow-hidden rounded-card bg-ink-900 ring-1 ring-white/10 transition-colors hover:ring-acid-500/50"
      >
        <div className="relative aspect-4/5 overflow-hidden bg-ink-800">
          {item.image ? (
            <Image
              src={item.image}
              alt={item.imageAlt ?? ""}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            <span className="flex h-full items-center justify-center font-head text-5xl text-white/10">
              {title.slice(0, 2).toUpperCase()}
            </span>
          )}

          <span className="absolute left-4 top-4 rounded-full bg-ink-950/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-acid-400 backdrop-blur-sm">
            {t(productCategoryKey(item.category))}
          </span>

          {ribbon && (
            <span className="absolute right-4 top-4 rounded-full bg-flare-500 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wide text-white">
              {ribbon}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="font-head text-xl leading-snug text-white">{title}</h3>
          {excerpt && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-400">{excerpt}</p>
          )}
          {item.trainer && (
            <p className="mt-3 text-xs text-ink-500">
              {t("shop.by", { name: item.trainer.displayName })}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-6">
            <p className="leading-tight">
              {price ? (
                <>
                  {price.from && (
                    <span className="block text-xs text-ink-500">{t("shop.from")}</span>
                  )}
                  <span className="font-head text-xl text-acid-500">
                    {money(price.price, item.currency, lang)}
                  </span>
                  {price.compareAtPrice != null && (
                    <s className="ml-2 text-sm text-ink-500">
                      {money(price.compareAtPrice, item.currency, lang)}
                    </s>
                  )}
                </>
              ) : (
                <span className="text-sm text-ink-300">{t("shop.priceOnRequest")}</span>
              )}
            </p>

            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white transition-colors group-hover:text-acid-400">
              {t("shop.order")}
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
