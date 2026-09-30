import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { api } from "@/utils/api";
import type { CartItem, Quote } from "@/types/content";

/** Where the cart survives a reload. Per browser, which is what a cart is. */
const STORAGE_KEY = "accelerez.cart";

/** The same ceiling the API enforces: a plan bought eleven times is a typo. */
export const MAX_QUANTITY = 10;

type CartState = {
  items: CartItem[];
  /** How many things are in it — the badge on the header's bag. */
  count: number;
  /** The server's pricing of `items`. Null while empty or not yet asked. */
  quote: Quote | null;
  quoting: boolean;
  /** Lines the server said can no longer be bought, and which were removed. */
  removed: number;
  add: (item: CartItem) => void;
  setQuantity: (productId: number, variantId: string, quantity: number) => void;
  remove: (productId: number, variantId: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartState | null>(null);

const same = (a: CartItem, productId: number, variantId: string) =>
  a.productId === productId && a.variantId === variantId;

function readStored(): CartItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (item): item is CartItem =>
            Number.isInteger(item?.productId) &&
            typeof item?.variantId === "string" &&
            Number.isInteger(item?.quantity) &&
            item.quantity > 0,
        )
      : [];
  } catch {
    // Private windows, blocked storage: the cart simply starts empty.
    return [];
  }
}

/**
 * The shop's cart.
 *
 * **The browser keeps what is in it; the server says what it costs.** Only
 * product, variant and quantity are stored — never a name or a price, which
 * would go stale the moment an editor changed them. Every change asks
 * `/orders/quote` for today's lines, and that answer is all the drawer and the
 * checkout page ever show. A line the shop no longer sells is dropped from the
 * cart, and `removed` says so once, rather than it vanishing unexplained.
 *
 * It starts empty on the server and on the first render in the browser, then
 * reads storage — so the badge never makes the page hydrate differently.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [removed, setRemoved] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Guards against a slow earlier quote overwriting a newer one.
  const requestId = useRef(0);

  useEffect(() => {
    setItems(readStored());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Not persisted; the cart still works for this visit.
    }
  }, [items, loaded]);

  useEffect(() => {
    if (!loaded) return;
    if (!items.length) {
      setQuote(null);
      return;
    }

    const id = ++requestId.current;
    setQuoting(true);

    api
      .post<Quote>("/orders/quote", { items, locale: locale ?? "ro" })
      .then(({ data }) => {
        if (id !== requestId.current) return;
        setQuote(data);
        if (data.unavailable.length) {
          setRemoved(data.unavailable.length);
          setItems((current) =>
            current.filter(
              (item) => !data.unavailable.some((gone) => same(item, gone.productId, gone.variantId)),
            ),
          );
        }
      })
      .catch(() => {
        // The last good quote stays on screen; the next change asks again.
      })
      .finally(() => {
        if (id === requestId.current) setQuoting(false);
      });
  }, [items, loaded, locale]);

  const add = useCallback((item: CartItem) => {
    setRemoved(0);
    setItems((current) => {
      const existing = current.find((line) => same(line, item.productId, item.variantId));
      if (!existing) return [...current, { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity) }];
      return current.map((line) =>
        line === existing
          ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + item.quantity) }
          : line,
      );
    });
  }, []);

  const setQuantity = useCallback((productId: number, variantId: string, quantity: number) => {
    setItems((current) =>
      quantity < 1
        ? current.filter((line) => !same(line, productId, variantId))
        : current.map((line) =>
            same(line, productId, variantId)
              ? { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }
              : line,
          ),
    );
  }, []);

  const remove = useCallback(
    (productId: number, variantId: string) =>
      setItems((current) => current.filter((line) => !same(line, productId, variantId))),
    [],
  );

  const clear = useCallback(() => {
    setItems([]);
    setRemoved(0);
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      quote,
      quoting,
      removed,
      add,
      setQuantity,
      remove,
      clear,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [items, quote, quoting, removed, add, setQuantity, remove, clear, drawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart needs a CartProvider above it — see _app.tsx.");
  return cart;
}
