import type { GetStaticPaths, GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import {
  DocumentTextIcon,
  InformationCircleIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import RecordEditor, { EditorSection } from "@/components/admin/RecordEditor";
import BlockEditor from "@/components/admin/BlockEditor";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import SeoFields from "@/components/admin/SeoFields";
import StatusField from "@/components/admin/StatusField";
import { useRecordEditor, useRecordId } from "@/hooks/useRecordEditor";
import { usePages } from "@/hooks/usePages";
import { translations } from "@/utils/i18n";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Block } from "@/blocks/types";
import type { Page, PageLayout, PageStatus, Translated } from "@/types/content";

/**
 * One content page.
 *
 * **The sidebar blocks are kept even when the layout is not `sidebar`.** An
 * editor who tries the two-column layout, changes their mind and switches back
 * should not find their sidebar deleted — so the field is hidden, never
 * cleared.
 *
 * `isHomepage` is a switch rather than a list: the API clears the flag on every
 * other page when one is set, so it can never be true twice. The hint says as
 * much, because "make this the home page" silently demoting another page is
 * surprising unless it is spelt out.
 *
 * **The screen is split.** The page's *content* — its name, its summary, its
 * blocks — runs down the middle, and everything that decides how the page
 * behaves rather than what it says sits in the rail on the right: address,
 * parent, layout, status, and the search listing. That is the distinction, and
 * it is worth keeping: an editor spends an hour in the block editor and ten
 * seconds on the status, and those two things should not be a screen and a half
 * apart in the same column.
 */

type Draft = {
  slug: string;
  title: Translated;
  excerpt: Translated;
  content: Block[];
  sidebar: Block[];
  layout: PageLayout;
  parentId: number | null;
  status: PageStatus;
  sortOrder: number;
  isHomepage: boolean;
  seoTitle: Translated;
  seoDescription: Translated;
  noindex: boolean;
};

const EMPTY: Draft = {
  slug: "",
  title: emptyTranslated(),
  excerpt: emptyTranslated(),
  content: [],
  sidebar: [],
  layout: "full",
  parentId: null,
  status: "draft",
  sortOrder: 0,
  isHomepage: false,
  seoTitle: emptyTranslated(),
  seoDescription: emptyTranslated(),
  noindex: false,
};

export default function AdminPageEditor() {
  const { t } = useTranslation("common");
  const id = useRecordId();
  const { pages } = usePages();

  const editor = useRecordEditor<Page, Draft>({
    path: "/admin/pages",
    id: id ?? null,
    empty: EMPTY,
    listHref: "/admin/pages",
    toDraft: (row) => ({
      slug: row.slug,
      title: row.title ?? emptyTranslated(),
      excerpt: row.excerpt ?? emptyTranslated(),
      content: (row.content ?? []) as Block[],
      sidebar: (row.sidebar ?? []) as Block[],
      layout: row.layout,
      parentId: row.parentId,
      status: row.status,
      sortOrder: row.sortOrder ?? 0,
      isHomepage: row.isHomepage,
      seoTitle: row.seoTitle ?? emptyTranslated(),
      seoDescription: row.seoDescription ?? emptyTranslated(),
      noindex: row.noindex ?? false,
    }),
  });

  const { draft, patch } = editor;

  // A page cannot be its own parent, and nesting is one level deep — so a page
  // that already has a parent cannot become one.
  const parents = pages.filter(
    (page) => page.id !== (id ?? -1) && !page.parentId && !page.isHomepage,
  );

  return (
    <RecordEditor
      icon={DocumentTextIcon}
      title={editor.isNew ? t("pages.add") : t("pages.edit")}
      description={t("pages.description")}
      backHref="/admin/pages"
      backLabel={t("pages.title")}
      deleteTitle={t("pages.deleteTitle")}
      deleteMessage={t("pages.deleteMessage")}
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
      aside={
        <>
          <EditorSection compact icon={DocumentTextIcon} title={t("editor.publishing")}>
            <StatusField
              status={draft.status}
              onStatusChange={(status) => patch({ status })}
              sortOrder={draft.sortOrder}
              onSortOrderChange={(sortOrder) => patch({ sortOrder })}
            />

            <label className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.isHomepage}
                onChange={(event) => patch({ isHomepage: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              {t("pages.isHomepage")}
            </label>
            <p className="-mt-2 text-xs text-gray-500">{t("pages.isHomepageHint")}</p>
          </EditorSection>

          <EditorSection compact icon={LinkIcon} title={t("editor.address")}>
            <Input
              label={t("editor.slug")}
              hint={t("editor.slugHint")}
              value={draft.slug}
              onChange={(event) => patch({ slug: event.target.value })}
            />

            <Select
              label={t("pages.parent")}
              hint={t("pages.parentHint")}
              value={draft.parentId === null ? "" : String(draft.parentId)}
              onChange={(event) =>
                patch({ parentId: event.target.value ? Number(event.target.value) : null })
              }
            >
              <option value="">{t("pages.noParent")}</option>
              {parents.map((page) => (
                <option key={page.id} value={page.id}>
                  {tr(page.title, "ro")}
                </option>
              ))}
            </Select>
          </EditorSection>

          <EditorSection
            compact
            icon={ViewColumnsIcon}
            title={t("pages.layout")}
            description={t("pages.layoutHint")}
          >
            <Select
              label={t("pages.layout")}
              value={draft.layout}
              onChange={(event) => patch({ layout: event.target.value as PageLayout })}
            >
              <option value="full">{t("pages.layoutFull")}</option>
              <option value="sidebar">{t("pages.layoutSidebar")}</option>
            </Select>
          </EditorSection>

          <EditorSection compact icon={MagnifyingGlassIcon} title={t("editor.seo")}>
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
        </>
      }
    >
      <EditorSection icon={InformationCircleIcon} title={t("editor.basics")}>
        <TranslatedField
          label={t("pages.name")}
          value={draft.title}
          onChange={(title) => patch({ title })}
          required
        />

        <TranslatedField
          label={t("editor.excerpt")}
          hint={t("editor.excerptHint")}
          value={draft.excerpt}
          onChange={(excerpt) => patch({ excerpt })}
          multiline
          rows={2}
        />

      </EditorSection>

      <EditorSection
        icon={Squares2X2Icon}
        title={t("editor.body")}
        description={t("editor.bodyHint")}
      >
        <BlockEditor blocks={draft.content} onChange={(content) => patch({ content })} />
      </EditorSection>

      {/* Shown only for the two-column layout, and **never cleared** when the
          layout changes back — see the note at the top. It lives in the main
          column because it is a second body, not a setting. */}
      {draft.layout === "sidebar" && (
        <EditorSection
          icon={ViewColumnsIcon}
          title={t("pages.layoutSidebar")}
          description={t("pages.layoutHint")}
        >
          <BlockEditor blocks={draft.sidebar} onChange={(sidebar) => patch({ sidebar })} />
        </EditorSection>
      )}

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
