import { forwardRef, useId } from "react";
import clsx from "clsx";

type Props = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  error?: string;
  hint?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, hint, className, rows = 3, ...rest },
  ref,
) {
  const id = useId();

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium uppercase tracking-[0.08em] text-gray-500"
      >
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={clsx(
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-gray-900 transition-colors sm:py-2 sm:text-sm",
          "placeholder:text-gray-400",
          "focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-gray-900/10",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/25"
            : "border-gray-300 hover:border-gray-400",
          className,
        )}
        {...rest}
      />
      {hint && !error && (
        <p className="mt-1.5 text-xs text-gray-500">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

export default Textarea;
