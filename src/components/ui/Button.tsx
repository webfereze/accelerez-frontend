import { forwardRef } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and blocks interaction. */
  loading?: boolean;
  fullWidth?: boolean;
};

/**
 * **Near-black, not the site's accent.**
 *
 * The house rule is that the admin has one look across every project — light
 * surfaces, grey neutrals, a dark pill for the primary action — and it is
 * deliberately *not* the site's art direction. A yellow Save here would make
 * the admin look like a second front end and would mean every project's admin
 * looked different, which is the thing the shared CMS exists to prevent.
 *
 * `primary` and `secondary` hover with a wipe from the left and the label
 * inverting on top of it (`sweep` below). `ghost` is a text control and stays a
 * tint — a wipe on something that is not shaped like a button reads as a glitch.
 */
const variants: Record<ButtonVariant, string> = {
  primary: "bg-gray-900 text-white shadow-sm hover:text-white",
  secondary: "border border-gray-300 bg-white text-gray-800 hover:text-white",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
};

/** What the wipe paints, per variant. `ghost` has none. */
const sweeps: Record<ButtonVariant, string | null> = {
  primary: "bg-gray-700",
  secondary: "bg-gray-900",
  ghost: null,
};

// min-h-11 = 44px — the minimum comfortable touch target on a phone.
const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 py-2 text-[13px]",
  lg: "min-h-12 px-5 py-2.5 text-sm",
};

/**
 * The wipe that plays on hover. Exported alongside `buttonClasses` because the
 * two only work as a pair: the classes turn the label a colour that is only
 * legible once this has painted behind it.
 */
export function ButtonSweep({ variant = "primary" }: { variant?: ButtonVariant }) {
  const sweep = sweeps[variant];
  if (!sweep) return null;

  return (
    <span
      aria-hidden
      className={clsx(
        "absolute inset-0 -z-10 origin-left scale-x-0 transition-transform duration-300 ease-out",
        "group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none",
        sweep,
      )}
    />
  );
}

/**
 * The shared button appearance. Exported so `ButtonLink` can render an anchor
 * that looks identical without either component duplicating the class list.
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
} = {}): string {
  return clsx(
    "group relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-colors duration-300",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-700",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
  );
}

/** Shared button. Never style a `<button>` inline — extend this instead. */
const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      /**
       * `button`, not the HTML default of `submit`.
       *
       * A bare `<button>` inside a `<form>` submits it, so any Button placed in
       * a form for some other purpose — "add a row", "open the picker" — was
       * silently saving the form as well. On the settings screen that showed up
       * as "saved" appearing when you added a social profile, and the profile
       * itself not being saved: the submit ran against the state from before
       * the row was added.
       *
       * Submitting is the exceptional case, so it is opted into with an
       * explicit `type="submit"` (which `...rest` still overrides).
       */
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(buttonClasses({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {/* Never on a disabled or busy button: a control that animates while
          refusing to be pressed is a control that looks broken. */}
      {!disabled && !loading && <ButtonSweep variant={variant} />}

      {/* One row for everything the button shows — the spinner, an icon passed
          as a child, and the label — so an icon can never sit a pixel off the
          text it belongs to. `relative` lifts it clear of the wipe behind. */}
      <span className="relative inline-flex items-center justify-center gap-2">
        {loading && (
          <span
            aria-hidden
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {children}
      </span>
    </button>
  );
});

export default Button;
