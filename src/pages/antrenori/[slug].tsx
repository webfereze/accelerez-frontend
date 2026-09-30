import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import PublicLayout from "@/components/public/PublicLayout";
import Seo from "@/components/public/Seo";
import Breadcrumb from "@/components/public/Breadcrumb";
import EnrollPanel from "@/components/public/EnrollPanel";
import BlockRenderer from "@/components/public/BlockRenderer";
import Reveal from "@/components/public/Reveal";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import { formatKey, money, specializationKey } from "@/utils/labels";
import {
  fetchChrome,
  fetchOccupancy,
  fetchTestimonials,
  fetchTrainer,
  fetchTrainerSlugs,
  type SiteChrome,
} from "@/utils/site";
import {
  LOCALES,
  type Locale,
  type Occupancy,
  type Testimonial,
  type Trainer,
} from "@/types/content";

type Props = {
  trainer: Trainer;
  occupancy: Occupancy | null;
  testimonials: Testimonial[];
  chrome: SiteChrome;
};

/**
 * One trainer's profile — the page the whole directory exists to deliver
 * somebody to.
 *
 * **The sign-up panel is sticky on a desktop and first on a phone.** Everything
 * else here is the argument; that panel is the decision, and a visitor who has
 * scrolled through two screens of bio should not have to scroll back up to act
 * on it.
 *
 * **It says how many places are left, counted live.** A profile that advertises
 * availability and then refuses the request is the single worst thing this page
 * can do, so the number comes from the enrolment table on every render rather
 * than from a field somebody remembered to update.
 */
