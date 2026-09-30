import Reveal from "./Reveal";
import Breadcrumb, { type Crumb } from "./Breadcrumb";

/**
 * The band a page opens with when it has no hero of its own.
 *
 * **Type on paper, not a dark slab.** A coloured band behind every page title
 * is what a template does to make a heading feel important; here the heading is
 * simply the first thing on the page, at the size it deserves, over the same
 * warm ground as everything below it. The page then reads as continuous
 * instead of as a header stapled to a body.
 *
 * It carries the `<h1>`. A page opening with a hero already has one inside that
 * block, and the caller is the only thing that knows which case it is in.
 *
 * **The breadcrumb belongs here**, above the heading, because every inner page
 * wants one in the same place (ch. 02) and a trail positioned by hand on each
 * page ends up at three different distances from the title. Pass the steps
 * that are yours; home is added for you.
 */
export default function PageHeading({
  eyebrow,
  title,
  lead,
  crumbs,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  /** The steps below the home page. Omit for a page that is one.  */
  crumbs?: Crumb[];
}) {
  return (
    <section className="site-container pt-10 md:pt-14">
      {crumbs && crumbs.length > 0 && (
        <Breadcrumb items={crumbs} className="mb-8 md:mb-10" />
      )}

      <Reveal>
        {eyebrow && (
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-300">
            {eyebrow}
          </p>
        )}

        <h1 className="mt-6 max-w-4xl font-head text-[2.75rem] text-ink-50 lg:text-7xl">
          {title}
        </h1>

        {lead && (
          <p className="mt-7 max-w-2xl text-[1.05rem] leading-[1.8] text-ink-400">{lead}</p>
        )}
      </Reveal>
    </section>
  );
}
