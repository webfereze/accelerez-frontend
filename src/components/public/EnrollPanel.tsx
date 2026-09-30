import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowRightIcon, CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { useViewer } from "@/hooks/useViewer";
import { api } from "@/utils/api";
import { slugIn } from "@/utils/href";
import type { ClientEnrollment, Trainer } from "@/types/content";

/**
 * The decision panel on a trainer's profile: sign up, or carry on where you
 * left off.
 *
 * **It has to know whether this visitor is already enrolled.** The API refuses
 * a second enrolment with the same pair — `409`, see `EnrollmentService` — so
 * nothing breaks without this; what breaks is the visitor's understanding. A
 * client who is already training with this coach, looking at a button that
 * says "înscrie-te", either presses it and gets an error they did not earn, or
 * concludes the platform has lost their account.
 *
 * Four states, and each one leads somewhere different:
 *
 * - **Not signed in** — the sign-up button, which registers and enrols in one
 *   step.
 * - **Signed in, not enrolled** — enrol directly, no second account needed.
 * - **Signed in, enrolment live** — no button at all: their own screen for this
 *   trainer, with what is waiting on it.
 * - **Signed in, enrolment over** — the button returns, because coming back to
 *   a coach you stopped with is a normal thing to do.
 *
 * Rendered only once the session is known, so a signed-in client never sees the
 * anonymous version flash first and reach for it.
 */
export default function EnrollPanel({
  trainer,
  freePlaces,
}: {
  trainer: Trainer;
  /** Null when the trainer states no limit. */
  freePlaces: number | null;
}) {
  const { t } = useTranslation("common");
  const router = useRouter();
  const locale = router.locale ?? "ro";

  const { viewer, ready } = useViewer();
  const [enrollment, setEnrollment] = useState<ClientEnrollment | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    // Only a client can be enrolled with anybody; a trainer looking at their
    // own profile is not a case worth a request.
    if (!viewer || viewer.role !== "client") {
      setEnrollment(null);
      return;
    }

    let cancelled = false;
    void api
      .get<ClientEnrollment[]>("/portal/client/overview")
      .then(({ data }) => {
        if (cancelled) return;
        setEnrollment(data.find((row) => row.trainer.id === trainer.id) ?? null);
      })
      .catch(() => !cancelled && setEnrollment(null));

    return () => {
      cancelled = true;
    };
  }, [ready, viewer, trainer.id]);

  const trainerHref = `/cont/${slugIn(trainer.slug, locale)}`;

  /** A signed-in client who is not enrolled yet: one request, no new account. */
  async function enrolNow() {
    setBusy(true);
    setError(null);

    try {
      await api.post("/portal/client/enroll", {
        trainerId: trainer.id,
        goal: t("trainer.defaultGoal", { name: trainer.displayName }),
      });
      await router.push(trainerHref);
    } catch {
      setError(t("trainer.enrollFailed"));
      setBusy(false);
    }
  }

  // Still checking: render the shape without the action, so the panel does not
  // jump once the answer arrives.
  if (!ready || enrollment === undefined) {
    return <p className="mt-6 h-12 animate-pulse rounded-full bg-white/5" aria-hidden />;
  }

  const live =
    enrollment &&
    (enrollment.status === "pending" ||
      enrollment.status === "active" ||
      enrollment.status === "paused");

  if (live && enrollment) {
    const tone =
      enrollment.status === "active"
        ? "border-acid-500/25 bg-acid-500/10 text-acid-300"
        : "border-flare-500/25 bg-flare-500/10 text-flare-300";

    return (
      <div className="mt-6">
        <p className={`flex items-start gap-2.5 rounded-card border px-4 py-3 text-sm ${tone}`}>
          {enrollment.status === "active" ? (
            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : (
            <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          )}
          {t(`trainer.already.${enrollment.status}`)}
        </p>

        <Link
          href={trainerHref}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
        >
          {t("trainer.openMyPlan")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  if (!trainer.isAcceptingClients) {
    return (
      <p className="mt-6 rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-sm text-flare-300">
        {t("trainer.fullExplained")}
      </p>
    );
  }

  return (
    <div className="mt-6">
      {error && (
        <p role="alert" className="mb-3 rounded-card border border-flare-500/30 bg-flare-500/10 px-4 py-2.5 text-sm text-flare-300">
          {error}
        </p>
      )}

      {viewer?.role === "client" ? (
        <button
          type="button"
          onClick={enrolNow}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400 disabled:opacity-60"
        >
          {busy ? t("trainer.enrolling") : t("trainer.enrollNow")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <Link
          href={`/inregistrare?antrenor=${slugIn(trainer.slug, locale)}`}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
        >
          {t("trainer.enroll")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        {freePlaces != null && freePlaces > 0
          ? t("trainer.enrollNotePlaces", { count: freePlaces })
          : t("trainer.enrollNote")}
      </p>
    </div>
  );
}
