import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";
import Select from "@/components/ui/Select";
import TranslatedField from "@/components/ui/TranslatedField";
import RichTextField from "@/components/ui/RichTextField";
import { emptyTranslated, tr } from "@/utils/localized";
import type { Translated } from "@/types/content";
import { useIsSideColumn } from "./column";
import type { BlockEditorProps, BlockRendererProps } from "./types";

/**
 * Two or three columns of text side by side.
 *
 * Mobile-first: always one column on a phone; the split only applies from
 * `md:` up. Three columns at 360 px would be three unreadable slivers.
 */

export type ColumnsData = {
  title: Translated;
  count: 2 | 3;
  columns: Array<{
    id: string;
    heading: Translated;
    html: Translated;
  }>;
};

/**
 * Column counts are viewport breakpoints, so a block in the narrow side rail
 * would still get `md:`/`lg:` layouts on a wide screen — three cards crushed
 * into 320px. The rail is therefore forced to one column explicitly, using the
 * signal the block already has, rather than by measuring anything.
 */
const GRID: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
};

const emptyColumn = (id: string) => ({
  id,
  heading: emptyTranslated(),
  html: emptyTranslated(),
});

export function ColumnsEditor({ data, onChange }: BlockEditorProps<ColumnsData>) {
  const { t } = useTranslation("common");
  const count = data.count ?? 2;
  const columns = data.columns ?? [];

  /** Keeps the column array in step with the chosen count, preserving content. */
  function setCount(next: 2 | 3) {
    const resized = [...columns];
    while (resized.length < next) resized.push(emptyColumn(`col-${resized.length}`));
    onChange({ ...data, count: next, columns: resized.slice(0, next) });
  }

  const update = (id: string, patch: Partial<ColumnsData["columns"][number]>) =>
    onChange({
      ...data,
      columns: columns.map((column) =>
        column.id === id ? { ...column, ...patch } : column,
      ),
    });

  return (
    <div className="space-y-4">
      <TranslatedField
        label={t("blocks.columns.heading")}
        value={data.title ?? emptyTranslated()}
        onChange={(title) => onChange({ ...data, title })}
      />

      <Select
        label={t("blocks.columns.count")}
        value={String(count)}
        onChange={(e) => setCount(Number(e.target.value) as 2 | 3)}
      >
        <option value="2">{t("blocks.columns.two")}</option>
        <option value="3">{t("blocks.columns.three")}</option>
      </Select>

      <div className="space-y-3">
        {columns.slice(0, count).map((column, index) => (
          <div
            key={column.id}
            className="rounded-lg border border-white/10 bg-ink-900/60 p-3"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              {t("blocks.columns.column", { index: index + 1 })}
            </p>
            <div className="space-y-3">
              <TranslatedField
                label={t("blocks.columns.columnHeading")}
                value={column.heading ?? emptyTranslated()}
                onChange={(heading) => update(column.id, { heading })}
              />
              <RichTextField
                label={t("blocks.columns.columnBody")}
                value={column.html ?? emptyTranslated()}
                onChange={(html) => update(column.id, { html })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColumnsRenderer({
  data,
  locale,
}: BlockRendererProps<ColumnsData>) {
  const side = useIsSideColumn();
  const title = tr(data.title, locale);
  const columns = (data.columns ?? []).slice(0, data.count ?? 2);

  return (
    <section>
      {title && (
        <h2 className="mb-7 font-head text-2xl leading-tight tracking-tight text-ink-50 md:text-4xl">
          {title}
        </h2>
      )}

      <div className={clsx("grid gap-6 md:gap-8", side ? "" : GRID[data.count ?? 2])}>
        {columns.map((column) => {
          const heading = tr(column.heading, locale);
          const html = tr(column.html, locale);

          return (
            <div key={column.id} className="min-w-0">
              {heading && (
                <h3 className="font-head text-lg text-ink-50">
                  {heading}
                </h3>
              )}
              {html && (
                <div
                  className="
                    mt-2 break-words text-sm leading-relaxed text-ink-300
                    [&_a]:text-flare-400 [&_a]:underline
                    [&_li]:mt-1
                    [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5
                    [&_p]:mt-2 [&_p:first-child]:mt-0
                    [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5
                  "
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export const columnsDefaults = (): ColumnsData => ({
  title: emptyTranslated(),
  count: 2,
  columns: [emptyColumn("col-0"), emptyColumn("col-1")],
});
