import React from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next/pages";
import { useAdminMenu } from "@/contexts/AdminMenuContext";
import AdminMenu from "@/components/admin/menu/AdminMenu";
import { useAdminAuth } from "@/hooks/useAdminAuth";

/**
 * Shell for every `/admin/*` screen: sidebar plus content column, and the auth
 * gate. Nothing renders until the session has been verified against the API —
 * a flash of admin chrome before a redirect looks like a security hole even
 * when it isn't.
 *
 * The admin deliberately keeps the light surface and dense layout of the
 * house style; a site's own art direction stops at `/admin`.
 */
export default function AdminLayout({
  children,
  className = "",
}: {
  children: React.ReactNode;
  /** Extra classes for the content column (e.g. "flex flex-col gap-5"). */
  className?: string;
}) {
  const { t } = useTranslation("common");
  const { collapsed } = useAdminMenu();
  const { ready } = useAdminAuth();

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* The admin is an app, not a page of the site: it sets its own light
          ground rather than inheriting the public site's dark body. Grey, not
          slate — this admin's neutral is `gray`, and mixing the two families
          reads as two different greys sitting next to each other. */}
      <div className="admin-shell min-h-screen bg-gray-50 text-gray-900">
        {ready ? (
          <div className="container mx-auto px-4 py-5 md:px-6">
            <div className="flex flex-col items-start gap-5 md:flex-row">
              <div
                className={`w-full flex-shrink-0 transition-all duration-200 ${
                  collapsed ? "md:w-16" : "md:w-[220px]"
                }`}
              >
                <AdminMenu />
              </div>

              <div className={`w-full min-w-0 flex-1 ${className}`}>{children}</div>
            </div>
          </div>
        ) : (
          /* A skeleton of the same layout, not a line of text: the sidebar and
             content column keep their place, so arriving content settles into
             it instead of shoving the page down. */
          <div
            role="status"
            aria-label={t("admin.checkingSession")}
            className="container mx-auto px-4 py-5 md:px-6"
          >
            <div className="flex flex-col items-start gap-5 md:flex-row">
              <div
                className={`w-full flex-shrink-0 ${collapsed ? "md:w-16" : "md:w-[220px]"}`}
              >
                <div className="h-72 animate-pulse rounded-xl border border-gray-200 bg-white" />
              </div>
              <div className="w-full min-w-0 flex-1 space-y-4">
                <div className="h-9 w-56 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
