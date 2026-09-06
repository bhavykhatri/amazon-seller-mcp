# Architecture

## Overview

```
MCP client (VS Code / Claude)
        │  stdio (JSON-RPC)
        ▼
  src/index.ts            # McpServer + StdioServerTransport
        │
        ├── src/tools/*    # tool definitions (thin) — validate input, call the client
        │
        └── src/spapi/client.ts  # SP-API client: LWA token cache + request() wrapper
                    │  HTTPS (x-amz-access-token)
                    ▼
             Amazon SP-API (EU endpoint)
```

## Layers

- **`src/index.ts`** — creates the `McpServer`, registers tools, connects the stdio
  transport. Logs only to **stderr** (stdout is the protocol channel).
- **`src/config.ts`** — reads env vars (with a small `.env` loader for local dev)
  into a typed `SpApiConfig`.
- **`src/spapi/client.ts`** — the only place that talks to Amazon. Caches the LWA
  access token, exposes a generic `request()` plus typed helpers per API
  (Sellers, Listings Items, Product Type Definitions).
- **`src/tools/*.ts`** — one file per API area. Tools are thin: validate input with
  Zod, call a client method, return `jsonResult(...)` or `errorResult(...)`.

## Conventions

- ESM + `NodeNext`: local imports include the `.js` extension.
- Never call `fetch` directly from a tool — go through `SpApiClient`.
- Never log secrets. stdout is reserved for MCP.
- Destructive tools require an explicit `confirm: true`.

## Adding a new tool

1. Add a helper to `SpApiClient` if a new SP-API call is needed.
2. Create/extend a file in `src/tools/` with a `register<Area>Tools(server, client)`:
   ```ts
   server.registerTool(
     "my_tool",
     { title, description, inputSchema: { field: z.string() } },
     async ({ field }) => {
       try { return jsonResult(await client.something(field)); }
       catch (err) { return errorResult(err); }
     }
   );
   ```
3. Call your `register<Area>Tools` from `src/tools/index.ts`.
4. `npm run build` and test.

## Ideas for future tools

Orders, pricing (`getPricing`/`getCompetitiveSummary`), reports (create/poll/download),
FBA inventory, and feeds (flat-file bulk create — the path that applies GTIN exemptions).
