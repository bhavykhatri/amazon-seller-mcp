// Product Type Definitions API tools.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SpApiClient } from "../spapi/client.js";
import { jsonResult, errorResult } from "./shared.js";

export function registerDefinitionTools(server: McpServer, client: SpApiClient): void {
  server.registerTool(
    "get_product_type_definition",
    {
      title: "Get product type definition",
      description:
        "Fetches the product type definition metadata (includes a link to the JSON schema with required attributes and enums).",
      inputSchema: {
        productType: z.string().describe("Amazon product type, e.g. SHIRT, TOTE_BAG."),
        locale: z.string().optional().describe("Locale, default en_IN."),
      },
    },
    async ({ productType, locale }) => {
      try {
        return jsonResult(await client.getProductTypeDefinition(productType, locale ?? "en_IN"));
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
