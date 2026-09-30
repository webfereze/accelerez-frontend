/**
 * Money, formatted from minor units.
 *
 * **Amounts are integers of bani, not floats of lei**, everywhere: in the
 * database, over the wire and in the editor's state. A price kept as a float is
 * a price that eventually renders as 1234.9999999, and an offer is the one
 * thing in this project somebody signs.
 *
 * The conversion to a decimal happens here and only here, at the moment of
 * display, which is the only place it is safe.
 */
export function formatMoney(
  minor: number,
  currency: string,
  locale = "ro",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    // Two everywhere the currencies here are concerned, and stated rather than
    // inferred: `Intl` decides this from the currency, and a total that shows
    // decimals while its line items do not is a total nobody trusts.
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** What an editor typed, as minor units. Returns null for anything unparseable. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d*\.?\d*$/.test(cleaned) || cleaned === "" || cleaned === "-") return null;
  // Rounded rather than truncated: 12.345 typed into a price field means 12.35,
  // and `Math.round` on the minor units is what stops 0.1 + 0.2 arithmetic from
  // losing a ban.
  return Math.round(Number(cleaned) * 100);
}

/** A net amount, what VAT it attracts, and the two added up. */
export type MoneyTotal = { net: number; vat: number; gross: number };

const withVat = (net: number, vatRate: number | null): MoneyTotal => {
  const vat = vatRate ? Math.round((net * vatRate) / 100) : 0;
  return { net, vat, gross: net + vat };
};

/**
 * What an offer comes to.
 *
 * **One-off and monthly are never added together** (ch. 07: "tarif
 * unic/lunar"). A single number that silently mixes a website build with a
 * monthly retainer is the most expensive ambiguity an offer can contain: it is
 * either three times too big or twelve times too small, and both are found out
 * after somebody has signed. So they come back as two totals, and the page
 * prints them as two lines.
 *
 * Optional lines are **excluded from both**: they are priced so the client can
 * see what an extra would cost, and including them in the number at the bottom
 * would make the offer look more expensive than what is being proposed.
 *
 * The advertising budget is not here at all — it is not Creative's fee and is
 * stated separately on the offer itself.
 */
export function offerTotals(
  items: Array<{
    quantity: number;
    unitPrice: number;
    recurrence?: "once" | "monthly";
    optional?: boolean;
  }>,
  vatRate: number | null,
): {
  once: MoneyTotal;
  monthly: MoneyTotal;
  optional: number;
  /** Convenience for the one-off figure — the list screen shows one number. */
  net: number;
  vat: number;
  gross: number;
} {
  let once = 0;
  let monthly = 0;
  let optional = 0;

  for (const item of items) {
    const line = item.quantity * item.unitPrice;
    if (item.optional) optional += line;
    else if (item.recurrence === "monthly") monthly += line;
    else once += line;
  }

  const onceTotal = withVat(once, vatRate);
  return {
    once: onceTotal,
    monthly: withVat(monthly, vatRate),
    optional,
    ...onceTotal,
  };
}
