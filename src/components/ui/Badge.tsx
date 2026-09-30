import clsx from "clsx";
import type { PageStatus } from "@/types/content";

/**
 * A small state marker: a neutral chip with a coloured dot.
 *
 * The colour lives in the dot rather than in the whole chip. A page of pastel
 * blocks — amber here, green there, grey below — is the look of an admin panel
 * from a decade ago, and it makes the *labels* fight each other for attention
 * when the thing worth noticing is the row they belong to. One neutral chip
 * shape, one 6px dot, and the word still says what the dot means.
 *
 * `status` colours a page's publication state; `tone` covers everything else a
 * badge marks. Keeping them apart means the publication colours stay reserved
 * for publication and never drift onto other meanings.
 */
type Tone = "brand" | "muted";

const statusDots: Record<PageStatus, string> = {
  draft: "bg-amber-500",
  published: "bg-accent-500",
};

const toneDots: Record<Tone, string> = {
  brand: "bg-primary-500",
  muted: "bg-gray-400",
};

export default function Badge({
  children,
  status,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  status?: PageStatus;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1",
        "text-[11px] font-medium uppercase tracking-[0.06em] text-gray-700",
        "ring-1 ring-inset ring-gray-900/10",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          status ? statusDots[status] : toneDots[tone],
        )}
      />
      {children}
    </span>
  );
}
