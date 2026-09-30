/**
 * One labelled value in a `<dl>` — the details of a request or an order.
 *
 * `children` replaces `value` when the value is a link. `break-all` because
 * what goes here is often an address or a URL with no spaces to wrap on.
 */
export default function Fact({
  label,
  value,
  wide,
  children,
}: {
  label: string;
  value?: string;
  wide?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-all text-gray-800">{children ?? value}</dd>
    </div>
  );
}
