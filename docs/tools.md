# Tools

Every tool returns a JSON text payload. On failure the result has `isError: true`
and a message.

## `get_seller_profile`
Seller marketplace participations (store name, marketplace, currency, status).

- **Input:** none.
- **Example:** "What's my Amazon store profile?"

## `list_listings`
Real-time list of all catalogued SKUs (`searchListingsItems`), auto-paginated.

- **Input:** none.
- **Returns:** `{ count, items[] }` with SKU, ASIN, status, and offer summaries.
- **Note:** more accurate than the reports API, which is cached.

## `get_listing`
Full detail for one SKU.

| Input | Type | Description |
|---|---|---|
| `sku` | string (required) | The seller SKU. |
| `includedData` | string (optional) | Comma-separated data sets. Default `summaries,attributes,offers,issues,fulfillmentAvailability`. |

Use this to inspect the `issues` array when debugging (e.g. error `8560` = missing
product identifier, `13013` = offer can't attach because the product isn't catalogued yet).

## `upsert_listing`
Create or update a listing via `PUT`.

| Input | Type | Description |
|---|---|---|
| `sku` | string (required) | The seller SKU. |
| `productType` | string (required) | e.g. `SHIRT`, `TOTE_BAG`. |
| `attributes` | object (required) | The full attributes object for the product type. |
| `requirements` | enum (optional) | `LISTING` (default), `LISTING_PRODUCT_ONLY`, or `LISTING_OFFER_ONLY`. |

Tip: fetch the schema first with `get_product_type_definition` to learn the required
attributes and valid enum values.

## `set_quantity`
Set the merchant-fulfilled (DEFAULT channel) quantity for a SKU.

| Input | Type | Description |
|---|---|---|
| `sku` | string (required) | The seller SKU. |
| `quantity` | integer >= 0 (required) | New quantity. Use `0` to remove the buyable offer. |
| `productType` | string (required) | e.g. `SHIRT`. |

## `delete_listing`
**Destructive.** Permanently deletes the listing for a SKU.

| Input | Type | Description |
|---|---|---|
| `sku` | string (required) | The seller SKU to delete. |
| `confirm` | boolean (required) | Must be `true` to proceed. |

Tip: if the listing has an active offer, run `set_quantity` with `0` first, then delete.

## `update_price`
Convenience: set the selling price (and optional MRP) for a SKU via a `purchasable_offer` PATCH, without a full `upsert_listing`.

| Input | Type | Description |
|---|---|---|
| `sku` | string (required) | The seller SKU. |
| `productType` | string (required) | e.g. `SHIRT`. |
| `price` | number (required) | Selling price (value with tax). |
| `mrp` | number (optional) | Maximum Retail Price. |
| `currency` | string (optional) | Default `INR`. |

## `get_product_type_definition`
Fetch a product type schema (required attributes + enums).

| Input | Type | Description |
|---|---|---|
| `productType` | string (required) | e.g. `SHIRT`. |
| `locale` | string (optional) | Default `en_IN`. |

The response includes a link to the JSON schema you use to build `attributes` for `upsert_listing`.

## `get_orders`
List orders. Defaults to orders created in the last 30 days.

| Input | Type | Description |
|---|---|---|
| `createdAfter` | string (optional) | ISO 8601; default 30 days ago. |
| `lastUpdatedAfter` | string (optional) | ISO 8601 (use instead of `createdAfter`). |
| `orderStatuses` | string[] (optional) | e.g. `['Unshipped','Shipped','Pending','Canceled']`. |
| `maxResults` | integer 1–100 (optional) | Page size. |
| `nextToken` | string (optional) | Pagination token. |

> Full buyer/shipping-address data requires the restricted **PII** role on your SP-API app.

## `get_order_items`
Line items for a specific order.

| Input | Type | Description |
|---|---|---|
| `orderId` | string (required) | The Amazon order ID. |

## `request_report`
Create a report request; returns a `reportId`.

| Input | Type | Description |
|---|---|---|
| `reportType` | string (required) | e.g. `GET_MERCHANT_LISTINGS_ALL_DATA`. |

## `get_report`
Poll a report's `processingStatus`. When `DONE`, use its `reportDocumentId` with `download_report`.

| Input | Type | Description |
|---|---|---|
| `reportId` | string (required) | From `request_report`. |

## `download_report`
Download and decompress a report document, returning the text (capped at 100k chars).

| Input | Type | Description |
|---|---|---|
| `reportDocumentId` | string (required) | From `get_report`. |

## `submit_feed`
**Writes to your account.** Submits a feed in one call (create document → upload content → create feed). Returns a `feedId` to poll with `get_feed`. Ideal for flat-file / `JSON_LISTINGS_FEED` bulk operations (the path that reliably applies GTIN exemptions).

| Input | Type | Description |
|---|---|---|
| `feedType` | string (required) | e.g. `JSON_LISTINGS_FEED`, `POST_FLAT_FILE_LISTINGS_DATA`. |
| `content` | string (required) | The feed body (JSON or flat-file text). |
| `contentType` | string (optional) | Default `text/tab-separated-values; charset=UTF-8`. |

## `get_feed`
Poll a feed's `processingStatus`. When `DONE`, retrieve the result via its `resultFeedDocumentId`.

| Input | Type | Description |
|---|---|---|
| `feedId` | string (required) | From `submit_feed`. |
