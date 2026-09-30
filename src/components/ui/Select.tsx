import { forwardRef, useId } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  /** Hides the label visually but keeps it for screen readers. */
  srOnlyLabel?: boolean;
};

/** Shared labelled select. Native on purpose — it's the best mobile picker. */
const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, hint, srOnlyLabel, className, required, children, ...rest },
  ref,
) {
  const id = useId();

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
        <select
          ref={ref}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          className={clsx(
            "min-h-11 w-full appearance-none rounded-lg border bg-white px-3.5 py-2.5 pr-9",
            "text-base text-gray-900 transition-colors sm:min-h-10 sm:py-2 sm:text-sm",
            "focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-900/10",
            error
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/25"
              : "border-gray-300 hover:border-gray-400",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
      </div>

      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Select;
