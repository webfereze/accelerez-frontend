import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { appWithTranslation } from "next-i18next/pages";
import { store } from "@/store/store";
import { fontVariables } from "@/fonts";
import { AdminMenuProvider } from "@/contexts/AdminMenuContext";
import { CartProvider } from "@/contexts/CartContext";
import nextI18NextConfig from "../../next-i18next.config";
import "@/styles/globals.css";

/**
 * The providers every screen needs, wrapped once.
 *
 * Both are easy to skip and fail confusingly: `AdminLayout` calls
 * `useAdminMenu()` and `useAdminAuth()`, so without `AdminMenuProvider` and the
 * Redux store above them every admin screen throws on render rather than
 * showing anything that hints at the cause.
 *
 * `appWithTranslation` takes the imported config rather than letting
 * next-i18next look for it on disk — that lookup is not in a serverless bundle,
 * and it is the single most common way this app breaks in production while
 * passing locally.
 */
function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <AdminMenuProvider>
        <CartProvider>
          <div className={fontVariables}>
            <Component {...pageProps} />
            <Toaster
              position="top-right"
              toastOptions={{ duration: 4000, style: { fontSize: "14px" } }}
            />
          </div>
        </CartProvider>
      </AdminMenuProvider>
    </Provider>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
