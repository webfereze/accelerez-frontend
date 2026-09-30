import { useCallback, useEffect, useState } from "react";
import { api, apiErrorMessage, isUnauthorized } from "@/utils/api";

/**
 * Loads and saves one `site_settings` row.
 *
 * The screen stays markup: fetching, the dirty flag, the save and the error
 * handling all live here, which is the house rule — a `useEffect` with a fetch
 * inside a page is a hook that has not been extracted yet.
 *
 * **The draft is the whole object, not a field at a time.** The setting is a
 * single JSON column and the API takes it whole, so a per-field PATCH would
 * mean the client inventing a merge the server does not do.
 *
 * `dirty` exists so the Save button can be disabled when nothing changed —
 * a button that always looks available teaches an editor that pressing it is
 * meaningless.
 */
export function useSettingsForm<T extends Record<string, unknown>>(
  key: string,
  empty: T,
) {
  const [value, setValue] = useState<T>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await api.get<T | null>(`/admin/settings/${key}`);
        if (cancelled) return;
        // A row that has never been written answers null rather than 404 —
        // spreading over `empty` is what gives a new key every field.
        setValue({ ...empty, ...(response.data ?? {}) });
      } catch (caught) {
        if (cancelled) return;
        if (!isUnauthorized(caught)) {
          setError(apiErrorMessage(caught, "load"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `empty` is a literal at the call site and would restart the fetch on
    // every render if it were a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /** Merges a patch into the draft and marks it unsaved. */
  const patch = useCallback((changes: Partial<T>) => {
    setValue((current) => ({ ...current, ...changes }));
    setDirty(true);
    setSaved(false);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    setError(null);

    try {
      await api.put(`/admin/settings/${key}`, { value });
      setDirty(false);
      setSaved(true);
      return true;
    } catch (caught) {
      setError(apiErrorMessage(caught, "save"));
      return false;
    } finally {
      setSaving(false);
    }
  }, [key, value]);

  return { value, patch, save, loading, saving, dirty, saved, error, setError };
}
