# Configuration

All configuration is provided through environment variables (via `.env` for local
development, or the MCP host's `env` block).

| Variable | Required | Default | Description |
|---|---|---|---|
| `SP_API_CLIENT_ID` | Yes | — | LWA app client ID (`amzn1.application-oa2-client...`). |
| `SP_API_CLIENT_SECRET` | Yes | — | LWA app client secret. |
| `SP_API_REFRESH_TOKEN` | Yes | — | Long-lived LWA refresh token (a long opaque string). |
| `SP_API_SELLER_ID` | For listing ops | — | Merchant Token (Seller ID), starts with `A`. |
| `SP_API_MARKETPLACE_ID` | No | `A21TJRUUN4KGV` | Marketplace ID (India). |
| `SP_API_ENDPOINT` | No | `https://sellingpartnerapi-eu.amazon.com` | Regional endpoint (India = EU). |
| `SP_API_TOKEN_ENDPOINT` | No | `https://api.amazon.com/auth/o2/token` | LWA token endpoint. |

## Regional endpoints

| Region | Endpoint | Example marketplaces |
|---|---|---|
| NA | `https://sellingpartnerapi-na.amazon.com` | US, CA, MX |
| EU | `https://sellingpartnerapi-eu.amazon.com` | **IN**, UK, DE, FR, ... |
| FE | `https://sellingpartnerapi-fe.amazon.com` | JP, AU, SG |

See the [Amazon marketplace IDs](https://developer-docs.amazon.com/sp-api/docs/marketplace-ids)
list to target a different marketplace.
