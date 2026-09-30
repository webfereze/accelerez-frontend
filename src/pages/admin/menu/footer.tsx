import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next/pages";
import MenuManager from "@/components/admin/MenuManager";
import { translations } from "@/utils/i18n";

/** The footer links. Same screen as the header, different key. */
export default function AdminFooterMenu() {
  const { t } = useTranslation("common");

  return (
    <MenuManager
      menu="footer"
      title={t("menu.footerTitle")}
      description={t("menu.footerDescription")}
    />
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
