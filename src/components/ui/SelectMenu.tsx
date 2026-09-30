import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export type SelectOption = {
  value: string;
  label: string;
  /** Indents the option — used for child categories. */
  depth?: number;
};

/**
 * Styled dropdown on Headless UI, with the keyboard and ARIA behaviour a native
 * `<select>` gives for free (type-ahead, arrow keys, Esc, announced state).
 *
 * `name` renders a hidden input alongside it, so the control still works inside
 * a plain GET form and the chosen value ends up in the URL.
 */
export default function SelectMenu({
  name,
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown when nothing is selected — also the "any" option. */
  placeholder: string;
  /** Accessible name for the control. */
  label: string;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={clsx("relative", className)}>
        {name && <input type="hidden" name={name} value={value} />}

        <ListboxButton
          aria-label={label}
          className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-primary-100 bg-primary-50/60 px-4 text-left text-sm font-medium text-primary-900 transition-colors hover:border-primary-200 focus:outline-2 focus:outline-offset-0 focus:outline-accent-700"
        >
          <span className={clsx("truncate", !selected && "text-primary-950/50")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDownIcon
            className="h-4 w-4 shrink-0 text-primary-950/40"
            aria-hidden
          />
        </ListboxButton>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-150"
          enterFrom="opacity-0 -translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-primary-100 bg-white py-1 shadow-xl shadow-primary-950/10 focus:outline-none">
            <ListboxOption
              value=""
              className={({ focus }) =>
                clsx(
                  "flex min-h-11 cursor-pointer items-center gap-2 px-3.5 text-sm text-primary-950/60",
                  focus && "bg-primary-50",
                )
              }
            >
              {placeholder}
            </ListboxOption>

            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={({ focus, selected: isSelected }) =>
                  clsx(
                    "flex min-h-11 cursor-pointer items-center gap-2 px-3.5 text-sm",
                    focus && "bg-primary-50",
                    isSelected
                      ? "font-semibold text-primary-900"
                      : "text-primary-950/80",
                  )
                }
                style={{ paddingLeft: `${0.875 + (option.depth ?? 0) * 1}rem` }}
              >
                {({ selected: isSelected }) => (
                  <>
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected && (
                      <CheckIcon
                        className="h-4 w-4 shrink-0 text-primary-600"
                        aria-hidden
                      />
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}
