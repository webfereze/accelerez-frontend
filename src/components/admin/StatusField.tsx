import { useTranslation } from "next-i18next/pages";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import type { PageStatus } from "@/types/content";

/**
 * Draft or published, and where the record sits in a manual order.
 *
 * The status badge is shown **beside** the select rather than instead of it:
 * the select says what will happen on save, the badge says what is true now,
 * and on a half-edited form those are different sentences.
 *
 * `sortOrder` is optional because not every entity has one — events order
 * themselves by date, documents by the date they are *of*.
 */
export default function StatusField({
  status,
  onStatusChange,
  sortOrder,
  onSortOrderChange,
}: {
  status: PageStatus;
  onStatusChange: (status: PageStatus) => void;
  sortOrder?: number;
  onSortOrderChange?: (sortOrder: number) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Select
          label={t("common.status")}
          value={status}
          onChange={(event) => onStatusChange(event.target.value as PageStatus)}
        >
          <option value="draft">{t("common.draft")}</option>
          <option value="published">{t("common.published")}</option>
        </Select>

        <p className="mt-2">
          <Badge status={status}>
            {status === "published" ? t("common.published") : t("common.draft")}
          </Badge>
        </p>
      </div>

      {typeof sortOrder === "number" && onSortOrderChange && (
        <Input
          label={t("editor.sortOrder")}
          hint={t("editor.sortOrderHint")}
          type="number"
          value={String(sortOrder)}
          onChange={(event) => onSortOrderChange(Number(event.target.value) || 0)}
        />
      )}
    </div>
  );
}
