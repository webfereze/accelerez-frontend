import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import Modal from "./Modal";

/**
 * "Are you sure?", as something the site actually designed.
 *
 * It replaces `window.confirm`, which is not a dialog so much as an
 * interruption: it is unstyled, it says "localhost:4003 says", it cannot be
 * translated, and it puts *Cancel* and *OK* in whatever order the operating
 * system prefers — so the destructive answer moves depending on the machine.
 *
 * **The tone is the whole point.** A delete and a send are both confirmations
 * and they are not the same question, so they do not get the same button: red
 * for the one that destroys something, green for the one that sends. Cancel is
 * always the outline button, always on the left of the pair, and always the
 * thing that happens if somebody presses Escape or clicks the backdrop.
 */
export type ConfirmTone = "danger" | "send" | "neutral";

const ICONS: Record<
  ConfirmTone,
  React.ComponentType<{ className?: string }>
> = {
  danger: ExclamationTriangleIcon,
  send: PaperAirplaneIcon,
  neutral: QuestionMarkCircleIcon,
};

/** The badge behind the icon — colour saying what kind of question this is. */
const HALO: Record<ConfirmTone, string> = {
  danger: "bg-red-50 text-red-600",
  send: "bg-accent-50 text-accent-800",
  neutral: "bg-gray-100 text-gray-500",
};

/**
 * The button that carries out the action. Red destroys, green sends — and both
 * are solid, because the confirming button is the one being aimed at.
 */
const CONFIRM: Record<ConfirmTone, string> = {
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  send: "bg-accent-500 text-ink-950 hover:bg-accent-400 focus-visible:outline-accent-600",
  neutral:
    "bg-primary-800 text-white hover:bg-primary-900 focus-visible:outline-primary-800",
};

export type ConfirmRequest = {
  title: string;
  /** One or two sentences. Say what will happen, not "are you sure". */
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

export default function ConfirmDialog({
  open,
  request,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  request: ConfirmRequest | null;
  /** True while the action runs, so the dialog cannot be fired twice. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("common");

  const tone = request?.tone ?? "neutral";
  const Icon = ICONS[tone];

  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60";

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={request?.title ?? ""}
      size="sm"
      // `Modal` already lays its footer out as a reversed column that becomes a
      // right-aligned row from `sm:` — so cancel sits under the confirm on a
      // phone and to its left on a desktop, with no second flex container here.
      footer={
        <>
          {/* Cancel is the outline button and it is never the accent colour:
              the way out of a dialog should not look like the thing it is
              asking you to do. */}
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={clsx(
              base,
              "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-gray-400",
            )}
          >
            {request?.cancelLabel ?? t("common.cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            // Focused on open, so Enter answers the question the dialog asked
            // rather than whatever was focused on the page behind it.
            autoFocus
            className={clsx(base, CONFIRM[tone])}
          >
            {busy && (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            )}
            {request?.confirmLabel ?? t("common.confirm")}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <span
          aria-hidden
          className={clsx(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            HALO[tone],
          )}
        >
          <Icon className="h-6 w-6" />
        </span>

        <p className="min-w-0 pt-1.5 text-sm leading-relaxed text-gray-600">
          {request?.message}
        </p>
      </div>
    </Modal>
  );
}