export default function TrainerProfile({ trainer, occupancy, testimonials, chrome }: Props) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = router.locale ?? "ro";

  const siteName = chrome.site.name?.trim() || t("site.name");
  const headline = tr(trainer.headline, locale);

  // One address per language the profile is actually live in — the same rule
  // the router and the sitemap follow.
  const alternates = Object.fromEntries(
    LOCALES.flatMap((lang) => {
      const slug = trainer.slug?.[lang];
      const live = (trainer.publishedLocales ?? ["ro"]).includes(lang);
      return slug && live ? [[lang, `/antrenori/${slug}`]] : [];
    }),
  ) as Partial<Record<Locale, string>>;

  return (
    <>
      <Seo
        title={`${trainer.displayName} — ${t("trainers.titleSingular")} | ${siteName}`}
        description={tr(trainer.seoDescription, locale) || tr(trainer.excerpt, locale) || headline}
        image={trainer.photo}
        imageAlt={trainer.displayName}
        noindex={trainer.noindex}
        type="profile"
        locales={trainer.publishedLocales ?? undefined}
        alternates={alternates}
      />

      <PublicLayout chrome={chrome} alternates={alternates}>
        <div className="site-container pt-8 md:pt-12">
          <Breadcrumb
            items={[
              { label: t("trainers.title"), href: "/antrenori" },
              { label: trainer.displayName },
            ]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
            <div>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                {trainer.photo && (
                  /**
                   * **Portrait, and anchored to the top.** Trainers send
                   * full-body photographs taken in a gym; a square crop of one
                   * lands on the chest and cuts the head off, which is the one
                   * part of the picture a visitor is looking for. 3:4 keeps the
                   * whole upper body and `object-top` keeps the face in frame
                   * whatever the photograph's own proportions are.
                   */
                  <div className="relative aspect-3/4 w-full shrink-0 overflow-hidden rounded-card bg-ink-900 ring-1 ring-white/10 sm:w-52 lg:w-60">
                    <Image
                      src={trainer.photo}
                      alt={trainer.displayName}
                      fill
                      sizes="(min-width: 1024px) 240px, (min-width: 640px) 208px, 100vw"
                      priority
                      className="object-cover object-top"
                    />
                  </div>
                )}

                <div className="min-w-0">
                  <h1 className="font-head text-4xl tracking-tight text-white md:text-5xl">
                    {trainer.displayName}
                  </h1>
                  {headline && (
                    <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-300">
                      {headline}
                    </p>
                  )}

                  <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-400">
                    {trainer.city && (
                      <li className="flex items-center gap-1.5">
                        <MapPinIcon className="h-4 w-4" aria-hidden />
                        {trainer.city}
                        {trainer.county && trainer.county !== trainer.city
                          ? `, ${trainer.county}`
                          : ""}
                      </li>
                    )}
                    {trainer.yearsExperience != null && (
                      <li className="flex items-center gap-1.5">
                        <AcademicCapIcon className="h-4 w-4" aria-hidden />
                        {t("trainer.years", { count: trainer.yearsExperience })}
                      </li>
                    )}
                    {(trainer.formats ?? []).map((format) => (
                      <li key={format}>{t(formatKey(format))}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {(trainer.specializations ?? []).length > 0 && (
                <ul className="mt-8 flex flex-wrap gap-2">
                  {(trainer.specializations ?? []).map((spec) => (
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

            {/* The decision. First in the source on a phone by grid order —
                see the class note. */}
            <aside className="order-first lg:order-none lg:sticky lg:top-32 lg:self-start">
              <div className="rounded-panel border border-white/10 bg-ink-900 p-6">
                {trainer.monthlyPrice != null ? (
                  <p className="font-head text-4xl text-white">
                    {money(trainer.monthlyPrice, trainer.currency, locale)}
                    <span className="ml-2 align-middle text-sm font-normal text-ink-400">
                      {t("trainer.perMonth")}
                    </span>
                  </p>
                ) : (
                  <p className="font-head text-2xl text-white">{t("trainer.priceOnRequest")}</p>
                )}

                {occupancy && occupancy.free != null && (
                  <p className="mt-3 text-sm text-ink-400">
                    {occupancy.free > 0
                      ? t("trainer.placesLeft", { count: occupancy.free })
                      : t("trainer.noPlaces")}
                  </p>
                )}

                {/* Knows whether this visitor is already enrolled — see
                    `EnrollPanel`. The API refuses a second enrolment anyway;
                    this is so nobody is invited to try. */}
                <EnrollPanel trainer={trainer} freePlaces={occupancy?.free ?? null} />

                {(trainer.certifications ?? []).length > 0 && (
                  <div className="mt-7 border-t border-white/10 pt-6">
                    <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-400">
                      {t("trainer.certifications")}
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {(trainer.certifications ?? []).map((cert) => (
                        <li key={cert.name} className="flex gap-2.5 text-sm text-ink-200">
                          <CheckBadgeIcon
                            className="mt-0.5 h-4 w-4 shrink-0 text-acid-500"
                            aria-hidden
                          />
                          <span>
                            {cert.name}
                            {(cert.issuer || cert.year) && (
                              <span className="block text-xs text-ink-500">
                                {[cert.issuer, cert.year].filter(Boolean).join(" · ")}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {(trainer.content ?? []).length > 0 && (
          <div className="mt-6">
            <BlockRenderer blocks={trainer.content ?? []} locale={locale} />
          </div>
        )}

        {testimonials.length > 0 && (
          <section className="site-container border-t border-white/10 py-14 md:py-20">
            <h2 className="font-head text-2xl tracking-tight text-white md:text-3xl">
              {t("trainer.said", { name: trainer.displayName })}
            </h2>

            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {testimonials.map((row, index) => (
                <Reveal
                  as="li"
                  key={row.id}
                  delay={index * 70}
                  className="rounded-card border border-white/10 bg-ink-900 p-6"
                >
                  <blockquote className="text-[0.95rem] leading-relaxed text-ink-200">
                    „{tr(row.quote, locale)}”
                  </blockquote>
                  <footer className="mt-5 border-t border-white/10 pt-4">
                    <p className="font-head text-sm text-white">{row.author}</p>
                    {row.role && <p className="mt-0.5 text-xs text-ink-400">{row.role}</p>}
                  </footer>
                </Reveal>
              ))}
            </ul>
          </section>
        )}
      </PublicLayout>
    </>
  );
}

/**
 * One path per language a profile is actually written in.
 *
 * Not one path per locale: a profile live only in Romanian must **404** in
 * English rather than serve the Romanian copy under an English address.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const rows = (await fetchTrainerSlugs()) ?? [];

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

  const [trainer, chrome] = await Promise.all([fetchTrainer(slug, lang), fetchChrome()]);

  if (!trainer) return { notFound: true, revalidate: 60 };

  const [occupancy, testimonials] = await Promise.all([
    fetchOccupancy(trainer.id),
    fetchTestimonials(),
  ]);

  return {
    props: {
      trainer,
      occupancy,
      testimonials: (testimonials ?? []).filter((row) => row.trainerId === trainer.id),
      chrome,
      ...(await translations(locale, ["common"])),
    },
    // Short: this page advertises availability, and a stale "3 locuri libere"
    // sends somebody to a sign-up that will be declined.
    revalidate: 120,
  };
};
