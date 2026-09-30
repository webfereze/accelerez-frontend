import type { GetStaticPaths, GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import {
  BanknotesIcon,
  DocumentTextIcon,
  PhotoIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import RecordEditor, { EditorSection } from "@/components/admin/RecordEditor";
import BlockEditor from "@/components/admin/BlockEditor";
import PublishedLocalesField from "@/components/admin/PublishedLocalesField";
import SeoFields from "@/components/admin/SeoFields";
import StatusField from "@/components/admin/StatusField";
import VariantsField, { emptyVariant, type VariantDraft } from "@/components/admin/VariantsField";
import Input from "@/components/ui/Input";
import ImageField from "@/components/ui/ImageField";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import { useRecordEditor, useRecordId } from "@/hooks/useRecordEditor";
import { useTrainerOptions } from "@/hooks/useTrainerOptions";
import { translations } from "@/utils/i18n";
import { emptyTranslated } from "@/utils/localized";
import { productCategoryKey } from "@/utils/shop";
import type { Block } from "@/blocks/types";
import {
  PRODUCT_CATEGORIES,
  type Locale,
  type PageStatus,
  type Product,
  type ProductCategory,
  type Translated,
} from "@/types/content";

/**
 * One product.
 *
 * Built like the class editor — the same `RecordEditor`, the same publishing
 * aside — with the variants in place of the schedule. The prices live on the
 * variants: a product has no price of its own, only the prices of the ways it
 * is sold.
 */

type Draft = {
  title: Translated;
  slug: Translated;
  category: ProductCategory;
  excerpt: Translated;
  content: Block[];
  image: string;
  imageAlt: string;
  variants: VariantDraft[];
  currency: string;
  deliveryNote: Translated;
  ribbon: Translated;
  trainerId: string;
  status: PageStatus;
  isFeatured: boolean;
  publishedLocales: string[];
  sortOrder: number;
  seoTitle: Translated;
  seoDescription: Translated;
  noindex: boolean;
};

const EMPTY: Draft = {
  title: emptyTranslated(),
  slug: emptyTranslated(),
  category: "meal_plan",
  excerpt: emptyTranslated(),
  content: [],
  image: "",
  imageAlt: "",
  variants: [emptyVariant()],
  currency: "RON",
  deliveryNote: emptyTranslated(),
  ribbon: emptyTranslated(),
  trainerId: "",
  status: "draft",
  isFeatured: false,
  publishedLocales: ["ro"],
  sortOrder: 0,
  seoTitle: emptyTranslated(),
  seoDescription: emptyTranslated(),
  noindex: false,
};

/** An empty input is "not stated", never zero. */
const toNumber = (value: string) => (value.trim() === "" ? null : Number(value));

export default function AdminProductEditor() {
  const { t } = useTranslation("common");
  const id = useRecordId();
  const trainers = useTrainerOptions();

  const editor = useRecordEditor<Product, Draft>({
    path: "/admin/products",
    id: id ?? null,
    empty: EMPTY,
    listHref: "/admin/products",
    toDraft: (row) => ({
      title: row.title ?? emptyTranslated(),
      slug: (row.slug as unknown as Translated) ?? emptyTranslated(),
      category: row.category ?? "other",
      excerpt: row.excerpt ?? emptyTranslated(),
      content: (row.content ?? []) as Block[],
      image: row.image ?? "",
      imageAlt: row.imageAlt ?? "",
      variants: (row.variants ?? []).length
        ? row.variants.map((variant) => ({
            id: variant.id,
            label: { ...emptyTranslated(), ...variant.label },
            price: variant.price != null ? String(variant.price) : "",
            compareAtPrice: variant.compareAtPrice != null ? String(variant.compareAtPrice) : "",
          }))
        : [emptyVariant()],
      currency: row.currency ?? "RON",
      deliveryNote: row.deliveryNote ?? emptyTranslated(),
      ribbon: row.ribbon ?? emptyTranslated(),
      trainerId: row.trainerId != null ? String(row.trainerId) : "",
      status: row.status ?? "draft",
      isFeatured: row.isFeatured ?? false,
      publishedLocales: row.publishedLocales ?? ["ro"],
      sortOrder: row.sortOrder ?? 0,
      seoTitle: row.seoTitle ?? emptyTranslated(),
      seoDescription: row.seoDescription ?? emptyTranslated(),
      noindex: row.noindex ?? false,
    }),
    toPayload: (draft) => ({
      title: draft.title,
      slug: draft.slug,
      category: draft.category,
      excerpt: draft.excerpt,
      content: draft.content,
      image: draft.image || null,
      imageAlt: draft.imageAlt || null,
      variants: draft.variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        price: toNumber(variant.price),
        compareAtPrice: toNumber(variant.compareAtPrice),
      })),
      currency: draft.currency || "RON",
      deliveryNote: draft.deliveryNote,
      ribbon: draft.ribbon,
      trainerId: draft.trainerId ? Number(draft.trainerId) : null,
      status: draft.status,
      isFeatured: draft.isFeatured,
      publishedLocales: draft.publishedLocales,
      sortOrder: draft.sortOrder,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      noindex: draft.noindex,
    }),
  });

  const { draft, patch } = editor;

  return (
    <RecordEditor
      icon={ShoppingBagIcon}
      title={draft.title.ro || t("shop.admin.addTitle")}
      description={t("shop.admin.editorDescription")}
      backHref="/admin/products"
      backLabel={t("shop.admin.title")}
      deleteTitle={t("shop.admin.deleteTitle")}
      deleteMessage={t("shop.admin.deleteMessage")}
      notFoundLabel={t("shop.admin.notFound")}
      completeness={[draft.title, draft.excerpt]}
      isNew={editor.isNew}
      loading={editor.loading}
      notFound={editor.notFound}
      saving={editor.saving}
      deleting={editor.deleting}
      dirty={editor.dirty}
      saved={editor.saved}
      error={editor.error}
      onSave={editor.save}
      onDelete={editor.remove}
      aside={
        <>
          <EditorSection icon={Squares2X2Icon} title={t("editor.publishing")} compact>
            <StatusField
              status={draft.status}
              onStatusChange={(status) => patch({ status })}
              sortOrder={draft.sortOrder}
              onSortOrderChange={(sortOrder) => patch({ sortOrder })}
            />

            <PublishedLocalesField
              value={draft.publishedLocales}
              onChange={(publishedLocales: Locale[]) => patch({ publishedLocales })}
            />

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={draft.isFeatured}
                onChange={(event) => patch({ isFeatured: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              {t("shop.admin.featured")}
            </label>
          </EditorSection>

          <EditorSection icon={DocumentTextIcon} title={t("editor.seo")} compact>
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
      <EditorSection icon={ShoppingBagIcon} title={t("shop.admin.about")}>
        <TranslatedField
          label={t("shop.admin.name")}
          value={draft.title}
          onChange={(title) => patch({ title })}
          required
        />

        <TranslatedField
          label={t("trainers.slug")}
          hint={t("trainers.slugHint")}
          value={draft.slug}
          onChange={(slug) => patch({ slug })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t("shop.admin.category")}
            value={draft.category}
            onChange={(event) => patch({ category: event.target.value as ProductCategory })}
          >
            {PRODUCT_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {t(productCategoryKey(value))}
              </option>
            ))}
          </Select>

          <Select
            label={t("shop.admin.trainer")}
            hint={t("shop.admin.trainerHint")}
            value={draft.trainerId}
            onChange={(event) => patch({ trainerId: event.target.value })}
          >
            <option value="">{t("shop.admin.trainerNone")}</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={String(trainer.id)}>
                {trainer.name}
              </option>
            ))}
          </Select>
        </div>

        <TranslatedField
          label={t("shop.admin.excerpt")}
          hint={t("shop.admin.excerptHint")}
          value={draft.excerpt}
          onChange={(excerpt) => patch({ excerpt })}
          multiline
          rows={3}
        />

        <TranslatedField
          label={t("shop.admin.ribbon")}
          hint={t("shop.admin.ribbonHint")}
          value={draft.ribbon}
          onChange={(ribbon) => patch({ ribbon })}
        />
      </EditorSection>

      <EditorSection
        icon={BanknotesIcon}
        title={t("shop.admin.variants")}
        description={t("shop.admin.variantsHint")}
      >
        <VariantsField
          value={draft.variants}
          currency={draft.currency || "RON"}
          onChange={(variants) => patch({ variants })}
        />

        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
          <Input
            label={t("trainers.currency")}
            value={draft.currency}
            maxLength={3}
            onChange={(event) => patch({ currency: event.target.value.toUpperCase() })}
          />
          <TranslatedField
            label={t("shop.admin.deliveryNote")}
            hint={t("shop.admin.deliveryNoteHint")}
            value={draft.deliveryNote}
            onChange={(deliveryNote) => patch({ deliveryNote })}
          />
        </div>
      </EditorSection>

      <EditorSection icon={PhotoIcon} title={t("shop.admin.image")}>
        <ImageField
          label={t("shop.admin.imageLabel")}
          url={draft.image || null}
          alt={draft.imageAlt}
          onChange={(next) => patch({ image: next.url ?? "", imageAlt: next.alt })}
        />
      </EditorSection>

      <EditorSection
        icon={DocumentTextIcon}
        title={t("shop.admin.body")}
        description={t("shop.admin.bodyHint")}
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
