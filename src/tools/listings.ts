// Listings Items API tools: list, get, upsert, set quantity, delete.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SpApiClient } from "../spapi/client.js";
import { jsonResult, errorResult } from "./shared.js";

export function registerListingTools(server: McpServer, client: SpApiClient): void {
  server.registerTool(
    "list_listings",
    {
      title: "List all listings",
      description:
        "Real-time list of catalogued SKUs for the seller (searchListingsItems). Paginates through all pages.",
      inputSchema: {},
    },
    async () => {
      try {
        const items: unknown[] = [];
        let pageToken: string | undefined;
        const MAX_PAGES = 500; // safety cap against a misbehaving cursor
        for (let page = 0; page < MAX_PAGES; page++) {
          const result = (await client.searchListingsItems(pageToken)) as {
            items?: unknown[];
            pagination?: { nextToken?: string };
          };
          items.push(...(result.items ?? []));
          pageToken = result.pagination?.nextToken;
          if (!pageToken) break;
        }
        return jsonResult({ count: items.length, items });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_listing",
    {
      title: "Get a listing",
      description:
        "Full details for one SKU: summaries (ASIN/status), attributes, offers, issues, and fulfillment availability.",
      inputSchema: {
        sku: z.string().describe("The seller SKU."),
        includedData: z
          .string()
          .optional()
          .describe("Comma-separated data sets. Default: summaries,attributes,offers,issues,fulfillmentAvailability"),
      },
    },
    async ({ sku, includedData }) => {
      try {
        return jsonResult(await client.getListingItem(sku, includedData));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "upsert_listing",
    {
      title: "Create or update a listing",
      description:
        "Creates or updates a listing via PUT. Provide productType, sku, and the full attributes object. " +
        "Use requirements=LISTING for a complete/offer listing or LISTING_PRODUCT_ONLY for a product-only draft.",
      inputSchema: {
        sku: z.string().describe("The seller SKU."),
        productType: z.string().describe("Amazon product type, e.g. SHIRT."),
        attributes: z.record(z.any()).describe("The listing attributes object (SP-API schema for the product type)."),
        requirements: z.enum(["LISTING", "LISTING_PRODUCT_ONLY", "LISTING_OFFER_ONLY"]).optional(),
      },
    },
    async ({ sku, productType, attributes, requirements }) => {
      try {
        return jsonResult(
          await client.putListingItem(sku, productType, attributes as Record<string, unknown>, requirements ?? "LISTING")
        );
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "set_quantity",
    {
      title: "Set listing quantity",
      description: "Sets the fulfillment quantity for a SKU (merchant-fulfilled / DEFAULT channel).",
      inputSchema: {
        sku: z.string().describe("The seller SKU."),
        quantity: z.number().int().min(0).describe("New quantity (0 to remove the buyable offer)."),
        productType: z.string().describe("Amazon product type, e.g. SHIRT."),
      },
    },
    async ({ sku, quantity, productType }) => {
      try {
        const patches = [
          {
            op: "replace",
            path: "/attributes/fulfillment_availability",
            value: [{ fulfillment_channel_code: "DEFAULT", quantity }],
          },
        ];
        return jsonResult(await client.patchListingItem(sku, productType, patches));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "delete_listing",
    {
      title: "Delete a listing",
      description:
        "DESTRUCTIVE: permanently deletes the listing for a SKU. Requires confirm=true. " +
        "Tip: if the listing has an active offer, set quantity to 0 first, then delete.",
      inputSchema: {
        sku: z.string().describe("The seller SKU to delete."),
        confirm: z.boolean().describe("Must be true to actually delete."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ sku, confirm }) => {
      if (!confirm) {
        return errorResult(`Refusing to delete "${sku}" without confirm=true.`);
      }
      try {
        return jsonResult(await client.deleteListingItem(sku));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "update_price",
    {
      title: "Update listing price",
      description:
        "Convenience: sets the selling price (and optional MRP) for a SKU via a purchasable_offer PATCH, without a full upsert.",
      inputSchema: {
        sku: z.string().describe("The seller SKU."),
        productType: z.string().describe("Amazon product type, e.g. SHIRT."),
        price: z.number().positive().describe("Selling price (value with tax)."),
        mrp: z.number().positive().optional().describe("Maximum Retail Price (value with tax)."),
        currency: z.string().optional().describe("Currency code. Default INR."),
      },
    },
    async ({ sku, productType, price, mrp, currency }) => {
      try {
        const marketplaceId = client.marketplaceId;
        const offer: Record<string, unknown> = {
          currency: currency ?? "INR",
          audience: "ALL",
          our_price: [{ schedule: [{ value_with_tax: price }] }],
          marketplace_id: marketplaceId,
        };
        if (mrp !== undefined) offer.maximum_retail_price = [{ schedule: [{ value_with_tax: mrp }] }];
        const patches = [{ op: "replace", path: "/attributes/purchasable_offer", value: [offer] }];
        return jsonResult(await client.patchListingItem(sku, productType, patches));
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
