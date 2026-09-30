import { useCallback, useRef, useState } from "react";
import ConfirmDialog, {
  type ConfirmRequest,
} from "@/components/ui/ConfirmDialog";

/**
 * `window.confirm`, replaced by something the site designed — and with the same
 * shape at the call site, so a page reads the way it always did:
 *
 * ```tsx
 * const { confirm, dialog } = useConfirm();
 * if (!(await confirm({ title: …, tone: "danger" }))) return;
 * …
 * return <AdminLayout>{…}{dialog}</AdminLayout>;
 * ```
 *
 * The promise is the trick. A dialog is asynchronous and `window.confirm` is
 * not, so replacing it usually means tearing every handler into a "start" half
 * and a "really do it" half, with the pending action parked in state. Resolving
 * a promise when a button is pressed keeps all of that inside the hook: one
 * `await`, and the handler carries on reading top to bottom.
 */
export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const [busy, setBusy] = useState(false);

  // The other half of the promise, kept until a button answers it.
  const resolver = useRef<((answer: boolean) => void) | null>(null);

  const settle = useCallback((answer: boolean) => {
    resolver.current?.(answer);
    resolver.current = null;
    setRequest(null);
    setBusy(false);
  }, []);

  const confirm = useCallback((next: ConfirmRequest) => {
    // A second question while one is open would strand the first promise and
    // the handler awaiting it would never continue. Answer it "no" first.
    resolver.current?.(false);

    setRequest(next);
    setBusy(false);

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  return {
    confirm,
    /** Render this once, anywhere in the screen. */
    dialog: (
      <ConfirmDialog
        open={!!request}
        request={request}
        busy={busy}
        onConfirm={() => {
          // The dialog stays up with a spinner until the caller has finished:
          // a delete that closes its dialog and then takes two seconds looks
          // like a button that did nothing.
          setBusy(true);
          resolver.current?.(true);
          resolver.current = null;
        }}
        onCancel={() => settle(false)}
      />
    ),
    /** Closes the dialog once the confirmed action has finished. */
    done: useCallback(() => {
      setRequest(null);
      setBusy(false);
    }, []),
  };
}
