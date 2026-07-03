import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { exists } from "../utils/fs.js";
import type { ToolAdapter, ToolId, ToolSelection } from "./types.js";

const execFileAsync = promisify(execFile);

const definitions: Array<Omit<ToolAdapter, "detect">> = [
  {
    id: "codex",
    displayName: "Codex",
    executables: ["codex"],
    configFiles: [".codex/config.toml", ".codex/hooks.json"],
    capabilities: {
      supportsMcp: true,
      supportsHooks: true,
      supportsPlugin: false,
      supportsSessionStartHook: true,
      supportsUserPromptSubmitHook: true,
      supportsStopHook: true,
      supportsBlockingHook: true,
      supportsWindowsCommandOverride: true,
      defaultEntry: "hook",
    },
  },
  {
    id: "claude-code",
    displayName: "Claude Code",
    executables: ["claude"],
    configFiles: [".mcp.json", ".claude/settings.json"],
    capabilities: {
      supportsMcp: true,
      supportsHooks: true,
      supportsPlugin: false,
      supportsSessionStartHook: true,
      supportsUserPromptSubmitHook: true,
      supportsStopHook: true,
      supportsBlockingHook: true,
      supportsWindowsCommandOverride: false,
      defaultEntry: "hook",
    },
  },
  {
    id: "opencode",
    displayName: "OpenCode",
    executables: ["opencode"],
    configFiles: ["opencode.json"],
    capabilities: {
      supportsMcp: true,
      supportsHooks: false,
      supportsPlugin: true,
      supportsSessionStartHook: true,
      supportsUserPromptSubmitHook: true,
      supportsStopHook: true,
      supportsBlockingHook: true,
      supportsWindowsCommandOverride: false,
      defaultEntry: "plugin",
    },
  },
];

export const toolAdapters: ToolAdapter[] = definitions.map((definition) => ({
  ...definition,
  async detect(projectRoot: string) {
    const projectConfigured = await Promise.any(
      definition.configFiles.map(async (file) => {
        if (await exists(path.join(projectRoot, file))) return true;
        throw new Error("missing");
      }),
    ).catch(() => false);
    const installed = await Promise.any(
      definition.executables.map(async (executable) => {
        await execFileAsync(
          process.platform === "win32" ? "where" : "which",
          [executable],
        );
        return true;
      }),
    ).catch(() => false);
    return {
      installed: installed || projectConfigured,
      projectConfigured,
    };
  },
}));

export function getToolAdapter(id: ToolId): ToolAdapter {
  return toolAdapters.find((adapter) => adapter.id === id)!;
}

export async function selectToolAdapters(
  root: string,
  selection: ToolSelection,
): Promise<ToolAdapter[]> {
  if (selection === "all") return toolAdapters;
  if (selection !== "auto") return [getToolAdapter(selection)];
  const detected = await Promise.all(
    toolAdapters.map(async (adapter) => ({
      adapter,
      detection: await adapter.detect(root),
    })),
  );
  return detected
    .filter(({ detection }) =>
      detection.installed || detection.projectConfigured
    )
    .map(({ adapter }) => adapter);
}
