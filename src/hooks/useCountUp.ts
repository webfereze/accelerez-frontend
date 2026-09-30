import { useEffect, useRef, useState } from "react";

/**
 * Counts a number up once, when it first scrolls into view.
 *
 * **The final value is what renders until the animation starts**, not zero. A
 * counter that ships as "0" shows nothing useful to a crawler, to a reader
 * without JavaScript, or in the instant before hydration — and a page full of
 * zeroes reads as broken data rather than as an animation waiting to happen.
 *
 * Eased out rather than linear: a number that decelerates into its final value
 * reads as arriving; one that stops dead at full speed reads as a glitch.
 *
 * Under `prefers-reduced-motion` it never animates and simply is the value.
 */
export function useCountUp(value: number, duration = 1400) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined" ||
      !Number.isFinite(value)
    ) {
      setShown(value);
      return;
    }

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setShown(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setShown(0);
        frame = window.requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return { ref, shown };
}
