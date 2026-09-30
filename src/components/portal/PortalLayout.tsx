import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch } from "@/store/store";
import { logout as logoutAction } from "@/store/authSlice";
import { resetPortalSession } from "@/hooks/usePortalAuth";
import type { AuthUser } from "@/store/authSlice";

export type PortalNavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  /** A count worth interrupting for — unanswered videos, unpaid months. */
  badge?: number;
};

/**
 * The shell both halves of the portal wear.
 *
 * **It looks like the site, not like the admin.** That is the opposite of the
 * house rule for `/admin`, and deliberately: the admin is a tool the platform's
 * own staff use for hours, while this is where a client reads their diet and a
 * coach answers a video. To them it is the product, so it keeps the product's
 * black ground, its neon and its display face. A light grey CRM here would feel
 * like being handed off to a different company.
 *
 * One layout for trainers and clients, with a different `items` list, because
 * the two screens are the same object — a rail, a header with the account on
 * it, a column of content — and two layouts would drift apart within a month.
 */
export default function PortalLayout({
  user,
  items,
  title,
  lead,
  actions,
  children,
}: {
  user: AuthUser | null;
  items: PortalNavItem[];
  title: string;
  lead?: string;
  /** Buttons that belong to the screen, level with its heading. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    dispatch(logoutAction());
    resetPortalSession("anonymous");
    void router.replace("/autentificare");
  };

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  return (
    <div className="flex min-h-screen flex-col bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/90 backdrop-blur">
        <div className="site-container flex h-16 items-center gap-4">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-accelerez.png" alt={t("site.name")} className="h-7 w-auto" />
          </Link>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={t("nav.menu")}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-ink-200 hover:bg-white/5 lg:hidden"
          >
            {open ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>

          <div className="ml-auto hidden items-center gap-4 lg:flex">
            <p className="text-sm text-ink-400">{name}</p>
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/12 px-4 text-sm text-ink-200 transition-colors hover:border-white/30 hover:text-white"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4" aria-hidden />
              {t("portal.signOut")}
            </button>
          </div>
        </div>
      </header>

      <div className="site-container flex flex-1 flex-col gap-8 py-8 lg:flex-row lg:gap-12 lg:py-12">
        <nav
          className={clsx(
            "lg:w-56 lg:shrink-0",
            open ? "block" : "hidden lg:block",
          )}
        >
          <ul className="flex flex-col gap-1 lg:sticky lg:top-24">
            {items.map(({ href, label, Icon, badge }) => {
              const current =
                router.pathname === href ||
                (href !== "/cont" && href !== "/antrenor" && router.pathname.startsWith(href));

              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? "page" : undefined}
                    className={clsx(
                      "flex min-h-11 items-center gap-3 rounded-card px-3.5 text-sm transition-colors",
                      current
                        ? "bg-acid-500/12 text-acid-400 ring-1 ring-inset ring-acid-500/25"
                        : "text-ink-300 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1">{label}</span>
                    {/* Pink, not neon: a badge here always means somebody is
                        waiting on you, and the neon is the colour of things
                        being fine. */}
                    {badge ? (
                      <span className="rounded-full bg-flare-500 px-2 py-0.5 text-[0.7rem] font-semibold text-white">
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}

            <li className="mt-2 lg:hidden">
              <button
                type="button"
                onClick={signOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-card px-3.5 text-sm text-ink-300 hover:bg-white/5 hover:text-white"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" aria-hidden />
                {t("portal.signOut")}
              </button>
            </li>
          </ul>
        </nav>

        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-head text-3xl tracking-tight text-white md:text-4xl">
                {title}
              </h1>
              {lead && <p className="mt-2 max-w-2xl text-sm text-ink-400">{lead}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>

          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** The full-screen state while the session is being verified. */
export function PortalChecking() {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <p className="text-sm text-ink-400">{t("portal.checking")}</p>
    </div>
  );
}
