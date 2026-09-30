import { useCallback, useEffect, useState } from "react";
import type { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  QuestionMarkCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import RichTextField from "@/components/ui/RichTextField";
import TranslatedField from "@/components/ui/TranslatedField";
import EditorLocaleBar from "@/components/ui/EditorLocaleBar";
import { useConfirm } from "@/hooks/useConfirm";
import { api } from "@/utils/api";
import { translations } from "@/utils/i18n";
import { tr } from "@/utils/localized";
import type { Faq } from "@/types/content";

/** A blank row, so "new" and "edit" are the same form. */
const EMPTY: Omit<Faq, "id"> = {
  question: { ro: "" },
  answer: { ro: "" },
  topic: null,
  sortOrder: 0,
  isVisible: true,
};

/**
 * The questions, in the admin.
 *
 * **One screen, not a list plus a detail page.** There are a dozen of these and
 * they are read as a sequence — what matters while editing them is the order
 * and whether the same thing is being asked twice, which is exactly what a
 * detail page hides. So the list is the screen, and the form is a dialog over
 * it.
 *
 * Order is arrows rather than a number field. `sortOrder` is a number in the
 * database because it has to be, but nobody editing a FAQ thinks "this is
 * question 40" — they think "this one goes above that one", and a swap of two
 * values is that sentence. Both rows are saved, because a reorder that writes
 * one row leaves two questions claiming the same position.
 *
 * Hiding is kept apart from deleting: a question that stops being asked is
 * usually seasonal, and the answer is worth keeping.
 */
export default function AdminFaqs() {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const { confirm, dialog } = useConfirm();

  const [rows, setRows] = useState<Faq[] | null>(null);
  /** The row being edited, `null` for a new one, `undefined` when closed. */
  const [draft, setDraft] = useState<(Omit<Faq, "id"> & { id?: number }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get<Faq[]>("/admin/faqs");
    setRows(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Swaps this row's `sortOrder` with its neighbour's, and saves both. */
  const move = async (index: number, direction: -1 | 1) => {
    if (!rows) return;

    const other = rows[index + direction];
    if (!other) return;

    const item = rows[index];

    // The seeded rows all carry distinct orders, but a pair that somehow shares
    // one would swap to itself and never move. Fall back to the positions.
    const [a, b] =
      item.sortOrder === other.sortOrder
        ? [index + direction, index]
        : [other.sortOrder, item.sortOrder];

    await Promise.all([
      api.put(`/admin/faqs/${item.id}`, { ...body(item), sortOrder: a }),
      api.put(`/admin/faqs/${other.id}`, { ...body(other), sortOrder: b }),
    ]);

    await load();
  };

  const toggle = async (item: Faq) => {
    await api.put(`/admin/faqs/${item.id}`, { ...body(item), isVisible: !item.isVisible });
    await load();
  };

  const remove = async (item: Faq) => {
    const ok = await confirm({
      title: t("faqs.removeTitle"),
      message: tr(item.question, locale),
      confirmLabel: t("actions.delete"),
      tone: "danger",
    });
    if (!ok) return;

    await api.delete(`/admin/faqs/${item.id}`);
    await load();
  };

  const save = async () => {
    if (!draft || !draft.question.ro.trim()) return;

    setSaving(true);
    try {
      if (draft.id) await api.put(`/admin/faqs/${draft.id}`, body(draft));
      else {
        // New questions go to the end — the top of the list is where the most
        // asked ones have been deliberately put.
        const last = rows?.length ? Math.max(...rows.map((row) => row.sortOrder)) : 0;
        await api.post("/admin/faqs", { ...body(draft), sortOrder: last + 10 });
      }

      setDraft(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={QuestionMarkCircleIcon}
        title={t("faqs.adminTitle")}
        description={t("faqs.adminDescription")}
        actions={<Button onClick={() => setDraft({ ...EMPTY })}>{t("faqs.add")}</Button>}
      />

      <div className="rounded-xl border border-gray-200 bg-white">
        {rows === null ? (
          <p role="status" className="p-6 text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : rows.length ? (
          <ul className="divide-y divide-gray-100">
            {rows.map((item, index) => (
              <li key={item.id} className="flex flex-wrap items-start gap-3 p-4">
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {tr(item.question, locale) || (
                        <em className="text-gray-400">{t("faqs.untitled")}</em>
                      )}
                    </span>

                    {item.topic && <Badge tone="muted">{item.topic}</Badge>}

                    {!item.isVisible && <Badge tone="muted">{t("faqs.hidden")}</Badge>}
                  </span>

                  <span
                    className="mt-1 block max-w-3xl truncate text-xs text-gray-500"
                    // The answer is rich text; this is a one-line preview of it,
                    // so the tags are stripped rather than rendered.
                  >
                    {tr(item.answer, locale).replace(/<[^>]*>/g, " ").trim()}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label={t("faqs.moveUp")}
                    icon={ArrowUpIcon}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  />
                  <IconButton
                    label={t("faqs.moveDown")}
                    icon={ArrowDownIcon}
                    disabled={index === rows.length - 1}
                    onClick={() => move(index, 1)}
                  />
                  <IconButton
                    label={item.isVisible ? t("faqs.hide") : t("faqs.show")}
                    icon={item.isVisible ? EyeIcon : EyeSlashIcon}
                    onClick={() => toggle(item)}
                  />
                  <IconButton
                    label={t("actions.edit")}
                    icon={PencilSquareIcon}
                    onClick={() => setDraft({ ...item })}
                  />
                  <IconButton
                    label={t("actions.delete")}
                    icon={TrashIcon}
                    danger
                    onClick={() => remove(item)}
                  />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={QuestionMarkCircleIcon}
            title={t("faqs.emptyTitle")}
            description={t("faqs.emptyText")}
          />
        )}
      </div>

      <Modal
        open={draft !== null}
        onClose={() => setDraft(null)}
        title={draft?.id ? t("faqs.editTitle") : t("faqs.addTitle")}
        description={t("faqs.formHint")}
        size="lg"
        headerExtra={
          <EditorLocaleBar completeness={[draft?.question, draft?.answer]} />
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDraft(null)}>
              {t("actions.cancel")}
            </Button>
            <Button onClick={save} disabled={saving || !draft?.question.ro.trim()}>
              {saving ? t("actions.saving") : t("actions.save")}
            </Button>
          </>
        }
      >
        {draft && (
          <div className="space-y-5">
            <TranslatedField
              label={t("faqs.question")}
              required
              value={draft.question}
              onChange={(question) => setDraft({ ...draft, question })}
            />

            <RichTextField
              label={t("faqs.answer")}
              value={draft.answer}
              onChange={(answer) => setDraft({ ...draft, answer })}
            />

            <Input
              label={t("faqs.topic")}
              hint={t("faqs.topicHint")}
              value={draft.topic ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, topic: event.target.value || null })
              }
            />
          </div>
        )}
      </Modal>

      {dialog}
    </AdminLayout>
  );
}

/** Only the fields the API accepts — `id` is in the URL, never in the body. */
function body(item: Omit<Faq, "id"> & { id?: number }) {
  return {
    question: item.question,
    answer: item.answer,
    topic: item.topic,
    sortOrder: item.sortOrder,
    isVisible: item.isVisible,
  };
}

/** A square icon control with an accessible name. Five of them per row. */
function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  danger,
}: {
  label: string;
  icon: typeof ArrowUpIcon;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent ${
        danger ? "hover:text-red-600" : "hover:text-gray-900"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: { ...(await translations(locale, ["common"])) },
});
