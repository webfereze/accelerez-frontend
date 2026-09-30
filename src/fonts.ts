import { Archivo, Manrope } from "next/font/google";

/**
 * Self-hosted through `next/font` — no external request and no layout shift,
 * which a `<link>` to a font CDN gives you both of.
 *
 * **Two grotesks, and the heavy one is chosen to match the mark.** The logo is
 * set in a wide, heavy, italic grotesk; a headline in anything narrower reads
 * as a different brand sitting under it.
 *
 * `Archivo` is the voice: headings, figures, the eyebrows. It is a grotesk
 * drawn for signage — it stays tight and square at 96px where a neutral sans
 * goes limp, and its heavy italic is close enough to the mark that the page and
 * the logo look drawn by the same hand.
 *
 * `Manrope` is everything read rather than announced — body copy, labels, form
 * fields, the whole admin. Quiet on purpose: two characterful faces on one page
 * fight, and the paragraph is not what should win.
 *
 * Both are variable, so each weight range costs one file rather than six.
 *
 * Both go on the root element as CSS variables via `fontVariables`, and
 * `theme.css` names the variables rather than the families — so swapping either
 * is this file alone.
 */
export const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans-face",
  display: "swap",
});

export const display = Archivo({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display-face",
  display: "swap",
  // The italic is load-bearing: it is what the mark is set in, and the hero
  // uses it for the accented word.
  style: ["normal", "italic"],
});

export const fontVariables = `${sans.variable} ${display.variable}`;
