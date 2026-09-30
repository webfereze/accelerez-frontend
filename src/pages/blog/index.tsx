import { useCallback, useEffect, useRef, useState } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import PublicLayout from "@/components/public/PublicLayout";
import PageHeading from "@/components/public/PageHeading";
import Seo from "@/components/public/Seo";
import PostTile from "@/components/public/PostTile";
import Pager from "@/components/public/Pager";
import Reveal from "@/components/public/Reveal";
import PublicEmpty from "@/components/public/PublicEmpty";
import { translations } from "@/utils/i18n";
import {
  fetchChrome,
  fetchPostCategories,
  fetchPosts,
  type Paged,
  type SiteChrome,
} from "@/utils/site";
import CtaButton from "@/components/public/CtaButton";
import {
  BLOG_CATEGORIES,
  SOURCE_LOCALE,
  type BlogCategory,
  type Post,
} from "@/types/content";

/** Twelve to a page: four rows of three, which fills a screen and ends on one. */
const PER_PAGE = 12;

type Props = {
  initial: Paged<Post>;
  /**
   * How many articles exist in the source language, when the reader is not
   * reading it and there are none in theirs. Zero otherwise — see the empty
   * state below.
   */
  inSource: number;
  /**
   * The categories that actually have an article in this language.
   *
   * Ch. 08: "Nu afișați categorii goale." Built from the API rather than from
   * the enum of five, because on a language where only some articles are
   * translated the empty ones differ — and a filter button that always returns
   * nothing is a broken control, not a category.
   */
  categories: BlogCategory[];
  chrome: SiteChrome;
};

/**
 * The blog.
 *
 * **Page one is prerendered; searching and paging happen in the browser.**
 * `getStaticProps` cannot see a query string, so a fully server-rendered
 * listing would mean `getServerSideProps` and giving up the static first paint
 * on the page most people arrive at. Instead the first page ships as HTML —
 * fast, and indexable — and any filter after that is a fetch, with the query
 * string kept in step so a result is a link somebody can send.
 *
 * **An empty language says so.** The articles exist in Romanian and not yet in
 * Hungarian or English, and the site does not substitute one for the other
 * (ch. 09). A reader on `/hu/blog` would otherwise see "no articles", which
 * reads as "this agency does not write" rather than "these are not translated
 * yet" — so the empty state names the difference and links to the language they
 * are in. That is what the blueprint asks for in place of a silent fallback.
 *
 * **The filter is the category, not the tag.** Categories are the closed list
 * of five the blueprint defines (ch. 08); tags are free text and there can be
 * forty of them. A row of five is a filter; a row of forty is a tag cloud, and
 * ch. 08 also says not to show empty ones — which a closed list makes possible
 * and an open one does not.
 *
 * **Three sizes, in one screen.** The newest article takes the large tile with
 * its picture; the two after it are ordinary cards beneath it; everything else
 * on the page is a headline in the column to the right. That is three degrees
 * of emphasis rather than one, which is what makes a blog look edited — a
 * uniform grid says every article matters equally, and none of them does.
 *
 * The column of headlines does the work a "read more" button usually does
 * badly: it shows *how much else there is* without asking anyone to scroll for
 * it, and nine titles are quicker to scan than three summaries.
 *
 * The shape repeats on every page rather than only the first. Page two leading
 * with its own article is the right trade: twelve equal cards after a first
 * page with a hierarchy reads as though the design gave up.
 */
