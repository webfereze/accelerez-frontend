import { useTranslation } from "next-i18next/pages";
import Link from "next/link";

import TranslatedField from "@/components/ui/TranslatedField";
import Input from "@/components/ui/Input";
import PostTile from "@/components/public/PostTile";
import Reveal from "@/components/public/Reveal";
import SectionIntro from "@/components/public/SectionIntro";
import { ArrowLink } from "@/components/public/CtaButton";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * The latest articles, as a section of any page.
 *
 * **It carries no articles.** The block stores a heading and how many to show;
 * the articles themselves arrive through `context`, fetched once by the page.
 * That is the whole reason this is not a card grid an editor fills in by hand —
 * a hand-filled list of "latest" articles is a list that is wrong the day after
 * it is written.
 *
 * **A centred header over an even row of white tiles.** Not a hero tile beside
 * a list: on a page that is already a stack of sections, three equal cards read
 * as "here is the thinking" in one glance, where a lead-plus-rows arrangement
 * reads as a second, smaller homepage. Which articles appear is still the
 * editor's decision, made by pinning — the API returns featured articles first,
 * so this block and `/blog` cannot disagree about the order.
 *
 * With no articles it renders **nothing at all**, rather than an empty heading.
 * A "Latest articles" band over blank space on a live site is worse than the
 * section simply not being there yet.
 */

export type LatestPostsData = {
  eyebrow: Translated;
  title: Translated;
  text: Translated;
  linkLabel: Translated;
  /** How many rows beside the large tile. The tile itself is always one. */
  count: number;
};

export function LatestPostsEditor({ data, onChange }: BlockEditorProps<LatestPostsData>) {
  const { t } = useTranslation("common");

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.latestPosts.eyebrow")}
        value={data.eyebrow ?? emptyTranslated()}
        onChange={(eyebrow) => onChange({ ...data, eyebrow })}
      />

      <TranslatedField
        label={t("blocks.latestPosts.title")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
        required
      />

      <TranslatedField
        label={t("blocks.latestPosts.text")}
        value={data.text ?? emptyTranslated()}
        onChange={(text) => onChange({ ...data, text })}
        multiline
        rows={2}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <TranslatedField
          label={t("blocks.latestPosts.linkLabel")}
          value={data.linkLabel ?? emptyTranslated()}
          onChange={(linkLabel) => onChange({ ...data, linkLabel })}
        />
        <Input
          label={t("blocks.latestPosts.count")}
          hint={t("blocks.latestPosts.countHint")}
          type="number"
          min={1}
          max={5}
          value={String(data.count ?? 3)}
          onChange={(event) =>
            onChange({
              ...data,
              // Clamped here rather than trusted: the field is a number input,
              // which accepts anything when typed into rather than stepped.
              count: Math.min(5, Math.max(1, Number(event.target.value) || 3)),
            })
          }
        />
      </div>
    </div>
  );
}

export function LatestPostsRenderer({
  data,
  locale,
  context,
}: BlockRendererProps<LatestPostsData>) {
  const { t } = useTranslation("common");

  const posts = context?.posts ?? [];
  if (posts.length === 0) return null;

  // Three across is the design; the editor's count is a cap on it, clamped so a
  // stray `12` cannot produce a twelve-wide row nobody asked for.
  const shown = posts.slice(0, Math.min(6, Math.max(1, data.count ?? 3)));

  const linkLabel = tr(data.linkLabel, locale) || t("public.blog.all");

  const when = (value: string | null) =>
    value
      ? new Date(value).toLocaleDateString(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";

  return (
    <section>
      <SectionIntro
        eyebrow={tr(data.eyebrow, locale)}
        title={tr(data.title, locale)}
        lead={tr(data.text, locale)}
        align="center"
        className="mb-14"
      />

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((post, index) => (
          <Reveal as="li" key={post.id} delay={index * 80}>
            <PostTile
              post={post}
              locale={locale}
              readMore={t("public.readMore")}
              when={when(post.publishedAt)}
            />
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-12 flex justify-center">
        <ArrowLink href="/blog" label={linkLabel} />
      </Reveal>
    </section>
  );
}

export const latestPostsDefaults = (): LatestPostsData => ({
  eyebrow: emptyTranslated(),
  title: emptyTranslated(),
  text: emptyTranslated(),
  linkLabel: emptyTranslated(),
  count: 3,
});
