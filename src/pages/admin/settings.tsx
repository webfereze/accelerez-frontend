import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import {
  BuildingOffice2Icon,
  Cog6ToothIcon,
  IdentificationIcon,
  PhoneIcon,
  ShareIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminSectionHeading from "@/components/admin/AdminSectionHeading";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ImageField from "@/components/ui/ImageField";
import TranslatedField from "@/components/ui/TranslatedField";
import SocialField from "@/components/admin/SocialField";
import EditorLocaleBar from "@/components/ui/EditorLocaleBar";
import { EditorLocaleProvider } from "@/hooks/useEditorLocale";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { translations } from "@/utils/i18n";
import { emptyTranslated } from "@/utils/localized";
import type { SiteSettings } from "@/types/content";

/**
 * The association's own details — *datele site-ului*.
 *
 * **These ship deliberately blank.** Name, address, telephone and registry data
 * are facts about a real organisation, and the seeder refuses to invent them
 * because an invention ends up on a live page, in an e-mail footer and
 * eventually on a document nobody checked. This screen is where they are filled
 * in, and every public component reads them through `useSiteSettings()` rather
 * than hardcoding any of it.
 *
 * An empty field renders as nothing on the site, never as a placeholder — so a
 * gap here is visible out there, which is what gets it filled.
 */

/** The full shape, so a never-written row still gets every field. */
const EMPTY: SiteSettings & Record<string, unknown> = {
  name: "",
  logo: "",
  tagline: emptyTranslated(),
  about: emptyTranslated(),
  phone: "",
  email: "",
  address: "",
  company: { name: "", cui: "", onrc: "" },
  social: [],
  shareImage: "",
  shareImageAlt: "",
};

export default function AdminSettings() {
  const { t } = useTranslation("common");
  const { value, patch, save, loading, saving, dirty, saved, error } =
    useSettingsForm<SiteSettings & Record<string, unknown>>("site", EMPTY);

  const company = value.company ?? {};

  return (
    <AdminLayout>
      <EditorLocaleProvider>
        <AdminPageHeader
          icon={Cog6ToothIcon}
          title={t("settings.title")}
          description={t("settings.description")}
          actions={
            <Button onClick={save} loading={saving} disabled={!dirty || loading}>
              {t("common.save")}
            </Button>
          }
        />

        {error && (
          <Alert tone="error" className="mb-4">
            {t("settings.saveFailed")}
          </Alert>
        )}

        {saved && !dirty && (
          <Alert tone="success" className="mb-4">
            {t("settings.saved")}
          </Alert>
        )}

        {loading ? (
          <p role="status" className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Identity --------------------------------------------------- */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <AdminSectionHeading icon={IdentificationIcon}>
                {t("settings.identity")}
              </AdminSectionHeading>

              <EditorLocaleBar
                className="mt-4"
                completeness={[value.tagline, value.about]}
              />

              <div className="mt-4 grid gap-4">
                <Input
                  label={t("settings.name")}
                  hint={t("settings.nameHint")}
                  value={value.name ?? ""}
                  onChange={(event) => patch({ name: event.target.value })}
                />


                <TranslatedField
                  label={t("settings.tagline")}
                  hint={t("settings.taglineHint")}
                  value={value.tagline ?? emptyTranslated()}
                  onChange={(tagline) => patch({ tagline })}
                />

                <TranslatedField
                  label={t("settings.about")}
                  hint={t("settings.aboutHint")}
                  multiline
                  rows={4}
                  value={value.about ?? emptyTranslated()}
                  onChange={(about) => patch({ about })}
                />
              </div>
            </section>

            {/* How to reach them ------------------------------------------ */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <AdminSectionHeading icon={PhoneIcon}>
                {t("settings.contact")}
              </AdminSectionHeading>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input
                  label={t("settings.phone")}
                  type="tel"
                  value={value.phone ?? ""}
                  onChange={(event) => patch({ phone: event.target.value })}
                />
                <Input
                  label={t("settings.email")}
                  type="email"
                  value={value.email ?? ""}
                  onChange={(event) => patch({ email: event.target.value })}
                />
                <div className="sm:col-span-2">
                  <Input
                    label={t("settings.address")}
                    value={value.address ?? ""}
                    onChange={(event) => patch({ address: event.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Registry data ---------------------------------------------- */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <AdminSectionHeading icon={BuildingOffice2Icon}>
                {t("settings.company")}
              </AdminSectionHeading>

              <p className="mt-2 text-sm text-gray-500">{t("settings.companyHint")}</p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <Input
                    label={t("settings.companyName")}
                    value={company.name ?? ""}
                    onChange={(event) =>
                      patch({ company: { ...company, name: event.target.value } })
                    }
                  />
                </div>
                <Input
                  label={t("settings.cui")}
                  value={company.cui ?? ""}
                  onChange={(event) =>
                    patch({ company: { ...company, cui: event.target.value } })
                  }
                />
                <Input
                  label={t("settings.onrc")}
                  value={company.onrc ?? ""}
                  onChange={(event) =>
                    patch({ company: { ...company, onrc: event.target.value } })
                  }
                />
              </div>
            </section>

            {/* Social profiles ------------------------------------------- */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <AdminSectionHeading icon={GlobeAltIcon}>
                {t("settings.social")}
              </AdminSectionHeading>

              <p className="mt-2 text-sm text-gray-500">{t("settings.socialHint")}</p>

              <div className="mt-4">
                <SocialField
                  value={value.social ?? []}
                  onChange={(social) => patch({ social })}
                />
              </div>
            </section>

            {/* What a shared link looks like ------------------------------ */}
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <AdminSectionHeading icon={ShareIcon}>
                {t("settings.sharing")}
              </AdminSectionHeading>

              <p className="mt-2 text-sm text-gray-500">{t("settings.sharingHint")}</p>

              <div className="mt-4">
                {/* Image and alt text together, so a picture cannot ship
                    without a description of it. */}
                <ImageField
                  label={t("settings.shareImage")}
                  url={value.shareImage ?? null}
                  alt={value.shareImageAlt ?? ""}
                  onChange={({ url, alt }) =>
                    patch({ shareImage: url ?? "", shareImageAlt: alt })
                  }
                />
              </div>
            </section>

            {/* Repeated at the bottom: these are long forms, and a Save that
                only exists above the fold is one nobody scrolls back up to. */}
            <div className="flex justify-end">
              <Button onClick={save} loading={saving} disabled={!dirty}>
                {t("common.save")}
              </Button>
            </div>
          </div>
        )}
      </EditorLocaleProvider>
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
