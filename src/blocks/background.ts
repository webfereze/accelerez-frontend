import type { BlockType } from "./types";

/**
 * The ground a block sits on.
 *
 * The page is black, so the choices run the other way from a light site: a
 * block stands out by painting something **lighter** than the page, not darker.
 * The editor chooses in the block header; blocks that predate the field fall
 * back to a sensible default for their type.
 *
 * The band always **bleeds to the screen edges while the words stay in the page
 * gutter** — `BlockRenderer` puts the colour on the outer element and the
 * container on the inner one — and the padding above and below it is the same,
 * so a coloured section is a band rather than a lopsided box.
 */
export const BLOCK_BACKGROUNDS = [
  "none",
  "soft",
  "raised",
  "pink",
  "dark",
  "neon",
] as const;

export type BlockBackground = (typeof BLOCK_BACKGROUNDS)[number];

/**
 * What each option paints.
 *
 * `dark` and `neon` also re-point the type colours inside themselves — see
 * `globals.css`. The other three only change the surface, which is safe
 * because all of them are dark enough for the page's own light type.
 */
const CLASSES: Record<BlockBackground, string | undefined> = {
  none: undefined,
  soft: "bg-ink-900",
  raised: "bg-ink-800",
  pink: "bg-flare-950",
  dark: "block-dark",
  neon: "block-acid",
};

/** The swatch shown in the picker. Same colours, at chip size. */
export const BACKGROUND_SWATCHES: Record<BlockBackground, string> = {
  none: "bg-ink-950",
  soft: "bg-ink-900",
  raised: "bg-ink-800",
  pink: "bg-flare-700",
  dark: "bg-black",
  neon: "bg-acid-500",
};

/**
 * What a block gets when nobody has chosen.
 *
 * Picked by type: the blocks that break up a long scroll — a card grid, a
 * gallery, the call to action — carry a band, and everything a visitor *reads*
 * keeps the white page behind it.
 */
const DEFAULTS: Partial<Record<BlockType, BlockBackground>> = {
  cta: "neon",
  cardGrid: "soft",
  accordion: "soft",
  gallery: "dark",
  // The featured frame is dark and the queue beside it is busy; a white
  // ground keeps the composition from turning into one grey mass.
  slider: "none",
  contactCard: "soft",
  // The neon is spent on the call to action, which is the one thing on a page
  // that has to be impossible to miss. A newsletter block wearing it too would
  // mean neither is loud.
  newsletter: "soft",
  notice: "soft",
};

/** The editor's stored choice, or nothing if it has never been touched. */
export function backgroundOf(data: unknown): BlockBackground | undefined {
  const value = (data as { background?: unknown } | null)?.background;
  return BLOCK_BACKGROUNDS.includes(value as BlockBackground)
    ? (value as BlockBackground)
    : undefined;
}

/** The class to paint, resolving the editor's choice against the type default. */
export function backgroundClass(type: BlockType, data: unknown): string | undefined {
  const chosen = backgroundOf(data) ?? DEFAULTS[type] ?? "none";
  return CLASSES[chosen];
}
