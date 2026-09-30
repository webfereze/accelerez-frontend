import type {
  BlogCategory,
  Faq,
  MenuItem,
  Occupancy,
  Page,
  Post,
  PostTag,
  SiteConfig,
  SiteSettings,
  Testimonial,
  Trainer,
  TrainingClass,
  Product,
  ProductCategory,
} from "@/types/content";

import { BLOCK_NEEDS, type BlockContext, type BlockType } from "@/blocks/types";

/** What every paged endpoint answers with. */
export type Paged<T> = { rows: T[]; total: number; page: number; perPage: number };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8006";

/**
 * A read from the API during a build or a server render.
 *
 * **Never throws.** A page is prerendered at build time and re-rendered on a
 * schedule; an API that is briefly unreachable must degrade to a page with less
 * on it, not to a build that fails or a 500 the visitor sees. Every caller
 * handles `null`.
 */
async function get<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export type SiteChrome = {
  main: MenuItem[];
  footer: MenuItem[];
  site: SiteSettings;
  config: SiteConfig;
};

/**
 * The header, the footer and the deploy-level config, in one round trip each.
 *
 * Fetched per page rather than per component: a block that needs the telephone
 * number should not cost a request, and three blocks needing it should not cost
 * three.
 */
export async function fetchChrome(): Promise<SiteChrome> {
  const [main, footer, site, config] = await Promise.all([
    get<MenuItem[]>("/menu/main"),
    get<MenuItem[]>("/menu/footer"),
    get<SiteSettings>("/settings/site"),
    get<SiteConfig>("/site-config"),
  ]);

  return {
    main: main ?? [],
    footer: footer ?? [],
    site: site ?? {},
    // Fails closed: with no answer the site is not indexable and has no
    // canonical origin, which is the safe state for a preview or a bad deploy.
    config: config ?? { baseUrl: "", allowIndexing: false },
  };
}

export const fetchHomepage = () => get<Page>("/pages/home");
export const fetchPage = (slug: string) =>
  get<Page>(`/pages/${encodeURIComponent(slug)}`);
export const fetchPageSlugs = () =>
  get<Array<{ slug: string; updatedAt: string }>>("/pages/slugs");


/**
 * Blog articles, newest first with whatever the editor pinned at the front.
 *
 * The API decides that order, not this file — the "latest news" block and the
 * blog index must agree about which article is the featured one, and two
 * clients sorting for themselves is how they stop agreeing.
 */
/**
 * Articles, as a page of results.
 *
 * Always an envelope — `{ rows, total, page, perPage }` — even when a caller
 * only wants three for a block. One response shape means the home page's block
 * and the blog index cannot end up ordering or filtering differently, which is
 * the bug two endpoints would eventually produce.
 */
export const fetchPosts = ({
  limit,
  page,
  perPage,
  search,
  tag,
  category,
  service,
  locale = "ro",
}: {
  limit?: number;
  page?: number;
  perPage?: number;
  search?: string;
  tag?: string;
  category?: string;
  /** Articles the editor attached to a service group — see ch. 08. */
  service?: string;
  locale?: string;
} = {}) => {
  const query = new URLSearchParams({ locale });
  if (limit) query.set("limit", String(limit));
  if (page) query.set("page", String(page));
  if (perPage) query.set("perPage", String(perPage));
  if (search) query.set("search", search);
  if (tag) query.set("tag", tag);
  if (category) query.set("category", category);
  if (service) query.set("service", service);
  return get<Paged<Post>>(`/posts?${query.toString()}`);
};

/**
 * One article, **by that language's slug**.
 *
 * The locale is not optional in practice: the API matches the slug against the
 * requested language only, and an article never written in that language is a
 * 404 rather than the Romanian one. That is the blueprint's rule (ch. 09) and
 * this is where the front end has to honour it.
 */
export const fetchPost = (slug: string, locale = "ro") =>
  get<Post>(`/posts/${encodeURIComponent(slug)}?locale=${locale}`);
export const fetchRelatedPosts = (slug: string, limit = 3, locale = "ro") =>
  get<Post[]>(`/posts/${encodeURIComponent(slug)}/related?limit=${limit}&locale=${locale}`);
export const fetchPostTags = () => get<PostTag[]>("/posts/tags");

/**
 * The categories with something published in them, in this language.
 *
 * The filter row is built from this rather than from the enum: ch. 08 says not
 * to show empty categories, and on `/hu/blog` — where only some articles are
 * translated — the set of non-empty ones is genuinely different.
 */
export const fetchPostCategories = (locale = "ro") =>
  get<Array<{ category: BlogCategory; count: number }>>(`/posts/categories?locale=${locale}`);

// --- the directory ---------------------------------------------------------

/**
 * Every one of these takes a **locale**, and none of them falls back.
 *
 * The API returns nothing for a record that was never written in the requested
 * language rather than the Romanian one, so these are thin wrappers that only
 * have to pass the language through. Getting that wrong here would reintroduce
 * the silent substitution at the one layer the API cannot police.
 */
export const fetchTrainers = ({
  locale = "ro",
  perPage,
  page,
  specialization,
  format,
  city,
  search,
  acceptingOnly,
}: {
  locale?: string;
  perPage?: number;
  page?: number;
  specialization?: string;
  format?: string;
  city?: string;
  search?: string;
  acceptingOnly?: boolean;
} = {}) => {
  const query = new URLSearchParams({ locale });
  if (perPage) query.set("perPage", String(perPage));
  if (page) query.set("page", String(page));
  if (specialization) query.set("specialization", specialization);
  if (format) query.set("format", format);
  if (city) query.set("city", city);
  if (search) query.set("search", search);
  if (acceptingOnly) query.set("acceptingOnly", "true");

  return get<Paged<Trainer>>(`/trainers?${query.toString()}`);
};

