import { useMemo, useState } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import Reveal from "@/components/public/Reveal";
import PageHeading from "@/components/public/PageHeading";
import PublicEmpty from "@/components/public/PublicEmpty";
import ClassCard from "@/components/public/ClassCard";
import { translations } from "@/utils/i18n";
import { specializationKey } from "@/utils/labels";
import { fetchChrome, fetchClasses, type SiteChrome } from "@/utils/site";
import { SPECIALIZATIONS, type TrainingClass } from "@/types/content";

type Props = {
  classes: TrainingClass[];
  chrome: SiteChrome;
};

/**
 * Every class the platform runs.
 *
 * Filtered in the browser over the whole published set, like the trainer
 * directory: this is tens of rows, not thousands, and fetching once at build
 * time gives instant filtering with no request per click. When it outgrows one
 * page the API already accepts every one of these parameters.
 */
export default function ClassesIndex({ classes, chrome }: Props) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const [goal, setGoal] = useState("");

  const filtered = useMemo(
    () =>
      goal
        ? classes.filter((item) => item.specializations?.includes(goal as never))
        : classes,
    [classes, goal],
  );

  const siteName = chrome.site.name?.trim() || t("site.name");

  return (
    <>
      <Seo
        title={`${t("classes.title")} — ${siteName}`}
        description={t("classes.description")}
      />

      <PublicLayout chrome={chrome}>
        <PageHeading
          eyebrow={t("classes.eyebrow")}
          title={t("classes.title")}
          lead={t("classes.lead")}
        />

        <div className="site-container pb-24">
          {/* Only the goals that some class actually has: a filter that can
              return nothing is a filter nobody trusts a second time. */}
          <ul className="flex flex-wrap gap-2">
            <li>
              <Chip active={goal === ""} onClick={() => setGoal("")}>
                {t("classes.allGoals")}
              </Chip>
            </li>
            {SPECIALIZATIONS.filter((value) =>
              classes.some((item) => item.specializations?.includes(value)),
            ).map((value) => (
              <li key={value}>
                <Chip
                  active={goal === value}
                  onClick={() => setGoal(goal === value ? "" : value)}
                >
                  {t(specializationKey(value))}
                </Chip>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-ink-400" aria-live="polite">
            {t("classes.count", { count: filtered.length })}
          </p>

          <div className="mt-8">
            {filtered.length > 0 ? (
              <ul className="grid items-start gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map((item, index) => (
                  <Reveal as="li" key={item.id} delay={Math.min(index, 6) * 50}>
                    <ClassCard
                      item={item}
                      offset={index % 2 === 1}
                      priority={index < 4}
                    />
                  </Reveal>
                ))}
              </ul>
            ) : (
              <PublicEmpty
                title={
                  classes.length === 0 ? t("classes.emptyTitle") : t("classes.noMatchTitle")
                }
                hint={classes.length === 0 ? t("classes.emptyText") : t("classes.noMatchText")}
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

  const [list, chrome] = await Promise.all([
    fetchClasses({ locale: lang, perPage: 100 }),
    fetchChrome(),
  ]);

  return {
    props: {
      classes: list?.rows ?? [],
      chrome,
      ...(await translations(locale, ["common"])),
    },
    revalidate: 300,
  };
};
