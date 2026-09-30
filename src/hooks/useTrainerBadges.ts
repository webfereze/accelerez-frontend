import { useEffect, useState } from "react";
import { api } from "@/utils/api";

export type TrainerBadges = {
  unreadMessages: number;
  pendingVideos: number;
  pending: number;
  unpaidThisMonth: number;
};

/**
 * The counts the trainer's rail shows, fetched once per page load.
 *
 * Its own hook rather than a prop threaded through four screens: every trainer
 * screen shows the same rail, and a badge that appears on one screen and not
 * the next is a badge nobody trusts. Cached at module scope for the same reason
 * the session is — the layout remounts on every client-side navigation.
 *
 * Not live. A coach who has just answered something sees the number drop on the
 * next full load, and polling four numbers every few seconds to save them that
 * is a request per screen for a count nobody is waiting on.
 */
let cached: TrainerBadges | null = null;

/** Called after an action that changes one of the counts. */
export function resetTrainerBadges() {
  cached = null;
}

export function useTrainerBadges(enabled = true): TrainerBadges | null {
  const [badges, setBadges] = useState<TrainerBadges | null>(cached);

  useEffect(() => {
    if (!enabled || cached) return;

    let cancelled = false;
    void api
      .get<TrainerBadges>("/portal/trainer/overview")
      .then(({ data }) => {
        cached = {
          unreadMessages: data.unreadMessages ?? 0,
          pendingVideos: data.pendingVideos ?? 0,
          pending: data.pending ?? 0,
          unpaidThisMonth: data.unpaidThisMonth ?? 0,
        };
        if (!cancelled) setBadges(cached);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return badges;
}
