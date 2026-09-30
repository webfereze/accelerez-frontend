import { StarIcon } from "@heroicons/react/24/solid";

/**
 * An official classification, 1–5.
 *
 * Only ever rendered when there is one. A property with `stars: null` is not
 * classified — a holiday home usually is not — and drawing five hollow stars
 * for it would be a claim about the place rather than an absence of one.
 *
 * The number is also written out for screen readers, because five identical
 * icons announce as nothing useful.
 */
export default function Stars({ count }: { count: number }) {
  const stars = Math.max(1, Math.min(5, Math.round(count)));

  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      <span className="sr-only">{stars}</span>
      {Array.from({ length: stars }, (_, index) => (
        <StarIcon key={index} aria-hidden className="h-3.5 w-3.5 text-acid-500" />
      ))}
    </span>
  );
}
