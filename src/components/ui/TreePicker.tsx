import { Fragment, useMemo, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Label,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export type TreeOption = {
  value: string;
  label: string;
  /** Second line, muted — usually where the entry points. */
  hint?: string;
  /** 0 = top level. Drawn as indentation with a guide rule. */
  depth?: number;
  icon?: React.ComponentType<{ className?: string }>;
  /** Tailwind classes for the icon tint, from the shared scheme. */
  tint?: string;
  /** Small pill on the right, e.g. "ciornă". */
  badge?: string;
  badgeTone?: "warning" | "muted";
};

/**
 * A picker for lists that are both long and nested — document categories run
 * to 74 entries across two levels.
 *
 * A native `<select>` cannot show hierarchy (people fake it with "— " prefixes,
 * which is unreadable) and cannot be searched. This is a Headless UI combobox:
 * type to filter, arrow keys to move, and the tree is drawn as real
 * indentation with a guide rule, so a child is visibly a child.
 */
export default function TreePicker({
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
  noResultsLabel,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: TreeOption[];
  /** Shown in the closed control when nothing is picked. */
  placeholder: string;
  /** Label of the "nothing selected" option. Omit to make the choice required. */
  emptyLabel?: string;
  noResultsLabel: string;
  hint?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const needle = fold(query);
    if (!needle) return options;

    // Matching a parent keeps it visible, but a child matching on its own must
    // not be orphaned — so parents of matches are pulled back in.
    const matched = options.filter((option) =>
      fold(`${option.label} ${option.hint ?? ""}`).includes(needle),
    );
    const keep = new Set(matched.map((o) => o.value));

    options.forEach((option, index) => {
      if (!keep.has(option.value)) return;
      for (let i = index - 1; i >= 0; i -= 1) {
        if ((options[i].depth ?? 0) < (option.depth ?? 0)) {
          keep.add(options[i].value);
          break;
        }
      }
    });

    return options.filter((option) => keep.has(option.value));
  }, [options, query]);

  const SelectedIcon = selected?.icon;

  return (
    <Combobox
      value={value}
      onChange={(next: string | null) => {
        onChange(next ?? "");
        setQuery("");
      }}
    >
      <div className="w-full">
        <Label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="ml-0.5 text-red-600" aria-hidden>
              *
            </span>
          )}
        </Label>

        <div className="relative">
          {SelectedIcon && !query && (
            <SelectedIcon
              aria-hidden
              className={clsx(
                "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                selected?.tint ?? "text-gray-400",
              )}
            />
          )}

          <ComboboxInput
            className={clsx(
              "min-h-11 w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 text-base text-gray-900",
              "placeholder:text-gray-400 hover:border-gray-400",
              "focus:outline-2 focus:outline-offset-0 focus:outline-accent-800",
              SelectedIcon && !query ? "pl-9" : "pl-3",
            )}
            placeholder={placeholder}
            displayValue={() => selected?.label ?? ""}
            onChange={(e) => setQuery(e.target.value)}
            // Half-typed text must not linger as if it were the value.
            onBlur={() => setQuery("")}
          />

          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden
            />
          </ComboboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <ComboboxOptions className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg focus:outline-none">
              {emptyLabel && (
                <Row option={{ value: "", label: emptyLabel }} muted />
              )}

              {filtered.length === 0 ? (
                <p className="px-3 py-2.5 text-sm text-gray-500">
                  {noResultsLabel}
                </p>
              ) : (
                filtered.map((option) => (
                  <Row key={option.value} option={option} />
                ))
              )}
            </ComboboxOptions>
          </Transition>
        </div>

        {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
      </div>
    </Combobox>
  );
}

function Row({ option, muted }: { option: TreeOption; muted?: boolean }) {
  const depth = option.depth ?? 0;
  const Icon = option.icon;

  return (
    <ComboboxOption
      value={option.value}
      className="group cursor-pointer data-[focus]:bg-accent-50"
    >
      <div
        className="flex items-center gap-2.5 py-2 pr-3"
        // Indentation is the hierarchy; a guide rule keeps deep rows anchored.
        style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
      >
        {depth > 0 && (
          <span
            aria-hidden
            className="-ml-3 h-4 w-2 shrink-0 border-b border-l border-gray-300"
          />
        )}

        {Icon && (
          <Icon
            aria-hidden
            className={clsx("h-4 w-4 shrink-0", option.tint ?? "text-gray-400")}
          />
        )}

        <span className="min-w-0 flex-1">
          <span
            className={clsx(
              "block truncate text-sm",
              muted
                ? "text-gray-500"
                : depth === 0
                  ? "font-medium text-gray-900"
                  : "text-gray-700",
            )}
          >
            {option.label}
          </span>
          {option.hint && (
            <span className="block truncate text-xs text-gray-400">
              {option.hint}
            </span>
          )}
        </span>

        {option.badge && (
          <span
            className={clsx(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
              option.badgeTone === "warning"
                ? "bg-amber-50 text-amber-800 ring-amber-200"
                : "bg-gray-100 text-gray-600 ring-gray-300",
            )}
          >
            {option.badge}
          </span>
        )}

        <CheckIcon
          aria-hidden
          className="h-4 w-4 shrink-0 text-accent-800 opacity-0 group-data-[selected]:opacity-100"
        />
      </div>
    </ComboboxOption>
  );
}

/** Diacritic-insensitive matching — people type "stare civila". */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
