import { Html, Head, Main, NextScript } from "next/document";
import { fontVariables } from "@/fonts";

/**
 * The font variables are applied **here and in `_app.tsx`**, and both are
 * load-bearing for different reasons:
 *
 * - **`<html>` is what makes them work.** `theme.css` declares
 *   `--font-head: var(--font-display-face), …` at `:root`, and a custom
 *   property's value is substituted in the scope it is *declared* in. With the
 *   face variable only on a `<div>` inside `<body>`, `--font-head` computes to
 *   nothing at `:root`, the `font-family` declaration is invalid, and every
 *   heading silently inherits the sans face — with every stylesheet looking
 *   perfectly correct.
 * - **`_app.tsx` is what makes them exist.** `next/font` emits a CSS module,
 *   and it is only bundled for the client when imported from the app tree.
 *   Importing it here alone ships a page with no `@font-face` rules at all.
 *
 * Remove either and the site loses its serif without erroring.
 */
export default function Document() {
  return (
    <Html className={fontVariables}>
      <Head>
        {/* Self-hosted through next/font, so no font CDN to preconnect to. */}
        <meta name="theme-color" content="#0a0c0c" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
