import { useCallback, useState } from "react";

/**
 * Drag-to-reorder for a flat list, on the native HTML5 drag API — no extra
 * dependency, and it keeps working when the list is rendered server-side.
 *
 * Native drag is mouse-only, so `moveByKeyboard` is exposed alongside it: the
 * drag handle is focusable and responds to the arrow keys. Reordering has to be
 * possible without a pointer — this site is held to OUG 112/2018.
 */
export function useDragReorder<T>(
  items: T[],
  onReorder: (next: T[]) => void,
  getId: (item: T) => string | number,
) {
  const [draggingId, setDraggingId] = useState<string | number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);

  const reorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || to >= items.length) return;

      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onReorder(next);
    },
    [items, onReorder],
  );

  const handlers = useCallback(
    (item: T, index: number) => ({
      draggable: true,

      onDragStart: (event: React.DragEvent) => {
        setDraggingId(getId(item));
        event.dataTransfer.effectAllowed = "move";
        // Firefox refuses to start a drag without a payload.
        event.dataTransfer.setData("text/plain", String(getId(item)));
      },

      onDragEnter: () => setOverId(getId(item)),

      onDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },

      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        const from = items.findIndex((i) => getId(i) === draggingId);
        reorder(from, index);
        setDraggingId(null);
        setOverId(null);
      },

      onDragEnd: () => {
        setDraggingId(null);
        setOverId(null);
      },
    }),
    [items, draggingId, getId, reorder],
  );

  /** Arrow keys on a focused handle move the item — the keyboard equivalent. */
  const moveByKeyboard = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        reorder(index, index - 1);
      } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        reorder(index, index + 1);
      }
    },
    [reorder],
  );

  return {
    handlers,
    moveByKeyboard,
    isDragging: (item: T) => getId(item) === draggingId,
    isOver: (item: T) => getId(item) === overId && getId(item) !== draggingId,
  };
}
