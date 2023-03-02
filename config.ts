// Environment variables can't be unwrapped by webpack, so we need to be verbose
// https://github.com/vercel/next.js/issues/19420
export const LOKE_API_URL =
  process.env.LOKE_API_URL ?? "https://api-next.loke.global";
export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
export const LOKE_ISSUER =
  process.env.LOKE_ISSUER ?? "https://auth.loke.global";
export const LOKE_CLIENT_ID = process.env.LOKE_CLIENT_ID ?? "";
if (!LOKE_CLIENT_ID) throw new Error("LOKE_CLIENT_ID is required");
export let LOKE_CLIENT_SECRET = "";

// Secret shouldn't be exposed in browser
if (typeof window === "undefined") {
  LOKE_CLIENT_SECRET = process.env.LOKE_CLIENT_SECRET ?? "";
  if (!LOKE_CLIENT_SECRET) throw new Error("LOKE_CLIENT_SECRET is required");
}
