import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";

/**
 * The cookie notice.
 *
 * **Reject is as easy as accept**, and they look the same weight. A notice
 * where refusing takes an extra click through a "manage preferences" screen is
 * not consent, it is attrition — and under GDPR it is not valid consent at all.
 *
 * **It asks before anything is set.** Right now the site stores nothing beyond
 * this answer: there is no analytics, no embedded player on a page a visitor
 * lands on cold, and no advertising. So the honest position is that the banner
 * is here ready for the day something is added, and `hasConsent()` is the gate
 * that thing must pass through. Wiring an analytics script in *without* calling
 * it would make this decoration.
 *
 * The answer itself lives in `localStorage`, not a cookie: it is a preference
 * for this browser, it never needs to reach the server, and storing a cookie in
 * order to record that somebody refused cookies is the joke that writes itself.
 */

/**
 * This site's own key.
 *
 * It read `omd.cookies` — the namespace of the project this codebase was
 * started from — which on a shared development origin means two sites
 * answering for each other's consent. A stored preference belongs to the site
 * that asked for it.
 */
const KEY = "accelerez.cookies";

/** Broadcast when the answer is cleared, so the banner comes back at once. */
const REOPEN = "accelerez:cookies-reopen";
type Answer = "accepted" | "rejected";

/**
 * Forget the answer and ask again.
 *
 * Ch. 02 puts the cookie settings in the footer beside the legal notices, and
 * consent that cannot be withdrawn as easily as it was given is not consent.
 * The footer link calls this; the banner listens and reappears.
 */
export function reopenCookieChoice(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked — the banner still reopens for this page.
  }
  window.dispatchEvent(new Event(REOPEN));
}

/** What a script should call before it sets anything. */
export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "accepted";
  } catch {
    // Private mode, or storage blocked entirely. No answer means no consent.
    return false;
  }
}

export default function CookieConsent() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      // Asked only once. An unanswered notice is the state that matters; any
      // stored answer, either way, means the visitor has decided.
      if (!window.localStorage.getItem(KEY)) setOpen(true);
    } catch {
      // Storage unavailable — the answer could not be remembered, so asking on
      // every page would be nagging with no way to stop it.
    }

    const reopen = () => setOpen(true);
    window.addEventListener(REOPEN, reopen);
    return () => window.removeEventListener(REOPEN, reopen);
  }, []);

  const answer = useCallback((value: Answer) => {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      // Nothing to do: the visitor gets their choice for this page either way.
    }
    setOpen(false);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookies.title")}
      className={clsx(
        "fixed inset-x-0 bottom-0 z-[80] p-4 md:p-6",
        "motion-safe:animate-[hero-rise_0.5s_cubic-bezier(0.22,1,0.36,1)_backwards]",
      )}
    >
      <div className="site-container">
        <div className="flex flex-col gap-5 rounded-3xl bg-ink-950 p-6 font-sans text-ink-300 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.8)] md:flex-row md:items-center md:gap-8 md:p-7">
          <div className="min-w-0 flex-1">
            <p className="font-head text-xl text-ink-50">{t("cookies.title")}</p>
            <p className="mt-2 text-sm leading-relaxed">
              {t("cookies.body")}{" "}
              <Link
                href="/cookies"
                className="underline decoration-acid-500 decoration-2 underline-offset-4 hover:text-ink-50"
              >
                {t("cookies.readMore")}
              </Link>
            </p>
          </div>

          {/* Same size, same shape, side by side. */}
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => answer("rejected")}
              className="min-h-12 rounded-full border border-white/30 px-7 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-100 transition-colors hover:border-white hover:text-white"
            >
              {t("cookies.reject")}
            </button>
            <button
              type="button"
              onClick={() => answer("accepted")}
              className="min-h-12 rounded-full bg-acid-500 px-7 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-ink-950 transition-colors hover:bg-acid-400"
            >
              {t("cookies.accept")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
