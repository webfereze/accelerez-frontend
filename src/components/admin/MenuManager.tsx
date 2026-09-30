import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Bars3BottomLeftIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import AdminLayout from "./AdminLayout";
import AdminPageHeader from "./AdminPageHeader";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import EmptyState from "@/components/ui/EmptyState";
import { EditorLocaleProvider } from "@/hooks/useEditorLocale";
import { useConfirm } from "@/hooks/useConfirm";
import { api, apiErrorMessage } from "@/utils/api";
import { emptyTranslated } from "@/utils/localized";
import type { Translated } from "@/types/content";

/**
 * One menu, edited in place.
 *
 * The header and footer menus are the **same screen with a different key**, so
 * this is a component rather than two pages that drift.
 *
 * **Reordering is a pair of arrows, not drag-and-drop.** A menu has five or six
 * entries; drag-and-drop costs a dependency, breaks on touch without more work
 * than the feature is worth, and is unusable with a keyboard. Two buttons are
 * boring, accessible, and obviously correct.
 *
 * **Each row saves itself.** A menu is a list of small independent records, and
 * a single Save for the whole screen means one bad row blocks five good ones —
 * and that an editor who changes a label and navigates away loses it silently.
 */

type MenuKey = "main" | "footer" | "quick";
type LinkType = "page" | "url" | "system" | "heading";

type MenuRow = {
  id: number;
  menu: MenuKey;
  label: Translated | null;
  linkType: LinkType;
  pageId: number | null;
  url: string | null;
  systemKey: string | null;
  openInNewTab: boolean;
  sortOrder: number;
  isVisible: boolean;
};

const SYSTEM_SECTIONS = [
  "home",
  "attractions",
  "accommodation",
  "events",
  "documents",
  "gallery",
  "contact",
];

export default function MenuManager({
  menu,
  title,
  description,
}: {
  menu: MenuKey;
  title: string;
  description: string;
}) {
  const { t } = useTranslation("common");
  const { confirm, dialog, done } = useConfirm();

  const [rows, setRows] = useState<MenuRow[]>([]);
  const [pages, setPages] = useState<Array<{ id: number; title: Translated }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, pageList] = await Promise.all([
        api.get<MenuRow[]>(`/admin/menu/${menu}`),
        api.get<Array<{ id: number; title: Translated }>>("/admin/pages"),
      ]);
      setRows(items.data);
      setPages(pageList.data);
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("menu.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [menu, t]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Applies a change locally and pushes it, so the row responds immediately. */
  const patchRow = async (id: number, changes: Partial<MenuRow>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...changes } : row)),
    );

    try {
      await api.patch(`/admin/menu/${id}`, changes);
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("menu.saveFailed")));
      // The server is the truth; put the row back the way it really is.
      await load();
    }
  };

  const move = async (index: number, delta: number) => {
    const next = [...rows];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);

    try {
      // One request for the whole arrangement: saving two rows separately
      // leaves the menu briefly with two entries claiming the same position.
      await api.patch("/admin/menu/reorder", {
        items: next.map((row, order) => ({ id: row.id, sortOrder: order })),
      });
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught, t("menu.saveFailed")));
      await load();
    }
  };

  const add = async () => {
    setBusy(true);
    try {
      await api.post("/admin/menu", {
        menu,
        linkType: "url",
        url: "/",
        sortOrder: rows.length,
        isVisible: true,
      });
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("menu.saveFailed")));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: MenuRow) => {
    const answered = await confirm({
      title: t("menu.deleteTitle"),
      message: t("menu.deleteMessage"),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!answered) return;

    try {
      await api.delete(`/admin/menu/${row.id}`);
      await load();
    } catch (caught) {
      setError(apiErrorMessage(caught, t("menu.saveFailed")));
    } finally {
      done();
    }
  };

  return (
    <AdminLayout>
      <EditorLocaleProvider>
        <AdminPageHeader
          icon={Bars3BottomLeftIcon}
          title={title}
          description={description}
          actions={
            <Button onClick={add} loading={busy}>
              <PlusIcon className="h-4 w-4" aria-hidden />
              {t("menu.add")}
            </Button>
          }
        />

        {error && (
          <Alert tone="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <p role="status" className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            {t("common.loading")}
          </p>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white">
            <EmptyState
              icon={Bars3BottomLeftIcon}
              title={t("menu.empty")}
              description={t("menu.emptyHint")}
              action={<Button onClick={add}>{t("menu.add")}</Button>}
            />
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {index + 1}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      aria-label={t("menu.moveUp")}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUpIcon className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={t("menu.moveDown")}
                      disabled={index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownIcon className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label={t("common.delete")}
                      onClick={() => remove(row)}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label={t("menu.linkType")}
                      value={row.linkType}
                      onChange={(event) =>
                        patchRow(row.id, { linkType: event.target.value as LinkType })
                      }
                    >
                      <option value="page">{t("menu.typePage")}</option>
                      <option value="system">{t("menu.typeSystem")}</option>
                      <option value="url">{t("menu.typeUrl")}</option>
                      <option value="heading">{t("menu.typeHeading")}</option>
                    </Select>

                    {row.linkType === "page" && (
                      <Select
                        label={t("menu.page")}
                        value={row.pageId === null ? "" : String(row.pageId)}
                        onChange={(event) =>
                          patchRow(row.id, {
                            pageId: event.target.value ? Number(event.target.value) : null,
                          })
                        }
                      >
                        <option value="">{t("menu.choosePage")}</option>
                        {pages.map((page) => (
                          <option key={page.id} value={page.id}>
                            {page.title?.ro ?? `#${page.id}`}
                          </option>
                        ))}
                      </Select>
                    )}

                    {row.linkType === "system" && (
                      <Select
                        label={t("menu.section")}
                        value={row.systemKey ?? ""}
                        onChange={(event) =>
                          patchRow(row.id, { systemKey: event.target.value || null })
                        }
                      >
                        <option value="">{t("menu.chooseSection")}</option>
                        {SYSTEM_SECTIONS.map((section) => (
                          <option key={section} value={section}>
                            {t(`menu.section.${section}`)}
                          </option>
                        ))}
                      </Select>
                    )}

                    {row.linkType === "url" && (
                      <Input
                        label={t("menu.url")}
                        hint={t("menu.urlHint")}
                        value={row.url ?? ""}
                        onChange={(event) => patchRow(row.id, { url: event.target.value })}
                      />
                    )}
                  </div>

                  {/* Empty falls back to the linked page's own title, so
                      renaming a page renames its menu entry too. */}
                  <TranslatedField
                    label={t("menu.label")}
                    hint={t("menu.labelHint")}
                    value={row.label ?? emptyTranslated()}
                    onChange={(label) => patchRow(row.id, { label })}
                  />

                  <div className="flex flex-wrap gap-5">
                    <label className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.isVisible}
                        onChange={(event) =>
                          patchRow(row.id, { isVisible: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {t("menu.visible")}
                      {!row.isVisible && (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" aria-hidden />
                      )}
                    </label>

                    <label className="flex min-h-11 items-center gap-2.5 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={row.openInNewTab}
                        onChange={(event) =>
                          patchRow(row.id, { openInNewTab: event.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      {t("menu.newTab")}
                    </label>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {dialog}
      </EditorLocaleProvider>
    </AdminLayout>
  );
}
