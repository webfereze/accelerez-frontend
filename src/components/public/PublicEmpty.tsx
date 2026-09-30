/**
 * "Nothing here yet", on the public site.
 *
 * Separate from `ui/EmptyState` on purpose: that one is the admin's, in the
 * admin's grey neutrals, and the admin has one look which is deliberately not
 * the site's. Reusing it would drop a grey administrative panel into the middle
 * of a warm limestone page.
 *
 * It says plainly that there is nothing rather than dressing the gap up. A
 * visitor who filtered down to nothing needs to know the filter did that, and a
 * section the association has not filled yet should look unfilled.
 */
export default function PublicEmpty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  /** A way out, where there is one — "read it in Romanian", say. */
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-panel border border-dashed border-white/15 bg-ink-900/60 px-6 py-16 text-center">
      <p className="font-head text-xl text-ink-50">{title}</p>
      {hint && <p className="mx-auto mt-3 max-w-prose text-sm text-ink-400">{hint}</p>}
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </div>
  );
}