export default function BlogIndex({ initial, inSource, categories, chrome }: Props) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = router.locale ?? "ro";

  const [result, setResult] = useState<Paged<Post>>(initial);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<BlogCategory | "">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Page one with no filters is what the server already rendered, so the first
  // effect must not refetch it — that would be a request on every arrival for
  // data already in the HTML.
  const pristine = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    const next = await fetchPosts({ locale, page, perPage: PER_PAGE, search, category: category || undefined });
    if (next) setResult(next);
    setLoading(false);
  }, [locale, page, search, category]);

  useEffect(() => {
    if (pristine.current) {
      pristine.current = false;
      return;
    }

    // Debounced, because this runs on every keystroke in the search box.
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  /** Reflect the state in the address, without re-running the page. */
  useEffect(() => {
    if (pristine.current) return;

    const query: Record<string, string> = {};
    if (search) query.q = search;
    if (category) query.tema = category;
    if (page > 1) query.p = String(page);

    void router.replace({ pathname: "/blog", query }, undefined, {
      shallow: true,
      scroll: false,
    });
    // `router` is deliberately absent: it changes identity on every navigation
    // and would make this fire in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, page]);

  /** Read the address once, on arrival, so a shared link opens filtered. */
  useEffect(() => {
    if (!router.isReady) return;
    const q = typeof router.query.q === "string" ? router.query.q : "";
    const tema = typeof router.query.tema === "string" ? router.query.tema : "";
    const p = Number(router.query.p) || 1;

    if (!q && !tema && p === 1) return;

    pristine.current = false;
    setSearch(q);
    setCategory(tema as BlogCategory | "");
    setPage(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  /**
   * The article somebody tried to read in this language and could not.
   *
   * The switcher on an untranslated article sends the reader here with its
   * title in the query — ch. 09: "dacă lipsește, anunță clar și oferă lista
   * Blog în limba aleasă." Saying it here rather than serving a 404 is the
   * difference between "this piece is not translated yet" and "this site is
   * broken", and the list underneath is the offer the blueprint asks for.
   */
  const untranslated =
    typeof router.query.netradus === "string" ? router.query.netradus : "";

  const pages = Math.max(1, Math.ceil(result.total / (result.perPage || PER_PAGE)));
  const filtering = search.trim().length > 0 || category !== "";

  // The page's own hierarchy: a feature, two cards under it, the rest as
  // headlines in the right-hand column.
  const [lead, ...rest] = result.rows;
  const seconds = rest.slice(0, 2);
  const titles = rest.slice(2);

  const when = (post: Post) =>
    post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  /** Any change to what is being looked at returns to page one. */
  const filter = (next: { search?: string; category?: BlogCategory | "" }) => {
    if (next.search !== undefined) setSearch(next.search);
    if (next.category !== undefined) setCategory(next.category);
    setPage(1);
  };

  return (
    <>
      <Seo
        title={`${t("blog.title")} — ${chrome.site.name?.trim() || t("site.name")}`}
        description={t("public.blog.lead")}
      />

      <PublicLayout chrome={chrome}>
        <PageHeading
          eyebrow={t("public.eyebrow")}
          title={t("public.blog.heading")}
          lead={t("public.blog.lead")}
          crumbs={[{ label: t("blog.title") }]}
        />

        {untranslated && (
          <div className="site-container pt-10">
            <p
              role="status"
              className="rounded-panel border border-acid-500/35 bg-acid-500/8 px-6 py-5 text-[0.95rem] leading-relaxed text-ink-200"
            >
              {t("public.blog.missingTranslation", { title: untranslated })}
            </p>
          </div>
        )}

        <div className="site-container pt-12">
          <div className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
            {/* The five categories. `type="button"` on each, not links: the
                listing is fetched rather than navigated to, and an anchor that
                does not navigate is a broken promise to anyone middle-clicking. */}
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {[{ key: "" as const }, ...categories.map((key) => ({ key }))].map(
                ({ key }) => {
                  const selected = key === category;

                  return (
                    <li key={key || "all"}>
                      <button
                        type="button"
                        onClick={() => filter({ category: key })}
                        aria-current={selected ? "true" : undefined}
                        className={clsx(
                          "inline-flex min-h-11 items-center text-sm transition-colors",
                          selected
                            ? "font-semibold text-ink-50 underline decoration-acid-500 decoration-2 underline-offset-[6px]"
                            : "text-ink-400 hover:text-ink-100",
                        )}
                      >
                        {key ? t(`blogCategory.${key}`) : t("public.blog.allTags")}
                      </button>
                    </li>
                  );
                },
              )}
            </ul>

            <label className="relative flex w-full items-center lg:w-72">
              <MagnifyingGlassIcon
                aria-hidden
                className="pointer-events-none absolute left-4 h-5 w-5 text-ink-400"
              />
              <span className="sr-only">{t("public.blog.search")}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => filter({ search: event.target.value })}
                placeholder={t("public.blog.search")}
                className="min-h-12 w-full rounded-full border border-white/15 bg-ink-900 pl-12 pr-10 text-[0.95rem] text-ink-50 outline-none transition-colors placeholder:text-ink-400 focus:border-white/20"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => filter({ search: "" })}
                  aria-label={t("public.blog.clear")}
                  className="absolute right-3 flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-900/5 hover:text-ink-100"
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden />
                </button>
              )}
            </label>
          </div>

          {filtering && (
            <p role="status" className="pt-6 text-sm text-ink-400">
              {t("public.blog.results", { count: result.total })}
            </p>
          )}
        </div>

        <div
          className={clsx(
            "site-container py-12 transition-opacity md:py-16",
            loading && "opacity-50",
          )}
        >
          {result.rows.length === 0 ? (
            // Three different empty states, because they mean three different
            // things: a search found nothing, the language has nothing, or the
            // blog has nothing at all.
            filtering ? (
              <PublicEmpty title={t("common.noResults")} hint={t("common.noResultsHint")} />
            ) : inSource > 0 ? (
              <PublicEmpty
                title={t("public.blog.notTranslated")}
                hint={t("public.blog.notTranslatedHint", { count: inSource })}
                action={
                  <CtaButton href="/blog" locale={SOURCE_LOCALE} arrow={false}>
                    {t("public.blog.readInSource")}
                  </CtaButton>
                }
              />
            ) : (
              <PublicEmpty title={t("public.blog.empty")} hint={t("public.empty.hint")} />
            )
          ) : (
            <>
              <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
                <div className="flex flex-col gap-5">
                  <Reveal>
                    <PostTile
                      post={lead}
                      locale={locale}
                      variant="feature"
                      readMore={t("public.readMore")}
                      when={when(lead)}
                    />
                  </Reveal>

                  {seconds.length > 0 && (
                    <ul className="grid gap-5 sm:grid-cols-2">
                      {seconds.map((post, index) => (
                        <Reveal as="li" key={post.id} delay={(index + 1) * 80}>
                          <PostTile
                            post={post}
                            locale={locale}
                            readMore={t("public.readMore")}
                            when={when(post)}
                          />
                        </Reveal>
                      ))}
                    </ul>
                  )}
                </div>

                {titles.length > 0 && (
                  // Headlines only. `lg:sticky` keeps the list in view while
                  // the taller left column scrolls past it, so the two halves
                  // do not end with a column of white space beside nothing.
                  <div className="lg:sticky lg:top-28 lg:self-start">
                    <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-400">
                      {t("public.blog.more")}
                    </p>

                    <ul>
                      {titles.map((post, index) => (
                        <Reveal as="li" key={post.id} delay={Math.min(index, 4) * 60}>
                          <PostTile
                            post={post}
                            locale={locale}
                            variant="title"
                            readMore={t("public.readMore")}
                            when={when(post)}
                          />
                        </Reveal>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Pager
                page={result.page}
                pages={pages}
                onChange={(next) => {
                  setPage(next);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-14"
              />
            </>
          )}
        </div>
      </PublicLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const lang = locale ?? SOURCE_LOCALE;

  const [initial, counts, chrome] = await Promise.all([
    fetchPosts({ locale: lang, page: 1, perPage: PER_PAGE }),
    fetchPostCategories(lang),
    fetchChrome(),
  ]);

  // Kept in the blueprint's order rather than the counts' — the five are a
  // sequence a reader learns (strategy first, offline last), not a chart.
  const categories = BLOG_CATEGORIES.filter((key) =>
    (counts ?? []).some((row) => row.category === key && row.count > 0),
  );

  // Only asked when it can change what the page says: the reader is in another
  // language and there is nothing for them. One extra request on two locales of
  // one page, and only while the blog is untranslated.
  const empty = (initial?.total ?? 0) === 0;
  const inSource =
    empty && lang !== SOURCE_LOCALE
      ? ((await fetchPosts({ locale: SOURCE_LOCALE, perPage: 1 }))?.total ?? 0)
      : 0;

  return {
    props: {
      initial: initial ?? { rows: [], total: 0, page: 1, perPage: PER_PAGE },
      inSource,
      categories,
      chrome,
      ...(await translations(locale, ["common"])),
    },
    revalidate: 300,
  };
};
