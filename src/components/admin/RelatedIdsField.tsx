import { useTranslation } from "next-i18next/pages";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Input from "@/components/ui/Input";

/**
 * A short list of record ids — related articles, related case studies.
 *
 * **Ids typed in, not a picker.** A picker would have to load and search every
 * article on every editor screen for a field that holds at most two entries,
 * and the ids are visible in the list URL an editor has just come from. When
 * the archive is large enough that this is annoying, it becomes a picker; it is
 * not large enough yet, and building the picker first would be building the
 * wrong thing carefully.
 *
 * `max` is the blueprint's cap, enforced by disabling the input rather than by
 * silently dropping what was typed.
 */
export default function RelatedIdsField({
  label,
  hint,
  value,
  onChange,
  max,
}: {
  label: string;
  hint?: string;
  value: number[];
  onChange: (next: number[]) => void;
  max?: number;
}) {
  const { t } = useTranslation("common");
  const ids = value ?? [];
  const full = max !== undefined && ids.length >= max;

  const add = (raw: string) => {
    const id = Number(raw.trim());
    if (!Number.isInteger(id) || id <= 0 || ids.includes(id)) return;
    onChange([...ids, id]);
  };

  return (
    <div>
      <Input
        label={label}
        hint={hint}
        type="number"
        min={1}
        disabled={full}
        placeholder={full ? t("editor.relatedFull", { max }) : t("editor.relatedAdd")}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          // Otherwise Enter submits the surrounding form and saves the record
          // halfway through typing an id.
          event.preventDefault();
          const input = event.currentTarget;
          add(input.value);
          input.value = "";
        }}
      />

      {ids.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {ids.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(ids.filter((other) => other !== id))}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-sm text-gray-700 hover:bg-gray-200"
                aria-label={t("editor.relatedRemove", { id })}
              >
                #{id}
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
