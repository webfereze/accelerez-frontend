import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import TranslatedField from "@/components/ui/TranslatedField";
import RichTextField from "@/components/ui/RichTextField";
import { api, apiErrorMessage } from "@/utils/api";
import { emptyTranslated } from "@/utils/localized";
import type { Faq, Translated } from "@/types/content";

/**
 * The questions attached to one service.
 *
 * **They save one at a time, against their own endpoint**, rather than
 * travelling with the service. A question is a record in its own right — the
 * front end renders it as structured data so it can answer a search result
 * directly — and bundling the set into the service's payload would mean the
 * whole list was rewritten on every save, which loses whatever a second editor
 * changed in the meantime.
 *
 * The consequence is that this section **is live**: adding, editing and
 * removing a question take effect immediately, independently of the Save button
 * above. That is stated in the hint rather than left to be discovered, because
 * a form where half the fields save on blur and half wait for a button is a
 * form nobody trusts.
 *
 * It only renders once the service exists — a question needs a `serviceId` to
 * hang off — which is why the parent guards on `isNew`.
 */
export default function FaqEditor({ serviceId }: { serviceId: number }) {
  const { t } = useTranslation("common");

  const [items, setItems] = useState<Faq[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<Faq[]>("/admin/services/faqs", {
        params: { serviceId },
      });
      setItems(data ?? []);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("services.faqsFailed")));
    }
  }, [serviceId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.post("/admin/services/faqs", {
        serviceId,
        question: emptyTranslated(),
        answer: emptyTranslated(),
        sortOrder: items.length,
        isVisible: true,
      });
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("services.faqsFailed")));
    } finally {
      setBusy(false);
    }
  };

  /**
   * Written on blur rather than on every keystroke.
   *
   * A request per character would be a request per character; a debounce would
   * be a timer racing the unmount when somebody types and immediately navigates
   * away. Blur is the moment the editor has finished with the field, and it is
   * the one event that is guaranteed to fire before either.
   */
  const save = async (faq: Faq, patch: Partial<Faq>) => {
    const next = { ...faq, ...patch };
    setItems((prev) => prev.map((item) => (item.id === faq.id ? next : item)));

    try {
      await api.put(`/admin/services/faqs/${faq.id}`, {
        serviceId,
        question: next.question,
        answer: next.answer,
        sortOrder: next.sortOrder,
        isVisible: next.isVisible,
      });
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("services.faqsFailed")));
    }
  };

  const remove = async (faq: Faq) => {
    setBusy(true);
    try {
      await api.delete(`/admin/services/faqs/${faq.id}`);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("services.faqsFailed")));
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
          {t("services.faqsEmpty")}
        </p>
      )}

      <ul className="space-y-3">
        {items.map((faq, index) => (
          <li key={faq.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t("blocks.accordion.item", { index: index + 1 })}
              </span>
              <button
                type="button"
                onClick={() => remove(faq)}
                disabled={busy}
                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                aria-label={t("blocks.accordion.remove", { index: index + 1 })}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <TranslatedField
                label={t("blocks.accordion.question")}
                value={(faq.question ?? emptyTranslated()) as Translated}
                onChange={(question) =>
                  setItems((prev) =>
                    prev.map((item) =>
                      item.id === faq.id ? { ...item, question } : item,
                    ),
                  )
                }
                onBlur={() => save(faq, {})}
                required
              />

              <RichTextField
                label={t("blocks.accordion.answer")}
                value={(faq.answer ?? emptyTranslated()) as Translated}
                onChange={(answer) => save(faq, { answer })}
              />

              <label className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={faq.isVisible}
                  onChange={(event) => save(faq, { isVisible: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                {t("services.faqVisible")}
              </label>
            </div>
          </li>
        ))}
      </ul>

      <Button variant="secondary" onClick={add} loading={busy}>
        <PlusIcon className="h-4 w-4" aria-hidden />
        {t("services.faqAdd")}
      </Button>
    </div>
  );
}
