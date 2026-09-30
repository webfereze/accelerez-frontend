import type { GetStaticPaths, GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import {
  DocumentTextIcon,
  InformationCircleIcon,
  LinkIcon,
  NewspaperIcon,
  PhotoIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import RecordEditor, { EditorSection } from "@/components/admin/RecordEditor";
import BlockEditor from "@/components/admin/BlockEditor";
import Input from "@/components/ui/Input";
import ImageField from "@/components/ui/ImageField";
import TranslatedField from "@/components/ui/TranslatedField";
import TagField from "@/components/admin/TagField";
import Select from "@/components/ui/Select";
import PublishedLocalesField from "@/components/admin/PublishedLocalesField";
import EnumChecklist from "@/components/admin/EnumChecklist";
import RelatedIdsField from "@/components/admin/RelatedIdsField";
import SeoFields from "@/components/admin/SeoFields";
import StatusField from "@/components/admin/StatusField";
import { useRecordEditor, useRecordId } from "@/hooks/useRecordEditor";
import { translations } from "@/utils/i18n";
import { emptyTranslated } from "@/utils/localized";
import type { Block } from "@/blocks/types";
import {
  BLOG_CATEGORIES,
  SPECIALIZATIONS,
  type BlogCategory,
  type Locale,
  type PageStatus,
  type Post,
  type Specialization,
  type Translated,
} from "@/types/content";
import { specializationKey } from "@/utils/labels";

/**
 * One article.
 *
 * **`publishedAt` is left alone once set.** The API stamps it the first time an
 * article goes live and never moves it, so correcting a typo next year does not
 * jump a two-year-old piece to the top of the blog. The field is here anyway,
 * because backdating something written before the site existed is a real need —
 * it is just not something that should happen by accident on every save.
 *
 * The fields below `category` are the blueprint's (ch. 09) and each earns its
 * place: a **single** category from a closed list of five, industry tags that
 * are deliberately *not* categories, the author's role — which is what makes a
 * byline evidence rather than decoration — and a "substantively updated" date
 * kept separate from `updatedAt`, because a date that moves whenever somebody
 * opens the editor is a freshness signal that means nothing.
 *
 * The closing call to action carries a **service key**, so the contact form the
 * reader lands on already has the topic selected. Related services and related
 * articles are capped at two each by the API, which is the document's rule —
 * "nu recomandați toate serviciile la fiecare articol".
 *
 * `isFeatured` picks the article that fills the large tile on `/blog` and in the
 * home page's journal section. The hint says only one should carry it: the API
 * returns featured articles first, so two makes the choice depend on sort order
 * rather than on the editor.
 */

type Draft = {
  slug: Translated;
  title: Translated;
  excerpt: Translated;
  content: Block[];
  coverImage: string | null;
  coverAlt: string;
  author: string;
  authorRole: Translated;
  category: BlogCategory | "";
  specializations: Specialization[];
  tags: string[];
  relatedTrainerIds: number[];
  relatedPostIds: number[];
  ctaLabel: Translated;
  ctaHref: string;
  publishedLocales: Locale[];
  isFeatured: boolean;
  readingMinutes: number | null;
  status: PageStatus;
  publishedAt: string;
  contentUpdatedAt: string;
  seoTitle: Translated;
  seoDescription: Translated;
  noindex: boolean;
};

const EMPTY: Draft = {
  slug: emptyTranslated(),
  title: emptyTranslated(),
  excerpt: emptyTranslated(),
  content: [],
  coverImage: null,
  coverAlt: "",
  author: "",
  authorRole: emptyTranslated(),
  category: "",
  specializations: [],
  tags: [],
  relatedTrainerIds: [],
  relatedPostIds: [],
  ctaLabel: emptyTranslated(),
  ctaHref: "",
  publishedLocales: ["ro"],
  isFeatured: false,
  readingMinutes: null,
  status: "draft",
  publishedAt: "",
  contentUpdatedAt: "",
  seoTitle: emptyTranslated(),
  seoDescription: emptyTranslated(),
  noindex: false,
};

export default function AdminPostEditor() {
  const { t } = useTranslation("common");
  const id = useRecordId();

  const editor = useRecordEditor<Post, Draft>({
    path: "/admin/posts",
    id: id ?? null,
    empty: EMPTY,
    listHref: "/admin/blog",
    // An empty date input is `""` and an unset select is `""`; `@IsDateString()`
    // and `@IsEnum()` both reject an empty string, while `@IsOptional()` only
    // skips `null` and `undefined`. Blanking a field in the form has to send
    // `null`, or saving an article with no category fails with a validation
    // error about a field the editor deliberately left empty.
    toPayload: (d) => ({
      ...d,
      publishedAt: d.publishedAt || null,
      contentUpdatedAt: d.contentUpdatedAt || null,
      category: d.category || null,
      ctaHref: d.ctaHref || null,
    }),
    toDraft: (row) => ({
      slug: (row.slug ?? emptyTranslated()) as Translated,
      title: row.title ?? emptyTranslated(),
      excerpt: row.excerpt ?? emptyTranslated(),
      content: (row.content ?? []) as Block[],
      coverImage: row.coverImage,
      coverAlt: row.coverAlt ?? "",
      author: row.author ?? "",
      authorRole: row.authorRole ?? emptyTranslated(),
      category: row.category ?? "",
      specializations: row.specializations ?? [],
      tags: row.tags ?? [],
      relatedTrainerIds: row.relatedTrainerIds ?? [],
      relatedPostIds: row.relatedPostIds ?? [],
      ctaLabel: row.ctaLabel ?? emptyTranslated(),
      ctaHref: row.ctaHref ?? "",
      publishedLocales: (row.publishedLocales ?? ["ro"]) as Locale[],
      isFeatured: row.isFeatured,
      readingMinutes: row.readingMinutes,
      status: row.status,
      publishedAt: row.publishedAt ? row.publishedAt.slice(0, 10) : "",
      contentUpdatedAt: row.contentUpdatedAt ? row.contentUpdatedAt.slice(0, 10) : "",
      seoTitle: row.seoTitle ?? emptyTranslated(),
      seoDescription: row.seoDescription ?? emptyTranslated(),
      noindex: row.noindex ?? false,
    }),
  });

  const { draft, patch } = editor;

  return (
    <RecordEditor
      icon={NewspaperIcon}
      title={editor.isNew ? t("blog.add") : t("blog.edit")}
      description={t("blog.description")}
      backHref="/admin/blog"
      backLabel={t("blog.title")}
      deleteTitle={t("blog.deleteTitle")}
      deleteMessage={t("blog.deleteMessage")}
      notFoundLabel={t("editor.notFound")}
      completeness={[draft.title, draft.excerpt]}
      loading={editor.loading || id === undefined}
      notFound={editor.notFound}
      saving={editor.saving}
      deleting={editor.deleting}
      dirty={editor.dirty}
      saved={editor.saved}
      error={editor.error}
      isNew={editor.isNew}
      onSave={editor.save}
      onDelete={editor.remove}
      aside={<>      <EditorSection compact icon={DocumentTextIcon} title={t("editor.publishing")}>
        <StatusField status={draft.status} onStatusChange={(status) => patch({ status })} />

        <PublishedLocalesField
          value={draft.publishedLocales}
          onChange={(publishedLocales) => patch({ publishedLocales })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("blog.publishedAt")}
            hint={t("blog.publishedAtHint")}
            type="date"
            value={draft.publishedAt}
            onChange={(event) => patch({ publishedAt: event.target.value })}
          />
          <Input
            label={t("blog.contentUpdatedAt")}
            hint={t("blog.contentUpdatedAtHint")}
            type="date"
            value={draft.contentUpdatedAt}
            onChange={(event) => patch({ contentUpdatedAt: event.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("blog.readingMinutes")}
            hint={t("blog.readingMinutesHint")}
            type="number"
            min={1}
            max={999}
            value={draft.readingMinutes === null ? "" : String(draft.readingMinutes)}
            onChange={(event) =>
              patch({
                readingMinutes: event.target.value ? Number(event.target.value) : null,
              })
            }
          />
        </div>

        <label className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={draft.isFeatured}
            onChange={(event) => patch({ isFeatured: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          {t("blog.isFeatured")}
        </label>
        <p className="-mt-2 text-xs text-gray-500">{t("blog.isFeaturedHint")}</p>

        <SeoFields
          title={draft.seoTitle}
          description={draft.seoDescription}
          noindex={draft.noindex}
          onChange={(next) =>
            patch({
              seoTitle: next.title,
              seoDescription: next.description,
              noindex: next.noindex,
            })
          }
        />
      </EditorSection>
</>}
    >
      <EditorSection icon={InformationCircleIcon} title={t("editor.basics")}>
        <TranslatedField
          label={t("blog.name")}
          value={draft.title}
          onChange={(title) => patch({ title })}
          required
        />

        <TranslatedField
          label={t("editor.excerpt")}
          hint={t("blog.excerptHint")}
          value={draft.excerpt}
          onChange={(excerpt) => patch({ excerpt })}
          multiline
          rows={2}
        />

        <TranslatedField
          label={t("editor.slug")}
          hint={t("editor.slugPerLocaleHint")}
          value={draft.slug}
          onChange={(slug) => patch({ slug })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("blog.author")}
            hint={t("blog.authorHint")}
            value={draft.author}
            onChange={(event) => patch({ author: event.target.value })}
          />
          <Select
            label={t("blog.category")}
            hint={t("blog.categoryHint")}
            value={draft.category}
            onChange={(event) =>
              patch({ category: event.target.value as BlogCategory | "" })
            }
          >
            <option value="">{t("blog.categoryNone")}</option>
            {BLOG_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {t(`blogCategory.${key}`)}
              </option>
            ))}
          </Select>
        </div>

        <TranslatedField
          label={t("blog.authorRole")}
          hint={t("blog.authorRoleHint")}
          value={draft.authorRole}
          onChange={(authorRole) => patch({ authorRole })}
        />

        <EnumChecklist
          label={t("blog.specializations")}
          hint={t("blog.specializationsHint")}
          options={SPECIALIZATIONS}
          labelFor={(key: Specialization) => t(specializationKey(key))}
          value={draft.specializations}
          onChange={(specializations) => patch({ specializations })}
        />

        <TagField
          label={t("blog.tags")}
          hint={t("blog.tagsHint")}
          value={draft.tags}
          onChange={(tags) => patch({ tags })}
        />
      </EditorSection>

      <EditorSection
        icon={LinkIcon}
        title={t("blog.connections")}
        description={t("blog.connectionsHint")}
      >
        {/* Two trainers at most: an article that recommends six recommends
            none, and the foot of the page has one call to action already. */}
        <RelatedIdsField
          label={t("blog.relatedTrainers")}
          hint={t("blog.relatedTrainersHint")}
          value={draft.relatedTrainerIds}
          max={2}
          onChange={(relatedTrainerIds) => patch({ relatedTrainerIds })}
        />

        <RelatedIdsField
          label={t("blog.relatedPosts")}
          hint={t("blog.relatedPostsHint")}
          value={draft.relatedPostIds}
          max={2}
          onChange={(relatedPostIds) => patch({ relatedPostIds })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TranslatedField
            label={t("blog.ctaLabel")}
            hint={t("blog.ctaLabelHint")}
            value={draft.ctaLabel}
            onChange={(ctaLabel) => patch({ ctaLabel })}
          />
          <Input
            label={t("blog.ctaHref")}
            hint={t("blog.ctaHrefHint")}
            value={draft.ctaHref}
            onChange={(event) => patch({ ctaHref: event.target.value })}
            placeholder="/antrenori?obiectiv=weight_loss"
          />
        </div>
      </EditorSection>

      <EditorSection icon={PhotoIcon} title={t("editor.cover")}>
        <ImageField
          label={t("editor.coverImage")}
          url={draft.coverImage}
          alt={draft.coverAlt}
          onChange={({ url, alt }) => patch({ coverImage: url, coverAlt: alt })}
        />
      </EditorSection>

      <EditorSection
        icon={Squares2X2Icon}
        title={t("editor.body")}
        description={t("editor.bodyHint")}
      >
        <BlockEditor blocks={draft.content} onChange={(content) => patch({ content })} />
      </EditorSection>

    </RecordEditor>
  );
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
