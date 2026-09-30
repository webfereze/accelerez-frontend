import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { useCart } from "@/contexts/CartContext";
import { api, apiErrorMessage } from "@/utils/api";
import type { OrderReceipt } from "@/types/content";

/**
 * Turning the cart into an order.
 *
 * **It sends the cart's products, variants and quantities — never a price.**
 * The server prices the order from its own rows and answers with what it
 * recorded, which is what the confirmation shows. On success the cart is
 * emptied: what was in it is now the order.
 */
export function useCheckout() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const cart = useCart();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    if (!form.get("consent")) {
      setError(t("shop.form.consentRequired"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { data } = await api.post<OrderReceipt>("/orders", {
        items: cart.items,
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? ""),
        message: String(form.get("message") ?? "") || undefined,
        locale: router.locale ?? "ro",
        sourceUrl: typeof window === "undefined" ? undefined : window.location.href,
        // The honeypot — see the contact form.
        fax: String(form.get("fax") ?? ""),
        consent: true,
      });
      setReceipt(data);
      cart.clear();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(apiErrorMessage(caught, t("shop.form.failed")));
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, receipt, submit };
}
