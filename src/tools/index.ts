// Registers every MCP tool on the server.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SpApiClient } from "../spapi/client.js";
import { registerSellerTools } from "./sellers.js";
import { registerListingTools } from "./listings.js";
import { registerDefinitionTools } from "./definitions.js";
import { registerOrderTools } from "./orders.js";
import { registerReportTools } from "./reports.js";
import { registerFeedTools } from "./feeds.js";

export function registerAllTools(server: McpServer, client: SpApiClient): void {
  registerSellerTools(server, client);
  registerListingTools(server, client);
  registerDefinitionTools(server, client);
  registerOrderTools(server, client);
  registerReportTools(server, client);
  registerFeedTools(server, client);
}
