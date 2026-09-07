# Seller Central MCP — VS Code Extension

<img src="icon.png" alt="Seller Central MCP" width="96" align="left" />

Adds the **[seller-central-mcp](https://www.npmjs.com/package/seller-central-mcp)** server (Amazon Selling Partner API) to VS Code as a managed MCP server, with **secure credential storage**.

<br clear="left" />

## What it does

- Registers a **Seller Central MCP** server in VS Code (no manual `mcp.json` editing).
- Stores your SP-API credentials in VS Code **SecretStorage** (encrypted), not in plaintext files.
- Launches the server via `npx seller-central-mcp`, injecting your credentials as environment variables.

## Setup

1. Install the extension.
2. Run **`Seller Central MCP: Set Credentials`** from the Command Palette and enter:
   - `SP_API_CLIENT_ID`
   - `SP_API_CLIENT_SECRET`
   - `SP_API_REFRESH_TOKEN`
   - `SP_API_SELLER_ID`
3. The **Seller Central MCP** server appears in the MCP view. Use its tools from Chat.

## Settings

| Setting | Default | Description |
|---|---|---|
| `sellerCentralMcp.marketplaceId` | `A21TJRUUN4KGV` (India) | Amazon marketplace ID. |
| `sellerCentralMcp.endpoint` | EU endpoint | SP-API regional endpoint. |

Change these for other marketplaces (NA / EU / FE).

## Commands

- **Seller Central MCP: Set Credentials** — securely store/update credentials.
- **Seller Central MCP: Clear Credentials** — remove stored credentials.

## How it relates to the npm package

This extension is a thin wrapper. All tools and logic live in the
[`seller-central-mcp`](https://www.npmjs.com/package/seller-central-mcp) npm package
([source](https://github.com/bhavykhatri/amazon-seller-mcp)).

## License

MIT © Bhavy Khatri
