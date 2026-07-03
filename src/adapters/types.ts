export type ToolId = "codex" | "claude-code" | "opencode";
export type ToolSelection = ToolId | "auto" | "all";
export type EntryMode = "auto" | "hook" | "plugin" | "mcp-only" | "none";

export interface ToolCapability {
  supportsMcp: boolean;
  supportsHooks: boolean;
  supportsPlugin: boolean;
  supportsSessionStartHook: boolean;
  supportsUserPromptSubmitHook: boolean;
  supportsStopHook: boolean;
  supportsBlockingHook: boolean;
  supportsWindowsCommandOverride: boolean;
  defaultEntry: Exclude<EntryMode, "auto">;
}

export interface ToolDetection {
  installed: boolean;
  projectConfigured: boolean;
}

export interface ToolAdapter {
  id: ToolId;
  displayName: string;
  executables: string[];
  configFiles: string[];
  capabilities: ToolCapability;
  detect(projectRoot: string): Promise<ToolDetection>;
}
