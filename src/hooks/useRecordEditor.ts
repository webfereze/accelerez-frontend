import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { api, apiErrorMessage, isUnauthorized } from "@/utils/api";

/**
 * One record, loaded, edited, saved and deleted.
 *
 * Every content editor in this admin does the same five things — fetch by id,
 * hold a draft, save it, create a new one, delete it — and differ only in which
 * fields the form shows. This is that shape, once, so an editor screen is a
 * form and nothing else.
 *
 * **`new` is not a special screen, it is a null id.** The alternative is two
 * pages per entity that drift: one grows a field the other forgets, and the
 * bug only appears when somebody edits a record they just created.
 *
 * **Saving a new record redirects to its edit URL** rather than staying put.
 * Without that, pressing Save twice creates two records — which is the single
 * most common way a CMS ends up with duplicates.
 */
export function useRecordEditor<TRecord, TDraft extends Record<string, unknown>>({
  path,
  id,
  empty,
  toDraft,
  listHref,
  toPayload,
}: {
  /** The admin collection, e.g. `/admin/attractions`. No trailing slash. */
  path: string;
  /** The record's id, or null when creating. */
  id: number | null;
  /** A blank draft, for the create case. */
  empty: TDraft;
  /** Maps a loaded record onto the draft the form edits. */
  toDraft: (record: TRecord) => TDraft;
  /** Where to go after a delete, and what the back link points at. */
  listHref: string;
  /**
   * Maps the draft onto what the API actually accepts. Defaults to sending the
   * draft as-is.
   *
   * It exists because a form and a DTO are not the same shape. An empty date
   * input is `""`, which `@IsDateString()` rejects — `@IsOptional()` skips
   * null and undefined, not the empty string — so a blank optional date has to
   * become null on the way out. Prices typed in lei become bani here too.
   *
   * **Do this here, not by calling `setDraft` before `save`.** `save` closes
   * over the draft from the current render, so a state update made immediately
   * before it is not visible to it and the conversion never reaches the server.
   */
  toPayload?: (draft: TDraft) => unknown;
}) {
  const router = useRouter();

  const [draft, setDraft] = useState<TDraft>(empty);
  const [loading, setLoading] = useState(id !== null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  // The row as the API returned it, kept beside the draft for the read-only
  // things a screen shows that nobody edits.
  const [record, setRecord] = useState<TRecord | null>(null);

  useEffect(() => {
    if (id === null) {
      setDraft(empty);
      setRecord(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const response = await api.get<TRecord>(`${path}/${id}`);
        if (cancelled) return;
        setRecord(response.data);
        setDraft(toDraft(response.data));
        setDirty(false);
      } catch (caught) {
        if (cancelled || isUnauthorized(caught)) return;
        setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `empty` and `toDraft` are literals at the call site and would restart the
    // fetch on every render if they were dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, id]);

  /** Merges a patch into the draft and marks it unsaved. */
  const patch = useCallback((changes: Partial<TDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setDirty(true);
    setSaved(false);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      const payload = toPayload ? toPayload(draft) : draft;

      if (id === null) {
        const response = await api.post<{ id: number }>(path, payload);
        setDirty(false);
        setSaved(true);
        // Straight to the record's own URL — see the note above about Save
        // being pressed twice.
        await router.replace(`${listHref}/${response.data.id}`);
      } else {
        await api.put(`${path}/${id}`, payload);
        setDirty(false);
        setSaved(true);
      }
      return true;
    } catch (caught) {
      // The API's own message, not a generic one: it is where "that slug is
      // taken" and "Romanian text is required" come from, and both are things
      // only the editor can fix.
      setError(apiErrorMessage(caught, "save"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, id, listHref, path, router, toPayload]);

  const remove = useCallback(async (): Promise<boolean> => {
    if (id === null) return false;

    setDeleting(true);
    setError(null);

    try {
      await api.delete(`${path}/${id}`);
      await router.push(listHref);
      return true;
    } catch (caught) {
      setError(apiErrorMessage(caught, "delete"));
      return false;
    } finally {
      setDeleting(false);
    }
  }, [id, listHref, path, router]);

  return {
    draft,
    /**
     * The row as the API last returned it.
     *
     * For the read-only things an editor screen shows beside the form — when a
     * client opened an offer, what they answered — which are not part of the
     * draft because nobody edits them. Null until the first load, and on a new
     * record.
     */
    record,
    patch,
    setDraft,
    save,
    remove,
    loading,
    saving,
    deleting,
    dirty,
    saved,
    error,
    notFound,
    isNew: id === null,
  };
}

/**
 * Reads the `[id]` route parameter, or null on the `new` screen.
 *
 * Returns `undefined` while the router is still hydrating, which is the state a
 * caller must not mistake for "create" — doing so fires a POST on every page
 * load of an edit screen.
 */
export function useRecordId(): number | null | undefined {
  const router = useRouter();

  if (!router.isReady) return undefined;

  const raw = router.query.id;
  if (raw === undefined || raw === "new") return null;

  const parsed = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isFinite(parsed) ? parsed : null;
}
