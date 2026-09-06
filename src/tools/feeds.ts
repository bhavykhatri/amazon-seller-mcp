// Feeds API tools: submit a feed (create doc -> upload -> create feed) and check status.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SpApiClient } from "../spapi/client.js";
import { jsonResult, errorResult } from "./shared.js";

export function registerFeedTools(server: McpServer, client: SpApiClient): void {
  server.registerTool(
    "submit_feed",
    {
      title: "Submit a feed",
      description:
        "Submits a feed in one call: creates a feed document, uploads the content, and creates the feed. " +
        "Common for flat-file / JSON_LISTINGS_FEED bulk operations. Returns the feedId to poll with get_feed. " +
        "This WRITES to your account.",
      inputSchema: {
        feedType: z.string().describe("SP-API feed type, e.g. JSON_LISTINGS_FEED, POST_FLAT_FILE_LISTINGS_DATA."),
        content: z.string().describe("The feed body (JSON or flat-file text)."),
        contentType: z
          .string()
          .optional()
          .describe("Content type of the body. Default: text/tab-separated-values; charset=UTF-8."),
      },
      annotations: { destructiveHint: true },
    },
    async ({ feedType, content, contentType }) => {
      try {
        const ct = contentType ?? "text/tab-separated-values; charset=UTF-8";
        const doc = await client.createFeedDocument(ct);
        await client.uploadToUrl(doc.url, content, ct);
        const feed = await client.createFeed(feedType, doc.feedDocumentId);
        return jsonResult({ feedId: feed.feedId, feedDocumentId: doc.feedDocumentId });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_feed",
    {
      title: "Get feed status",
      description:
        "Returns a feed's processing status. When DONE, use resultFeedDocumentId with download_report-style retrieval.",
      inputSchema: { feedId: z.string() },
    },
    async ({ feedId }) => {
      try {
        return jsonResult(await client.getFeed(feedId));
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
