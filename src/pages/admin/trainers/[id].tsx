import type { GetStaticPaths, GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import {
  BanknotesIcon,
  DocumentTextIcon,
  IdentificationIcon,
  KeyIcon,
  MapPinIcon,
  PhotoIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/outline";
import RecordEditor, { EditorSection } from "@/components/admin/RecordEditor";
import BlockEditor from "@/components/admin/BlockEditor";
import CertificationsField from "@/components/admin/CertificationsField";
import EnumChecklist from "@/components/admin/EnumChecklist";
import PublishedLocalesField from "@/components/admin/PublishedLocalesField";
import SeoFields from "@/components/admin/SeoFields";
import StatusField from "@/components/admin/StatusField";
import Input from "@/components/ui/Input";
import ImageField from "@/components/ui/ImageField";
import PasswordInput from "@/components/ui/PasswordInput";
import TranslatedField from "@/components/ui/TranslatedField";
import { useRecordEditor, useRecordId } from "@/hooks/useRecordEditor";
import { translations } from "@/utils/i18n";
import { emptyTranslated } from "@/utils/localized";
import { formatKey, specializationKey } from "@/utils/labels";
import type { Block } from "@/blocks/types";
import {
  SPECIALIZATIONS,
  TRAINING_FORMATS,
  type Certification,
  type Locale,
  type PageStatus,
  type Specialization,
  type Trainer,
  type TrainingFormat,
  type Translated,
} from "@/types/content";

/**
 * One trainer: the account and the public profile, in one form.
 *
 * **Creating this record creates a login.** An administrator types the coach's
 * name, the e-mail they will sign in with and a first password, and the API
 * creates the `users` row and the profile together — see `TrainerService`.
 * Splitting it into "create a user, then create a profile" produces orphans in
 * both directions the first time somebody is interrupted halfway.
 *
 * **The password field is empty on an existing trainer and that is not a bug.**
 * A password is stored as a hash and cannot be read back; leaving it blank
 * means "leave it alone", and typing in it sets a new one. Rendering the hash
 * or a row of asterisks that saves itself back would re-hash the hash on every
 * save and lock the trainer out.
 *
 * Publication, featuring and SEO live here rather than in the trainer's own
 * portal: a coach can edit their bio, their price and whether they are taking
 * clients, but the directory's front page is the platform's editorial decision.
 */

type Draft = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;

  displayName: string;
  slug: Translated;
  headline: Translated;
  excerpt: Translated;
  content: Block[];
  photo: string;
  coverImage: string;
  city: string;
  county: string;
  formats: TrainingFormat[];
  specializations: Specialization[];
  yearsExperience: string;
  certifications: Certification[];
  monthlyPrice: string;
  currency: string;
  capacity: string;
  isAcceptingClients: boolean;
  isFeatured: boolean;
  phone: string;
  publicEmail: string;
  status: PageStatus;
  publishedLocales: string[];
  sortOrder: number;
  seoTitle: Translated;
  seoDescription: Translated;
  noindex: boolean;
};

const EMPTY: Draft = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  isActive: true,

  displayName: "",
  slug: emptyTranslated(),
  headline: emptyTranslated(),
  excerpt: emptyTranslated(),
  content: [],
  photo: "",
  coverImage: "",
  city: "",
  county: "",
  formats: [],
  specializations: [],
  yearsExperience: "",
  certifications: [],
  monthlyPrice: "",
  currency: "RON",
  capacity: "",
  isAcceptingClients: true,
  isFeatured: false,
  phone: "",
  publicEmail: "",
  status: "draft",
  publishedLocales: ["ro"],
  sortOrder: 0,
  seoTitle: emptyTranslated(),
  seoDescription: emptyTranslated(),
  noindex: false,
};

