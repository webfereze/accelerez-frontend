import BlockRenderer from "./BlockRenderer";
import { isFullBleed, type BlockContext, type BlockType } from "@/blocks/types";
import type { Page, PageBlock } from "@/types/content";

/**
 * Renders a page's blocks, honouring its layout.
 *
 * Shared by `/` and `/[slug]` so the two cannot drift — the homepage is just a
 * page with a flag.
 *
 * **A full-bleed block is page-level chrome, not column content.** A hero — or
 * the full-screen tour splitter — at the start of the page is lifted out and
 * rendered edge to edge, above the two-column area. Otherwise a page with a
 * sidebar would trap its banner in a 1280px column and lose the one thing it
 * is for.
 *
 * Below that, a two-column page puts its remaining blocks in the narrower main
 * column beside the sidebar. Those blocks are rendered `bare`, which also means
 * the full-width switch does nothing there — correctly: a block sharing a row
 * with a sidebar cannot also span the window. The editor is told as much.
 */
export default function PageBody({
  page,
  locale,
  context,
}: {
  page: Page;
  locale: string;
  context?: BlockContext;
}) {
  const blocks = (page.content ?? []) as PageBlock[];
  const sidebar = (page.sidebar ?? []) as PageBlock[];

  const hasSidebar = page.layout === "sidebar" && sidebar.length > 0;

  // Only *leading* full-bleed blocks break out. One placed halfway down is
  // being used as a divider, and splitting the sidebar around it would show it
  // twice.
  let lead = 0;
  while (lead < blocks.length && isFullBleed(blocks[lead].type as BlockType)) lead++;

  const heroes = blocks.slice(0, lead);
  const rest = blocks.slice(lead);

  return (
    <>
      {heroes.length > 0 && (
        <BlockRenderer blocks={heroes} locale={locale} context={context} />
      )}

      {hasSidebar ? (
        <div className="site-container grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
          <div className="min-w-0">
            <BlockRenderer blocks={rest} locale={locale} bare context={context} />
          </div>
          <aside className="min-w-0">
            <BlockRenderer blocks={sidebar} locale={locale} column="side" bare />
          </aside>
        </div>
      ) : (
        <BlockRenderer blocks={rest} locale={locale} context={context} />
      )}
    </>
  );
}

/**
 * True when the page opens with a block that runs edge to edge and sets its own
 * height, so the fixed header can lie over it instead of pushing it down.
 */
export function opensFullBleed(page: Page | null | undefined): boolean {
  const first = ((page?.content ?? []) as PageBlock[])[0];
  return !!first && isFullBleed(first.type as BlockType);
}

/**
 * True when the page opens with a **hero** specifically — which is the only
 * block that carries a visible `<h1>`. A page opening with anything else still
 * needs one, so this is deliberately narrower than `opensFullBleed`.
 */
export function opensWithHero(page: Page | null | undefined): boolean {
  return ((page?.content ?? []) as PageBlock[])[0]?.type === "hero";
}
