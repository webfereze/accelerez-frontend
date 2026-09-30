import axios, { AxiosError } from "axios";

/**
 * Shared HTTP client. Everything that talks to the NestJS API goes through it,
 * so the base URL, the auth header and error handling live in one place.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8006",
  headers: { "Content-Type": "application/json" },
});

// Namespaced so two of these apps served from the same host — a staging and a
// production preview, say — do not sign each other out. Change the prefix to
// the project's name.
const TOKEN_KEY = "app.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

// Attached per request rather than once at creation: the token appears after
// login, and the client instance is created at module load.
api.interceptors.request.use((request) => {
  const token = getToken();
  if (token) request.headers.Authorization = `Bearer ${token}`;

  return request;
});

/**
 * Pulls a human-readable message out of an API error.
 *
 * Nest's ValidationPipe returns `message` as an array of field errors; a thrown
 * HttpException returns it as a string. Anything else — a network failure, an
 * unhandled 500 — falls back to the caller's own wording, because the raw text
 * would be unhelpful or in the wrong language.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error as AxiosError<{ message?: string | string[] }>).response?.data
      ?.message;
    if (Array.isArray(message) && message.length) return String(message[0]);
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

/** True when the API rejected the token — the caller should send the user to login. */
export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
