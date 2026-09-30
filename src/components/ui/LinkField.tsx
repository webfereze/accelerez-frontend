import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import Input from "./Input";
import Select from "./Select";
import { usePages } from "@/hooks/usePages";
import { tr } from "@/utils/localized";

/**
 * A link target: either a page from this site or an external address.
 *
 * External links are validated rather than trusted — a typo like
 * A bare domain (no scheme) silently becomes a relative path and 404s on the
 * live site, which is exactly the kind of breakage nobody notices until a
 * citizen reports it.
 */

type Mode = "page" | "url";

/** Accepts absolute http(s) URLs, site-relative paths, mailto: and tel:. */
export function validateLink(value: string | null | undefined): {
  valid: boolean;
  error?: "scheme" | "invalid";
  normalized: string;
} {
  // Tolerates a missing value rather than throwing. A block whose stored data
  // predates its link field has no key at all, and a white screen in the page
  // editor is a worse answer to that than an empty field.
  const raw = (value ?? "").trim();
  if (!raw) return { valid: true, normalized: "" };

  if (raw.startsWith("/") || raw.startsWith("#")) {
    return { valid: true, normalized: raw };
  }

  if (/^(mailto:|tel:)/i.test(raw)) {
    return { valid: true, normalized: raw };
  }

  // A bare domain is the most common mistake — flag it
  // rather than silently treating it as a relative path.
  if (!/^https?:\/\//i.test(raw)) {
    return { valid: false, error: "scheme", normalized: raw };
  }

  try {
    const url = new URL(raw);
    if (!url.hostname.includes(".")) {
      return { valid: false, error: "invalid", normalized: raw };
    }
    return { valid: true, normalized: url.toString() };
  } catch {
    return { valid: false, error: "invalid", normalized: raw };
  }
}

export default function LinkField({
  label,
  value: stored,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (next: string) => void;
}) {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
  const { pages } = usePages();

  // Normalised once, here: a block saved before its link field existed has no
  // key at all, and every line below would otherwise have to guard for it.
  const value = stored ?? "";

  // A value that matches a page path starts the field in "page" mode.
  const pagePaths = useMemo(() => {
    const byId = new Map(pages.map((p) => [p.id, p]));
    return pages.map((page) => {
      const parent = page.parentId ? byId.get(page.parentId) : null;
      return {
        id: page.id,
        path: parent ? `/${parent.slug}/${page.slug}` : `/${page.slug}`,
        label: parent
          ? `${tr(parent.title, locale)} › ${tr(page.title, locale)}`
          : tr(page.title, locale),
        status: page.status,
      };
    });
  }, [pages, locale]);

  const [mode, setMode] = useState<Mode>(() =>
    !value || value.startsWith("/") ? "page" : "url",
  );

  const check = validateLink(value);
  const knownPage = pagePaths.find((p) => p.path === value);

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>

      <div className="mb-2 flex flex-wrap gap-2">
        {(["page", "url"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              onChange("");
            }}
            aria-pressed={mode === option}
            className={
              mode === option
                ? "flex min-h-9 items-center gap-1.5 rounded-lg border border-primary-800 bg-primary-800 px-3 text-sm font-medium text-white"
                : "flex min-h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-600 hover:border-gray-400"
            }
          >
            {option === "page" ? (
              <DocumentDuplicateIcon className="h-4 w-4" aria-hidden />
            ) : (
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
            )}
            {t(`link.mode.${option}`)}
          </button>
        ))}
      </div>

      {mode === "page" ? (
        <>
          <Select
            label={t("link.choosePage")}
            srOnlyLabel
            value={knownPage ? knownPage.path : ""}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{t("link.pickPage")}</option>
            {pagePaths.map((page) => (
              <option key={page.id} value={page.path}>
                {page.label}
                {page.status !== "published"
                  ? ` (${t(`admin.pages.status.${page.status}`)})`
                  : ""}
              </option>
            ))}
          </Select>

          {value && !knownPage && (
            <p className="mt-1.5 text-xs text-amber-700">
              {t("link.unknownPage", { path: value })}
            </p>
          )}
          {knownPage && knownPage.status !== "published" && (
            <p className="mt-1.5 text-xs text-amber-700">
              {t("link.pageNotPublished")}
            </p>
          )}
        </>
      ) : (
        <>
          <Input
            label={t("link.url")}
            srOnlyLabel
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              // Normalise on blur so a valid URL is stored consistently.
              const result = validateLink(value);
              if (result.valid && result.normalized !== value) {
                onChange(result.normalized);
              }
            }}
            placeholder="https://…"
            inputMode="url"
            spellCheck={false}
            error={
              !check.valid
                ? t(`link.error.${check.error}`)
                : undefined
            }
          />

          {check.valid && value && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
              <LinkIcon className="h-3.5 w-3.5" aria-hidden />
              {t("link.opensExternal")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
