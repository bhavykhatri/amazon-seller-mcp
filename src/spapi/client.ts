// SP-API client: LWA access-token caching + a typed request wrapper, plus
// helpers for the Sellers, Listings Items, and Product Type Definitions APIs.
// Auth is LWA-only (no AWS SigV4). All tools should go through this client.
import { gunzipSync } from "node:zlib";
import type { SpApiConfig } from "../config.js";

interface TokenCache {
  accessToken: string;
  expiresAt: number; // epoch ms
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class SpApiClient {
  private tokenCache: TokenCache | null = null;
  // Coalesces concurrent token refreshes into a single in-flight request.
  private tokenPromise: Promise<string> | null = null;

  constructor(private readonly config: SpApiConfig) {}

  private requireCreds(): void {
    const missing = (["clientId", "clientSecret", "refreshToken"] as const).filter(
      (k) => !this.config[k]
    );
    if (missing.length) {
      throw new Error(
        `Missing SP-API credentials: ${missing.join(", ")}. Set them in .env or the MCP host env.`
      );
    }
  }

  private requireSellerId(): string {
    if (!this.config.sellerId) {
      throw new Error("SP_API_SELLER_ID (Merchant Token) is required for this operation.");
    }
    return this.config.sellerId;
  }

  async getAccessToken(): Promise<string> {
    this.requireCreds();
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60_000) {
      return this.tokenCache.accessToken;
    }
    this.tokenPromise ??= this.fetchAccessToken().finally(() => {
      this.tokenPromise = null;
    });
    return this.tokenPromise;
  }

