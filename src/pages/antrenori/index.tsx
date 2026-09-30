import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import Reveal from "@/components/public/Reveal";
import PageHeading from "@/components/public/PageHeading";
import PublicEmpty from "@/components/public/PublicEmpty";
import TrainerCard from "@/components/public/TrainerCard";
import { translations } from "@/utils/i18n";
import { formatKey, specializationKey } from "@/utils/labels";
import { cardRowClass } from "@/utils/grid";
import {
  fetchChrome,
  fetchTrainerCities,
  fetchTrainers,
  type SiteChrome,
} from "@/utils/site";
import {
  SPECIALIZATIONS,
  TRAINING_FORMATS,
  type Trainer,
} from "@/types/content";

type Props = {
  trainers: Trainer[];
  cities: string[];
  chrome: SiteChrome;
};

/**
 * The directory.
 *
 * **Filtered in the browser, over the whole published set.** The API can filter
 * too, and the portal uses that — but here the list is tens of profiles, not
 * thousands, and fetching it once at build time gives instant filtering with no
 * request per keystroke and no loading state between two clicks. When the
 * directory outgrows one page this becomes a server-filtered list; the API
 * already accepts every one of these parameters.
 *
 * **A trainer who has closed their list is still shown, and says so.** Hiding
 * them makes the platform look smaller than it is, and somebody deciding
 * between two coaches deserves to know one of them is full rather than to
 * wonder where they went.
 *
 * The filters come from the data, not from a constant: the cities are the ones
 * that actually have a trainer, so the list can never offer a filter that
 * returns nothing.
 */
export default function TrainersIndex({ trainers, cities, chrome }: Props) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = router.locale ?? "ro";

  // The goal can arrive in the URL — an article's closing link, a home-page
  // chip — so the page opens already filtered rather than dropping the reader
  // into the unfiltered list they just navigated away from.
  const initialGoal = typeof router.query.obiectiv === "string" ? router.query.obiectiv : "";

  const [goal, setGoal] = useState(initialGoal);
  const [format, setFormat] = useState("");
  const [city, setCity] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return trainers.filter((trainer) => {
      if (goal && !trainer.specializations?.includes(goal as never)) return false;
      if (format && !trainer.formats?.includes(format as never)) return false;
      if (city && trainer.city !== city) return false;
      if (!term) return true;

      return [trainer.displayName, trainer.city, trainer.headline?.[locale as never]]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [trainers, goal, format, city, search, locale]);

  const siteName = chrome.site.name?.trim() || t("site.name");

  return (
    <>
      <Seo
        title={`${t("trainers.title")} — ${siteName}`}
        description={t("trainers.description")}
      />

      <PublicLayout chrome={chrome}>
        <PageHeading
          eyebrow={t("trainers.eyebrow")}
          title={t("trainers.title")}
          lead={t("trainers.lead")}
        />

        <div className="site-container">
          {/* The search and the selects are one row on a desktop and a stack on
              a phone. The goal chips are below them, because a goal is what a
              visitor knows before anything else and it deserves to be tapped
              rather than chosen from a menu. */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">{t("trainers.search")}</span>
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-500"
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("trainers.searchPlaceholder")}
                className="h-12 w-full rounded-full border border-white/12 bg-ink-900 pl-12 pr-4 text-sm text-white placeholder:text-ink-500 focus:border-acid-500 focus:outline-none"
              />
            </label>

            <select
              value={format}
              onChange={(event) => setFormat(event.target.value)}
              className="h-12 rounded-full border border-white/12 bg-ink-900 px-5 text-sm text-white focus:border-acid-500 focus:outline-none"
            >
              <option value="">{t("trainers.anyFormat")}</option>
              {TRAINING_FORMATS.map((value) => (
                <option key={value} value={value}>
                  {t(formatKey(value))}
                </option>
              ))}
            </select>

            {cities.length > 0 && (
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="h-12 rounded-full border border-white/12 bg-ink-900 px-5 text-sm text-white focus:border-acid-500 focus:outline-none"
              >
                <option value="">{t("trainers.anyCity")}</option>
                {cities.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            )}
          </div>

          <ul className="mt-5 flex flex-wrap gap-2">
            <li>
              <Chip active={goal === ""} onClick={() => setGoal("")}>
                {t("trainers.anyGoal")}
              </Chip>
            </li>
            {SPECIALIZATIONS.map((value) => (
              <li key={value}>
                <Chip active={goal === value} onClick={() => setGoal(goal === value ? "" : value)}>
                  {t(specializationKey(value))}
                </Chip>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-ink-400" aria-live="polite">
            {t("trainers.count", { count: filtered.length })}
          </p>

          <div className="mt-6 pb-20">
            {filtered.length > 0 ? (
              <ul className={cardRowClass(filtered.length)}>
                {filtered.map((trainer, index) => (
                  <Reveal as="li" key={trainer.id} delay={Math.min(index, 6) * 50}>
                    <TrainerCard trainer={trainer} locale={locale} priority={index < 4} />
                  </Reveal>
                ))}
              </ul>
            ) : (
              <PublicEmpty
                title={
                  trainers.length === 0 ? t("trainers.emptyTitle") : t("trainers.noMatchTitle")
                }
                hint={
                  trainers.length === 0 ? t("trainers.emptyText") : t("trainers.noMatchText")
                }
              />
            )}
          </div>
        </div>
      </PublicLayout>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "min-h-9 rounded-full px-3.5 text-xs font-medium transition-colors",
        active
          ? "bg-acid-500 text-ink-950"
          : "border border-white/12 text-ink-300 hover:border-white/30 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ locale }) => {
  const lang = locale ?? "ro";

  const [directory, cities, chrome] = await Promise.all([
    // The whole published set in this language — see the note on filtering.
    fetchTrainers({ locale: lang, perPage: 100 }),
    fetchTrainerCities(),
    fetchChrome(),
  ]);

  return {
    props: {
      trainers: directory?.rows ?? [],
      cities: cities ?? [],
      chrome,
      ...(await translations(locale, ["common"])),
    },
    revalidate: 300,
  };
};
