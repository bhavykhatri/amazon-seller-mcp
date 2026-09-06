// Reports API tools: request a report, check status, download the document.
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { SpApiClient } from "../spapi/client.js";
import { jsonResult, errorResult } from "./shared.js";

// Reports can be large; cap the returned text to keep tool payloads reasonable.
const MAX_REPORT_CHARS = 100_000;

export function registerReportTools(server: McpServer, client: SpApiClient): void {
  server.registerTool(
    "request_report",
    {
      title: "Request a report",
      description:
        "Creates a report request and returns a reportId. Example types: GET_MERCHANT_LISTINGS_ALL_DATA, GET_FLAT_FILE_OPEN_LISTINGS_DATA, GET_FBA_INVENTORY_PLANNING_DATA.",
      inputSchema: { reportType: z.string().describe("SP-API report type.") },
    },
    async ({ reportType }) => {
      try {
        return jsonResult(await client.createReport(reportType));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "get_report",
    {
      title: "Get report status",
      description:
        "Returns a report's processing status. When DONE, use the reportDocumentId with download_report.",
      inputSchema: { reportId: z.string() },
    },
    async ({ reportId }) => {
      try {
        return jsonResult(await client.getReport(reportId));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "download_report",
    {
      title: "Download report document",
      description: "Downloads and decompresses a report document by its reportDocumentId, returning the text.",
      inputSchema: { reportDocumentId: z.string() },
    },
    async ({ reportDocumentId }) => {
      try {
        const doc = await client.getReportDocument(reportDocumentId);
        const text = await client.downloadText(doc.url, doc.compressionAlgorithm);
        const truncated = text.length > MAX_REPORT_CHARS;
        const body = truncated ? `${text.slice(0, MAX_REPORT_CHARS)}\n...[truncated ${text.length - MAX_REPORT_CHARS} chars]` : text;
        return { content: [{ type: "text", text: body }] };
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
