# Getting Started

## 1. Prerequisites

- Node.js >= 18
- Amazon SP-API access: an LWA application, a refresh token, and your Merchant Token.
  See [Authentication](authentication.md) to obtain these.

## 2. Install

```bash
cd mcp
npm install
```

## 3. Configure

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

See [Configuration](configuration.md) for every variable. At minimum you need
`SP_API_CLIENT_ID`, `SP_API_CLIENT_SECRET`, `SP_API_REFRESH_TOKEN`, and
`SP_API_SELLER_ID`.

> `.env` is git-ignored. Never commit real credentials.

## 4. Build & run

```bash
npm run build   # compile TypeScript to dist/
npm start       # run the server over stdio
```

For development with auto-reload:

```bash
npm run dev
```

The server logs `amazon-seller-mcp running on stdio` to **stderr** and then waits
for an MCP client to connect over stdin/stdout.

## 5. Connect a client

### VS Code
This repo ships [`.vscode/mcp.json`](../.vscode/mcp.json). Open the repo in VS Code
and start the server from the MCP view (it reads credentials from your environment).

### Claude Desktop
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "amazon-seller": {
      "command": "node",
      "args": ["/absolute/path/to/mcp/dist/index.js"],
      "env": {
        "SP_API_CLIENT_ID": "...",
        "SP_API_CLIENT_SECRET": "...",
        "SP_API_REFRESH_TOKEN": "...",
        "SP_API_SELLER_ID": "..."
      }
    }
  }
}
```

## 6. Try it

Ask your MCP client to run `get_seller_profile` — it should return your store name
and marketplace participation. Then explore [the tools](tools.md).
