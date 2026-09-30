import { useState } from "react";
import clsx from "clsx";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

/**
 * A secondary, foldable panel — used for the configuration around a page
 * (settings, SEO) so it reads as *metadata*, visually distinct from the page
 * content itself. Muted background, folded by default, no white "canvas".
 */
export default function CollapsiblePanel({
  title,
  description,
  icon: Icon,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Small summary shown on the header while folded, e.g. the slug. */
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-300 border-dashed bg-gray-100/70">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-200/50"
      >
        <Icon className="h-5 w-5 shrink-0 text-gray-500" aria-hidden />

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-700">
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs text-gray-500">
              {description}
            </span>
          )}
        </span>

        {badge && !open && (
          <span className="hidden shrink-0 truncate text-xs text-gray-500 sm:block">
            {badge}
          </span>
        )}

        <ChevronDownIcon
          aria-hidden
          className={clsx(
            "h-5 w-5 shrink-0 text-gray-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-dashed border-gray-300 bg-white/60 px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}
