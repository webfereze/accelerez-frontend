import type { GetStaticPaths, GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhotoIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import RecordEditor, { EditorSection } from "@/components/admin/RecordEditor";
import BlockEditor from "@/components/admin/BlockEditor";
import EnumChecklist from "@/components/admin/EnumChecklist";
import PublishedLocalesField from "@/components/admin/PublishedLocalesField";
import RelatedIdsField from "@/components/admin/RelatedIdsField";
import SeoFields from "@/components/admin/SeoFields";
import StatusField from "@/components/admin/StatusField";
import Input from "@/components/ui/Input";
import ImageField from "@/components/ui/ImageField";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import { useRecordEditor, useRecordId } from "@/hooks/useRecordEditor";
import { translations } from "@/utils/i18n";
import { emptyTranslated } from "@/utils/localized";
import { specializationKey } from "@/utils/labels";
import type { Block } from "@/blocks/types";
import {
  SPECIALIZATIONS,
  type Locale,
  type PageStatus,
  type Specialization,
  type TrainingClass,
  type Translated,
} from "@/types/content";

/**
 * One class.
 *
 * **Two prices, and both may be empty.** Somebody dropping in pays per session;
 * somebody committing pays per month. A class sold only monthly leaves the
 * per-session field blank rather than repeating the figure, and the card then
 * shows one price instead of two identical ones.
 *
 * The coaches are ids rather than a picker of their own: `RelatedIdsField` is
 * what the blog already uses for the same job, and a second widget for the same
 * shape of data is a second thing to keep working.
 */

type Draft = {
  title: Translated;
  slug: Translated;
  excerpt: Translated;
  content: Block[];
  image: string;
  imageAlt: string;
  scheduleText: Translated;
  startsOn: string;
  durationMinutes: string;
  pricePerSession: string;
  pricePerMonth: string;
  currency: string;
  ribbon: Translated;
  location: "gym" | "online" | "outdoor" | "other";
  place: string;
  city: string;
  capacity: string;
  specializations: Specialization[];
  trainerIds: number[];
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
  excerpt: emptyTranslated(),
  content: [],
  image: "",
  imageAlt: "",
  scheduleText: emptyTranslated(),
  startsOn: "",
  durationMinutes: "",
  pricePerSession: "",
  pricePerMonth: "",
  currency: "RON",
  ribbon: emptyTranslated(),
  location: "gym",
  place: "",
  city: "",
  capacity: "",
  specializations: [],
  trainerIds: [],
  status: "draft",
  isFeatured: false,
  publishedLocales: ["ro"],
  sortOrder: 0,
  seoTitle: emptyTranslated(),
  seoDescription: emptyTranslated(),
  noindex: false,
};

export default function AdminClassEditor() {
  const { t } = useTranslation("common");
  const id = useRecordId();

  const editor = useRecordEditor<TrainingClass, Draft>({
    path: "/admin/classes",
    id: id ?? null,
    empty: EMPTY,
    listHref: "/admin/classes",
    toDraft: (row) => ({
      title: row.title ?? emptyTranslated(),
      slug: (row.slug as unknown as Translated) ?? emptyTranslated(),
      excerpt: row.excerpt ?? emptyTranslated(),
      content: (row.content ?? []) as Block[],
      image: row.image ?? "",
      imageAlt: row.imageAlt ?? "",
      scheduleText: row.scheduleText ?? emptyTranslated(),
      startsOn: row.startsOn ?? "",
      durationMinutes: row.durationMinutes != null ? String(row.durationMinutes) : "",
      pricePerSession: row.pricePerSession != null ? String(row.pricePerSession) : "",
      pricePerMonth: row.pricePerMonth != null ? String(row.pricePerMonth) : "",
      currency: row.currency ?? "RON",
      ribbon: row.ribbon ?? emptyTranslated(),
      location: row.location ?? "gym",
      place: row.place ?? "",
      city: row.city ?? "",
      capacity: row.capacity != null ? String(row.capacity) : "",
      specializations: row.specializations ?? [],
      trainerIds: row.trainerIds ?? [],
      status: row.status ?? "draft",
      isFeatured: row.isFeatured ?? false,
      publishedLocales: row.publishedLocales ?? ["ro"],
      sortOrder: row.sortOrder ?? 0,
      seoTitle: row.seoTitle ?? emptyTranslated(),
      seoDescription: row.seoDescription ?? emptyTranslated(),
      noindex: row.noindex ?? false,
    }),
    // Numbers typed into text inputs arrive as strings, and an empty one has to
    // become `null`, not `0` — "no stated price" is not "free".
    toPayload: (draft) => ({
      title: draft.title,
      slug: draft.slug,
      excerpt: draft.excerpt,
      content: draft.content,
      image: draft.image || null,
      imageAlt: draft.imageAlt || null,
      scheduleText: draft.scheduleText,
      startsOn: draft.startsOn || null,
      durationMinutes: draft.durationMinutes ? Number(draft.durationMinutes) : null,
      pricePerSession: draft.pricePerSession ? Number(draft.pricePerSession) : null,
      pricePerMonth: draft.pricePerMonth ? Number(draft.pricePerMonth) : null,
      currency: draft.currency || "RON",
      ribbon: draft.ribbon,
      location: draft.location,
      place: draft.place || null,
      city: draft.city || null,
      capacity: draft.capacity ? Number(draft.capacity) : null,
      specializations: draft.specializations,
      trainerIds: draft.trainerIds,
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
      icon={RectangleGroupIcon}
      title={draft.title.ro || t("classes.addTitle")}
      description={t("classes.editorDescription")}
      backHref="/admin/classes"
      backLabel={t("classes.adminTitle")}
      deleteTitle={t("classes.deleteTitle")}
      deleteMessage={t("classes.deleteMessage")}
      notFoundLabel={t("classes.notFound")}
      completeness={[draft.title, draft.excerpt, draft.scheduleText]}
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
              {t("classes.featured")}
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
      <EditorSection icon={RectangleGroupIcon} title={t("classes.about")}>
        <TranslatedField
          label={t("classes.name")}
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

        <TranslatedField
          label={t("classes.excerptLabel")}
          hint={t("classes.excerptHint")}
          value={draft.excerpt}
          onChange={(excerpt) => patch({ excerpt })}
          multiline
          rows={4}
        />

        <TranslatedField
          label={t("classes.ribbonLabel")}
          hint={t("classes.ribbonHint")}
          value={draft.ribbon}
          onChange={(ribbon) => patch({ ribbon })}
        />

        <EnumChecklist
          label={t("trainers.specializations")}
          hint={t("classes.specializationsHint")}
          options={SPECIALIZATIONS}
          labelFor={(key: Specialization) => t(specializationKey(key))}
          value={draft.specializations}
          onChange={(specializations) => patch({ specializations })}
        />

        <RelatedIdsField
          label={t("classes.trainers")}
          hint={t("classes.trainersHint")}
          value={draft.trainerIds}
          max={6}
          onChange={(trainerIds) => patch({ trainerIds })}
        />
      </EditorSection>

      <EditorSection icon={PhotoIcon} title={t("classes.image")}>
        <ImageField
          label={t("classes.imageLabel")}
          url={draft.image || null}
          alt={draft.imageAlt}
          onChange={(next) => patch({ image: next.url ?? "", imageAlt: next.alt })}
        />
      </EditorSection>

      <EditorSection
        icon={CalendarDaysIcon}
        title={t("classes.whenLabel")}
        description={t("classes.whenHint")}
      >
        <TranslatedField
          label={t("classes.schedule")}
          hint={t("classes.scheduleHint")}
          value={draft.scheduleText}
          onChange={(scheduleText) => patch({ scheduleText })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label={t("classes.startsOn")}
            hint={t("classes.startsOnHint")}
            value={draft.startsOn}
            onChange={(event) => patch({ startsOn: event.target.value })}
          />
          <Input
            type="number"
            label={t("classes.duration")}
            hint={t("classes.durationHint")}
            value={draft.durationMinutes}
            onChange={(event) => patch({ durationMinutes: event.target.value })}
          />
        </div>
      </EditorSection>

      <EditorSection icon={MapPinIcon} title={t("classes.where")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label={t("classes.locationLabel")}
            value={draft.location}
            onChange={(event) =>
              patch({ location: event.target.value as Draft["location"] })
            }
          >
            <option value="gym">{t("classes.location.gym")}</option>
            <option value="outdoor">{t("classes.location.outdoor")}</option>
            <option value="online">{t("classes.location.online")}</option>
            <option value="other">{t("classes.location.other")}</option>
          </Select>
          <Input
            label={t("classes.place")}
            value={draft.place}
            onChange={(event) => patch({ place: event.target.value })}
          />
          <Input
            label={t("trainers.city")}
            value={draft.city}
            onChange={(event) => patch({ city: event.target.value })}
          />
        </div>
      </EditorSection>

      <EditorSection
        icon={BanknotesIcon}
        title={t("classes.priceLabel")}
        description={t("classes.priceHint")}
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <Input
            type="number"
            label={t("classes.pricePerSession")}
            value={draft.pricePerSession}
            onChange={(event) => patch({ pricePerSession: event.target.value })}
          />
          <Input
            type="number"
            label={t("classes.pricePerMonth")}
            value={draft.pricePerMonth}
            onChange={(event) => patch({ pricePerMonth: event.target.value })}
          />
          <Input
            label={t("trainers.currency")}
            value={draft.currency}
            onChange={(event) => patch({ currency: event.target.value.toUpperCase() })}
          />
          <Input
            type="number"
            label={t("classes.capacity")}
            hint={t("classes.capacityHint")}
            value={draft.capacity}
            onChange={(event) => patch({ capacity: event.target.value })}
          />
        </div>
      </EditorSection>

      <EditorSection
        icon={DocumentTextIcon}
        title={t("classes.body")}
        description={t("classes.bodyHint")}
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
