import { createContext, useContext } from "react";
import type { SiteSettings } from "@/types/content";

const SiteSettingsContext = createContext<SiteSettings>({});

/**
 * Makes the company's own details — name, phone, e-mail, address, socials —
 * available to anything rendered inside the public layout.
 *
 * They are fetched once per page, server-side, and passed down rather than
 * re-requested: a block that needs the phone number should not cost a round
 * trip, and three blocks needing it should not cost three.
 */
export function SiteSettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return (
    <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
  );
}

/**
 * The site's details. Returns an empty object outside the provider — in the
 * admin's block preview, for instance — so a renderer degrades to showing
 * nothing rather than throwing.
 */
export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
