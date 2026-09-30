import { useTranslation } from "next-i18next/pages";
import clsx from "clsx";

/**
 * The facilities a property or a room offers, as toggles.
 *
 * A **closed list**, not a free-text tag box. The public pages translate each
 * key into three languages, and a free field would have produced "wifi",
 * "Wi-Fi" and "internet" within a week — three chips meaning one thing, none of
 * them translated.
 *
 * Keys are the stored value and must never be renamed: they are written onto
 * every property already using them, and a rename silently empties the chip.
 * Adding is free.
 */
const AMENITIES = [
  "wifi",
  "parking",
  "breakfast",
  "restaurant",
  "spa",
  "accessible",
  "garden",
  "pets",
  "kitchen",
  "fireplace",
  "showers",
  "electricity",
  "campfire",
  "tv",
  "bathroom",
  "balcony",
];

export default function AmenityField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslation("common");
  const selected = new Set(value);

  const toggle = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    // Kept in the order of the list above rather than of clicking, so two
    // properties with the same facilities store the same array.
    onChange(AMENITIES.filter((amenity) => next.has(amenity)));
  };

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-gray-700">{label}</legend>

      <div className="flex flex-wrap gap-2">
        {AMENITIES.map((amenity) => {
          const on = selected.has(amenity);

          return (
            <button
              key={amenity}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(amenity)}
              className={clsx(
                "min-h-11 rounded-full border px-3.5 text-sm transition-colors",
                on
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900",
              )}
            >
              {t(`amenity.${amenity}`, { defaultValue: amenity })}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
