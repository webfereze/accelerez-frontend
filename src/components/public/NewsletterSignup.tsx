import { useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { api, apiErrorMessage } from "@/utils/api";

/**
 * The e-mail capture, in the footer and inside the newsletter block.
 *
 * **An underlined field and a square button**, like every other form on this
 * site. The rule under the input is the only chrome it gets: a boxed field
 * would be the one rounded-cornered, bordered object in a design made of flat
 * planes, and it is the element people notice least.
 *
 * It posts to `/newsletter/subscribe`, which stores the address **with the date
 * of consent and the page it came from** — that record is what makes the
 * address lawful to keep, so the tick is a real field rather than fine print.
 *
 * Signing up twice is deliberately not an error: the API reactivates the
 * existing row and answers the same either way, so the form never tells a
 * stranger whether an address is already on the list.
 *
 * `type="email"` and `required` mean the browser validates first, in the
 * visitor's own language, before anything runs.
 */
export default function NewsletterSignup({
  className,
  source = "footer",
  onDark = false,
  /** A unique id, for the two of these that can share a page. */
  id = "newsletter",
}: {
  className?: string;
  /** Which part of the site the sign-up came from, stored on the record. */
  source?: string;
  onDark?: boolean;
  id?: string;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p
        className={clsx("text-sm", onDark ? "text-acid-300" : "text-acid-400", className)}
        role="status"
      >
        {t("footer.newsletterDone")}
      </p>
    );
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!consent) {
      setError(t("footer.newsletterConsentRequired"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await api.post("/newsletter/subscribe", {
        email,
        locale: locale ?? "ro",
        source,
        consent: true,
      });
      setDone(true);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("footer.newsletterFailed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={className} onSubmit={submit}>
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={id}>
            {t("footer.newsletterField")}
          </label>
          <input
            id={id}
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("footer.newsletterField")}
            className={clsx(
              "w-full border-0 border-b bg-transparent pb-3 text-[0.95rem] outline-none transition-colors",
              onDark
                ? "border-white/25 text-ink-100 placeholder:text-ink-400 focus:border-white"
                : "border-white/20 text-ink-50 placeholder:text-ink-400 focus:border-white/20",
            )}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className={clsx(
            "min-h-11 shrink-0 rounded-full px-6 font-head text-[0.9rem] font-medium transition-colors disabled:opacity-60",
            onDark
              ? "bg-ink-900 text-ink-50 hover:bg-ink-800"
              : "bg-acid-500 text-ink-950 hover:bg-ink-950 hover:text-white",
          )}
        >
          {t("footer.newsletterButton")}
        </button>
      </div>

      {/* The consent tick is the record that makes the address lawful to keep,
          so it is a real control rather than a line of fine print. */}
      <label
        className={clsx(
          "mt-4 flex items-start gap-2.5 text-xs leading-relaxed",
          onDark ? "text-ink-400" : "text-ink-400",
        )}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0 border",
            onDark ? "border-white/30 bg-transparent" : "border-ink-900/30",
          )}
        />
        {t("footer.newsletterConsent")}
      </label>

      {error && (
        <p
          role="alert"
          className={clsx("mt-2 text-xs", onDark ? "text-red-300" : "text-red-600")}
        >
          {error}
        </p>
      )}
    </form>
  );
}
