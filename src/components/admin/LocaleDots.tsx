import clsx from "clsx";
import { useTranslation } from "next-i18next/pages";
import { LOCALES } from "@/types/content";

/**
 * Which languages a record is live in, as three small marks.
 *
 * It earns a place in every list row because it is the field most likely to be
 * wrong and least likely to be noticed: a record published only in Romanian is
 * *correctly* absent from the Hungarian site, so nothing looks broken — the
 * page simply is not there. Three letters in a row make that visible at a
 * glance, across a whole list, without opening anything.
 *
 * Letters rather than coloured dots alone: a dot is the same as nothing to a
 * colour-blind reader and in a screenshot somebody pastes into a message.
 */
export default function LocaleDots({
  locales,
  className,
}: {
  locales: string[] | null | undefined;
  className?: string;
}) {
  const { t } = useTranslation("common");
  const live = locales?.length ? locales : ["ro"];

  return (
    <span
      className={clsx("flex shrink-0 items-center gap-1", className)}
      title={live.map((locale) => t(`locale.${locale}`)).join(", ")}
    >
      {LOCALES.map((locale) => (
        <span
          key={locale}
          className={clsx(
            "rounded px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase leading-none",
            live.includes(locale)
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-400",
          )}
        >
          {locale}
        </span>
      ))}
    </span>
  );
}
