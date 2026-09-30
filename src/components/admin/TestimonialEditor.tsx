import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import TranslatedField from "@/components/ui/TranslatedField";
import ImageField from "@/components/ui/ImageField";
import { api, apiErrorMessage } from "@/utils/api";
import { emptyTranslated } from "@/utils/localized";
import type { Testimonial, Translated } from "@/types/content";

/**
 * The quotations attached to one case study.
 *
 * **"Approved" is the whole point of this screen.** It defaults to off, the
 * public API filters on it, and nothing a client said appears on the site until
 * somebody here ticks it. Publishing another person's words is a deliberate
 * act, and a quotation that goes live because a draft was saved is a quotation
 * they never agreed to — so the tick is the most prominent control on each
 * card, and the list says plainly what the unticked state means.
 *
 * Like the questions on a service, these save against their own endpoint as
 * they are edited, independently of the Save button above.
 */
export default function TestimonialEditor({ trainerId }: { trainerId: number }) {
  const { t } = useTranslation("common");

  const [items, setItems] = useState<Testimonial[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Testimonial[]>("/admin/projects/testimonials", {
        params: { trainerId },
      });
      setItems((data ?? []).filter((row) => row.trainerId === trainerId));
    } catch (caught) {
      setError(apiErrorMessage(caught, t("testimonials.failed")));
    }
  }, [trainerId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post("/admin/projects/testimonials", {
        trainerId,
        quote: emptyTranslated(),
        author: "",
        approved: false,
        isFeatured: false,
        sortOrder: items.length,
      });
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("testimonials.failed")));
    } finally {
      setBusy(false);
    }
  };

  const save = async (item: Testimonial, patch: Partial<Testimonial>) => {
    const next = { ...item, ...patch };
    setItems((prev) => prev.map((row) => (row.id === item.id ? next : row)));

    try {
      await api.put(`/admin/projects/testimonials/${item.id}`, {
        trainerId,
        quote: next.quote,
        author: next.author,
        role: next.role || null,
        company: next.company || null,
        avatar: next.avatar || null,
        approved: next.approved,
        isFeatured: next.isFeatured,
        sortOrder: next.sortOrder,
      });
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("testimonials.failed")));
    }
  };

  const remove = async (item: Testimonial) => {
    setBusy(true);
    try {
      await api.delete(`/admin/projects/testimonials/${item.id}`);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("testimonials.failed")));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {items.length === 0 && (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
          {t("testimonials.empty")}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("testimonials.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() => remove(item)}
                disabled={busy}
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                aria-label={t("testimonials.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <TranslatedField
                label={t("testimonials.quote")}
                value={(item.quote ?? emptyTranslated()) as Translated}
                onChange={(quote) =>
                  setItems((prev) =>
                    prev.map((row) => (row.id === item.id ? { ...row, quote } : row)),
                  )
                }
                onBlur={() => save(item, {})}
                multiline
                rows={3}
                required
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <Input
                  label={t("testimonials.author")}
                  value={item.author ?? ""}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((row) =>
                        row.id === item.id ? { ...row, author: event.target.value } : row,
                      ),
                    )
                  }
                  onBlur={() => save(item, {})}
                  required
                />
                <Input
                  label={t("testimonials.role")}
                  value={item.role ?? ""}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((row) =>
                        row.id === item.id ? { ...row, role: event.target.value } : row,
                      ),
                    )
                  }
                  onBlur={() => save(item, {})}
                />
                <Input
                  label={t("testimonials.company")}
                  value={item.company ?? ""}
                  onChange={(event) =>
                    setItems((prev) =>
                      prev.map((row) =>
                        row.id === item.id ? { ...row, company: event.target.value } : row,
                      ),
                    )
                  }
                  onBlur={() => save(item, {})}
                />
              </div>

              <ImageField
                label={t("testimonials.avatar")}
                url={item.avatar}
                alt=""
                onChange={({ url }) => save(item, { avatar: url })}
              />

              {/* The consequential control, and it looks like it. */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-white p-3 ring-1 ring-gray-200">
                <label className="flex min-h-11 items-center gap-2.5 text-sm font-medium text-gray-900">
                  <input
                    type="checkbox"
                    checked={item.approved}
                    onChange={(event) => save(item, { approved: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {t("testimonials.approved")}
                </label>

                <label className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={item.isFeatured}
                    onChange={(event) => save(item, { isFeatured: event.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {t("testimonials.isFeatured")}
                </label>

                {!item.approved && (
                  <p className="text-xs text-gray-500">{t("testimonials.approvedHint")}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Button variant="secondary" onClick={add} loading={busy}>
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("testimonials.add")}
      </Button>
    </div>
  );
}
