import { useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

/**
 * Two photographs of the same person, one dragged across the other.
 *
 * **The new picture sits on top and is pulled over the old one.** The "before"
 * is the whole frame; the "after" is clipped to the right of the divider, so
 * dragging left drags the result across the starting point. That direction is
 * the point: the gesture *is* the claim being made, and a slider that reveals
 * the old photograph instead tells the story backwards.
 *
 * **It is a slider, not a picture with a gimmick.** The handle is a real
 * `role="slider"`: arrow keys move it, Home and End throw it to either end,
 * and it is reachable by tab. A comparison that only works with a mouse is one
 * a third of readers cannot use, and this is the one element on the page whose
 * whole content is behind an interaction.
 *
 * **Vertical scrolling still belongs to the page** (`touch-pan-y`). A frame
 * this tall that swallowed every touch would trap a thumb halfway down the
 * page — the horizontal drag is ours, the vertical one is never taken.
 *
 * The pointer is captured on the frame rather than the handle, so a drag
 * continues when the finger leaves the picture and a tap anywhere in the frame
 * jumps the divider there — the handle is a target, not a requirement.
 */
export default function BeforeAfter({
  before,
  beforeAlt = "",
  after,
  afterAlt = "",
  beforeLabel,
  afterLabel,
  ariaLabel,
  priority = false,
  className,
}: {
  before: string;
  beforeAlt?: string;
  after: string;
  afterAlt?: string;
  beforeLabel: string;
  afterLabel: string;
  /** What the slider is called, for a reader who cannot see either picture. */
  ariaLabel: string;
  priority?: boolean;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const moveTo = (clientX: number) => {
    const box = frame.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    const next = ((clientX - box.left) / box.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  };

  const step = (delta: number) =>
    setPosition((current) => Math.min(100, Math.max(0, current + delta)));

  return (
    <div
      ref={frame}
      className={clsx(
        "relative isolate touch-pan-y select-none overflow-hidden rounded-card bg-ink-900 ring-1 ring-inset ring-white/10",
        dragging ? "cursor-grabbing" : "cursor-grab",
        className,
      )}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
        moveTo(event.clientX);
      }}
      onPointerMove={(event) => {
        if (dragging) moveTo(event.clientX);
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        setDragging(false);
      }}
      onPointerCancel={() => setDragging(false)}
    >
      <Image
        src={before}
        alt={beforeAlt}
        fill
        sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
        priority={priority}
        className="-z-10 object-cover object-top"
        draggable={false}
      />

      {/* The result, clipped to the right of the divider. `clip-path` rather
          than a width: the picture must stay the size of the whole frame, or
          the two halves show different crops of two different people. */}
      <div
        className="absolute inset-0 -z-10"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        aria-hidden={position >= 100}
      >
        <Image
          src={after}
          alt={afterAlt}
          fill
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="object-cover object-top"
          draggable={false}
        />
      </div>

      <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-ink-950/70 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/85 backdrop-blur-xs">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-acid-500/90 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-950 backdrop-blur-xs">
        {afterLabel}
      </span>

      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white/90"
        style={{ left: `${position}%` }}
      >
        <button
          type="button"
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`${Math.round(position)}%`}
          onKeyDown={(event) => {
            const keys: Record<string, () => void> = {
              ArrowLeft: () => step(-4),
              ArrowRight: () => step(4),
              ArrowDown: () => step(-4),
              ArrowUp: () => step(4),
              Home: () => setPosition(0),
              End: () => setPosition(100),
            };
            const handler = keys[event.key];
            if (!handler) return;
            event.preventDefault();
            handler();
          }}
          // The divider ignores the pointer so a drag anywhere in the frame is
          // not interrupted by crossing the handle; the handle itself takes it
          // back, because a control you cannot grab is a decoration.
          className="pointer-events-auto absolute top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-white text-ink-950 shadow-[0_8px_30px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid-500 active:cursor-grabbing motion-reduce:transition-none"
        >
          <ChevronLeftIcon strokeWidth={2.5} className="h-4 w-4 -mr-0.5" aria-hidden />
          <ChevronRightIcon strokeWidth={2.5} className="h-4 w-4 -ml-0.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
