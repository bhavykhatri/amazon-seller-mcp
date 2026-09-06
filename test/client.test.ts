import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { SpApiClient } from "../src/spapi/client.js";

const config = {
  clientId: "cid",
  clientSecret: "sec",
  refreshToken: "ref",
  sellerId: "A123456789",
  marketplaceId: "A21TJRUUN4KGV",
  endpoint: "https://sellingpartnerapi-eu.amazon.com",
  tokenEndpoint: "https://api.amazon.com/auth/o2/token",
};

function mockRes(status: number, body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  const h: Record<string, string> = {};
  for (const k of Object.keys(headers)) h[k.toLowerCase()] = headers[k];
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => h[k.toLowerCase()] ?? null },
    json: async () => (typeof body === "string" ? JSON.parse(body) : body),
    text: async () => text,
  };
}

const isTokenUrl = (u: unknown): boolean => String(u).includes("/auth/o2/token");
const TOKEN_OK = () => mockRes(200, { access_token: "tok", expires_in: 3600 });

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("returns data on success (token exchange then API call)", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (url: unknown) => {
    calls.push(String(url));
    return isTokenUrl(url) ? TOKEN_OK() : mockRes(200, { payload: [{ ok: true }] });
  }) as typeof globalThis.fetch;

  const client = new SpApiClient(config);
  const data = await client.getMarketplaceParticipations();
  assert.deepEqual(data, { payload: [{ ok: true }] });
  assert.equal(calls.length, 2);
});

test("retries on 429 and honours Retry-After", async () => {
  let apiCalls = 0;
  globalThis.fetch = (async (url: unknown) => {
    if (isTokenUrl(url)) return TOKEN_OK();
    apiCalls++;
    if (apiCalls === 1) return mockRes(429, "slow down", { "retry-after": "0.01" });
    return mockRes(200, { payload: "ok" });
  }) as typeof globalThis.fetch;

  const client = new SpApiClient(config);
  const data = await client.getMarketplaceParticipations();
  assert.deepEqual(data, { payload: "ok" });
  assert.equal(apiCalls, 2);
});

test("caches the access token across requests", async () => {
  let tokenCalls = 0;
  let apiCalls = 0;
  globalThis.fetch = (async (url: unknown) => {
    if (isTokenUrl(url)) {
      tokenCalls++;
      return TOKEN_OK();
    }
    apiCalls++;
    return mockRes(200, { n: apiCalls });
  }) as typeof globalThis.fetch;

  const client = new SpApiClient(config);
  await client.getMarketplaceParticipations();
  await client.getMarketplaceParticipations();
  assert.equal(tokenCalls, 1);
  assert.equal(apiCalls, 2);
});

test("throws on a non-retryable error status", async () => {
  globalThis.fetch = (async (url: unknown) =>
    isTokenUrl(url) ? TOKEN_OK() : mockRes(400, "bad request")) as typeof globalThis.fetch;

  const client = new SpApiClient(config);
  await assert.rejects(() => client.getMarketplaceParticipations(), /failed \(400\)/);
});

test("throws when credentials are missing", async () => {
  const client = new SpApiClient({ ...config, clientId: "" });
  await assert.rejects(() => client.getMarketplaceParticipations(), /Missing SP-API credentials/);
});
