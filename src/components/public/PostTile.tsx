import Link from "next/link";
import clsx from "clsx";
import { useTranslation } from "next-i18next/pages";
import { tr } from "@/utils/localized";
import { postHref } from "@/utils/href";
import type { Post } from "@/types/content";

/**
 * An article, in one of the three shapes the blog needs.
 *
 * - `card` — a white tile on the warm ground: category and date on one small
 *   line, the title large, two lines of excerpt, a bare arrow. This is the
 *   default and the shape the design is built around, because a grid of these
 *   is what the blog *is*.
 * - `feature` — a tall picture with the title laid over it. One per listing, to
 *   give the page a focal point instead of a uniform grid.
 * - `row` — a small thumbnail beside the title. Reads as a list.
 * - `title` — the category, the date and the headline, nothing else. For the
 *   column beside a feature, where the job is to show *how much else there is*
 *   rather than to sell each one: nine headlines a reader can scan in a glance
 *   beat three cards they have to work through.
 *
 * One component, because they are the same content in three arrangements, and a
 * second component is how two of them drift into disagreeing about what an
 * article looks like.
 *
 * **The category is a label, not a link.** It is a filter the blog index owns;
 * putting a second anchor inside a card whose whole surface is already a link
 * gives a keyboard user two stops for what looks like one thing.
 *
 * The date is formatted by the caller and passed in: `Intl` in a component that
 * renders on the server and again in the browser is how you get a hydration
 * mismatch on any machine whose timezone differs from the build's.
 */
export default function PostTile({
  post,
  locale,
  variant = "card",
  readMore,
  when,
}: {
  post: Post;
  locale: string | undefined;
  variant?: "card" | "feature" | "row" | "title";
  readMore: string;
  when: string;
}) {
  const { t } = useTranslation("common");
  const title = tr(post.title, locale);
  const excerpt = tr(post.excerpt, locale);
  const href = postHref(post, locale);
  const category = post.category ? t(`blogCategory.${post.category}`) : "";

  /** The small line above every title: category, then the date. */
  const meta = (tone: "light" | "dark") => (
    <span
      className={clsx(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em]",
        tone === "dark" ? "text-ink-300" : "text-ink-100",
      )}
    >
      {category && <span>{category}</span>}
      {category && when && (
        <span aria-hidden className={tone === "dark" ? "text-ink-400" : "text-ink-300"}>
          •
        </span>
      )}
      {when && (
        <time
          dateTime={post.publishedAt ?? undefined}
          className={clsx(
            "font-normal normal-case tracking-normal",
            tone === "dark" ? "text-ink-300" : "text-ink-400",
          )}
        >
          {when}
        </time>
      )}
    </span>
  );

  /** The bare arrow a card ends on. Decoration — the tile is the link. */
  const arrow = (
    <span aria-hidden className="mt-8 inline-flex items-center text-ink-50" title={readMore}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        className="h-6 w-6 transition-transform duration-300 ease-out group-hover:translate-x-2 motion-reduce:transition-none"
      >
        <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="square" />
      </svg>
    </span>
  );

  if (variant === "feature") {
    return (
      <Link
        href={href}
        className="group relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-panel bg-ink-900 p-8 md:min-h-[34rem] md:p-12"
      >
        {post.coverImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.coverAlt ?? ""}
              className="absolute inset-0 z-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            {/* Heaviest at the bottom, where the words are — a flat scrim over
                the whole picture would grey out the half nothing sits on. */}
            <span
              aria-hidden
              className="absolute inset-0 z-10 bg-gradient-to-t from-ink-950 via-ink-950/55 to-ink-950/5"
            />
          </>
        )}

        <span className="relative z-20">{meta("dark")}</span>

        <h3 className="relative z-20 mt-5 max-w-2xl font-head text-3xl text-ink-50 md:text-5xl">
          {title}
        </h3>
      </Link>
    );
  }

  if (variant === "title") {
    return (
      <Link
        href={href}
        className="group block border-b border-white/10 py-5 first:pt-0"
      >
        {meta("light")}

        <span className="mt-2 flex items-start justify-between gap-4">
          <span className="font-head text-lg leading-snug text-ink-50 lg:text-xl">
            {title}
          </span>

          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="mt-1 h-5 w-5 shrink-0 text-ink-300 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:text-ink-50 motion-reduce:transition-none"
          >
            <path d="M4 12h15m0 0-6-6m6 6-6 6" strokeLinecap="square" />
          </svg>
        </span>
      </Link>
    );
  }

  if (variant === "row") {
    return (
      <Link href={href} className="group flex gap-5">
        {post.coverImage && (
          <span className="hidden shrink-0 self-start overflow-hidden rounded-card bg-ink-800 sm:block">
            <span className="block h-28 w-36 lg:h-32 lg:w-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.coverAlt ?? ""}
                loading="lazy"
                className="block h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </span>
          </span>
        )}

        <span className="min-w-0 flex-1">
          {meta("light")}

          <span className="mt-2 block font-head text-xl leading-snug text-ink-50">
            {title}
          </span>

          {excerpt && (
            <span className="mt-2 line-clamp-2 block text-sm leading-relaxed text-ink-400">
              {excerpt}
            </span>
          )}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-card border border-white/10 bg-ink-900 p-8 transition-colors duration-300 hover:border-white/20 lg:p-10"
    >
      {meta("light")}

      <span className="mt-5 block font-head text-2xl text-ink-50 lg:text-[1.75rem]">
        {title}
      </span>

      {excerpt && (
        <span className="mt-4 line-clamp-2 block flex-1 text-[0.95rem] leading-relaxed text-ink-400">
          {excerpt}
        </span>
      )}

      {arrow}
    </Link>
  );
}
