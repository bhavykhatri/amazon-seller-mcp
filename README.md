# Amazon Seller MCP

[![npm version](https://img.shields.io/npm/v/seller-central-mcp)](https://www.npmjs.com/package/seller-central-mcp)
[![license](https://img.shields.io/npm/l/seller-central-mcp)](LICENSE)
[![CI](https://github.com/bhavykhatri/amazon-seller-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/bhavykhatri/amazon-seller-mcp/actions/workflows/ci.yml)

> ✅ Published on npm as **[`seller-central-mcp`](https://www.npmjs.com/package/seller-central-mcp)** — run instantly with `npx seller-central-mcp` (no clone or build needed).
>
> 🧩 Also available as a **[VS Code extension](vscode-extension/)** for one-click install with secure credential storage.

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for the **Amazon Selling Partner API (SP-API)**. It exposes seller data and listing operations as MCP tools so any MCP-compatible client (VS Code, Claude Desktop, etc.) can query and manage your Amazon catalogue.

> Works with **any SP-API marketplace and region** — set `SP_API_MARKETPLACE_ID` and `SP_API_ENDPOINT` for your target (defaults to India / `amazon.in`). LWA-only auth — no AWS SigV4 signing required.

## Features

Tools exposed by this server:

| Tool | Description |
|---|---|
| `get_seller_profile` | Seller marketplace participations (store name, marketplace, currency). |
| `list_listings` | Real-time list of catalogued SKUs (`searchListingsItems`). |
| `get_listing` | Full details for one SKU (summaries, offers, issues, attributes). |
| `upsert_listing` | Create or update a listing (`PUT` a product type + attributes). |
| `update_price` | Set selling price (and optional MRP) for a SKU. |
| `set_quantity` | Set fulfillment quantity for a SKU. |
| `delete_listing` | Delete a listing (destructive — requires `confirm: true`). |
| `get_product_type_definition` | Fetch a product type schema (required attributes + enums). |
| `get_orders` | List orders (default: last 30 days). |
| `get_order_items` | Line items for a specific order. |
| `request_report` | Create a report request (returns a reportId). |
| `get_report` | Poll a report's processing status. |
| `download_report` | Download + decompress a report document. |
| `submit_feed` | Submit a feed (create doc → upload → create feed) for bulk operations. |
| `get_feed` | Poll a feed's processing status. |

## Requirements

- Node.js >= 18
- Amazon SP-API access (LWA app credentials + refresh token). See the
  [SP-API docs](https://developer-docs.amazon.com/sp-api/).

## Install

Run directly from npm (no clone needed):

```bash
npx seller-central-mcp
```

Or install globally:

```bash
npm install -g seller-central-mcp
seller-central-mcp
```

> Provide credentials via environment variables (see [Configuration](#configuration)).

## Setup (from source)

```bash
npm install
cp .env.example .env   # fill in your credentials
npm run build
```

### Configuration

Set these via `.env` (local dev) or via the MCP host's `env` block:

| Variable | Description |
|---|---|
| `SP_API_CLIENT_ID` | LWA app client ID (`amzn1.application-oa2-client...`) |
| `SP_API_CLIENT_SECRET` | LWA app client secret |
| `SP_API_REFRESH_TOKEN` | Long-lived refresh token (a long opaque string) |
| `SP_API_SELLER_ID` | Merchant Token (Seller ID, starts with `A`) |
| `SP_API_MARKETPLACE_ID` | Marketplace ID (default India `A21TJRUUN4KGV`) |
| `SP_API_ENDPOINT` | Regional endpoint for your marketplace (default EU, used by India) |
| `SP_API_TOKEN_ENDPOINT` | LWA token endpoint (default `https://api.amazon.com/auth/o2/token`) |

### Marketplaces & regions

This server is **not tied to India** — point it at any marketplace by setting the two variables above:

| Region | `SP_API_ENDPOINT` | Example marketplaces |
|---|---|---|
| NA | `https://sellingpartnerapi-na.amazon.com` | US `ATVPDKIKX0DER`, CA, MX, BR |
| EU | `https://sellingpartnerapi-eu.amazon.com` | UK, DE, FR, IT, ES, **IN `A21TJRUUN4KGV`**, AE, SA |
| FE | `https://sellingpartnerapi-fe.amazon.com` | JP, AU, SG |

Full list: [Amazon marketplace IDs](https://developer-docs.amazon.com/sp-api/docs/marketplace-ids). Defaults live in `src/config.ts`.

Never commit `.env` — it is git-ignored.

## Run

```bash
npm start          # run the built server (stdio)
npm run dev        # watch mode with tsx
```

## VS Code extension

<img src="vscode-extension/icon.png" alt="Seller Central MCP" width="72" align="left" />

Prefer a one-click setup? Install the **[Seller Central MCP VS Code extension](vscode-extension/)**. It registers this server automatically and stores your SP-API credentials in encrypted **SecretStorage** — no manual `mcp.json` or `.env` editing.

<br clear="left" />

1. Install the extension (from the Marketplace, or the packaged `.vsix` in [`vscode-extension/`](vscode-extension/)).
2. Run **`Seller Central MCP: Set Credentials`** from the Command Palette.
3. The **Seller Central MCP** server appears in the MCP view — use its tools from Chat.

Under the hood it just launches `npx -y seller-central-mcp` with your credentials injected as environment variables. See [`vscode-extension/README.md`](vscode-extension/README.md) for details.

## Use with VS Code (manual)

This repo ships a [`.vscode/mcp.json`](.vscode/mcp.json). Open it in VS Code and start the server from the MCP view, or point your MCP host at:

```json
{
  "servers": {
    "amazon-seller": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/index.js"],
      "env": { "SP_API_CLIENT_ID": "...", "SP_API_CLIENT_SECRET": "...", "SP_API_REFRESH_TOKEN": "...", "SP_API_SELLER_ID": "..." }
    }
  }
}
```

## Use with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amazon-seller": {
      "command": "npx",
      "args": ["-y", "seller-central-mcp"],
      "env": { "SP_API_CLIENT_ID": "...", "SP_API_CLIENT_SECRET": "...", "SP_API_REFRESH_TOKEN": "...", "SP_API_SELLER_ID": "..." }
    }
  }
}
```

## Project structure

```
mcp/
├── src/
│   ├── index.ts            # server entry (stdio)
│   ├── config.ts           # env loading + validation
│   ├── spapi/
│   │   └── client.ts       # SP-API client (LWA auth + request wrapper)
│   └── tools/
│       ├── index.ts        # registers all tools
│       ├── shared.ts       # result helpers
│       ├── sellers.ts      # get_seller_profile
│       ├── listings.ts     # list/get/upsert/update_price/set_quantity/delete
│       ├── definitions.ts  # get_product_type_definition
│       ├── orders.ts       # get_orders, get_order_items
│       ├── reports.ts      # request/get/download report
│       └── feeds.ts        # submit_feed, get_feed
├── .vscode/mcp.json
├── .github/copilot-instructions.md
├── .env.example
├── package.json
└── tsconfig.json
```

## Security

- Credentials are read from environment variables only; nothing is logged to stdout (reserved for the MCP protocol).
- `delete_listing` is destructive and requires an explicit `confirm: true` argument.

## License

MIT © Bhavy Khatri
