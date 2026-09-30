import { useRef, useState } from "react";
import { useTranslation } from "next-i18next/pages";
import { ArrowUpTrayIcon, DocumentTextIcon, TrashIcon } from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { api, apiErrorMessage } from "@/utils/api";
import { formatBytes } from "@/utils/files";

export type UploadedFile = {
  url: string;
  name: string;
  size: number | null;
  mimeType: string | null;
};

/**
 * Uploads a document and reports back what was stored.
 *
 * **The size and type are captured here, at upload, and stored on the record.**
 * They arrive with the URL from the API, so the public listing can print
 * "PDF, 2.4 MB" without a request per row — which is the difference between a
 * documents page that renders and one that waits.
 *
 * Replacing a file **does not delete the old one**. An older page revision, or
 * a link somebody has already shared, may still point at it; storage is cheap
 * and a dead link in an e-mail sent last week is not.
 */
export default function FileField({
  url,
  name,
  size,
  mimeType,
  onChange,
}: {
  url: string;
  name: string;
  size: number | null;
  mimeType: string | null;
  onChange: (file: UploadedFile) => void;
}) {
  const { t } = useTranslation("common");
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const body = new FormData();
      // The multipart field is `file` — Multer rejects any other name with a
      // bare "Unexpected field", so this and the controller have to agree.
      body.append("file", file);

      const response = await api.post<UploadedFile>("/admin/upload/document", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onChange({
        url: response.data.url,
        name: response.data.name,
        size: response.data.size ?? null,
        mimeType: response.data.mimeType ?? null,
      });
    } catch (caught) {
      setError(apiErrorMessage(caught, t("documents.uploadFailed")));
    } finally {
      setUploading(false);
      // Cleared so re-picking the same file fires `change` again.
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="grid gap-3">
      {url ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
            <DocumentTextIcon className="h-5 w-5 text-primary-700" aria-hidden />
          </span>

          <span className="min-w-0 flex-1">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm font-medium text-gray-900 hover:underline"
            >
              {name || url}
            </a>
            <span className="mt-0.5 block text-xs text-gray-500">
              {[mimeType, size ? formatBytes(size, "ro") : null]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>

          <Button
            variant="ghost"
            onClick={() => onChange({ url: "", name: "", size: null, mimeType: null })}
            aria-label={t("common.remove")}
          >
            <TrashIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          {t("documents.noFile")}
        </p>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          loading={uploading}
          onClick={() => input.current?.click()}
        >
          <ArrowUpTrayIcon className="h-4 w-4" aria-hidden />
          {url ? t("documents.replaceFile") : t("documents.chooseFile")}
        </Button>
        <span className="text-xs text-gray-500">{t("documents.formats")}</span>
      </div>

      <input
        ref={input}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
