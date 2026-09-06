#!/usr/bin/env node
// Amazon Seller MCP server (stdio).
// stdout is reserved for the MCP protocol — log only to stderr.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { SpApiClient } from "./spapi/client.js";
import { registerAllTools } from "./tools/index.js";

async function main(): Promise<void> {
  const config = loadConfig();

  const missing = (["clientId", "clientSecret", "refreshToken"] as const).filter((k) => !config[k]);
  if (missing.length) {
    console.error(`[warn] Missing SP-API credentials: ${missing.join(", ")}. Tools will error until these are set.`);
  }

  const client = new SpApiClient(config);
  const server = new McpServer({ name: "amazon-seller-mcp", version: "0.1.0" });
  registerAllTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("amazon-seller-mcp running on stdio");

  const shutdown = async (): Promise<void> => {
    await server.close().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error starting amazon-seller-mcp:", err);
  process.exit(1);
});
