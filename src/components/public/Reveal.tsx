import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Fades a section up as it comes into view.
 *
 * **The visible state is the default.** The element renders in place, fully
 * opaque, and only becomes hidden once this component has mounted and confirmed
 * it can observe it. That order matters: with the hidden state as the default,
 * anything served without JavaScript — a crawler, a reader with scripting off,
 * the moment before hydration — would get a page of invisible content. An
 * animation is worth exactly nothing next to that.
 *
 * It also fires **once**. A section that re-animates every time it is scrolled
 * past turns a long page into a flicker, and the effect is meant to be noticed
 * on arrival, not repeatedly.
 *
 * Under `prefers-reduced-motion` nothing is ever hidden; globals.css collapses
 * the durations, and the guard here stops the element being transparent while
 * it waits for a transition that will not run.
 */
export default function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
}: {
  as?: "div" | "section" | "li" | "article" | "aside";
  /** Milliseconds, for staggering a row of cards. Keep it under ~240. */
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    // Armed only now — see the note above about the default being visible.
    setArmed(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      // A little before the edge, so the movement finishes as the reader
      // arrives rather than starting under their eyes.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={clsx(
        "motion-reduce:!translate-y-0 motion-reduce:!opacity-100",
        armed && "transition-[opacity,transform] duration-700 ease-out",
        armed && !shown && "translate-y-4 opacity-0",
        className,
      )}
      style={armed && !shown ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
