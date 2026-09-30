import clsx from "clsx";

/**
 * A fixed set of options, any number of which may be on.
 *
 * Used wherever the blueprint defines a closed list — industry tags, the
 * services an article points at. Deliberately a checklist and not a
 * multi-select: a `<select multiple>` hides its options behind a scroll and
 * requires ctrl-click to deselect, which is a control almost nobody operates
 * correctly, and these lists are five or six items long.
 *
 * `max` enforces the document's caps ("cel mult două articole conexe") in the
 * form rather than only at the API, so an editor is stopped at the moment of
 * choosing rather than at the moment of saving. Options beyond the cap are
 * disabled rather than hidden — a vanished option looks like a bug.
 */
export default function EnumChecklist<T extends string>({
  label,
  hint,
  options,
  labelFor,
  value,
  onChange,
  max,
}: {
  label: string;
  hint?: string;
  options: readonly T[];
  labelFor: (key: T) => string;
  value: T[];
  onChange: (next: T[]) => void;
  max?: number;
}) {
  const selected = value ?? [];
  const full = max !== undefined && selected.length >= max;

  const toggle = (key: T, on: boolean) =>
    // Filtered from `options` rather than appended, so the stored order is the
    // canonical one however the boxes were clicked.
    onChange(
      options.filter((option) =>
        option === key ? on : selected.includes(option),
      ),
    );

  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {options.map((option) => {
          const on = selected.includes(option);
          const locked = full && !on;

          return (
            <label
              key={option}
              className={clsx(
                "flex min-h-11 items-center gap-2.5 text-sm",
                locked ? "text-gray-400" : "text-gray-700",
              )}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={locked}
                onChange={(event) => toggle(option, event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
              />
              {labelFor(option)}
            </label>
          );
        })}
      </div>
    </div>
  );
}
