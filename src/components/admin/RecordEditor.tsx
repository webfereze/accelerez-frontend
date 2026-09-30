import React from "react";
import clsx from "clsx";
import { useTranslation } from "next-i18next/pages";
import { TrashIcon } from "@heroicons/react/24/outline";
import AdminLayout from "./AdminLayout";
import AdminPageHeader from "./AdminPageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import EditorLocaleBar from "@/components/ui/EditorLocaleBar";
import { EditorLocaleProvider } from "@/hooks/useEditorLocale";
import { useConfirm } from "@/hooks/useConfirm";
import type { Translated } from "@/types/content";

/**
 * The shell every content editor wears.
 *
 * Ten screens in this admin create and edit a record with translated fields and
 * a block body, and they differ only in which fields appear. Everything they
 * have in common lives here — the header and its back link, Save, Delete and
 * its confirmation, the loading and not-found states, the error banner, and the
 * language bar — so an editor screen is a `<form>` and nothing else.
 *
 * Three things it insists on, because each is a bug in every CMS that leaves
 * them to the individual screen:
 *
 * - **Delete is always confirmed**, and the dialog stays up until the request
 *   finishes. A delete that closes its dialog and then takes two seconds looks
 *   like a button that did nothing.
 * - **Save is disabled when nothing has changed.** A button that always looks
 *   available teaches an editor that pressing it is meaningless.
 * - **Save appears top and bottom.** These forms are long, and a Save that only
 *   exists above the fold is one nobody scrolls back up to.
 *
 * **`aside` splits the screen.** Pass it and the form becomes two columns: what
 * the page *is* down the middle, and what decides how it behaves — status,
 * languages, address, search listing — in a rail on the right that stays put
 * while the body scrolls. The two belong apart: the body is long and gets
 * edited for an hour, while the settings are a handful of controls touched once
 * and then wanted at a glance. Stacked, as they were, the publishing controls
 * sit a screen and a half below a block editor and nobody finds them.
 *
 * Below `xl` it collapses back to one column with the rail underneath, because
 * a 300px settings rail beside a 400px body is two cramped columns rather than
 * a layout.
 */
export default function RecordEditor({
  icon,
  title,
  description,
  backHref,
  backLabel,
  deleteTitle,
  deleteMessage,
  loading,
  notFound,
  notFoundLabel,
  saving,
  deleting,
  dirty,
  saved,
  error,
  isNew,
  onSave,
  onDelete,
  /** Fields whose translation state the language bar should reflect. */
  completeness,
  aside,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  backHref: string;
  backLabel: string;
  deleteTitle: string;
  deleteMessage: string;
  loading: boolean;
  notFound: boolean;
  notFoundLabel: string;
  saving: boolean;
  deleting: boolean;
  dirty: boolean;
  saved: boolean;
  error: string | null;
  isNew: boolean;
  onSave: () => void | Promise<unknown>;
  onDelete: () => void | Promise<unknown>;
  completeness?: Array<Translated | null | undefined>;
  /** The right-hand rail. Omit it and the form stays a single column. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  const { confirm, dialog, done } = useConfirm();

  const askThenDelete = async () => {
    const answered = await confirm({
      title: deleteTitle,
      message: deleteMessage,
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!answered) return;

    try {
      await onDelete();
    } finally {
      done();
    }
  };

  return (
    <AdminLayout>
      <EditorLocaleProvider>
        <AdminPageHeader
          icon={icon}
          title={title}
          description={description}
          backHref={backHref}
          backLabel={backLabel}
          actions={
            <div className="flex items-center gap-2">
              {/* Nothing to delete on a record that does not exist yet. */}
              {!isNew && (
                <Button
                  variant="ghost"
                  onClick={askThenDelete}
                  loading={deleting}
                  aria-label={t("common.delete")}
                >
                  <TrashIcon className="h-4 w-4" aria-hidden />
                  {t("common.delete")}
                </Button>
              )}
              <Button onClick={onSave} loading={saving} disabled={!dirty || loading}>
                {t("common.save")}
              </Button>
            </div>
          }
        />

        {error && (
          <Alert tone="error" className="mb-4">
            {error}
          </Alert>
        )}

        {saved && !dirty && (
          <Alert tone="success" className="mb-4">
            {t("editor.saved")}
          </Alert>
        )}

        {notFound ? (
          <p
            role="status"
            className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500"
          >
            {notFoundLabel}
          </p>
        ) : loading ? (
          <p
            role="status"
            className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500"
          >
            {t("common.loading")}
          </p>
        ) : (
          <div
            className={
              aside
                ? "grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
                : "flex min-w-0 flex-col gap-6"
            }
          >
            <div className="flex min-w-0 flex-col gap-6">
              {completeness && <EditorLocaleBar completeness={completeness} />}

              {children}

              <div className="flex justify-end">
                <Button onClick={onSave} loading={saving} disabled={!dirty}>
                  {t("common.save")}
                </Button>
              </div>
            </div>

            {aside && (
              // `top-6` clears the sticky admin header; `max-h` plus its own
              // scroll is what stops a long rail from becoming unreachable on a
              // short screen, which is the usual way a sticky sidebar breaks.
              <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:max-h-[calc(100svh-3rem)] xl:overflow-y-auto xl:pb-2">
                {aside}
              </aside>
            )}
          </div>
        )}

        {dialog}
      </EditorLocaleProvider>
    </AdminLayout>
  );
}

/**
 * A titled card, so the long forms have visible sections.
 *
 * `compact` is the variant the right-hand rail uses: the same card with less
 * padding and a smaller heading, because a 22rem column cannot afford 20px of
 * padding on each side and still hold a date field.
 */
export function EditorSection({
  icon: Icon,
  title,
  description,
  compact = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    // `min-w-0` on the card, and again on every child of its grid.
    //
    // A grid item's default `min-width` is `auto`, which means "never shrink
    // below your content". A long row inside — a block list, a wide field pair
    // — therefore pushes the item wider than its track, and because the card's
    // own background is painted at the track width, the content spills out
    // past the white edge instead of wrapping or scrolling. It looks like a
    // broken card; it is one declaration.
    <section
      className={clsx(
        "min-w-0 rounded-xl border border-gray-200 bg-white",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className={clsx("flex items-start gap-3", compact ? "mb-3" : "mb-4")}>
        <span
          className={clsx(
            "flex shrink-0 items-center justify-center rounded-lg bg-primary-500/10",
            compact ? "h-8 w-8" : "h-9 w-9",
          )}
        >
          <Icon className="h-4 w-4 text-primary-700" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
      </div>

      <div className="grid min-w-0 gap-4 [&>*]:min-w-0">{children}</div>
    </section>
  );
}
