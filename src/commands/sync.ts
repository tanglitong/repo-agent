import path from "node:path";
import { exists } from "../utils/fs.js";
import { initializeProject } from "./init.js";
import { validateProject } from "./validate.js";
import {
  activateIntegrations,
  type EntryMode,
  type ToolSelection,
} from "../core/integration-manager.js";
import { CliError } from "../errors.js";
import { ensureManagedGitignore } from "../core/gitignore-manager.js";

export async function syncProject(options: {
  root: string;
  tool: ToolSelection;
  entry: EntryMode;
  dryRun: boolean;
}) {
  const initialized = await exists(
    path.join(options.root, ".repo-agent", "config.yaml"),
  );
  if (!initialized) {
    const result = await initializeProject({
      root: options.root,
      mode: "team",
      dryRun: options.dryRun,
      tool: options.tool,
      entry: options.entry,
    });
    return {
      ok: true,
      command: "sync",
      initialized: !options.dryRun,
      initializedNow: !options.dryRun,
      wouldInitialize: options.dryRun,
      repaired: true,
      init: result,
      validation: options.dryRun
        ? null
        : await validateProject(options.root, true),
      activation: result.activation,
      warnings: result.warnings,
    };
  }

  const validation = await validateProject(options.root, true);
  if (!validation.ok) {
    throw new CliError(
      "E_CONFIG_SCHEMA",
      `团队治理资产校验失败：${validation.errors
        .map((issue) => `${issue.path ?? "配置"}：${issue.message}`)
        .join(" ")}`,
    );
  }
  const activation = await activateIntegrations(
    options.root,
    options.tool,
    options.dryRun,
    options.entry,
  );
  const gitignore = await ensureManagedGitignore(
    options.root,
    options.dryRun,
  );
  return {
    ok: true,
    command: "sync",
    initialized: true,
    initializedNow: false,
    wouldInitialize: false,
    repaired:
      activation.created.length > 0 ||
      activation.updated.length > 0 ||
      gitignore.action === "updated" ||
      gitignore.action === "wouldUpdate",
    validation,
    activation,
    gitignore: { action: gitignore.action },
    warnings: validation.warnings.map((warning) => warning.message),
  };
}
