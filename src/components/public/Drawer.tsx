import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * A panel that slides in from the right over a dimmed page — the menu on a
 * phone, and the cart.
 *
 * Three things it does because a panel that traps you is worse than no panel:
 * **Escape closes it**, **the page behind does not scroll**, and focus moves
 * to the close button when it opens so a keyboard reader is inside it rather
 * than behind it. It also closes on navigation, not on click: a link to an
 * anchor on the same page would otherwise leave it open over the target.
 *
 * While shut it is `inert`, so nothing inside it can be tabbed to from the
 * page behind. Open, it sits above the cookie banner (z-80): the visitor asked
 * for this panel, and a banner covering its button is a panel they cannot use.
 */
export default function Drawer({
  open,
  onClose,
  label,
  header,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Its name for a screen reader. */
  label: string;
  /** Beside the close button, on the same line. */
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    router.events.on("routeChangeComplete", onClose);
    return () => router.events.off("routeChangeComplete", onClose);
  }, [router.events, onClose]);

  return (
    <>
      {/* Clickable to close. `pointer-events-none` when shut so it never
          swallows a click on the page underneath. */}
      <div
        aria-hidden
        onClick={onClose}
        className={clsx(
          "fixed inset-0 z-[85] bg-ink-950/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        aria-hidden={!open}
        aria-label={label}
        inert={!open}
        className={clsx(
          "fixed inset-y-0 right-0 z-[90] flex w-full flex-col overflow-y-auto overscroll-contain bg-ink-950 px-5 py-5 text-ink-200 sm:max-w-sm sm:px-8 sm:py-8",
          "transition-transform duration-500 ease-out motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-8 flex shrink-0 items-center justify-between gap-4 sm:mb-10">
          <div className="min-w-0">{header}</div>
          <button
            ref={closeButton}
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-ink-900/10 hover:text-white"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden />
          </button>
        </div>

        {children}
      </aside>
    </>
  );
}
