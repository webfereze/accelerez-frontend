import Reveal from "./Reveal";

/**
 * The band a section page opens with — attractions, accommodation, events,
 * documents, the blog.
 *
 * **Deliberately not a hero.** A hero is a picture that takes the screen and
 * says "arrive"; a listing page is somewhere a visitor is already going, and a
 * second full-height image between them and the list is an obstacle wearing a
 * nice coat. So this is type on paper, the height of its own content.
 *
 * It sits on the **page ground rather than a dark band**, which is what makes
 * the site read as editorial: the heading is simply the first thing on the
 * page, at the size it deserves, with a hairline under it. A coloured slab
 * behind every section heading is what a template does to make a heading feel
 * important.
 *
 * `lead` is set in the sans face at prose width, so the serif heading has
 * something to be large *against*.
 */
export default function SectionHeader({
  eyebrow,
  title,
  lead,
  count,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** Rendered as given — the caller owns the pluralisation. */
  count?: string;
  /** A control that belongs level with the heading, not below the lead. */
  aside?: React.ReactNode;
}) {
  return (
    <section className="site-container pt-12 md:pt-20">
      <Reveal>
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-ink-400">
                <span aria-hidden className="h-px w-6 bg-acid-500" />
                {eyebrow}
              </p>
            )}

            <h1 className="mt-5 font-head text-4xl leading-[1.08] tracking-tight text-ink-50 md:text-6xl">
              {title}
            </h1>

            {lead && (
              <p className="mt-5 max-w-prose text-base leading-relaxed text-ink-400 md:text-lg">
                {lead}
              </p>
            )}
          </div>

          {(count || aside) && (
            <div className="flex shrink-0 items-center gap-4">
              {count && (
                <p className="text-sm font-medium text-ink-400 tabular-nums">{count}</p>
              )}
              {aside}
            </div>
          )}
        </div>
      </Reveal>
    </section>
  );
}
