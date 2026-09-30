import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/utils/api";
import type { Page, PageStatus } from "@/types/content";

/**
 * Loads the page list for the admin.
 *
 * Filtering is done here rather than through the API: the page count is small
 * (dozens, not thousands) and searching in memory keeps typing instant and
 * matches every language at once.
 */
export function usePages({ q, status }: { q?: string; status?: PageStatus | "" } = {}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slow earlier response overwriting a newer one.
  const requestId = useRef(0);

  const fetchPages = useCallback(async () => {
    const current = ++requestId.current;

    try {
      const { data } = await api.get<Page[]>("/admin/pages");
      if (current === requestId.current) {
        setPages(data);
        setError(null);
      }
    } catch {
      if (current === requestId.current) setError("load-failed");
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPages();
  }, [fetchPages]);

  const filtered = useMemo(() => {
    const term = q?.trim().toLowerCase();

    return pages.filter((page) => {
      if (status && page.status !== status) return false;
      if (!term) return true;

      // Matches any language plus the slug, so an editor working in Danish
      // still finds a page they only titled in Hungarian.
      const haystack = [page.slug, ...Object.values(page.title ?? {})]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [pages, q, status]);

  /** Roots with their children attached — the shape the list renders. */
  const tree = useMemo(() => {
    const visible = new Set(filtered.map((p) => p.id));

    return pages
      .filter((p) => !p.parentId)
      .map((root) => ({
        ...root,
        children: pages.filter((p) => p.parentId === root.id),
      }))
      // A parent stays when one of its children matches, so a match is never
      // shown orphaned or hidden behind a non-matching parent.
      .filter(
        (root) =>
          visible.has(root.id) || root.children.some((c) => visible.has(c.id)),
      );
  }, [pages, filtered]);

  /**
   * Pages that may be chosen as a parent: only roots, and never the page being
   * edited. Mirrors the backend's two-level rule so the dropdown cannot offer
   * something the API will reject.
   */
  const parentOptions = useCallback(
    (excludeId?: number) => pages.filter((p) => !p.parentId && p.id !== excludeId),
    [pages],
  );

  return { pages: filtered, tree, parentOptions, loading, error, reload: fetchPages };
}
