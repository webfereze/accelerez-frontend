import clsx from "clsx";

/**
 * The portal's form controls.
 *
 * **Its own, rather than `components/ui`'s.** Those are built for the admin —
 * light surfaces, grey neutrals, a near-black button — and the house rule is
 * that the admin's look stops at `/admin`. Re-skinning them with a `dark` prop
 * would put a branch in every one of twenty-two primitives to serve two
 * screens; four small components here is less code and no risk to the admin.
 *
 * The shared shape is one line high, `min-h-11`, and focused with the neon
 * rather than a browser default nobody chose.
 */

const CONTROL =
  "w-full rounded-card border border-white/12 bg-ink-900 px-4 text-[0.95rem] text-white placeholder:text-ink-500 transition-colors focus:border-acid-500 focus:outline-none disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-200">
        {label}
        {required && <span className="ml-1 text-flare-400">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-ink-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-flare-400">{error}</span>}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(CONTROL, "h-12", className)} />;
}

export function TextArea({
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={rows} className={clsx(CONTROL, "py-3", className)} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={clsx(CONTROL, "h-12", className)}>
      {children}
    </select>
  );
}

/**
 * Three button skins, and the neon one always carries near-black type — white
 * on `#00ea54` is about 1.6:1. See `theme.css`.
 */
export function PortalButton({
  variant = "primary",
  loading = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-head text-sm font-semibold transition-colors disabled:opacity-60",
        variant === "primary" && "bg-acid-500 text-ink-950 hover:bg-acid-400",
        variant === "ghost" &&
          "border border-white/15 text-white hover:border-white/35 hover:bg-white/5",
        variant === "danger" &&
          "border border-flare-500/40 text-flare-300 hover:bg-flare-500/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** A status pill. The tone map lives in `utils/labels` — see it for why. */
export function Pill({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider",
        tone,
      )}
    >
      {children}
    </span>
  );
}
