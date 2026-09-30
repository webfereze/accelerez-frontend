import { useState } from "react";
import clsx from "clsx";
import { useTranslation } from "next-i18next/pages";
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";

/**
 * Copy one value to the clipboard.
 *
 * For the values that are *transcribed* rather than read — a webhook URL that
 * has to be pasted into Stripe's dashboard, where one wrong character is a
 * payment that never gets confirmed and an afternoon spent looking for the
 * reason.
 *
 * `navigator.clipboard` is unavailable over plain HTTP and can be refused by
 * the browser, so the failure is silent and the value stays selectable on the
 * page. A dead button is better than an error dialog over a convenience.
 */
export default function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  /** What is being copied, for the screen reader and the tooltip. */
  label: string;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      // Long enough to be seen, short enough that the button is ready again
      // before somebody reaches for it a second time.
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // No clipboard permission, or an insecure origin. The value is on screen.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? t("common.copied") : label}
      aria-label={copied ? t("common.copied") : label}
      className={clsx(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
        "text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700",
        "focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:outline-none",
        className,
      )}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-primary-600" aria-hidden />
      ) : (
        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
