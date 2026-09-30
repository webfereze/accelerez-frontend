import clsx from "clsx";
import { getBlockDefinition } from "@/blocks/registry";
import { BlockColumnProvider, type BlockColumn } from "@/blocks/column";
import { backgroundClass } from "@/blocks/background";
import { isFullBleed, isProse, type BlockContext, type BlockType } from "@/blocks/types";
import type { PageBlock } from "@/types/content";

/**
 * Renders a page's blocks. Unknown block types are skipped rather than crashing
 * the page — content outlives code.
 *
 * **Width.** Two cases, decided here so no renderer has to know about the page
 * container:
 *
 * - `hero` and `tourSplit` — always edge to edge, and they set their own
 *   height. They are the **only** blocks outside the container: a hero inside a
 *   1280px column is not a hero, and neither is a full-screen tour splitter.
 *   The list lives in `blocks/types.ts`; there is no per-block switch.
 * - everything else — `site-container`, so every line of content on the page
 *   starts at the same position, level with the logo and the menu above it.
 *   **Not Tailwind's `container`**: in Tailwind 4 that is `width: 100%` with no
 *   max-width unless one is configured, so it silently runs the full window and
 *   nothing lines up with the header.
 *
 * `bare` drops the container entirely, for callers that already provide their
 * own column (an article body). Nesting the page gutter inside a narrower parent
 * would make the block wider than its column and push text outside it.
 *
 * Every block is also a **container**, and blocks lay themselves out against
 * that width (`sm:`, `md:`…) rather than the window's. The same block appears
 * both across a full page and inside a 25% sidebar, where a viewport breakpoint
 * would happily put three cards side by side in 300 pixels because the *window*
 * is wide. What matters is the room the block actually has.
 */
export default function BlockRenderer({
  blocks,
  locale,
  bare = false,
  column = "main",
  context,
}: {
  blocks?: PageBlock[];
  locale: string;
  bare?: boolean;
  /** Blocks in the side column know they are a note, not the centrepiece. */
  column?: BlockColumn;
  /** Collections a block may render — see `BlockContext`. */
  context?: BlockContext;
}) {
  // Inside an article body there are no bands: that column is already a
  // surface, and painting stripes down the middle of it would fight the text.
  let previousBand: string | undefined;

  return (
    <BlockColumnProvider value={column}>
      {(blocks ?? []).map((block) => {
        const definition = getBlockDefinition(block.type as BlockType);
        if (!definition) return null;

        const { Renderer } = definition;
        const bleeds = isFullBleed(block.type as BlockType);
        const band =
          bare || bleeds
            ? undefined
            : backgroundClass(block.type as BlockType, block.data);

        // Two bands of the same colour back to back would read as one very
        // tall section. A hairline is enough to say they are two.
        const merges = !!band && band === previousBand;
        previousBand = band;

        const prose = isProse(block.type as BlockType);

        const inner = (
          // `min-w-0` only. **Never `max-w-full` here**: Tailwind emits
          // `.max-w-full{max-width:100%}` after `.container`'s max-widths, so
          // it silently wins and the block runs the full window width while
          // the header stays contained — a gap that looks like a layout bug
          // and is really a specificity tie broken by order.
          <Renderer data={block.data} locale={locale} context={context} />
        );

        if (bare || bleeds) {
          return (
            <section
              key={block.id}
              /* The block id doubles as an anchor, so a CTA can link to a
                 section further down the same page (`#trasee`). Editors get
                 that for free by naming a block's id. */
              id={block.id}
              className={clsx("min-w-0", bare ? "[&+&]:mt-8" : "w-full")}
            >
              {inner}
            </section>
          );
        }

        return (
          <section
            key={block.id}
            id={block.id}
            /* The band bleeds to the edges; the words stay in the gutter. The
               background is on the outer element and the container on the
               inner one, which is the only arrangement where both are true. */
            className={clsx("min-w-0", band, merges && "border-t border-ink-900/5")}
          >
            {/* Each block owns its own padding, so what a reader sees between
                two of them is this doubled — keep that in mind before raising
                it, since the gap grows twice as fast as the number here.
                The design is built on air: at these values two adjacent
                *sections* are separated by about 100px on a phone and 160px on
                a desktop, which is what lets a heading be enormous without the
                page feeling crowded.

                Prose is the exception. Two paragraphs of an article are not two
                sections, and 160px between them reads as a missing image rather
                than as breathing room — so a text block gets a paragraph's
                worth of space instead, and only pays the full section gap where
                it meets something that is not prose. */}
            <div
              className={clsx(
                "site-container",
                prose ? "py-3 sm:py-4" : "py-12 sm:py-16 lg:py-20",
              )}
            >
              {inner}
            </div>
          </section>
        );
      })}
    </BlockColumnProvider>
  );
}
