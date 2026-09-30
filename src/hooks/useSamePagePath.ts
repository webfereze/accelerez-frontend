import { useRouter } from "next/router";

/**
 * This page's address, **without the hash**, for a link that changes only the
 * language.
 *
 * `router.asPath` is the obvious thing to reach for and it is wrong here. On
 * the server it is `/`; in the browser, after a reader has followed an in-page
 * anchor, it is `/#some-section`. A language link built from it therefore
 * renders one `href` on the server and a different one on the client, which is
 * a hydration mismatch — React discards the server markup for that subtree and
 * re-renders it, and in the language switcher that is the whole header.
 *
 * The query string is kept, because a filtered listing should stay filtered
 * when the reader changes language. The hash is dropped, because it is browser
 * state rather than part of the address, and the browser keeps it anyway.
 */
export function useSamePagePath(): string {
  const { asPath, isReady } = useRouter();
  const path = asPath.split("#")[0];
  // A static page is rendered on the server without its query string, and the
  // browser's first render must match it — `/magazin?categorie=…` otherwise
  // hydrates with a different `href`. Once the router is ready the query is
  // known on both sides and the links pick it up.
  return isReady ? path : path.split("?")[0];
}
