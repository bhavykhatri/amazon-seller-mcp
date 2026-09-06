# Copilot instructions — Amazon Seller MCP

This project is an MCP (Model Context Protocol) server (TypeScript, stdio) wrapping the Amazon Selling Partner API (SP-API) for the India marketplace.

## SDK references
- MCP TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP docs: https://modelcontextprotocol.io/docs
- Uses `@modelcontextprotocol/sdk` v1: `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`, `StdioServerTransport` from `@modelcontextprotocol/sdk/server/stdio.js`.
- SP-API: https://developer-docs.amazon.com/sp-api/

## Conventions
- ESM + NodeNext: local imports must include the `.js` extension.
- stdout is reserved for the MCP protocol — log ONLY to stderr (`console.error`).
- Tools live in `src/tools/*.ts` and are registered via `registerAllTools`.
- SP-API access goes through `src/spapi/client.ts` (LWA token caching + `request()` wrapper). Do not call `fetch` directly from tools.
- Auth is LWA-only (no AWS SigV4). India marketplace `A21TJRUUN4KGV`, EU endpoint.
- Credentials come from env vars (see `.env.example`). Never hardcode or log secrets.
- Destructive tools (e.g. `delete_listing`) must require an explicit `confirm: true` argument.

## Adding a tool
1. Add a `register<Area>Tools(server, client)` function in `src/tools/<area>.ts`.
2. Use `server.registerTool(name, { title, description, inputSchema, annotations }, handler)`.
3. `inputSchema` is a Zod raw shape (object of zod validators).
4. Return `{ content: [{ type: "text", text }] }`; on failure return `{ content: [...], isError: true }`.
5. Call it from `registerAllTools` in `src/tools/index.ts`.
