import type { LocalizedSlug } from "@/types/content";

/**
 * The address of a record in one language.
 *
 * Slugs are per-language on this site (blueprint ch. 06), so building a link
 * means picking the right one — and **falling back to Romanian is correct
 * here, where it would be wrong for content**. A missing translation must not
 * silently replace an article's *text*; a link still has to point somewhere,
 * and the Romanian address is the one address that always exists.
 *
 * Whether a record should be linked at all in a given language is a separate
 * question, answered by `publishedLocales` before this is ever called.
 */
export function slugIn(slug: LocalizedSlug | undefined, locale: string | undefined): string {
  if (!slug) return "";
  const value = (slug as Record<string, string | undefined>)[locale ?? "ro"];
  return value || slug.ro || "";
}

/** `/blog/<slug in this language>`. */
export const postHref = (
  post: { slug: LocalizedSlug },
  locale: string | undefined,
): string => `/blog/${slugIn(post.slug, locale)}`;
