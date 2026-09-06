// Orders API tools.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SpApiClient } from "../spapi/client.js";
import { jsonResult, errorResult } from "./shared.js";

export function registerOrderTools(server: McpServer, client: SpApiClient): void {
  server.registerTool(
    "get_orders",
    {
      title: "Get orders",
      description:
        "Lists orders. Defaults to orders created in the last 30 days. Note: full buyer/address data requires the restricted PII role.",
      inputSchema: {
        createdAfter: z.string().optional().describe("ISO 8601 datetime. Default: 30 days ago."),
        lastUpdatedAfter: z.string().optional().describe("ISO 8601 datetime (use instead of createdAfter)."),
        orderStatuses: z
          .array(z.string())
          .optional()
          .describe("Filter, e.g. ['Unshipped','Shipped','Pending','Canceled']."),
        maxResults: z.number().int().min(1).max(100).optional(),
        nextToken: z.string().optional().describe("Pagination token from a previous response."),
      },
    },
    async (args) => {
      try {
        return jsonResult(await client.getOrders(args));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_order_items",
    {
      title: "Get order items",
      description: "Returns the line items for a specific order.",
      inputSchema: { orderId: z.string().describe("The Amazon order ID.") },
    },
    async ({ orderId }) => {
      try {
        return jsonResult(await client.getOrderItems(orderId));
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
