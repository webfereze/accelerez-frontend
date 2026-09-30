import { serverSideTranslations } from "next-i18next/pages/serverSideTranslations";
import nextI18NextConfig from "../../next-i18next.config";

/**
 * Loads translations for a page's `getStaticProps` / `getServerSideProps`.
 *
 * **Always call this instead of `serverSideTranslations` directly.** Without an
 * explicit config, next-i18next goes looking for `next-i18next.config.js` on
 * disk — and that file is not in a serverless bundle, so every page rendered at
 * request time dies with:
 *
 *   next-i18next was unable to find a user config at /var/task/next-i18next.config.js
 *
 * It never shows up locally: the file is right there in the project directory,
 * so dev and `next start` both work. It also never shows up on pages
 * prerendered at build time — only on the `fallback: "blocking"` ones, which
 * render inside the function. Passing the imported config removes the disk
 * lookup entirely, and bundles the config as a normal import.
 */
export function translations(locale?: string, namespaces: string[] = ["common"]) {
  return serverSideTranslations(locale ?? "ro", namespaces, nextI18NextConfig);
}
