import { config } from "dotenv";
config();

// If you don't need these configurable via env vars you can define the default values here
const DEFAULT_NAME = "addon-fidel";

if (!process.env.LOKE_CLIENT_ID) throw new Error("LOKE_CLIENT_ID is required");
if (!process.env.LOKE_CLIENT_SECRET)
  throw new Error("LOKE_CLIENT_SECRET is required");
if (!process.env.WEBHOOK_SECRET) throw new Error("WEBHOOK_SECRET is required");
if (!process.env.COOKIE_KEY) throw new Error("COOKIE_KEY is required");

// Configuration can be customized via env vars
export const name = process.env.NAME || DEFAULT_NAME;
export const port = process.env.PORT || 3000;
export const baseUrl: string =
  process.env.BASE_URL || `http://localhost:${port}/`;
export const isDev = process.env.NODE_ENV !== "production";
export const useMock = isDev && process.env.USE_MOCK_REPO === "true";
export const usePostgres = !useMock;
export const metricsInstance = process.env.DYNO || "unknown";
export const lokeWebhookSecret = process.env.WEBHOOK_SECRET;
export const lokeClientId = process.env.LOKE_CLIENT_ID;
export const lokeClientSecret = process.env.LOKE_CLIENT_SECRET;
export const lokeIssuerUrl: string =
  process.env.LOKE_ISSUER_URL || "https://auth-next.loke.global/";

export const cookieKeys: string[] = [
  process.env.COOKIE_KEY,
  process.env.PREVIOUS_COOKIE_KEY,
].filter(Boolean) as string[];

export const FIDEL_BASE_URL: string =
  process.env.FIDEL_BASE_URL || "https://api.fidel.uk/v1";