  private async fetchAccessToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.config.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });
    const res = await fetch(this.config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!res.ok || !data.access_token) {
      throw new Error(`LWA token request failed (${res.status}): ${JSON.stringify(data)}`);
    }
    this.tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    };
    return data.access_token;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    opts: { query?: Record<string, string | undefined>; body?: unknown } = {}
  ): Promise<T> {
    const url = new URL(path, this.config.endpoint);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
    const payload = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;

    for (let attempt = 0; ; attempt++) {
      const token = await this.getAccessToken();
      const res = await fetch(url, {
        method,
        headers: { "x-amz-access-token": token, "Content-Type": "application/json" },
        body: payload,
      });

      // Back off and retry on throttling (429) and transient server errors.
      if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const delayMs =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.min(1000 * 2 ** attempt, 8000) + Math.floor(Math.random() * 250);
        await sleep(delayMs);
        continue;
      }

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
      }
      return text ? (JSON.parse(text) as T) : ({} as T);
    }
  }

  // --- Sellers API ---
  getMarketplaceParticipations(): Promise<unknown> {
    return this.request("GET", "/sellers/v1/marketplaceParticipations");
  }

  // --- Listings Items API ---
  async searchListingsItems(pageToken?: string): Promise<unknown> {
    const sellerId = this.requireSellerId();
    return this.request("GET", `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}`, {
      query: {
        marketplaceIds: this.config.marketplaceId,
        includedData: "summaries,offers,fulfillmentAvailability",
        pageSize: "20",
        pageToken,
      },
    });
  }

  getListingItem(sku: string, includedData = "summaries,attributes,offers,issues,fulfillmentAvailability"): Promise<unknown> {
    const sellerId = this.requireSellerId();
    return this.request("GET", `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`, {
      query: { marketplaceIds: this.config.marketplaceId, includedData },
    });
  }

  putListingItem(sku: string, productType: string, attributes: Record<string, unknown>, requirements = "LISTING"): Promise<unknown> {
    const sellerId = this.requireSellerId();
    return this.request("PUT", `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`, {
      query: { marketplaceIds: this.config.marketplaceId },
      body: { productType, requirements, attributes },
    });
  }

  patchListingItem(sku: string, productType: string, patches: unknown[]): Promise<unknown> {
    const sellerId = this.requireSellerId();
    return this.request("PATCH", `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`, {
      query: { marketplaceIds: this.config.marketplaceId },
      body: { productType, patches },
    });
  }

  deleteListingItem(sku: string): Promise<unknown> {
    const sellerId = this.requireSellerId();
    return this.request("DELETE", `/listings/2021-08-01/items/${encodeURIComponent(sellerId)}/${encodeURIComponent(sku)}`, {
      query: { marketplaceIds: this.config.marketplaceId },
    });
  }

  // --- Product Type Definitions API ---
  getProductTypeDefinition(productType: string, locale = "en_IN"): Promise<unknown> {
    return this.request("GET", `/definitions/2020-09-01/productTypes/${encodeURIComponent(productType)}`, {
      query: { marketplaceIds: this.config.marketplaceId, requirements: "LISTING", locale },
    });
  }

  // --- Orders API (v0) ---
  getOrders(params: {
    createdAfter?: string;
    lastUpdatedAfter?: string;
    orderStatuses?: string[];
    maxResults?: number;
    nextToken?: string;
  } = {}): Promise<unknown> {
    const query: Record<string, string | undefined> = {
      MarketplaceIds: this.config.marketplaceId,
      MaxResultsPerPage: params.maxResults ? String(params.maxResults) : undefined,
      NextToken: params.nextToken,
    };
    if (params.nextToken) {
      // NextToken is exclusive of the other filters.
    } else if (params.lastUpdatedAfter) {
      query.LastUpdatedAfter = params.lastUpdatedAfter;
    } else {
      query.CreatedAfter = params.createdAfter ?? new Date(Date.now() - 30 * 864e5).toISOString();
    }
    if (params.orderStatuses?.length) query.OrderStatuses = params.orderStatuses.join(",");
    return this.request("GET", "/orders/v0/orders", { query });
  }

  getOrderItems(orderId: string): Promise<unknown> {
    return this.request("GET", `/orders/v0/orders/${encodeURIComponent(orderId)}/orderItems`);
  }

  // --- Reports API (2021-06-30) ---
  createReport(reportType: string): Promise<{ reportId: string }> {
    return this.request("POST", "/reports/2021-06-30/reports", {
      body: { reportType, marketplaceIds: [this.config.marketplaceId] },
    });
  }
  getReport(reportId: string): Promise<{ processingStatus: string; reportDocumentId?: string }> {
    return this.request("GET", `/reports/2021-06-30/reports/${encodeURIComponent(reportId)}`);
  }
  getReportDocument(documentId: string): Promise<{ url: string; compressionAlgorithm?: string }> {
    return this.request("GET", `/reports/2021-06-30/documents/${encodeURIComponent(documentId)}`);
  }

  // --- Feeds API (2021-06-30) ---
  createFeedDocument(contentType: string): Promise<{ feedDocumentId: string; url: string }> {
    return this.request("POST", "/feeds/2021-06-30/documents", { body: { contentType } });
  }
  createFeed(feedType: string, inputFeedDocumentId: string): Promise<{ feedId: string }> {
    return this.request("POST", "/feeds/2021-06-30/feeds", {
      body: { feedType, marketplaceIds: [this.config.marketplaceId], inputFeedDocumentId },
    });
  }
  getFeed(feedId: string): Promise<{ processingStatus: string; resultFeedDocumentId?: string }> {
    return this.request("GET", `/feeds/2021-06-30/feeds/${encodeURIComponent(feedId)}`);
  }

  // --- Document I/O (plain presigned URLs, no access token) ---
  async uploadToUrl(url: string, content: string, contentType: string): Promise<void> {
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: content });
    if (!res.ok) throw new Error(`Document upload failed (${res.status}): ${await res.text()}`);
  }
  async downloadText(url: string, compressionAlgorithm?: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Document download failed (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    return compressionAlgorithm === "GZIP" ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  }

  get marketplaceId(): string {
    return this.config.marketplaceId;
  }
}
