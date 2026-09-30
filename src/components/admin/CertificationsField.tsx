import { useTranslation } from "next-i18next/pages";
import { TrashIcon } from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";
import type { Certification } from "@/types/content";

/**
 * A trainer's certifications: what, who issued it, when.
 *
 * **Plain strings, not a closed list.** Romanian fitness certifications come
 * from a dozen bodies and change names; a select would be out of date within a
 * year and would force an administrator to pick the nearest wrong option. What
 * matters is that a person read the document before typing it, and no field can
 * enforce that.
 *
 * Not translated either: "Antrenor personal acreditat ANC" is the name of a
 * document, and translating the name of a document is how it stops matching the
 * paper it refers to.
 */
export default function CertificationsField({
  value,
  onChange,
}: {
  value: Certification[];
  onChange: (next: Certification[]) => void;
}) {
  const { t } = useTranslation("common");
  const rows = value ?? [];

  const set = (index: number, changes: Partial<Certification>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">{t("trainers.certifications")}</p>

      {rows.length === 0 && (
        <p className="mb-3 text-xs text-gray-500">{t("trainers.certificationsEmpty")}</p>
      )}

      <ul className="space-y-3">
        {rows.map((row, index) => (
          <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem_2.5rem]">
            <Input
              srOnlyLabel
              label={t("trainers.certName")}
              placeholder={t("trainers.certName")}
              value={row.name ?? ""}
              onChange={(event) => set(index, { name: event.target.value })}
            />
            <Input
              srOnlyLabel
              label={t("trainers.certIssuer")}
              placeholder={t("trainers.certIssuer")}
              value={row.issuer ?? ""}
              onChange={(event) => set(index, { issuer: event.target.value })}
            />
            <Input
              srOnlyLabel
              type="number"
              label={t("trainers.certYear")}
              placeholder={t("trainers.certYear")}
              value={row.year ? String(row.year) : ""}
              onChange={(event) =>
                set(index, { year: Number(event.target.value) || undefined })
              }
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              aria-label={t("actions.delete")}
              className="flex h-11 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:border-red-300 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...rows, { name: "" }])}
        className="mt-3 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        {t("trainers.addCertification")}
      </button>
    </div>
  );
}
