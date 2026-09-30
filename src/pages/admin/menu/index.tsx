import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import MenuManager from "@/components/admin/MenuManager";
import { translations } from "@/utils/i18n";

/** The header navigation. Same screen as the footer, different key. */
export default function AdminMainMenu() {
  const { t } = useTranslation("common");

  return (
    <MenuManager
      menu="main"
      title={t("menu.mainTitle")}
      description={t("menu.mainDescription")}
    />
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
