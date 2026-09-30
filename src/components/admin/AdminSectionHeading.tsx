import React from "react";

/**
 * The label above a group of fields inside an admin card.
 *
 * Extracted from the settings screen when the diagnostics screen needed the
 * same thing. Named for the admin rather than taking the `SectionHeading` name,
 * which belongs to the public site's eyebrow-and-H2 primitive — two different
 * things called the same would be picked wrongly within a week.
 *
 * A `<p>`, not a heading element: these sit inside a card under the page's one
 * `<h1>` and are labels for a group of fields, not document structure. Marking
 * them up as `<h2>` would put a dozen empty sections into the outline a screen
 * reader announces.
 */
export default function AdminSectionHeading({
  icon: Icon,
  children,
  actions,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  /** A control belonging to this group — a refresh, a check. */
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        <Icon className="h-5 w-5" aria-hidden />
        {children}
      </p>
      {actions}
    </div>
  );
}
