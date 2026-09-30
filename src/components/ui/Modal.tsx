import { Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "next-i18next/pages";

/** `lg` is for content that needs room to be judged — a block preview. */
const widths = {
  // A question, not a form: narrow enough that the two buttons under it read
  // as a pair rather than as opposite ends of a bar.
  sm: "sm:max-w-md",
  md: "sm:max-w-2xl",
  lg: "sm:max-w-5xl",
} as const;

/**
 * Accessible dialog (focus trap, Esc to close, restores focus on exit).
 *
 * Mobile-first: full-width sheet pinned to the bottom of the screen on a
 * phone, centred card from `sm:` up.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  headerExtra,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Sub-line under the title, for a one-sentence explanation. */
  description?: string;
  size?: keyof typeof widths;
  /** Controls that belong in the header rather than the footer. */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation("common");

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/50" aria-hidden />
        </TransitionChild>

        <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="translate-y-full opacity-0 sm:translate-y-2"
            enterTo="translate-y-0 opacity-100"
            leave="ease-in duration-150"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-full opacity-0 sm:translate-y-2"
          >
            <DialogPanel
              className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl ${widths[size]}`}
            >
              {/* Wraps rather than squeezing: on a phone the title keeps the
                  first row with the close button and any controls drop to a
                  row of their own. Ordered with `order-*` rather than rendered
                  twice — duplicating a control would duplicate it for a screen
                  reader and for the tab sequence too. */}
              <div className="flex flex-wrap items-start gap-x-3 gap-y-3 border-b border-gray-200 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-base font-semibold text-primary-900">
                    {title}
                  </DialogTitle>
                  {description && (
                    <p className="mt-0.5 text-sm leading-snug text-gray-500">
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="-m-2 order-1 shrink-0 rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 sm:order-last"
                >
                  <XMarkIcon className="h-5 w-5" />
                  <span className="sr-only">{t("common.close")}</span>
                </button>

                {headerExtra && (
                  <div className="order-2 w-full sm:order-none sm:w-auto">
                    {headerExtra}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

              {footer && (
                <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
                  {footer}
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
