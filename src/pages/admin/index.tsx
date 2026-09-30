import type { GetStaticProps } from "next";
import Link from "next/link";
import { useTranslation } from "next-i18next/pages";
import {
  Bars3BottomLeftIcon,
  ChatBubbleLeftRightIcon,
  DocumentCurrencyEuroIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  IdentificationIcon,
  NewspaperIcon,
  RectangleStackIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { translations } from "@/utils/i18n";

/**
 * Where the admin lands.
 *
 * A map, not a metrics screen. Content changes a few times a month, so the
 * useful thing on arrival is a short path to each kind of thing somebody came
 * to change — numbers nobody acts on are just decoration.
 *
 * **It lists what this project has.** The scaffold arrived with attractions,
 * accommodation, events and documents, which belong to the destination site
 * this CMS was lifted from and have no screens, no entities and no meaning
 * here. Four tiles leading to four 404s is worse than four fewer tiles.
 */
const DESTINATIONS = [
  { href: "/admin/pages", labelKey: "admin.nav.pages", icon: DocumentTextIcon },
  { href: "/admin/menu", labelKey: "admin.nav.menu", icon: Bars3BottomLeftIcon },
  { href: "/admin/services", labelKey: "admin.nav.services", icon: RectangleStackIcon },
  { href: "/admin/projects", labelKey: "admin.nav.projects", icon: ShoppingBagIcon },
  { href: "/admin/team", labelKey: "admin.nav.team", icon: IdentificationIcon },
  { href: "/admin/offers", labelKey: "admin.nav.offers", icon: DocumentCurrencyEuroIcon },
  { href: "/admin/blog", labelKey: "admin.nav.blog", icon: NewspaperIcon },
  { href: "/admin/requests", labelKey: "admin.nav.requests", icon: EnvelopeIcon },
  { href: "/admin/blocks", labelKey: "admin.nav.blocks", icon: ChatBubbleLeftRightIcon },
];

export default function AdminDashboard() {
  const { t } = useTranslation("common");

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={Squares2X2Icon}
        title={t("admin.dashboard.title")}
        description={t("admin.dashboard.description")}
      />

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map(({ href, labelKey, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-11 items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/10">
                <Icon className="h-5 w-5 text-primary-700" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-gray-900">{t(labelKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminLayout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
