import React from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

/**
 * Title row for an admin screen — the admin's house style.
 *
 * An icon chip, a small bold title and a quiet one-line description, with the
 * screen's actions on the right. Compact on purpose: the admin is a working
 * tool where the *content* is the point, and a page heading that fills a fifth
 * of the screen is a heading competing with the table under it.
 *
 * The icon is required rather than optional. Every screen has one in the
 * sidebar already, and repeating it here is what makes a page recognisable at a
 * glance — an optional icon is one that half the screens quietly go without.
 */
export default function AdminPageHeader({
  icon: Icon,
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-5">
      {backHref && (
        <Link
          href={backHref}
          className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
            <Icon className="h-5 w-5 text-primary-700" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-xs text-gray-500">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
