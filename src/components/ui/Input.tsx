import { forwardRef, useId } from "react";
import clsx from "clsx";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  /** Validation message — also wires up aria-invalid / aria-describedby. */
  error?: string;
  hint?: string;
  /** Hides the label visually but keeps it for screen readers. */
  srOnlyLabel?: boolean;
  /**
   * A control sitting inside the field's right edge — the password reveal, for
   * one. Rendered in a relative wrapper around the input only, so it lines up
   * with the box rather than with the label above it.
   */
  trailing?: React.ReactNode;
  /**
   * A small icon inside the left edge. Decoration: it names the field's *kind*
   * at a glance, while the label still names the field. Never the only way to
   * tell what a field is for.
   */
  leading?: React.ComponentType<{ className?: string }>;
};

/**
 * Shared labelled text input. The label is always rendered and always tied to
 * the input — placeholder-only fields fail accessibility checks.
 *
 * The field is a **filled** control, not an outlined one: a soft warm-grey box
 * with a hairline, which turns white and takes a green focus halo when it is
 * the one being typed into. On a white page an outlined field is four thin grey
 * lines and reads as a wireframe; a filled one reads as somewhere to write.
 */
const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, srOnlyLabel, trailing, leading: Leading, className, required, ...rest },
  ref,
) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={clsx(
          "mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-gray-500",
          srOnlyLabel && "sr-only",
        )}
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden>
            *
          </span>
        )}
      </label>

      <div className="relative">
        {Leading && (
          <Leading
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          />
        )}

        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            clsx(error && errorId, hint && hintId).trim() || undefined
          }
          className={clsx(
            // 44px and 16px type on touch: the first is the minimum target,
            // the second stops iOS zooming the page on focus. From `sm:` up
            // neither applies, and a long form reads better tighter.
            "min-h-11 w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-gray-900 transition-colors",
            "sm:min-h-10 sm:py-2 sm:text-sm",
            "placeholder:text-gray-400",
            "focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-900/10",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400",
            // Room for whatever sits inside the field, so text never runs under it.
            trailing && "pr-11",
            Leading && "pl-10",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/25"
              : "border-gray-300 hover:border-gray-400",
            className,
          )}
          {...rest}
        />

        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-1">
            {trailing}
          </div>
        )}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
