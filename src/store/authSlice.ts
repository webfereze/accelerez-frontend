import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { setToken } from "@/utils/api";

export type AuthUser = {
  id: number;
  email: string;
  /** The handle the portal's addresses use instead of the id. */
  slug?: string | null;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  locale?: string;
  role: "admin" | "editor" | "trainer" | "client";
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
};

const initialState: AuthState = { user: null, token: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      // Mirrored into localStorage so the axios interceptor can read it without
      // reaching into the store.
      setToken(action.payload.token);
    },
    logout(state) {
      state.user = null;
      state.token = null;
      setToken(null);
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
