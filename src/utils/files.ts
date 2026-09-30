/**
 * "2.4 MB" from a byte count.
 *
 * Binary steps (1024), because that is what a file manager shows and a visitor
 * comparing the two should see the same number. One decimal place below a
 * gigabyte and none for kilobytes — "1.4 kB" is precision nobody asked for.
 *
 * Localised, so Romanian gets a comma and English a point.
 */
export function formatBytes(bytes: number, locale: string | undefined): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";

  const units = ["B", "kB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const decimals = unit >= 2 ? 1 : 0;

  return `${value.toLocaleString(locale ?? "ro", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ${units[unit]}`;
}
