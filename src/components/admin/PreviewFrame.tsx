import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { fontVariables } from "@/fonts";

/**
 * Renders a block inside an iframe, so the preview has a viewport of its own.
 *
 * Narrowing a `<div>` to 360px does **not** preview a phone. Blocks size
 * themselves with viewport breakpoints (`sm:`, `md:`), and those keep measuring
 * the real browser window however narrow the box around them is — so a "mobile"
 * preview on a desktop screen shows the desktop layout crushed into 360px,
 * which is a layout that exists nowhere.
 *
 * An iframe has its own viewport. At 360px wide, `sm:` and `md:` genuinely do
 * not apply, and what appears is what a phone would actually render.
 *
 * The parent's stylesheets are copied in rather than re-linked: Next hashes the
 * CSS filename per build, so cloning whatever the page is already using is both
 * simpler and always correct.
 */
export default function PreviewFrame({
  width,
  children,
}: {
  /** A pixel width to emulate, or `"full"` to fill the available space. */
  width: number | "full";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const [height, setHeight] = useState(240);

  useEffect(() => {
    const frame = ref.current;
    const target = frame?.contentDocument;
    if (!target) return;

    target.head.replaceChildren();
    for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
      target.head.appendChild(node.cloneNode(true));
    }

    // The font variables live on a wrapper in `_app`, which is outside this
    // document — without them the display face falls back mid-preview.
    target.body.className = fontVariables;
    target.body.style.margin = "0";
    target.body.style.background = "transparent";
    // A block that overruns its width must be clipped here rather than push
    // the frame wider than the box drawn around it.
    target.body.style.overflowX = "hidden";

    setDoc(target);
  }, []);

  // The frame cannot size itself: an iframe has no intrinsic height, and the
  // content's height only settles once the copied stylesheets have applied.
  useEffect(() => {
    if (!doc) return;

    /**
     * Capped, because a block can measure itself against this frame's own
     * viewport. A `100svh` hero would otherwise grow the frame, which grows
     * its viewport, which grows the hero — a loop with no end. `preview-surface`
     * already clamps the hero; the cap is the backstop for anything else that
     * reaches for a viewport unit.
     */
    const measure = () => setHeight(Math.min(doc.body.scrollHeight, 900));
    const observer = new ResizeObserver(measure);
    observer.observe(doc.body);
    measure();

    return () => observer.disconnect();
  }, [doc]);

  return (
    <iframe
      ref={ref}
      title="preview"
      // Nothing is loaded from outside, but the frame renders editor-supplied
      // HTML, so it is sandboxed to exactly what a preview needs.
      sandbox="allow-same-origin"
      scrolling="no"
      style={{
        width: width === "full" ? "100%" : `${width}px`,
        height: `${height}px`,
        border: "0",
        display: "block",
        margin: width === "full" ? undefined : "0 auto",
      }}
    >
      {doc && createPortal(<div className="preview-surface">{children}</div>, doc.body)}
    </iframe>
  );
}
