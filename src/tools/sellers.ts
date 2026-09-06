// Sellers API tools.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpApiClient } from "../spapi/client.js";
import { jsonResult, errorResult } from "./shared.js";

export function registerSellerTools(server: McpServer, client: SpApiClient): void {
  server.registerTool(
    "get_seller_profile",
    {
      title: "Get seller profile",
      description:
        "Returns the seller's marketplace participations (store name, marketplace, currency, participation status).",
      inputSchema: {},
    },
    async () => {
      try {
        return jsonResult(await client.getMarketplaceParticipations());
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
