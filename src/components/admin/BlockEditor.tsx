import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next/pages";
import {
  Bars2Icon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import PreviewFrame from "@/components/admin/PreviewFrame";
import { useConfirm } from "@/hooks/useConfirm";
import { useDragReorder } from "@/hooks/useDragReorder";
import {
  BLOCK_DEFINITIONS,
  createBlock,
  getBlockDefinition,
} from "@/blocks/registry";
import {
  BACKGROUND_SWATCHES,
  BLOCK_BACKGROUNDS,
  backgroundOf,
  type BlockBackground,
} from "@/blocks/background";
import type { Block, BlockType } from "@/blocks/types";

/**
 * Builds a page out of blocks: add, reorder, remove, edit.
 *
 * **Shut, the list is the page outline.** Every block opens collapsed, and each
 * row shows its type *and a line of its own content* — the heading an editor
 * typed, not "Card grid #4". That one addition is what turns a stack of
 * identical grey bars into something you can read down and recognise, which is
 * the whole job of this screen when a page has twelve sections.
 *
 * The summary is derived rather than stored: the first translated line the
 * block carries, in the language being edited. It is deliberately not a field
 * an editor has to fill in — a title for the admin that has to be kept in step
 * with the title on the page is a second copy of the same string.
 *
 * The editor for each type comes from the block registry; this component knows
 * nothing about individual block shapes.
 */

/**
 * A line of this block's own content, for the collapsed row.
 *
 * Looks for the fields a block is most likely to lead with, then falls back to
 * the first translated string anywhere in `data`. Returns an empty string when
 * the block has no text at all — a gallery, an image — and the row then shows
 * the type alone, which is the honest answer.
 */
function summarise(data: Record<string, unknown>, locale: string): string {
  const preferred = ["title", "heading", "eyebrow", "name", "question", "html", "body"];

  const read = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const translated = value as Record<string, unknown>;
      const picked = translated[locale] ?? translated.ro ?? translated.hu ?? translated.en;
      if (typeof picked === "string") return picked;
    }
    return "";
  };

  for (const field of preferred) {
    const text = read(data?.[field]).replace(/<[^>]+>/g, " ").trim();
    if (text) return text;
  }

  // Nothing at the top level — try one level into an items array, which is
  // where a card grid or an accordion keeps its first real words.
  const items = data?.items;
  if (Array.isArray(items) && items.length > 0) {
    const first = items[0] as Record<string, unknown>;
    for (const field of preferred) {
      const text = read(first?.[field]).replace(/<[^>]+>/g, " ").trim();
      if (text) return text;
    }
  }

  return "";
}
export default function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
}) {
  const { t } = useTranslation("common");
  const { confirm, dialog, done } = useConfirm();
  const { locale } = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  /** The block type being previewed from inside the picker, if any. */
  const [previewType, setPreviewType] = useState<BlockType | null>(null);
  const [previewing, setPreviewing] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  /**
   * A page opens with **every block shut**.
   *
   * Twelve open editors is several screens of fields to scroll past before the
   * one being edited, and the shape of the page — which blocks it has, in what
   * order — is invisible under them. Shut, the list *is* the page outline, and
   * opening one is a click.
   *
   * It happens in an effect rather than in the initial state because the page
   * is fetched: this component's first render has no blocks yet. `hydrated`
   * makes it fire once, on the render the blocks arrive, so a block added
   * afterwards opens — somebody who just inserted a block wants to fill it in.
   */
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || blocks.length === 0) return;

    hydrated.current = true;
    setCollapsed(new Set(blocks.map((block) => block.id)));
  }, [blocks]);

  const togglePreview = (id: string) =>
    setPreviewing((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openPicker = () => {
    setQuery("");
    setPreviewType(null);
    setPickerOpen(true);
  };

  const add = (type: BlockType) => {
    const block = createBlock(type);
    if (block) onChange([...blocks, block]);
    setPickerOpen(false);
  };

  /**
   * The block list is a fixed, code-defined set — filtering happens here, not
   * through the API. Matches name and description in the active language so
   * "documente" finds the document list, and "poza" finds image + text.
   */
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return BLOCK_DEFINITIONS;

    return BLOCK_DEFINITIONS.filter(({ key, type }) =>
      [t(`blocks.${key}.name`), t(`blocks.${key}.description`), type]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [query, t]);

  const update = (id: string, data: Record<string, unknown>) =>
    onChange(
      blocks.map((block) => (block.id === id ? { ...block, data } : block)),
    );


  const { handlers, moveByKeyboard, isDragging, isOver } = useDragReorder(
    blocks,
    onChange,
    (block) => block.id,
  );

  const remove = async (id: string) => {
    const sure = await confirm({
      title: t("pages.blocks.remove"),
      message: t("pages.blocks.confirmRemove"),
      confirmLabel: t("common.delete"),
      tone: "danger",
    });
    if (!sure) return;

    onChange(blocks.filter((block) => block.id !== id));
    done();
  };

  return (
    <div className="min-w-0 space-y-3">
      {blocks.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <EmptyState
            icon={Squares2X2Icon}
            title={t("pages.blocks.emptyTitle")}
            description={t("pages.blocks.emptyDescription")}
            action={
              <Button onClick={openPicker}>
                <PlusIcon className="h-4 w-4" aria-hidden />
                {t("pages.blocks.add")}
              </Button>
            }
          />
        </div>
      )}

      {blocks.map((block, index) => {
        const definition = getBlockDefinition(block.type);
        const isCollapsed = collapsed.has(block.id);

        // A block whose type is no longer registered must not break the page.
        if (!definition) {
          return (
            <div
              key={block.id}
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
            >
              {t("pages.blocks.unknown", { type: block.type })}
              <button
                type="button"
                onClick={() => remove(block.id)}
                className="ml-2 underline"
              >
                {t("common.delete")}
              </button>
            </div>
          );
        }

        const { icon: Icon, Editor, Renderer, Preview, key } = definition;
        // Blocks whose content is resolved server-side supply their own preview.
        const PreviewComponent = Preview ?? Renderer;
        const showPreview = previewing.has(block.id);
        const summary = summarise(block.data, locale ?? "ro");

        return (
          <div
            key={block.id}
            {...handlers(block, index)}
            className={clsx(
              "group/block min-w-0 overflow-hidden rounded-xl border bg-white transition-shadow",
              isDragging(block) && "opacity-40",
              isOver(block)
                ? "border-primary-700 ring-2 ring-primary-200"
                : isCollapsed
                  ? "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  : "border-gray-300 shadow-sm",
            )}
          >
            <div
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 transition-colors",
                isCollapsed ? "bg-white" : "border-b border-gray-200 bg-gray-50",
              )}
            >
              {/* Drag to reorder; focus it and use the arrow keys instead. The
                  handle carries the position, so the number and the thing you
                  grab to change it are one control rather than two. */}
              <button
                type="button"
                aria-label={t("pages.blocks.dragHandle", { index: index + 1 })}
                title={t("pages.blocks.dragHint")}
                onKeyDown={(e) => moveByKeyboard(e, index)}
                className="group/handle flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold tabular-nums text-gray-500 transition-colors hover:bg-gray-900 hover:text-white active:cursor-grabbing"
              >
                <span className="group-hover/handle:hidden">{index + 1}</span>
                <Bars2Icon className="hidden h-4 w-4 group-hover/handle:block" aria-hidden />
              </button>

              <button
                type="button"
                onClick={() => toggle(block.id)}
                aria-expanded={!isCollapsed}
                className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
              >
                <Icon className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />

                <span className="min-w-0 flex-1">
                  {/* The block's own words lead, and the type is the caption
                      under them. The other way round — which is what this was —
                      makes every row of a twelve-block page look the same. */}
                  {summary ? (
                    <>
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {summary}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {t(`blocks.${key}.name`)}
                      </span>
                    </>
                  ) : (
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {t(`blocks.${key}.name`)}
                    </span>
                  )}
                </span>

                <ChevronDownIcon
                  aria-hidden
                  className={clsx(
                    "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
                    isCollapsed && "-rotate-90",
                  )}
                />
              </button>

              {/* Revealed on hover or keyboard focus. At rest the row is the
                  content; the controls arrive when you reach for them. */}
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/block:opacity-100 [@media(hover:none)]:opacity-100">
                <button
                  type="button"
                  onClick={() => togglePreview(block.id)}
                  aria-pressed={showPreview}
                  aria-label={t("pages.blocks.togglePreview")}
                  title={t("pages.blocks.togglePreview")}
                  className={clsx(
                    "rounded-lg p-2 transition-colors",
                    showPreview
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-700",
                  )}
                >
                  {showPreview ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(block.id)}
                  aria-label={t("pages.blocks.remove")}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isCollapsed && (
              // `min-w-0` on a flex/grid child is what stops a wide field —
              // a long URL, a code block, a two-column grid — from widening the
              // card past the column it sits in. Without it the card grows and
              // the whole editor scrolls sideways.
              <div className="min-w-0 overflow-x-auto p-4 sm:p-5">
                {/* The band the section sits on. Kept out of every block's own
                    editor because it is not a property of the *content* — the
                    same choice applies to all of them, and thirteen copies of
                    one row is thirteen places for it to drift. */}
                <BackgroundField
                  value={backgroundOf(block.data)}
                  onChange={(background) =>
                    update(block.id, { ...block.data, background })
                  }
                />

                <Editor
                  data={block.data}
                  onChange={(data: Record<string, unknown>) =>
                    update(block.id, data)
                  }
                />
              </div>
            )}

            {/* Live preview — the same component the public page renders. */}
            {showPreview && (
              <div className="border-t border-gray-200 bg-gray-100 p-4 sm:p-5">
                <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-gray-500">
                  {t("pages.blocks.preview")}
                </p>
                {/* Framed, so the block lays itself out against this box
                    rather than against the browser window. The editor column
                    is much narrower than the screen, and blocks size with
                    viewport breakpoints — unframed, a two-column block would
                    show two columns here however little room it has. */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <PreviewFrame width="full">
                    <PreviewComponent data={block.data} locale={locale ?? "ro"} />
                  </PreviewFrame>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {blocks.length > 0 && (
        // A dashed outline rather than a filled button: it reads as "the page
        // continues here", which is what it does, instead of as a second
        // primary action competing with Save.
        <button
          type="button"
          onClick={openPicker}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-900"
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          {t("pages.blocks.add")}
        </button>
      )}

      {/* Add-block picker */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("pages.blocks.pick")}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Enter inserts the first match — fastest path when you know the name.
            if (matches.length) add(matches[0].type);
          }}
        >
          <div className="relative">
            <MagnifyingGlassIcon
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("pages.blocks.searchPlaceholder")}
              aria-label={t("pages.blocks.search")}
              autoFocus
              className="min-h-11 w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-base text-gray-900 placeholder:text-gray-400 hover:border-gray-400 focus:outline-2 focus:outline-offset-0 focus:outline-primary-800"
            />
          </div>
        </form>

        {matches.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {t("pages.blocks.noMatches", { query })}
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {matches.map(({ type, key, icon: Icon }) => (
              <li key={type} className="relative">
                {/* Look before you insert. It opens over the picker rather than
                    replacing it, so choosing is still one click away and the
                    search term survives — which is the whole reason this is a
                    second dialog and not a different screen. */}
                <button
                  type="button"
                  onClick={() => setPreviewType(type)}
                  aria-label={t("pages.blocks.previewOf", {
                    name: t(`blocks.${key}.name`),
                  })}
                  title={t("pages.blocks.togglePreview")}
                  className="absolute right-2 top-2 z-10 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
                >
                  <EyeIcon className="h-4 w-4" aria-hidden />
                </button>

                <button
                  type="button"
                  onClick={() => add(type)}
                  className="group/pick flex h-full w-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 pr-12 text-left transition-colors hover:border-gray-900 hover:bg-gray-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover/pick:bg-gray-900">
                    <Icon
                      className="h-5 w-5 text-gray-600 transition-colors group-hover/pick:text-white"
                      aria-hidden
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {t(`blocks.${key}.name`)}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                      {t(`blocks.${key}.description`)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      {/* The preview, stacked over the picker. Headless UI nests dialogs
          correctly — the inner one takes the focus trap and Escape closes it
          first — so the picker is still there underneath when it closes. */}
      <Modal
        open={previewType !== null}
        onClose={() => setPreviewType(null)}
        size="lg"
        title={
          previewType
            ? t(`blocks.${getBlockDefinition(previewType)?.key ?? ""}.name`)
            : ""
        }
        description={
          previewType
            ? t(`blocks.${getBlockDefinition(previewType)?.key ?? ""}.description`)
            : undefined
        }
        footer={
          previewType && (
            <Button
              onClick={() => {
                add(previewType);
                setPreviewType(null);
              }}
            >
              <PlusIcon className="h-4 w-4" aria-hidden />
              {t("pages.blocks.addThis")}
            </Button>
          )
        }
      >
        {previewType && <SamplePreview type={previewType} locale={locale ?? "ro"} />}
      </Modal>

      {dialog}
    </div>
  );
}

/**
 * One block rendered with its sample content, for the picker's preview.
 *
 * Split out because it reads the registry twice and would otherwise clutter the
 * dialog's markup, and because it is the one place that has to decide what to
 * do with a block whose content comes from the page — `latestPosts` and the
 * rest have no articles here, so they supply a `Preview` of their own and this
 * uses it in preference to the real renderer.
 */
function SamplePreview({ type, locale }: { type: BlockType; locale: string }) {
  const { t } = useTranslation("common");
  const definition = getBlockDefinition(type);
  if (!definition) return null;

  const Body = definition.Preview ?? definition.Renderer;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-sand-50">
      {/* Framed, so the block lays itself out against this box rather than
          against the browser window — see `PreviewFrame`. */}
      <PreviewFrame width="full">
        <Body data={definition.sample(t)} locale={locale} />
      </PreviewFrame>
    </div>
  );
}


/**
 * Which band this block's section is painted on.
 *
 * Swatches rather than a dropdown: the choice *is* a colour, and a list of
 * words describing colours is a worse way to pick one. "Default" is a real
 * option and the first one — a block that has never been touched follows the
 * house rule for its type, and that has to be recoverable.
 */
function BackgroundField({
  value,
  onChange,
}: {
  value?: BlockBackground;
  onChange: (value: BlockBackground | undefined) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-gray-50 px-3 py-2.5">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-gray-500">
        {t("pages.blocks.background")}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-pressed={value === undefined}
          className={clsx(
            "min-h-8 rounded-md border px-2 text-xs font-medium transition-colors",
            value === undefined
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 bg-white text-gray-600 hover:border-gray-500",
          )}
        >
          {t("pages.blocks.backgroundDefault")}
        </button>

        {BLOCK_BACKGROUNDS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            aria-label={t(`pages.blocks.background.${option}`)}
            title={t(`pages.blocks.background.${option}`)}
            className={clsx(
              "h-8 w-8 rounded-md border-2 transition-colors",
              BACKGROUND_SWATCHES[option],
              value === option
                ? "border-gray-900 ring-2 ring-gray-900/15"
                : "border-gray-300 hover:border-gray-500",
            )}
          />
        ))}
      </div>
    </div>
  );
}
