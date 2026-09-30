import { useEffect, useRef, useState } from "react";

/**
 * Moves an element against the scroll, for a parallax background.
 *
 * **Driven by `requestAnimationFrame`, not by the scroll event.** A scroll
 * listener that writes a style runs at the browser's scroll frequency, which on
 * a trackpad is far above the frame rate — so the work is done many times per
 * painted frame and the page stutters doing it. Reading in the listener and
 * writing in a frame is the difference between smooth and janky.
 *
 * It also **only runs while the element is on screen**, because a page with
 * three of these otherwise recalculates all three on every frame of a scroll
 * that is nowhere near two of them.
 *
 * Returns `0` under `prefers-reduced-motion`, and the element renders in its
 * resting position — parallax is exactly the kind of movement that makes some
 * readers ill, and it carries no information.
 *
 * @param strength How far to travel, as a fraction of the element's height.
 *   0.2 is a hint; past ~0.4 the background visibly slides out of its frame.
 */
export function useParallax<T extends HTMLElement>(strength = 0.2) {
  const ref = useRef<T>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let visible = false;

    const measure = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight || 1;

      // -1 when the element is just below the fold, +1 when just above it, 0
      // when its centre is level with the viewport's.
      const progress =
        (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2 + rect.height / 2);

      setOffset(progress * strength * rect.height);
    };

    const schedule = () => {
      if (!visible || frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { threshold: 0 },
    );

    observer.observe(element);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [strength]);

  return { ref, offset };
}
