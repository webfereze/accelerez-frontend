import { useCallback, useEffect } from "react";
import Image from "next/image";
import { useTranslation } from "next-i18next/pages";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/**
 * The full-screen image viewer, shared by every block that shows photographs.
 *
 * Lifted out of `GalleryBlock`, which owned the only copy. The moment a second
 * block wanted to open a gallery, keeping it there would have meant either a
 * duplicate — two viewers drifting apart on keyboard handling and scroll
 * locking, which is exactly the kind of thing nobody notices is broken in the
 * copy — or one block importing from another, which is worse.
 *
 * **Controlled.** The parent owns the index, because the parent is what decides
 * which thumbnail was clicked and, in the preview block, that the eleventh
 * thumbnail means "open at the eleventh image" rather than at one of the five
 * on screen.
 */

/** The minimum a picture needs to be viewable. Blocks may hold more. */
export type LightboxImage = {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
};

export default function Lightbox({
  images,
  index,
  onIndexChange,
  onClose,
  label,
}: {
  images: LightboxImage[];
  /** `null` is closed. */
  index: number | null;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  /** Names the dialog for a screen reader — usually the block's own title. */
  label?: string;
}) {
  const { t } = useTranslation("common");

  const move = useCallback(
    (step: number) => {
      if (index === null || images.length === 0) return;
      // Wraps, so the last image's "next" is the first rather than a dead
      // button at each end.
      onIndexChange((index + step + images.length) % images.length);
    },
    [images.length, index, onIndexChange],
  );

  useEffect(() => {
    if (index === null) return undefined;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };

    document.addEventListener("keydown", onKey);
    // The page behind must not scroll while the overlay is up. The previous
    // value is restored rather than cleared, so a viewer opened from inside
    // something that had already locked scrolling does not unlock it on close.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [index, move, onClose]);

  // Narrowed once here so the markup below needs no repeated assertions:
  // past this point there is both an index and an image at it.
  if (index === null) return null;
  const active = images[index];
  if (!active) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label || t("blocks.gallery.name")}
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm tabular-nums opacity-70">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          aria-label={t("common.close")}
          onClick={onClose}
          className="rounded-full bg-ink-900/10 p-2.5 hover:bg-ink-900/20"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4">
        {images.length > 1 && (
          <button
            type="button"
            aria-label={t("blocks.gallery.previous")}
            onClick={() => move(-1)}
            className="absolute left-2 z-10 rounded-full bg-ink-900/10 p-3 text-white hover:bg-ink-900/20"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        )}

        <Image
          src={active.url}
          alt={active.alt || active.caption || ""}
          width={1600}
          height={1200}
          className="max-h-full w-auto max-w-full object-contain"
        />

        {images.length > 1 && (
          <button
            type="button"
            aria-label={t("blocks.gallery.next")}
            onClick={() => move(1)}
            className="absolute right-2 z-10 rounded-full bg-ink-900/10 p-3 text-white hover:bg-ink-900/20"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {active.caption && (
        <p className="px-4 pb-5 text-center text-sm text-white/80">
          {active.caption}
        </p>
      )}
    </div>
  );
}