export const fetchTrainer = (slug: string, locale = "ro") =>
  get<Trainer>(`/trainers/${encodeURIComponent(slug)}?locale=${locale}`);

export const fetchTrainerSlugs = () =>
  get<Array<{ id: number; slug: Record<string, string>; locales: string[] }>>(
    "/trainers/slugs",
  );

/** The cities that actually have a published trainer — the filter's options. */
export const fetchTrainerCities = () => get<string[]>("/trainers/cities");

/** How many places a trainer has left. Counted live, never cached. */
export const fetchOccupancy = (id: number) => get<Occupancy>(`/trainers/${id}/occupancy`);

export const fetchClasses = ({
  locale = "ro",
  perPage,
  featuredOnly,
  specialization,
}: {
  locale?: string;
  perPage?: number;
  featuredOnly?: boolean;
  specialization?: string;
} = {}) => {
  const query = new URLSearchParams({ locale });
  if (perPage) query.set("perPage", String(perPage));
  if (featuredOnly) query.set("featuredOnly", "true");
  if (specialization) query.set("specialization", specialization);

  return get<Paged<TrainingClass>>(`/classes?${query.toString()}`);
};

export const fetchClass = (slug: string, locale = "ro") =>
  get<TrainingClass>(`/classes/${encodeURIComponent(slug)}?locale=${locale}`);

export const fetchClassSlugs = () =>
  get<Array<{ id: number; slug: Record<string, string>; locales: string[] }>>(
    "/classes/slugs",
  );

/** The classes one trainer runs — the strip on their profile. */
export const fetchClassesForTrainer = (trainerId: number, locale = "ro") =>
  get<TrainingClass[]>(`/classes/by-trainer/${trainerId}?locale=${locale}`);

export const fetchProducts = ({
  locale = "ro",
  perPage,
  featuredOnly,
  category,
}: {
  locale?: string;
  perPage?: number;
  featuredOnly?: boolean;
  category?: ProductCategory;
} = {}) => {
  const query = new URLSearchParams({ locale });
  if (perPage) query.set("perPage", String(perPage));
  if (featuredOnly) query.set("featuredOnly", "true");
  if (category) query.set("category", category);

  return get<Paged<Product>>(`/products?${query.toString()}`);
};

export const fetchProduct = (slug: string, locale = "ro") =>
  get<Product>(`/products/${encodeURIComponent(slug)}?locale=${locale}`);

export const fetchProductSlugs = () =>
  get<Array<{ id: number; slug: Record<string, string>; locales: string[]; updatedAt?: string }>>(
    "/products/slugs",
  );

export const fetchTestimonials = (featuredOnly = false) =>
  get<Testimonial[]>(`/testimonials${featuredOnly ? "?featured=1" : ""}`);

export const fetchFaqs = (topic?: string) =>
  get<Faq[]>(`/faqs${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`);

export const fetchPostSlugs = () =>
  get<Array<{ id: number; slug: Record<string, string>; locales: string[]; updatedAt: string }>>(
    "/posts/slugs",
  );


/**
 * Everything a page's blocks need, and nothing else.
 *
 * A page of prose costs no extra requests; a page carrying the trainer grid
 * costs exactly one. The alternative — fetching every collection on every
 * page in case a block wants one — is five round trips per build of a page that
 * may use none of them, and it is the kind of waste that only shows up once the
 * site is large enough that rebuilding it is slow.
 *
 * Fetched here rather than inside the blocks because a block that fetches for
 * itself cannot be statically rendered: it would show a spinner in the middle
 * of a prerendered page and cost one request per instance.
 */
export async function fetchBlockContext(
  page: Page | null,
  locale = "ro",
): Promise<BlockContext> {
  const types = new Set(((page?.content ?? []) as Array<{ type?: string }>).map((b) => b.type));
  const needs = new Set(
    [...types].map((type) => BLOCK_NEEDS[type as BlockType]).filter(Boolean),
  );

  const [posts, trainers, testimonials, faqs, classes, products] = await Promise.all([
    // Six covers the largest layout the latest-articles block offers.
    needs.has("posts") ? fetchPosts({ limit: 6, locale }) : null,
    // Twelve: the grid caps at twelve and the hero counts the whole directory.
    needs.has("trainers") ? fetchTrainers({ locale, perPage: 12 }) : null,
    needs.has("testimonials") ? fetchTestimonials() : null,
    needs.has("faqs") ? fetchFaqs() : null,
    needs.has("classes") ? fetchClasses({ locale, perPage: 12 }) : null,
    // Every published product: the block picks its own subset (featured, one
    // category, a count) and a shop is tens of rows.
    needs.has("products") ? fetchProducts({ locale, perPage: 48 }) : null,
  ]);

  // **Keys are omitted, never set to `undefined`.** `getStaticProps` serialises
  // its result as JSON, and `undefined` is not a JSON value — Next refuses the
  // whole page with "`undefined` cannot be serialized", which is a 500 on any
  // page that happens not to use one of these collections. That is most pages.
  const context: BlockContext = {};
  if (posts) context.posts = posts.rows;
  if (trainers) context.trainers = trainers.rows;
  if (testimonials) context.testimonials = testimonials;
  if (faqs) context.faqs = faqs;
  if (classes) context.classes = classes.rows;
  if (products) context.products = products.rows;

  return context;
}
