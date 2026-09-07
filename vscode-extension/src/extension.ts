// VS Code extension: registers the Seller Central MCP server and manages SP-API
// credentials via SecretStorage. The server itself is the `seller-central-mcp`
// npm package, launched with `npx`.
import * as vscode from "vscode";

const SECRET_KEYS = [
  "SP_API_CLIENT_ID",
  "SP_API_CLIENT_SECRET",
  "SP_API_REFRESH_TOKEN",
  "SP_API_SELLER_ID",
] as const;

const PROVIDER_ID = "seller-central-mcp";

export function activate(context: vscode.ExtensionContext): void {
  const didChange = new vscode.EventEmitter<void>();
  context.subscriptions.push(didChange);

  const provider: vscode.McpServerDefinitionProvider = {
    onDidChangeMcpServerDefinitions: didChange.event,
    async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
      const env: Record<string, string> = {};
      for (const key of SECRET_KEYS) {
        const value = await context.secrets.get(key);
        if (value) env[key] = value;
      }
      const cfg = vscode.workspace.getConfiguration("sellerCentralMcp");
      env.SP_API_MARKETPLACE_ID = cfg.get<string>("marketplaceId") || "A21TJRUUN4KGV";
      env.SP_API_ENDPOINT =
        cfg.get<string>("endpoint") || "https://sellingpartnerapi-eu.amazon.com";

      return [
        new vscode.McpStdioServerDefinition("Seller Central MCP", "npx", ["-y", "seller-central-mcp"], env),
      ];
    },
  };

  context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider(PROVIDER_ID, provider));

  context.subscriptions.push(
    vscode.commands.registerCommand("sellerCentralMcp.setCredentials", async () => {
      for (const key of SECRET_KEYS) {
        const existing = await context.secrets.get(key);
        const value = await vscode.window.showInputBox({
          title: `Seller Central MCP — ${key}`,
          prompt: `Enter ${key}`,
          password: true,
          ignoreFocusOut: true,
          placeHolder: existing ? "(leave blank to keep the existing value)" : "",
        });
        if (value === undefined) {
          vscode.window.showWarningMessage("Seller Central MCP: credential setup cancelled.");
          return;
        }
        if (value.trim() !== "") await context.secrets.store(key, value.trim());
      }
      didChange.fire();
      vscode.window.showInformationMessage("Seller Central MCP credentials saved.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("sellerCentralMcp.clearCredentials", async () => {
      for (const key of SECRET_KEYS) await context.secrets.delete(key);
      didChange.fire();
      vscode.window.showInformationMessage("Seller Central MCP credentials cleared.");
    })
  );
}

export function deactivate(): void {
  // Nothing to clean up — subscriptions are disposed by VS Code.
}
