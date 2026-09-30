import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { slugifyTag } from "@/utils/tags";

/**
 * Free tags, entered one at a time.
 *
 * Unlike facilities, this list is genuinely open — an editor should be able to
 * tag an article "toamna" without anybody adding it to a table first.
 *
 * Three rules keep an open list from becoming a mess:
 *
 * - **Enter and comma both commit**, because half of everyone types a comma.
 * - **Tags are normalised** on the way in — trimmed, lowercased, spaces to
 *   hyphens — so "Trasee", "trasee " and "trasee" are one tag rather than
 *   three that look identical in a filter list.
 * - **Duplicates are dropped silently.** Refusing one with an error is a lot of
 *   ceremony for a keystroke with no consequence.
 */
export default function TagField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [text, setText] = useState("");

  const commit = (raw: string) => {
    const tag = slugifyTag(raw);
    if (!tag) return;
    if (!value.includes(tag)) onChange([...value, tag]);
    setText("");
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="tag-input">
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white p-2 focus-within:border-gray-400">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-1 pl-3 pr-1 text-sm text-gray-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              aria-label={tag}
            >
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ))}

        <input
          id="tag-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              // Enter would submit the surrounding form, and a comma would be
              // typed into the field it is supposed to be splitting on.
              event.preventDefault();
              commit(text);
            } else if (event.key === "Backspace" && !text && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          // Committed on blur too: a tag typed and left in the box is one the
          // editor believes they added.
          onBlur={() => commit(text)}
          className="min-h-9 min-w-[8rem] flex-1 border-0 bg-transparent px-1 text-sm outline-none"
        />
      </div>

      {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}
