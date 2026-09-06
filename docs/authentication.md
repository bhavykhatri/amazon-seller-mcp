# Authentication

This server uses **LWA (Login with Amazon) only** — no AWS IAM / SigV4 signing is
required. You need four values.

## 1. Register as an SP-API developer

Amazon moved developer registration to the **Solution Provider Portal**
(`solutionproviderportal.amazon.com`). From Seller Central:

1. Menu → **Programmes and apps** (or go to the portal directly).
2. Enrol, choose **"Build applications that use SP APIs"**.
3. Complete identity verification, then the account profile & permissions.
4. This creates a **Private developer** profile in **Developer Central**.

## 2. Create an app → Client ID & Client Secret

In Developer Central → **Add new app client** (SP-API), then open **LWA credentials**:

- **LWA client identifier** → `SP_API_CLIENT_ID` (starts with `amzn1.application-oa2-client...`)
- **LWA client secret** → `SP_API_CLIENT_SECRET`

## 3. Refresh Token

For your own store, use **self-authorization**:

1. In Developer Central, on your app, choose **Authorize / Generate refresh token**.
2. Copy the token → `SP_API_REFRESH_TOKEN`. It is long-lived.

## 4. Merchant Token (Seller ID)

Seller Central → **Settings → Account Info → Merchant Token**.

- Copy it → `SP_API_SELLER_ID`. It **starts with `A`** and is ~13–14 characters.
- Required for all listing create/update/delete/quantity operations.

## Region & marketplace

India (`amazon.in`) is served by the **EU** regional endpoint:

- `SP_API_MARKETPLACE_ID=A21TJRUUN4KGV`
- `SP_API_ENDPOINT=https://sellingpartnerapi-eu.amazon.com`

## Security notes

- Keep credentials in `.env` (git-ignored) or the MCP host's `env` block.
- Never paste tokens into chat, commits, or logs.
- The server never writes secrets to stdout/stderr.
