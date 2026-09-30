import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import BlockRenderer from "@/components/public/BlockRenderer";
import PostTile from "@/components/public/PostTile";
import Reveal from "@/components/public/Reveal";
import Breadcrumb from "@/components/public/Breadcrumb";
import CtaButton from "@/components/public/CtaButton";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import TrainerCard from "@/components/public/TrainerCard";
import { withContents, type TocEntry } from "@/utils/toc";
import {
  fetchChrome,
  fetchPost,
  fetchPostSlugs,
  fetchRelatedPosts,
  fetchTrainers,
  type SiteChrome,
} from "@/utils/site";
import {
  LOCALES,
  type Locale,
  type PageBlock,
  type Post,
  type Trainer,
} from "@/types/content";

type Props = {
  post: Post;
  /** The body with `id`s on its headings — see `withContents`. */
  body: PageBlock[];
  toc: TocEntry[];
  trainers: Trainer[];
  related: Post[];
  chrome: SiteChrome;
};

/**
 * One article.
 *
 * **Type first, picture second.** The title, the byline and the date sit on
 * paper at the top of the page, and the cover image comes after them, full
 * width. The alternative — white type over a photograph — is what every blog
 * does, and it makes the headline a caption on somebody else's picture.
 *
 * The body is capped at a reading measure rather than the page gutter: prose
 * that runs the full 1280px is prose nobody finishes a paragraph of.
 *
 * **The head and the foot are ch. 09, in its order.** Breadcrumb, category,
 * title, summary, author *and role*, the date published and the date the text
 * was last actually revised, the image, then the text. At the end: one main
 * call to action, the one or two trainers the piece points at, and at most two
 * further articles. None of it is decoration — it is the whole
 * reason the blueprint asks for a blog at all ("conduce firesc spre un serviciu
 * relevant sau o discuție"), and every part of it is the editor's choice,
 * stored on the article, rather than something this page infers.
 *
 * **Two dates, told apart.** `publishedAt` is the date the article is *of*;
 * `contentUpdatedAt` is set by hand when somebody revises the substance. A
 * freshness date that moved every time an editor opened the form would mean
 * nothing, so the second one appears only when it exists and is later.
 */
