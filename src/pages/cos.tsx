import type { GetStaticProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import PageHeading from "@/components/public/PageHeading";
import CartLines, { CartTotal } from "@/components/public/CartLines";
import CheckoutForm from "@/components/public/CheckoutForm";
import OrderConfirmation from "@/components/public/OrderConfirmation";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/hooks/useCheckout";
import { translations } from "@/utils/i18n";
import { fetchChrome, type SiteChrome } from "@/utils/site";

type Props = { chrome: SiteChrome };

/**
 * The cart, and checking it out: the lines on the left, who is ordering on
 * the right. After ordering, the same address shows the confirmation.
 *
 * Not indexed — a cart is a different page for every visitor and an empty one
 * for a crawler.
 */
export default function CartPage({ chrome }: Props) {
  const { t } = useTranslation("common");
  const cart = useCart();
  const checkout = useCheckout();

  const siteName = chrome.site.name?.trim() || t("site.name");

  return (
    <>
      <Seo title={`${t("cart.title")} — ${siteName}`} noindex />

      <PublicLayout chrome={chrome}>
        {checkout.receipt ? (
          <div className="site-container py-16 md:py-24">
            <OrderConfirmation receipt={checkout.receipt} />
          </div>
        ) : (
          <>
            <PageHeading
              eyebrow={t("shop.title")}
              title={t("cart.title")}
              crumbs={[{ label: t("shop.title"), href: "/magazin" }, { label: t("cart.title") }]}
            />

            <div className="site-container pb-24 pt-10">
              {cart.removed > 0 && (
                <p
                  role="status"
                  className="mb-6 rounded-card bg-flare-500/10 px-4 py-3 text-sm text-flare-200"
                >
                  {t("cart.removedUnavailable")}
                </p>
              )}

              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <ShoppingBagIcon className="h-14 w-14 text-ink-600" aria-hidden />
                  <p className="mt-5 font-head text-2xl text-white">{t("cart.emptyTitle")}</p>
                  <p className="mt-2 text-ink-400">{t("cart.emptyText")}</p>
                  <Link
                    href="/magazin"
                    className="mt-8 inline-flex min-h-11 items-center rounded-full bg-acid-500 px-6 font-head text-sm font-medium text-ink-950 transition-colors hover:bg-white"
                  >
                    {t("cart.toShop")}
                  </Link>
                </div>
              ) : (
                <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
                  <section aria-label={t("cart.title")}>
                    <CartLines />
                    <div className="border-t border-white/10 pt-6">
                      <CartTotal />
                    </div>
                  </section>

                  <aside className="lg:sticky lg:top-32 lg:self-start">
                    <div className="rounded-panel border border-white/10 bg-ink-900 p-6">
                      <h2 className="mb-6 font-head text-2xl text-white">{t("cart.yourDetails")}</h2>
                      <CheckoutForm
                        busy={checkout.busy || cart.quoting}
                        error={checkout.error}
                        onSubmit={checkout.submit}
                      />
                    </div>
                  </aside>
                </div>
              )}
            </div>
          </>
        )}
      </PublicLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => ({
  props: {
    chrome: await fetchChrome(),
    ...(await translations(locale, ["common"])),
  },
  revalidate: 300,
});
