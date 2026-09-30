import { createContext, useContext } from "react";
import type { SiteConfig } from "@/types/content";

/**
 * Fails closed: with no provider — or on a page that never fetched the config —
 * nothing is indexable and there is no canonical origin to get wrong.
 */
const FALLBACK: SiteConfig = {
  baseUrl: "",
  allowIndexing: false,
  // Fails closed here too: an unknown brand cannot be assumed to have a Stripe
  // account, and offering a card button that leads nowhere is worse than
  // offering only a reservation.
  // Fails closed: no ID means `<Analytics>` renders nothing, so a page that
  // never fetched the config cannot load a tag by accident.
};

const SiteConfigContext = createContext<SiteConfig>(FALLBACK);

/**
 * Provided in `_app`, not in `PublicLayout`, on purpose: `<Seo>` renders
 * *outside* the layout on most pages (the `<head>` is emitted before the
 * chrome), so a provider inside the layout would never reach it.
 */
export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfig | undefined;
  children: React.ReactNode;
}) {
  return (
    <SiteConfigContext.Provider value={value ?? FALLBACK}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
