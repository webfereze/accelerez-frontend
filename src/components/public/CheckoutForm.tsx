import { useTranslation } from "next-i18next/pages";
import {
  AtSymbolIcon,
  PencilIcon,
  PhoneIcon,
  ShoppingBagIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import FormField, { FIELD_INPUT } from "@/components/public/FormField";

/**
 * Who is ordering: name, e-mail (where the plans go), telephone, and an
 * optional word about their goal. The state lives in `useCheckout`; this is
 * only the form.
 */
export default function CheckoutForm({
  busy,
  error,
  onSubmit,
}: {
  busy: boolean;
  error: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <form onSubmit={onSubmit} className="relative space-y-5">
      <FormField icon={UserIcon} label={t("shop.form.name")}>
        <input name="name" required minLength={2} autoComplete="name" className={FIELD_INPUT} />
      </FormField>

      <FormField icon={AtSymbolIcon} label={t("shop.form.email")}>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={t("shop.form.emailPlaceholder")}
          className={FIELD_INPUT}
        />
      </FormField>

      <FormField icon={PhoneIcon} label={t("shop.form.phone")}>
        <input
          name="phone"
          type="tel"
          required
          minLength={6}
          autoComplete="tel"
          className={FIELD_INPUT}
        />
      </FormField>

      <FormField icon={PencilIcon} label={t("shop.form.message")} align="start">
        <textarea
          name="message"
          rows={3}
          placeholder={t("shop.form.messagePlaceholder")}
          className={`${FIELD_INPUT} min-h-0 resize-y leading-relaxed`}
        />
      </FormField>

      {/* The honeypot — see the contact form. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Fax
          <input name="fax" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-400">
        <input
          type="checkbox"
          name="consent"
          className="mt-0.5 h-5 w-5 shrink-0 rounded border border-ink-900/40 bg-ink-900"
        />
        {t("shop.form.consent")}
      </label>

      <p className="rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-xs leading-relaxed text-flare-200">
        {t("shop.form.reservation")}
      </p>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full bg-acid-500 px-6 font-head text-[0.95rem] font-medium text-ink-950 transition-colors hover:bg-white disabled:opacity-60"
      >
        <ShoppingBagIcon className="h-5 w-5" aria-hidden />
        {busy ? t("shop.form.sending") : t("shop.form.submit")}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
