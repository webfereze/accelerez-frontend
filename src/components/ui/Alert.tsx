import clsx from "clsx";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

type Tone = "error" | "success" | "info";

/**
 * Inline feedback, on a dark card.
 *
 * The pastel tinted box — pink for bad news, mint for good — is the most dated
 * thing an interface can wear, and on a white page it is also the weakest: a
 * message that matters ends up as the palest element on screen. This is the
 * opposite. One near-black card, and the tone lives in a single icon chip, so
 * the message reads as *something the system is telling you* at any size.
 *
 * Errors announce themselves to screen readers via `role="alert"`.
 */
/**
 * Light surfaces, like everything else in the admin.
 *
 * These were dark panels, which is the public site's language — a near-black
 * slab announcing "saved" in the middle of a white form reads as an error
 * whatever colour the icon is. Tone now lives in the surface itself, quietly.
 */
const tones: Record<
  Tone,
  { surface: string; chip: string; icon: typeof InformationCircleIcon }
> = {
  error: {
    surface: "border-red-200 bg-red-50 text-red-900",
    chip: "bg-red-100 text-red-700 ring-red-200",
    icon: ExclamationTriangleIcon,
  },
  success: {
    surface: "border-emerald-200 bg-emerald-50 text-emerald-900",
    chip: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    icon: CheckCircleIcon,
  },
  info: {
    surface: "border-gray-200 bg-gray-50 text-gray-800",
    chip: "bg-gray-200 text-gray-700 ring-gray-300",
    icon: InformationCircleIcon,
  },
};

export default function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const { surface, chip, icon: Icon } = tones[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-3 rounded-lg border px-4 py-3.5 text-sm leading-relaxed",
        surface,
        className,
      )}
    >
      <span
        className={clsx(
          "mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          chip,
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pt-1">{children}</span>
    </div>
  );
}
