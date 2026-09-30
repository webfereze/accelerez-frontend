import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/utils/api";

/** What every paged admin endpoint returns. */
export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  perPage: number;
};

/**
 * One page of a server-paged admin list, with search and filters.
 *
 * The lists that outgrow in-memory filtering — subscribers, the e-mail log —
 * all need the same four things: a page, a debounced search box, a set of
 * filters, and a reload after something is changed. `usePages` filters dozens
 * of rows in the browser and is right for that; this is for the tables that
 * will be tens of thousands of rows in a year.
 *
 * **The search is debounced and the page resets when it changes.** Typing a
 * letter must not fire a request per keystroke, and landing on page 7 of a
 * search that has three results is the classic paging bug.
 */
export function usePagedList<T, E = Record<string, never>>(
  path: string,
  {
    perPage = 50,
    params = {},
    debounceMs = 300,
  }: {
    perPage?: number;
    /** Filters, as query parameters. Changing them resets to page 1. */
    params?: Record<string, string | number | undefined>;
    debounceMs?: number;
  } = {},
) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<(Paged<T> & E) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow earlier response overwriting a newer one.
  const requestId = useRef(0);

  // Params are rebuilt on every render by the caller; the string is what
  // actually changed, and it is what the effect should depend on.
  const query = useMemo(() => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") search.set(key, String(value));
    }
    return search.toString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), debounceMs);
    return () => clearTimeout(timer);
  }, [search, debounceMs]);

  // A new search or a new filter is a new list; staying on page 7 of it would
  // show an empty table and no way to tell why.
  useEffect(() => {
    setPage(1);
  }, [debounced, query]);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);

    const url = new URLSearchParams(query);
    url.set("page", String(page));
    url.set("perPage", String(perPage));
    if (debounced.trim()) url.set("search", debounced.trim());

    try {
      const { data } = await api.get<Paged<T> & E>(`${path}?${url.toString()}`);
      if (current !== requestId.current) return;

      setData(data);
      setError(null);
    } catch {
      if (current === requestId.current) setError("load-failed");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [path, query, page, perPage, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return {
    rows: data?.rows ?? [],
    /** The whole payload, for endpoints that return more than the page. */
    data,
    total,
    page,
    pages,
    perPage,
    loading,
    error,
    search,
    setSearch,
    setPage,
    reload: load,
    /** Replaces one row in place, so an action does not refetch the page. */
    patchRow: (id: number, next: T) =>
      setData((current) =>
        current
          ? {
              ...current,
              rows: current.rows.map((row) =>
                (row as unknown as { id: number }).id === id ? next : row,
              ),
            }
          : current,
      ),
    /** Drops one row in place, after a delete. */
    dropRow: (id: number) =>
      setData((current) =>
        current
          ? {
              ...current,
              total: Math.max(0, current.total - 1),
              rows: current.rows.filter(
                (row) => (row as unknown as { id: number }).id !== id,
              ),
            }
          : current,
      ),
  };
}
