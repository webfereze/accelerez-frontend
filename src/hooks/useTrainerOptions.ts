import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import type { Paged } from "@/hooks/usePagedList";
import type { Trainer } from "@/types/content";

/**
 * Every trainer, as `{ id, name }` for a picker in the admin.
 *
 * One request for up to a hundred rows: a directory of coaches is tens of
 * people, and a picker that pages is a picker nobody finds their coach in.
 */
export function useTrainerOptions() {
  const [options, setOptions] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    let live = true;
    api
      .get<Paged<Trainer>>("/admin/trainers", { params: { perPage: 100 } })
      .then(({ data }) => {
        if (live) setOptions(data.rows.map((row) => ({ id: row.id, name: row.displayName })));
      })
      .catch(() => {
        // The picker falls back to "none"; the product still saves.
      });
    return () => {
      live = false;
    };
  }, []);

  return options;
}