export default function PostDetail({
  post,
  body,
  toc,
  trainers,
  related,
  chrome,
}: Props) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const title = tr(post.title, locale);
  const excerpt = tr(post.excerpt, locale);
  const authorRole = tr(post.authorRole, locale);
  const siteName = chrome.site.name?.trim() || t("site.name");

  const when = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(locale ?? "ro", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  // Only when it says something the publication date does not.
  const revised =
    post.contentUpdatedAt &&
    (!post.publishedAt || post.contentUpdatedAt > post.publishedAt)
      ? post.contentUpdatedAt
      : null;

  const ctaLabel = tr(post.ctaLabel, locale) || t("nav.headerCta");

  /**
   * Where the language switcher goes, per language.
   *
   * The slug is translated, so the same path under another locale is an address
   * that does not exist. Where the article *was* written, this is its address
   * in that language; where it was not, it is the blog index in that language
   * carrying `?netradus=` — which is ch. 09's rule exactly: "dacă lipsește,
   * anunță clar și oferă lista Blog în limba aleasă. Nu schimbă limba pe
   * ascuns." A switcher that simply vanished the option would be the quieter
   * lie: the reader would never learn the piece is untranslated.
   */
  const live = post.publishedLocales ?? ["ro"];

  const alternates = Object.fromEntries(
    LOCALES.map((code) => {
      // `publishedLocales` is the authority, not the slug: a slug may well be
      // filled in for a translation nobody has finished writing.
      const translated = live.includes(code) ? post.slug?.[code] : undefined;
      return [
        code,
        translated
          ? `/blog/${translated}`
          : `/blog?netradus=${encodeURIComponent(tr(post.title, locale))}`,
      ];
    }),
  ) as Record<Locale, string>;

  /**
   * The closing call to action carries the topic *and* the article it came
   * from — ch. 09: "Articolul de origine poate fi transmis într-un câmp
   * ascuns." The form reads both from the query and the enquiry lands in the
   * admin already saying what the reader had been reading.
   */
  const ctaHref = (() => {
    // Whatever the editor set, or the directory filtered by the article's own
    // goal — which is a better destination than a contact form for a reader who
    // has just finished an article about losing weight.
    if (post.ctaHref) return post.ctaHref;

    const goal = post.specializations?.[0];
    return goal ? `/antrenori?obiectiv=${goal}` : "/antrenori";
  })();

  return (
    <>
      <Seo
        title={`${tr(post.seoTitle, locale) || title} — ${siteName}`}
        description={tr(post.seoDescription, locale) || excerpt}
        image={post.coverImage}
        imageAlt={post.coverAlt}
        noindex={post.noindex}
        type="article"
        publishedTime={post.publishedAt}
        modifiedTime={post.contentUpdatedAt ?? post.updatedAt}
        locales={post.publishedLocales}
        alternates={alternates}
      />

      <PublicLayout chrome={chrome} alternates={alternates}>
        <article>
          <header className="site-container pt-10 md:pt-14">
            {/* Left, not centred with the rest of the header: a breadcrumb is
                navigation, and centring it would make it read as part of the
                article's own typography. */}
            <Breadcrumb
              items={[
                { label: t("blog.title"), href: "/blog" },
                { label: title },
              ]}
              className="mb-10"
            />

            <Reveal className="mx-auto max-w-3xl text-center">
              {/* The category, above the title and linked: ch. 09 puts it
                  first, and a reader who wants more of this kind of thing
                  should not have to go back to the index to find it. */}
              {post.category && (
                <p className="mb-5">
                  <Link
                    href={{ pathname: "/blog", query: { tema: post.category } }}
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-acid-400 underline decoration-acid-500/40 decoration-2 underline-offset-[6px] transition-colors hover:text-ink-50"
                  >
                    {t(`blogCategory.${post.category}`)}
                  </Link>
                </p>
              )}

              <h1 className="font-head text-4xl leading-[1.1] tracking-tight text-ink-50 md:text-6xl">
                {title}
              </h1>

              {excerpt && (
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-400">
                  {excerpt}
                </p>
              )}

              {/* The byline sits *under* the title here rather than above it:
                  with a category line already above, three rows of small type
                  before the headline buries it. */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                {post.author && (
                  <span className="text-acid-400">
                    {post.author}
                    {/* The role is what makes a byline evidence rather than
                        decoration — ch. 09 asks for "autor real și rol". */}
                    {authorRole && (
                      <span className="font-medium normal-case tracking-normal text-ink-400">
                        {` · ${authorRole}`}
                      </span>
                    )}
                  </span>
                )}

                <time dateTime={post.publishedAt ?? undefined}>
                  {when(post.publishedAt)}
                </time>

                {revised && (
                  <time dateTime={revised} className="font-medium normal-case tracking-normal text-ink-400">
                    {t("public.post.updated", { date: when(revised) })}
                  </time>
                )}

                {post.readingMinutes && (
                  <span className="inline-flex items-center gap-1.5">
                    <ClockIcon className="h-3.5 w-3.5" aria-hidden />
                    {t("public.blog.minutes", { count: post.readingMinutes })}
                  </span>
                )}
              </div>

              {post.tags && post.tags.length > 0 && (
                <ul className="mt-7 flex flex-wrap justify-center gap-2">
                  {post.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-ink-400"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          </header>

          {post.coverImage && (
            <Reveal className="site-container mt-12 md:mt-16">
              <div className="overflow-hidden rounded-3xl bg-ink-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.coverAlt ?? ""}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            </Reveal>
          )}

          {/* A reading measure, not the page gutter. */}
          <div className="site-container py-12 md:py-16">
            <div className="mx-auto max-w-2xl">
              {/* The contents list, for articles long enough to need one. The
                  anchors are already in the HTML — see `withContents` — so
                  these are plain links a crawler follows and a reader can
                  copy, not scroll handlers. */}
              {toc.length > 0 && (
                <nav
                  aria-labelledby="article-contents"
                  className="mb-12 rounded-panel border border-white/10 bg-ink-900/60 p-6 sm:p-8"
                >
                  <h2
                    id="article-contents"
                    className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-300"
                  >
                    {t("public.post.contents")}
                  </h2>

                  <ol className="mt-5 flex flex-col gap-3">
                    {toc.map((entry) => (
                      <li key={entry.id} className={entry.level === 3 ? "pl-5" : undefined}>
                        <a
                          href={`#${entry.id}`}
                          className="text-[0.95rem] leading-snug text-ink-300 underline decoration-ink-900/20 underline-offset-4 transition-colors hover:text-ink-50 hover:decoration-acid-500"
                        >
                          {entry.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <BlockRenderer blocks={body} locale={locale ?? "ro"} bare />
            </div>
          </div>
        </article>

        {/* The closing ask. One, not three — ch. 09: "un îndemn principal". */}
        <section className="site-container pb-4">
          <Reveal className="mx-auto flex max-w-3xl flex-col items-start gap-6 rounded-panel bg-ink-950 p-10 md:flex-row md:items-center md:justify-between md:p-12">
            <p className="max-w-md font-head text-2xl text-white md:text-3xl">
              {t("public.post.ctaTitle")}
            </p>
            <CtaButton href={ctaHref} variant="primary" arrow={false}>
              {ctaLabel}
            </CtaButton>
          </Reveal>
        </section>

        {trainers.length > 0 && (
          <section className="site-container py-14 md:py-20">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink-300">
                {t("public.post.trainers")}
              </h2>

              <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                {trainers.map((trainer) => (
                  <li key={trainer.id}>
                    <TrainerCard trainer={trainer} locale={locale} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="site-container border-t border-white/10 py-14 md:py-20">
            <h2 className="font-head text-2xl tracking-tight text-ink-50 md:text-3xl">
              {t("public.blog.related")}
            </h2>

            <ul className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {related.map((item, index) => (
                <Reveal as="li" key={item.id} delay={Math.min(index, 2) * 80}>
                  <PostTile
                    post={item}
                    locale={locale}
                    readMore={t("public.readMore")}
                    when={when(item.publishedAt)}
                  />
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </PublicLayout>
    </>
  );
}

/**
 * One path **per language an article actually exists in** — not one path with
 * three locales hung off it.
 *
 * The slug differs per language here, so `/hu/blog/<romanian-slug>` is not a
 * page that should ever be built. And a language the article was never written
 * in gets no path at all, which is what makes the blueprint's rule — no silent
 * substitution — true of the static build and not only of the API.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const rows = await fetchPostSlugs();

  const paths = (rows ?? []).flatMap((row) =>
    (row.locales ?? ["ro"]).flatMap((locale) => {
      const slug = row.slug?.[locale];
      return slug ? [{ params: { slug }, locale }] : [];
    }),
  );

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params, locale }) => {
  const slug = String(params?.slug ?? "");
  const lang = locale ?? "ro";

  // Two, not three: ch. 09 says "maximum două articole conexe". The API puts
  // whatever the editor picked first and only then fills from the newest.
  const [post, related, chrome] = await Promise.all([
    fetchPost(slug, lang),
    fetchRelatedPosts(slug, 2, lang),
    fetchChrome(),
  ]);

  if (!post) return { notFound: true, revalidate: 60 };

  // Only fetched when the article names somebody — an article with no related
  // trainer costs no request at all.
  const ids = (post.relatedTrainerIds ?? []).slice(0, 2);

  const directory = ids.length > 0 ? await fetchTrainers({ locale: lang, perPage: 50 }) : null;

  // In the editor's order, not the API's, and silently short when a trainer is
  // not published in this language — which is the rule everywhere else too.
  const trainers = ids
    .map((id) => (directory?.rows ?? []).find((row) => row.id === id))
    .filter((row): row is Trainer => Boolean(row));

  const { blocks, toc } = withContents(post.content, lang);

  return {
    props: {
      post,
      body: blocks,
      toc,
      trainers,
      related: related ?? [],
      chrome,
      ...(await translations(locale, ["common"])),
    },
    revalidate: 300,
  };
};
