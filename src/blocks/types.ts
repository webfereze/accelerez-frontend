import type {
  Faq,
  Post,
  Testimonial,
  Trainer,
  TrainingClass,
  Translated,
  Product,
} from "@/types/content";

/**
 * A page's content is an ordered list of blocks. Each block is a small, typed
 * piece of content with its own editor (admin) and renderer (public site).
 *
 * Adding a block type means: define its data shape here, write an editor and a
 * renderer, and register it in `registry.tsx`. Nothing else changes — the page
 * editor and the public renderer both read from the registry.
 *
 * This list and the backend's `BLOCK_TYPES` are **one decision in two files**.
 * A block registered here but missing there is rejected on save, and the
 * symptom is a save that appears to do nothing. Add a type to both or neither.
 */
export type Block<T = Record<string, unknown>> = {
  /** Stable id so React keys and drag-reordering survive edits. */
  id: string;
  type: BlockType;
  data: T;
};

export type BlockType =
  | "hero"
  | "showcase"
  | "latestPosts"
  | "promoBand"
  | "featureTeaser"
  | "howToGetThere"
  | "contactPanel"
  | "statsGallery"
  | "richText"
  | "image"
  | "mediaText"
  | "cardGrid"
  | "columns"
  | "accordion"
  | "notice"
  | "cta"
  | "gallery"
  | "galleryPreview"
  | "slider"
  | "video"
  | "embed"
  | "contactCard"
  | "newsletter"
  | "imageStrip"
  | "splitCta"
  | "transformations"
  | "awards"
  | "trainerGrid"
  | "homeHero"
  | "steps"
  | "faqList"
  | "classGrid"
  | "testimonials"
  | "duoHero"
  | "audienceSplit"
  | "productGrid";

// --- Data shapes for the blocks that carry non-obvious structure -----------

export type RichTextData = {
  html: Translated;
};

export type AccordionData = {
  title: Translated;
  /** Sits opposite the heading, above the button. Both are optional. */
  intro: Translated;
  ctaLabel: Translated;
  ctaHref: string;
  items: Array<{
    id: string;
    question: Translated;
    answer: Translated;
  }>;
};

/**
 * The blocks that run **edge to edge**, outside the page gutter, and set their
 * own height.
 *
 * There is no per-block full-bleed switch — content that starts 32px from the
 * glass while the header starts 350px in reads as a mistake. This is the short,
 * closed list of blocks whose whole point is the full width of the screen: the
 * banner a page opens with, the showcase band that hands the viewport over to
 * a photograph, the split call to action whose two panels are half the screen
 * each, and the image strip — whose pictures touch edge to edge and would read
 * as an ordinary gallery the moment a gutter appeared around them.
 * `BlockRenderer` places them, and `PageBody` lets any of them run under the
 * fixed header.
 */
export const FULL_BLEED_BLOCKS: readonly BlockType[] = [
  "hero",
  "showcase",
  "imageStrip",
  // Two panels that each take half the screen. Inside the gutter they become
  // two cards with a margin around them, which is a different block: the whole
  // argument of this one is that the page splits in two.
  "splitCta",
  // The home hero paints two soft washes across the whole width. Inside the
  // page gutter they stop at the container's edge and leave two dark bands
  // down the sides, which reads as a broken background rather than as a frame.
  "homeHero",
  // Two portraits that meet in the middle of the screen; the frame is the
  // same panel `hero` sits in, and like it, it opens the page.
  "duoHero",
];

export function isFullBleed(type: BlockType): boolean {
  return FULL_BLEED_BLOCKS.includes(type);
}

/**
 * Blocks that are **a paragraph of the page**, not a section of it.
 *
 * A body written as five rich-text blocks is one piece of prose an editor
 * happened to split; putting a section's worth of air between each pair makes
 * it read as five unrelated fragments with something missing in between. These
 * get a paragraph's spacing instead, and everything else keeps the full gap.
 *
 * `notice` is here because it is an aside inside a body, and `image` because a
 * picture dropped into an article belongs to the sentence above it.
 */
export const PROSE_BLOCKS: readonly BlockType[] = ["richText", "notice", "image"];

export function isProse(type: BlockType): boolean {
  return PROSE_BLOCKS.includes(type);
}

/** Everything a block editor receives. */
export type BlockEditorProps<T> = {
  data: T;
  onChange: (data: T) => void;
};

/**
 * Content a block needs that is **not** stored in the block itself.
 *
 * Most blocks are self-contained: what an editor typed is what renders. A few
 * are windows onto a collection — the latest articles, what is coming up — and
 * those cannot carry their content, because the whole point is that it changes
 * without anyone editing the page.
 *
 * It is fetched **once by the page** and passed down, rather than fetched by
 * the block. A block that fetches for itself cannot be statically rendered,
 * costs a request per instance, and shows a spinner in the middle of a
 * prerendered page. Every field is optional: a block whose context is missing
 * renders nothing rather than throwing, which is what happens in the admin's
 * block library where there is no page to fetch for.
 */
export type BlockContext = {
  posts?: Post[];
  trainers?: Trainer[];
  testimonials?: Testimonial[];
  faqs?: Faq[];
  classes?: TrainingClass[];
  products?: Product[];
};

/**
 * Which collection each block needs, so a page can fetch exactly that.
 *
 * Without this every page would fetch every collection on the chance that one
 * of its blocks wanted it — five requests to render a page of prose. It is
 * declared here, beside the context it fills, because the two are the same
 * decision and a block added to one and forgotten in the other renders empty
 * for reasons nobody can see.
 */
export const BLOCK_NEEDS: Partial<Record<BlockType, keyof BlockContext>> = {
  latestPosts: "posts",
  trainerGrid: "trainers",
  testimonials: "testimonials",
  faqList: "faqs",
  classGrid: "classes",
  productGrid: "products",
  // The hero shows the directory's faces and its count — never a typed number.
  homeHero: "trainers",
};

/** Everything a block renderer receives on the public site. */
export type BlockRendererProps<T> = {
  data: T;
  locale: string;
  context?: BlockContext;
};
