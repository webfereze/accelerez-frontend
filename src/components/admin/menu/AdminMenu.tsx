import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  QuestionMarkCircleIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  Bars3BottomLeftIcon,
  ViewColumnsIcon,
  Squares2X2Icon as BlocksIcon,
  NewspaperIcon,
  InboxArrowDownIcon,
  RectangleStackIcon,
  ShoppingBagIcon,
  IdentificationIcon,
  EnvelopeIcon,
  DocumentCurrencyEuroIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { FLAGS } from "@/components/ui/FlagIcons";
import { LOCALES, LOCALE_META } from "@/types/content";
import { useAdminMenu } from "@/contexts/AdminMenuContext";
import { useAppDispatch } from "@/store/store";
import { logout } from "@/store/authSlice";
import { resetAdminSession } from "@/hooks/useAdminAuth";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Not built yet — shown, but visibly inert, so the shape of the admin is legible. */
  soon?: boolean;
  /**
   * A brand colour for the one entry that matters more than the rest — the
   * screen where money moves, or wherever a mistake is expensive. Worth being
   * able to find without reading. Use it once, or not at all: two highlighted
   * rows highlight nothing.
   */
  highlight?: boolean;
  /**
   * One level of nesting, and deliberately only one.
   *
   * A sidebar that nests further needs collapsing state, and then a memory of
   * which groups were open — machinery worth having when there are twenty
   * sections, and clutter when there are two children under one entry.
   */
  children?: NavItem[];
};

type NavSection = { labelKey: string | null; items: NavItem[] };

/**
 * The sections mirror the implementation plan, so the menu doubles as a map of
 * what exists. Items for unbuilt phases carry `soon` and are not links.
 */
const SECTIONS: NavSection[] = [
  {
    labelKey: null,
    items: [{ href: "/admin", labelKey: "admin.nav.dashboard", icon: Squares2X2Icon }],
  },
  {
    labelKey: "admin.nav.contentGroup",
    items: [
      // Navigation before the pages it points at: the menu is the map of the
      // site, and it is what an editor reaches for most often.
      {
        href: "/admin/menu",
        labelKey: "admin.nav.menu",
        icon: Bars3BottomLeftIcon,
        children: [
          { href: "/admin/menu", labelKey: "admin.nav.menuHeader", icon: Bars3BottomLeftIcon },
          { href: "/admin/menu/footer", labelKey: "admin.nav.menuFooter", icon: ViewColumnsIcon },
        ],
      },
      { href: "/admin/pages", labelKey: "admin.nav.pages", icon: DocumentTextIcon },
    ],
  },
  {
    // The product itself: the people in the directory and who trains with whom.
    // Grouped apart from the pages because these are records the site queries
    // and money is counted against, not documents somebody wrote.
    labelKey: "admin.nav.platformGroup",
    items: [
      { href: "/admin/trainers", labelKey: "admin.nav.trainers", icon: IdentificationIcon },
      { href: "/admin/classes", labelKey: "admin.nav.classes", icon: RectangleGroupIcon },
      {
        href: "/admin/enrollments",
        labelKey: "admin.nav.enrollments",
        icon: RectangleStackIcon,
      },
    ],
  },
  {
    // What is for sale and who asked for it. Its own group: the products are
    // edited like pages, but the orders are an inbox somebody works through.
    labelKey: "admin.nav.shopGroup",
    items: [
      { href: "/admin/products", labelKey: "admin.nav.products", icon: ShoppingBagIcon },
      { href: "/admin/orders", labelKey: "admin.nav.orders", icon: ClipboardDocumentListIcon },
    ],
  },
  {
    labelKey: "admin.nav.contentGroup2",
    items: [
      { href: "/admin/blog", labelKey: "admin.nav.blog", icon: NewspaperIcon },
      { href: "/admin/faqs", labelKey: "admin.nav.faqs", icon: QuestionMarkCircleIcon },
      { href: "/admin/requests", labelKey: "admin.nav.requests", icon: EnvelopeIcon },
      { href: "/admin/subscribers", labelKey: "admin.nav.subscribers", icon: InboxArrowDownIcon },
    ],
  },
  {
    labelKey: "admin.nav.settingsGroup",
    items: [
      { href: "/admin/settings", labelKey: "admin.nav.settings", icon: Cog6ToothIcon },
      { href: "/admin/blocks", labelKey: "admin.nav.blocks", icon: BlocksIcon },
    ],
  },
];

