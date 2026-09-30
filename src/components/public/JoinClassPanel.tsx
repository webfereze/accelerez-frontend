import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useViewer } from "@/hooks/useViewer";
import { api } from "@/utils/api";
import type { ClientClass, TrainingClass } from "@/types/content";

/**
 * Joining a class, or seeing that you already have.
 *
 * The same shape as `EnrollPanel` on a trainer's profile, and for the same
 * reason: the API refuses a second membership, so nothing breaks without this —
 * what breaks is the reader's understanding of where they stand.
 *
 * **Joining is a registration, not a payment.** Nothing here takes money: the
 * class is paid at the door or monthly with the coach, exactly as the one-to-one
 * side is. The note under the button says so, because a green button on a page
 * with a price on it reads as a purchase.
 *
 * **And joining is not admission.** Anybody with an account may register; the
 * meeting link and the confirmed place arrive once a coach of this class has
 * accepted them as a client. That is said before the button is pressed, not
 * discovered afterwards.
 */
export default function JoinClassPanel({ item }: { item: TrainingClass }) {
  const { t } = useTranslation("common");
  const router = useRouter();

  const { viewer, ready } = useViewer();
  const [joined, setJoined] = useState<boolean | undefined>(undefined);
  /** Whether a coach of this class has accepted them — what carries the link. */
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (!viewer || viewer.role !== "client") {
      setJoined(false);
      return;
    }

    let cancelled = false;
    void api
      .get<ClientClass[]>("/portal/client/classes")
      .then(({ data }) => {
        if (cancelled) return;
        const mine = data.find((row) => row.trainingClass.id === item.id);
        setJoined(Boolean(mine));
        setAccepted(Boolean(mine?.accepted));
      })
      .catch(() => !cancelled && setJoined(false));

    return () => {
      cancelled = true;
    };
  }, [ready, viewer, item.id]);

  async function join() {
    setBusy(true);
    setError(null);

    try {
      await api.post(`/portal/client/classes/${item.id}/join`, {});
      await router.push("/cont");
    } catch (caught) {
      const message =
        (caught as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message ?? t("classes.joinFailed"));
      setBusy(false);
    }
  }

  const full = item.freePlaces != null && item.freePlaces <= 0;

  if (!ready || joined === undefined) {
    return <p className="mt-6 h-12 animate-pulse rounded-full bg-white/5" aria-hidden />;
  }

  if (joined) {
    return (
      <div className="mt-6">
        <p
          className={
            accepted
              ? "flex items-start gap-2.5 rounded-card border border-acid-500/25 bg-acid-500/10 px-4 py-3 text-sm text-acid-300"
              : "flex items-start gap-2.5 rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-sm text-flare-300"
          }
        >
          <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {accepted ? t("classes.alreadyIn") : t("classes.waitingAccept")}
        </p>

        <Link
          href="/cont"
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
        >
          {t("classes.openAccount")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  if (full) {
    return (
      <p className="mt-6 rounded-card border border-flare-500/25 bg-flare-500/10 px-4 py-3 text-sm text-flare-300">
        {t("classes.fullExplained")}
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
          onClick={join}
          disabled={busy}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400 disabled:opacity-60"
        >
          {busy ? t("classes.joining") : t("classes.join")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <Link
          href="/inregistrare"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-acid-500 px-6 font-head font-semibold text-ink-950 transition-colors hover:bg-acid-400"
        >
          {t("classes.joinSignedOut")}
          <ArrowRightIcon className="h-4 w-4" aria-hidden />
        </Link>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        {item.freePlaces != null
          ? t("classes.joinNotePlaces", { count: item.freePlaces })
          : t("classes.joinNote")}
      </p>

      {/* Said before they press it, not after: joining is open, but the way in
          comes from the coach accepting them. */}
      <p className="mt-2 text-xs leading-relaxed text-ink-500">
        {t("classes.acceptanceNote")}
      </p>
    </div>
  );
}
