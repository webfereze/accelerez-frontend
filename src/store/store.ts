import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import authReducer from "./authSlice";

/**
 * The store, and deliberately a small one.
 *
 * Only the admin session lives here — it is the one piece of state that several
 * unrelated components need to agree on (the sidebar's sign-out, the layout's
 * auth gate, the API client's token). Public pages are server-rendered and hold
 * their data in props; putting that in a store would be state for its own sake.
 *
 * No persistence layer: the token is already in `localStorage`, written by the
 * API client, and a second copy of it in a rehydrated store is a second thing
 * that can be stale.
 */
export const store = configureStore({
  reducer: { auth: authReducer },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
