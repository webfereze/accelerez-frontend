import clsx from "clsx";
import Reveal from "./Reveal";

/**
 * The header every section on this site opens with.
 *
 * **One object, three arrangements**, because the reference art direction uses
 * the same three parts everywhere and only changes where they sit:
 *
 * - `split` — eyebrow and a very large title on the left, the lead paragraph
 *   set small beside it on the right, and any control (slider arrows, a "read
 *   more") pushed to the far edge. This is the default and it is what makes the
 *   page read as designed rather than stacked: the title gets to be enormous
 *   precisely because the paragraph is not underneath it.
 * - `center` — eyebrow over a centred title, nothing else. For a section whose
 *   content is the argument and whose header should get out of the way.
 * - `stack` — everything left-aligned in a column, for a narrow container where
 *   a split would give each half 300px.
 *
 * The eyebrow is the small tracked-out capital line. It is the one place in the
 * design where letter-spacing is opened up, and it works *because* it is the
 * only one — the headings underneath are tracked tight.
 *
 * Nothing renders for a part that is empty, so a block can pass whatever its
 * editor filled in and get a sensible header either way.
 */
export default function SectionIntro({
  eyebrow,
  title,
  lead,
  aside,
  align = "split",
  onDark = false,
  className,
}: {
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** A control level with the title — slider arrows, a text link. */
  aside?: React.ReactNode;
  align?: "split" | "center" | "stack";
  onDark?: boolean;
  className?: string;
}) {
  if (!eyebrow && !title && !lead && !aside) return null;

  const eyebrowMark = eyebrow && (
    <p
      className={clsx(
        "text-[0.7rem] font-semibold uppercase tracking-[0.22em]",
        onDark ? "text-ink-300" : "text-ink-300",
      )}
    >
      {eyebrow}
    </p>
  );

  const heading = title && (
    <h2
      className={clsx(
        "font-head text-[2.5rem] sm:text-6xl lg:text-7xl",
        onDark ? "text-white" : "text-ink-50",
      )}
    >
      {title}
    </h2>
  );

  const paragraph = lead && (
    <p
      className={clsx(
        "max-w-xl text-base leading-[1.75]",
        onDark ? "text-ink-300" : "text-ink-400",
      )}
    >
      {lead}
    </p>
  );

  if (align === "center") {
    return (
      <Reveal>
        <div className={clsx("flex flex-col items-center gap-5 text-center", className)}>
          {eyebrowMark}
          {heading}
          {paragraph && <div className="mt-1">{paragraph}</div>}
          {aside}
        </div>
      </Reveal>
    );
  }

  if (align === "stack") {
    return (
      <Reveal>
        <div className={clsx("flex flex-col items-start gap-5", className)}>
          {eyebrowMark}
          {heading}
          {paragraph}
          {aside}
        </div>
      </Reveal>
    );
  }

  return (
    <Reveal>
      <div
        className={clsx(
          // `items-start`, not `items-end`: the lead aligns to the top of the
          // title's first line, which is what the reference does and what keeps
          // a two-line title from dragging the paragraph down the page.
          "flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-16",
          className,
        )}
      >
        <div className="flex min-w-0 flex-col gap-4 lg:flex-1">
          {eyebrowMark}
          {heading}
        </div>

        {(paragraph || aside) && (
          <div className="flex flex-1 items-start justify-between gap-8 lg:pt-4">
            {paragraph}
            {aside && <div className="shrink-0">{aside}</div>}
          </div>
        )}
      </div>
    </Reveal>
  );
}