export default function AdminMenu() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useAdminMenu();

  /**
   * `exact` for anything that has a child at a deeper path — otherwise
   * `/admin/menu` matches `/admin/menu/footer` by prefix and both light up,
   * which reads as being in two places at once.
   */
  const isActive = (href: string, exact = false) =>
    href === "/admin" || exact
      ? router.pathname === href
      : router.pathname.startsWith(href);

  const signOut = () => {
    dispatch(logout());
    // Without this the module-level cache would still say "authenticated" and
    // the login screen would bounce straight back into the admin.
    resetAdminSession("anonymous");
    void router.push("/admin/login");
  };

  /** What the mobile bar shows on the right: where you currently are. */
  const activeLabel = SECTIONS.flatMap((section) =>
    section.items.flatMap((item) => [item, ...(item.children ?? [])]),
  ).find((item) => isActive(item.href, true));

  /**
   * One row of the sidebar, at either level.
   *
   * The shape that matters: a dark pill when active rather than a tinted one,
   * 16px icons, and the label carrying the weight. The neutral is `gray`, not
   * `slate` — they are visibly different greys and mixing them reads as a
   * mistake rather than a palette.
   */
  const NavRow = ({
    item,
    parent,
    isChild = false,
  }: {
    item: NavItem;
    parent?: NavItem;
    isChild?: boolean;
  }) => {
    const Icon = item.icon;
    const label = t(item.labelKey);
    const shared =
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all";

    if (item.soon) {
      return (
        <span
          title={t("admin.nav.soon")}
          aria-disabled="true"
          className={clsx(shared, "cursor-not-allowed font-medium text-gray-300")}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          {!collapsed && <span className="truncate">{label}</span>}
        </span>
      );
    }

    // A parent with children never lights up itself — the highlighted child
    // below it is what says where you are, and two lit rows read as being in
    // two places at once. Children match exactly, or the Header child
    // (`/admin/menu`) would light up by prefix while you are on its Footer.
    const active =
      !isChild && item.children ? false : isActive(item.href, isChild);

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        aria-current={active ? "page" : undefined}
        title={collapsed ? label : undefined}
        className={clsx(
          shared,
          item.highlight
            ? [
                "font-semibold",
                active
                  ? "bg-[#635bff] text-white shadow-sm"
                  : "bg-[#635bff]/10 text-[#635bff] hover:bg-[#635bff] hover:text-white",
              ]
            : [
                "font-medium",
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
              ],
          isChild && !collapsed && "py-1.5 text-[13px]",
        )}
      >
        <Icon
          className={clsx(
            "h-4 w-4 shrink-0",
            item.highlight
              ? active
                ? "text-white"
                : "text-[#635bff] group-hover:text-white"
              : active
                ? "text-white"
                : "text-gray-400 group-hover:text-gray-600",
          )}
          aria-hidden
        />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  /** Collapsed, a section label has no room — it becomes a hairline instead. */
  const SectionLabel = ({ labelKey }: { labelKey: string }) =>
    collapsed ? (
      <div className="my-1 border-t border-gray-100" />
    ) : (
      <p className="mt-4 mb-1 select-none px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
        {t(labelKey)}
      </p>
    );

  const NavContent = (
    <nav
      aria-label={t("admin.nav.label")}
      className="flex flex-1 flex-col gap-0.5 overflow-y-auto"
    >
      {SECTIONS.map((section) => (
        <React.Fragment key={section.labelKey ?? "root"}>
          {section.labelKey && <SectionLabel labelKey={section.labelKey} />}

          {section.items.map((item) => (
            <React.Fragment key={item.href}>
              <NavRow item={item} />

              {item.children && (
                // Collapsed, the rail cannot indent, so the children sit as
                // their own icons and stay reachable — hiding them would make
                // the Footer menu unreachable from a collapsed sidebar.
                <div
                  className={clsx(
                    "flex flex-col gap-0.5",
                    !collapsed && "ml-[1.35rem] border-l border-gray-100 pl-2",
                  )}
                >
                  {item.children.map((child) => (
                    <NavRow key={child.href} item={child} parent={item} isChild />
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </nav>
  );

  const SignOut = (
    <button
      type="button"
      onClick={signOut}
      title={collapsed ? t("admin.nav.logout") : undefined}
      className={clsx(
        "mt-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50",
        collapsed && "justify-center",
      )}
    >
      <ArrowRightOnRectangleIcon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed && <span>{t("admin.nav.logout")}</span>}
    </button>
  );

  return (
    <>
      {/* Mobile: a bar naming where you are, and a drawer over the page. */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          className="mb-4 flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm"
        >
          <Bars3Icon className="h-5 w-5" aria-hidden />
          <span>{t("admin.nav.label")}</span>
          <span className="ml-auto truncate text-xs text-gray-400">
            {activeLabel ? t(activeLabel.labelKey) : t("admin.title")}
          </span>
        </button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto bg-white p-5 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  {t("admin.title")}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("common.close")}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {NavContent}

              <div className="mt-4 border-t border-gray-100 pt-3">
                <AdminLanguages collapsed={false} />
              </div>
              {SignOut}
            </div>
          </>
        )}
      </div>

      {/* Desktop rail. */}
      <div
        className={clsx(
          "hidden flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 md:flex",
          collapsed ? "w-16 p-2" : "w-full p-4",
        )}
      >
        <div
          className={clsx(
            "mb-4 flex items-center",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {t("admin.title")}
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={t("admin.nav.collapse")}
            title={t("admin.nav.collapse")}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            {collapsed ? (
              <Bars3Icon className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        {NavContent}

        <div className="mt-4 border-t border-gray-100 pt-3">
          <AdminLanguages collapsed={collapsed} />
        </div>
        {SignOut}
      </div>
    </>
  );
}

/**
 * The admin's own language, in the menu.
 *
 * The admin is a four-language interface as much as the site is — the client's
 * team is Hungarian, and the labels arrive in whatever locale the last public
 * page was read in. Without this the only way to change it was to edit the URL.
 *
 * It switches the **interface**, not the content: a page's Hungarian and
 * Romanian text are both edited on the same screen, in the translated fields.
 *
 * Each flag is a real `<Link>` to the same admin path in another locale, the
 * same as the public bar. Collapsed to the icon rail there is no room for a
 * row of four, so they wrap into two.
 */
function AdminLanguages({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation("common");
  const { locale, asPath } = useRouter();

  return (
    <div className={clsx("pb-1", collapsed ? "px-1.5" : "px-3")}>
      {!collapsed && (
        <p className="pb-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
          {t("admin.nav.language")}
        </p>
      )}

      <ul className={clsx("flex flex-wrap items-center", collapsed ? "gap-1" : "gap-1.5")}>
        {LOCALES.map((code) => {
          const Flag = FLAGS[code];
          const current = code === locale;

          return (
            <li key={code}>
              <Link
                href={asPath}
                locale={code}
                lang={code}
                hrefLang={code}
                aria-current={current ? "true" : undefined}
                title={LOCALE_META[code].name}
                className={clsx(
                  // The target is the link; the flag inside it stays small.
                  // Four postage stamps with no room around them are unusable.
                  "flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100",
                  collapsed ? "h-8 w-8" : "min-h-9 w-9",
                )}
              >
                <span className="sr-only">{LOCALE_META[code].name}</span>
                <Flag
                  className={clsx(
                    "h-4 w-6 rounded-[3px] shadow-sm ring-1 ring-gray-900/15 transition-opacity",
                    // The one in use is the bright one; the rest step back
                    // rather than disappear.
                    current ? "opacity-100" : "opacity-50 hover:opacity-100",
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
