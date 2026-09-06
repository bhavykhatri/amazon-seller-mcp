import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

const KEYS = [
  "SP_API_CLIENT_ID",
  "SP_API_CLIENT_SECRET",
  "SP_API_REFRESH_TOKEN",
  "SP_API_SELLER_ID",
  "SP_API_MARKETPLACE_ID",
  "SP_API_ENDPOINT",
  "SP_API_TOKEN_ENDPOINT",
];

function clearEnv(): void {
  for (const k of KEYS) delete process.env[k];
}

test("loadConfig applies India/EU defaults when env is unset", () => {
  clearEnv();
  const c = loadConfig();
  assert.equal(c.marketplaceId, "A21TJRUUN4KGV");
  assert.equal(c.endpoint, "https://sellingpartnerapi-eu.amazon.com");
  assert.equal(c.tokenEndpoint, "https://api.amazon.com/auth/o2/token");
});

test("loadConfig reads values from the environment", () => {
  clearEnv();
  process.env.SP_API_CLIENT_ID = "cid";
  process.env.SP_API_MARKETPLACE_ID = "ATVPDKIKX0DER";
  process.env.SP_API_ENDPOINT = "https://sellingpartnerapi-na.amazon.com";
  const c = loadConfig();
  assert.equal(c.clientId, "cid");
  assert.equal(c.marketplaceId, "ATVPDKIKX0DER");
  assert.equal(c.endpoint, "https://sellingpartnerapi-na.amazon.com");
  clearEnv();
});
