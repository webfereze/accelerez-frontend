import clsx from "clsx";

/** The class every input inside a `FormField` carries. */
export const FIELD_INPUT =
  "min-h-12 w-full bg-transparent text-[0.95rem] text-ink-50 outline-none placeholder:text-ink-400";

/**
 * One field of a public form: a visible label, then a bordered box with the
 * mark inside it. Shared by the contact panel and the order form.
 *
 * `align` is "start" for a textarea — the mark belongs beside the first line
 * of a growing field, not floating in the middle of it, which is what centring
 * did.
 */
export default function FormField({
  icon: Icon,
  label,
  align = "center",
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  align?: "center" | "start";
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-300">
        {label}
      </span>

      <span
        className={clsx(
          "flex gap-3 rounded-card border border-white/15 bg-ink-900 px-4 transition-colors",
          "focus-within:border-white/20",
          align === "start" ? "items-start py-3.5" : "items-center",
        )}
      >
        <Icon
          className={clsx("h-5 w-5 shrink-0 text-ink-400", align === "start" ? "mt-0.5" : undefined)}
          aria-hidden
        />
        {children}
      </span>
    </label>
  );
}
