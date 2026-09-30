import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * The portal's dialog.
 *
 * Its own rather than `components/ui/Modal` for the same reason the form
 * controls are: that one is built for the admin's light surfaces, and the house
 * rule is that the admin's look stops at `/admin`.
 *
 * What it does beyond showing a box:
 *
 * - **Renders into `document.body`**, so a dialog opened from inside a card is
 *   not clipped by that card's `overflow`.
 * - **Escape closes it and the backdrop closes it**, because both are what
 *   everybody tries.
 * - **Locks the page behind it**, or the dialog scrolls the list underneath and
 *   the reader loses their place on closing.
 * - **Moves focus in on open**, which is what makes it reachable from the
 *   keyboard at all.
 */
export default function PortalModal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** `lg` is for a video: the player wants the width more than the text does. */
  size?: "md" | "lg";
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label={t("actions.close")}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={clsx(
          "relative my-auto w-full rounded-panel border border-white/12 bg-ink-900 shadow-2xl shadow-black/60 outline-none",
          size === "lg" ? "max-w-4xl" : "max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <h2 className="font-head text-lg text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("actions.close")}
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