export default function AdminTrainerEditor() {
  const { t } = useTranslation("common");
  const id = useRecordId();

  const editor = useRecordEditor<Trainer, Draft>({
    path: "/admin/trainers",
    id: id ?? null,
    empty: EMPTY,
    listHref: "/admin/trainers",
    toDraft: (row) => ({
      email: row.user?.email ?? "",
      // Never filled from the record — see the class note.
      password: "",
      firstName: row.user?.firstName ?? "",
      lastName: row.user?.lastName ?? "",
      isActive: row.user?.isActive ?? true,

      displayName: row.displayName ?? "",
      slug: (row.slug as unknown as Translated) ?? emptyTranslated(),
      headline: row.headline ?? emptyTranslated(),
      excerpt: row.excerpt ?? emptyTranslated(),
      content: (row.content ?? []) as Block[],
      photo: row.photo ?? "",
      coverImage: row.coverImage ?? "",
      city: row.city ?? "",
      county: row.county ?? "",
      formats: row.formats ?? [],
      specializations: row.specializations ?? [],
      yearsExperience: row.yearsExperience != null ? String(row.yearsExperience) : "",
      certifications: row.certifications ?? [],
      monthlyPrice: row.monthlyPrice != null ? String(row.monthlyPrice) : "",
      currency: row.currency ?? "RON",
      capacity: row.capacity != null ? String(row.capacity) : "",
      isAcceptingClients: row.isAcceptingClients ?? true,
      isFeatured: row.isFeatured ?? false,
      phone: row.phone ?? "",
      publicEmail: row.publicEmail ?? "",
      status: row.status ?? "draft",
      publishedLocales: row.publishedLocales ?? ["ro"],
      sortOrder: row.sortOrder ?? 0,
      seoTitle: row.seoTitle ?? emptyTranslated(),
      seoDescription: row.seoDescription ?? emptyTranslated(),
      noindex: row.noindex ?? false,
    }),
    /**
     * The form and the DTO are not the same shape. Numbers typed into text
     * inputs arrive as strings — and an empty one has to become `undefined`,
     * not `0`, or "no stated price" becomes "free". An empty password has to
     * disappear entirely rather than be sent as `""`, which the API would
     * reject as too short.
     */
    toPayload: (draft) => ({
      email: draft.email.trim(),
      ...(draft.password ? { password: draft.password } : {}),
      firstName: draft.firstName.trim() || undefined,
      lastName: draft.lastName.trim() || undefined,
      isActive: draft.isActive,

      displayName: draft.displayName.trim(),
      slug: draft.slug,
      headline: draft.headline,
      excerpt: draft.excerpt,
      content: draft.content,
      photo: draft.photo || null,
      coverImage: draft.coverImage || null,
      city: draft.city.trim() || undefined,
      county: draft.county.trim() || undefined,
      formats: draft.formats,
      specializations: draft.specializations,
      yearsExperience: draft.yearsExperience ? Number(draft.yearsExperience) : null,
      certifications: draft.certifications.filter((row) => row.name.trim()),
      monthlyPrice: draft.monthlyPrice ? Number(draft.monthlyPrice) : null,
      currency: draft.currency || "RON",
      capacity: draft.capacity ? Number(draft.capacity) : null,
      isAcceptingClients: draft.isAcceptingClients,
      isFeatured: draft.isFeatured,
      phone: draft.phone.trim() || undefined,
      publicEmail: draft.publicEmail.trim() || undefined,
      status: draft.status,
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
      icon={IdentificationIcon}
      title={draft.displayName || t("trainers.addTitle")}
      description={t("trainers.editorDescription")}
      backHref="/admin/trainers"
      backLabel={t("trainers.adminTitle")}
      deleteTitle={t("trainers.deleteTitle")}
      deleteMessage={t("trainers.deleteMessage")}
      notFoundLabel={t("trainers.notFound")}
      completeness={[draft.headline, draft.excerpt]}
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
              {t("trainers.featured")}
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
      <EditorSection
        icon={KeyIcon}
        title={t("trainers.account")}
        description={t("trainers.accountHint")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="email"
            label={t("trainers.email")}
            hint={t("trainers.emailHint")}
            value={draft.email}
            onChange={(event) => patch({ email: event.target.value })}
            required
          />
          <PasswordInput
            label={editor.isNew ? t("trainers.password") : t("trainers.newPassword")}
            hint={editor.isNew ? t("trainers.passwordHint") : t("trainers.newPasswordHint")}
            value={draft.password}
            onChange={(event) => patch({ password: event.target.value })}
            autoComplete="new-password"
            required={editor.isNew}
          />
          <Input
            label={t("trainers.firstName")}
            value={draft.firstName}
            onChange={(event) => patch({ firstName: event.target.value })}
          />
          <Input
            label={t("trainers.lastName")}
            value={draft.lastName}
            onChange={(event) => patch({ lastName: event.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => patch({ isActive: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t("trainers.active")}
        </label>
        <p className="text-xs text-gray-500">{t("trainers.activeHint")}</p>
      </EditorSection>

      <EditorSection icon={UserIcon} title={t("trainers.profile")}>
        <Input
          label={t("trainers.displayName")}
          hint={t("trainers.displayNameHint")}
          value={draft.displayName}
          onChange={(event) => patch({ displayName: event.target.value })}
          required
        />

        <TranslatedField
          label={t("trainers.slug")}
          hint={t("trainers.slugHint")}
          value={draft.slug}
          onChange={(slug) => patch({ slug })}
        />

        <TranslatedField
          label={t("trainers.headline")}
          hint={t("trainers.headlineHint")}
          value={draft.headline}
          onChange={(headline) => patch({ headline })}
        />

        <TranslatedField
          label={t("trainers.excerpt")}
          hint={t("trainers.excerptHint")}
          value={draft.excerpt}
          onChange={(excerpt) => patch({ excerpt })}
          multiline
          rows={3}
        />
      </EditorSection>

      <EditorSection icon={PhotoIcon} title={t("trainers.images")}>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* `ImageField` carries an alt text; a trainer's own photograph is
              described by their name, which the card already prints beside it,
              so the alt is not stored and the field's value is discarded. */}
          <ImageField
            label={t("trainers.photo")}
            url={draft.photo || null}
            alt=""
            onChange={(next) => patch({ photo: next.url ?? "" })}
          />
          <ImageField
            label={t("trainers.coverImage")}
            url={draft.coverImage || null}
            alt=""
            onChange={(next) => patch({ coverImage: next.url ?? "" })}
          />
        </div>
      </EditorSection>

      <EditorSection icon={MapPinIcon} title={t("trainers.whereAndWhat")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("trainers.city")}
            value={draft.city}
            onChange={(event) => patch({ city: event.target.value })}
          />
          <Input
            label={t("trainers.county")}
            value={draft.county}
            onChange={(event) => patch({ county: event.target.value })}
          />
        </div>

        <EnumChecklist
          label={t("trainers.formats")}
          hint={t("trainers.formatsHint")}
          options={TRAINING_FORMATS}
          labelFor={(key: TrainingFormat) => t(formatKey(key))}
          value={draft.formats}
          onChange={(formats) => patch({ formats })}
        />

        <EnumChecklist
          label={t("trainers.specializations")}
          hint={t("trainers.specializationsHint")}
          options={SPECIALIZATIONS}
          labelFor={(key: Specialization) => t(specializationKey(key))}
          value={draft.specializations}
          onChange={(specializations) => patch({ specializations })}
        />

        <Input
          type="number"
          label={t("trainers.yearsExperience")}
          value={draft.yearsExperience}
          onChange={(event) => patch({ yearsExperience: event.target.value })}
        />

        <CertificationsField
          value={draft.certifications}
          onChange={(certifications) => patch({ certifications })}
        />
      </EditorSection>

      <EditorSection
        icon={BanknotesIcon}
        title={t("trainers.priceAndPlaces")}
        description={t("trainers.priceAndPlacesHint")}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            type="number"
            label={t("trainers.monthlyPrice")}
            hint={t("trainers.monthlyPriceHint")}
            value={draft.monthlyPrice}
            onChange={(event) => patch({ monthlyPrice: event.target.value })}
          />
          <Input
            label={t("trainers.currency")}
            value={draft.currency}
            onChange={(event) => patch({ currency: event.target.value.toUpperCase() })}
          />
          <Input
            type="number"
            label={t("trainers.capacity")}
            hint={t("trainers.capacityHint")}
            value={draft.capacity}
            onChange={(event) => patch({ capacity: event.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={draft.isAcceptingClients}
            onChange={(event) => patch({ isAcceptingClients: event.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t("trainers.acceptingClients")}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("trainers.phone")}
            hint={t("trainers.phoneHint")}
            value={draft.phone}
            onChange={(event) => patch({ phone: event.target.value })}
          />
          <Input
            type="email"
            label={t("trainers.publicEmail")}
            hint={t("trainers.publicEmailHint")}
            value={draft.publicEmail}
            onChange={(event) => patch({ publicEmail: event.target.value })}
          />
        </div>
      </EditorSection>

      <EditorSection
        icon={DocumentTextIcon}
        title={t("trainers.body")}
        description={t("trainers.bodyHint")}
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
