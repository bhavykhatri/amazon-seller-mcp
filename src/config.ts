// Loads and validates SP-API configuration from environment variables.
// A minimal .env loader is included for local development (no dotenv dependency).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface SpApiConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  sellerId: string;
  marketplaceId: string;
  endpoint: string;
  tokenEndpoint: string;
}

function loadDotEnv(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // No .env file — rely on the host-provided environment.
  }
}

export function loadConfig(): SpApiConfig {
  loadDotEnv();
  return {
    clientId: process.env.SP_API_CLIENT_ID ?? "",
    clientSecret: process.env.SP_API_CLIENT_SECRET ?? "",
    refreshToken: process.env.SP_API_REFRESH_TOKEN ?? "",
    sellerId: process.env.SP_API_SELLER_ID ?? "",
    marketplaceId: process.env.SP_API_MARKETPLACE_ID ?? "A21TJRUUN4KGV",
    endpoint: process.env.SP_API_ENDPOINT ?? "https://sellingpartnerapi-eu.amazon.com",
    tokenEndpoint: process.env.SP_API_TOKEN_ENDPOINT ?? "https://api.amazon.com/auth/o2/token",
  };
}
