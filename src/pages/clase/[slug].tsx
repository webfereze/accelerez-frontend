import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowRightIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import Breadcrumb from "@/components/public/Breadcrumb";
import JoinClassPanel from "@/components/public/JoinClassPanel";
import BlockRenderer from "@/components/public/BlockRenderer";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { slugIn } from "@/utils/href";
import { money, specializationKey } from "@/utils/labels";
import { formatDay } from "@/utils/dates";
import {
  fetchChrome,
  fetchClass,
  fetchClassSlugs,
  type SiteChrome,
} from "@/utils/site";
import { LOCALES, type Locale, type TrainingClass } from "@/types/content";

type Props = { item: TrainingClass; chrome: SiteChrome };

/**
 * One class.
 *
 * **The coaches who run it are the point of the page**, not a footnote: a class
 * is a thing you turn up to, and who is standing in front of the room is what
 * decides whether somebody comes back. They link to their own profiles, where
 * the one-to-one offer lives.
 *
 * There is no "book" button and that is deliberate. Nothing in this product
 * takes a booking yet — the calendar module holds sessions but has no public
 * side — so the page ends with the honest next step: write to the platform.
 * A button that opens a form pretending to reserve a place is worse than none.
 */
export default function ClassDetail({ item, chrome }: Props) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const lang = locale ?? "ro";

  const siteName = chrome.site.name?.trim() || t("site.name");
  const title = tr(item.title, lang);

  const alternates = Object.fromEntries(
    LOCALES.flatMap((code) => {
      const slug = item.slug?.[code];
      const live = (item.publishedLocales ?? ["ro"]).includes(code);
      return slug && live ? [[code, `/clase/${slug}`]] : [];
    }),
  ) as Partial<Record<Locale, string>>;

  return (
    <>
      <Seo
        title={`${tr(item.seoTitle, lang) || title} — ${siteName}`}
        description={tr(item.seoDescription, lang) || tr(item.excerpt, lang)}
        image={item.image}
        imageAlt={item.imageAlt}
        noindex={item.noindex}
        locales={item.publishedLocales ?? undefined}
        alternates={alternates}
      />

      <PublicLayout chrome={chrome} alternates={alternates}>
        <div className="site-container pt-8 md:pt-12">
          <Breadcrumb
            items={[{ label: t("classes.title"), href: "/clase" }, { label: title }]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <div>
              {item.image && (
                <div className="relative aspect-4/3 overflow-hidden rounded-panel bg-ink-900">
                  <Image
                    src={item.image}
                    alt={item.imageAlt ?? ""}
                    fill
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    priority
                    className="object-cover"
                  />
                </div>
              )}

              <h1 className="mt-8 font-head text-4xl uppercase tracking-tight text-white md:text-5xl">
                {title}
              </h1>

              {tr(item.excerpt, lang) && (
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-300 md:text-lg">
                  {tr(item.excerpt, lang)}
                </p>
              )}

              {(item.specializations ?? []).length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {(item.specializations ?? []).map((spec) => (
                    <li
                      key={spec}
                      className="rounded-full border border-acid-500/25 bg-acid-500/10 px-3 py-1.5 text-xs font-medium text-acid-400"
                    >
                      {t(specializationKey(spec))}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <div className="rounded-panel border border-white/10 bg-ink-900 p-6">
                {item.pricePerSession != null && (
                  <p className="font-head text-4xl text-white">
                    {money(item.pricePerSession, item.currency, lang)}
                    <span className="ml-2 align-middle text-sm font-normal text-ink-400">
                      {t("classes.perSession")}
                    </span>
                  </p>
                )}

                {item.pricePerMonth != null && (
                  <p className="mt-1.5 text-sm text-ink-300">
                    {money(item.pricePerMonth, item.currency, lang)}
                    <span className="ml-1 text-ink-500">{t("classes.perMonth")}</span>
                  </p>
                )}

                {item.pricePerSession == null && item.pricePerMonth == null && (
                  <p className="font-head text-2xl text-white">
                    {t("classes.priceOnRequest")}
                  </p>
                )}

                <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                  {tr(item.scheduleText, lang) && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-ink-500">
                        {t("classes.schedule")}
                      </dt>
                      <dd className="mt-1 text-ink-100">{tr(item.scheduleText, lang)}</dd>
                    </div>
                  )}

                  {item.startsOn && (
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-ink-500">
                        {t("classes.startsOn")}
                      </dt>
                      <dd className="mt-1 text-ink-100">{formatDay(item.startsOn, lang)}</dd>
                    </div>
                  )}

                  {item.durationMinutes && (
                    <div className="flex items-center gap-2 text-ink-200">
                      <ClockIcon className="h-4 w-4 text-ink-500" aria-hidden />
                      <dt className="sr-only">{t("classes.duration")}</dt>
                      <dd>{t("classes.minutes", { count: item.durationMinutes })}</dd>
                    </div>
                  )}

                  {item.location === "online" && (
                    <div className="flex items-center gap-2 text-ink-200">
                      <VideoCameraIcon className="h-4 w-4 text-ink-500" aria-hidden />
                      <dt className="sr-only">{t("classes.where")}</dt>
                      <dd>{t("classes.onlineClass")}</dd>
                    </div>
                  )}

                  {item.location !== "online" && (item.place || item.city) && (
                    <div className="flex items-center gap-2 text-ink-200">
                      <MapPinIcon className="h-4 w-4 text-ink-500" aria-hidden />
                      <dt className="sr-only">{t("classes.where")}</dt>
                      <dd>{[item.place, item.city].filter(Boolean).join(", ")}</dd>
                    </div>
                  )}

                  {item.capacity && (
                    <div className="flex items-center gap-2 text-ink-200">
                      <UserGroupIcon className="h-4 w-4 text-ink-500" aria-hidden />
                      <dt className="sr-only">{t("classes.capacity")}</dt>
                      <dd>
                        {item.freePlaces != null
                          ? t("classes.freeOf", {
                              free: item.freePlaces,
                              total: item.capacity,
                            })
                          : t("classes.places", { count: item.capacity })}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Knows whether this visitor has already joined, and how many
                    places are left — both counted live. See `JoinClassPanel`. */}
                <JoinClassPanel item={item} />
              </div>
            </aside>
          </div>
        </div>

        {(item.content ?? []).length > 0 && (
          <div className="mt-6">
            <BlockRenderer blocks={item.content ?? []} locale={lang} />
          </div>
        )}

        {(item.trainers ?? []).length > 0 && (
          <section className="site-container border-t border-white/10 py-14 md:py-20">
            <h2 className="font-head text-2xl tracking-tight text-white md:text-3xl">
              {t("classes.whoRuns")}
            </h2>

            <ul className="mt-8 flex flex-wrap gap-5">
              {(item.trainers ?? []).map((trainer) => (
                <li key={trainer.id}>
                  <Link
                    href={`/antrenori/${slugIn(trainer.slug, lang)}`}
                    className="group flex items-center gap-4 rounded-card border border-white/10 bg-ink-900 p-4 pr-6 transition-colors hover:border-acid-500/50"
                  >
                    {trainer.photo ? (
                      <Image
                        src={trainer.photo}
                        alt={trainer.displayName}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full object-cover object-top"
                      />
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink-800 font-head text-lg text-white/40">
                        {trainer.displayName.slice(0, 1)}
                      </span>
                    )}

                    <span>
                      <span className="block font-head text-base text-white">
                        {trainer.displayName}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-400 transition-colors group-hover:text-acid-400">
                        {t("classes.seeTrainer")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PublicLayout>
    </>
  );
}

/** One path per language the class is actually written in — never a fallback. */
export const getStaticPaths: GetStaticPaths = async () => {
  const rows = (await fetchClassSlugs()) ?? [];

  return {
    paths: rows.flatMap((row) =>
      (row.locales ?? ["ro"]).flatMap((locale) => {
        const slug = row.slug?.[locale];
        return slug ? [{ params: { slug }, locale }] : [];
      }),
    ),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params, locale }) => {
  const slug = String(params?.slug ?? "");
  const lang = locale ?? "ro";

  const [item, chrome] = await Promise.all([fetchClass(slug, lang), fetchChrome()]);

  if (!item) return { notFound: true, revalidate: 60 };

  return {
    props: { item, chrome, ...(await translations(locale, ["common"])) },
    revalidate: 300,
  };
};
