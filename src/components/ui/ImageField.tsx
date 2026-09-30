import { useRef, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "./Button";
import Input from "./Input";
import { api, apiErrorMessage } from "@/utils/api";

/**
 * Uploads one image to R2 and returns its public URL.
 *
 * The alt text sits next to the upload on purpose: an image without alt text
 * fails the accessibility bar this site is legally held to, so the field is
 * never somewhere else in the form.
 */
export default function ImageField({
  label,
  url,
  alt,
  onChange,
  altLabel,
}: {
  label: string;
  url: string | null;
  /** Alt text for the active editing language (kept simple — one string). */
  alt: string;
  onChange: (next: { url: string | null; alt: string }) => void;
  altLabel?: string;
}) {
  const { t } = useTranslation("common");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const { data } = await api.post<{ url: string }>(
        "/admin/upload/image",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      onChange({ url: data.url, alt });
    } catch (err) {
      setError(apiErrorMessage(err, t("image.uploadFailed")));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-gray-700">{label}</span>

      {url ? (
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
          {/* Plain <img>: the URL is remote and arbitrary, and this is the
              admin preview — next/image is used on the public renderer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt || ""}
            className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-gray-200"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="truncate text-xs text-gray-500">{url}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                loading={uploading}
              >
                {t("image.replace")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => onChange({ url: null, alt })}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
                {t("image.remove")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/40 disabled:opacity-60"
        >
          <PhotoIcon className="h-8 w-8 text-gray-400" aria-hidden />
          <span className="mt-2 text-sm font-medium text-gray-700">
            {uploading ? t("image.uploading") : t("image.choose")}
          </span>
          <span className="mt-0.5 text-xs text-gray-400">
            {t("image.formats")}
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Input
        label={altLabel ?? t("image.alt")}
        value={alt}
        onChange={(e) => onChange({ url, alt: e.target.value })}
        hint={t("image.altHint")}
      />
    </div>
  );
}
