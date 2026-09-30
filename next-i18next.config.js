/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    /**
     * Romanian is the default and the source language — the association writes
     * in it. Hungarian matters because Borsec is in Harghita; English is for
     * visitors from further away. Both fall back to Romanian rather than
     * rendering blank.
     */
    locales: ["ro", "hu", "en"],
    defaultLocale: "ro",
    localeDetection: false,
  },
  fallbackLng: "ro",
  /** Flat dot-notation keys: "nav.attractions" is one literal key. */
  keySeparator: false,
  reloadOnPrerender: process.env.NODE_ENV === "development",
};
