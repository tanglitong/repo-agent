import path from "node:path";
import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import {
  applyEdits,
  modify,
  parse,
  type ParseError,
} from "jsonc-parser/lib/esm/main.js";
import { exists } from "../utils/fs.js";
import { VERSION } from "../index.js";
import { CliError } from "../errors.js";
import {
  getToolAdapter,
  selectToolAdapters,
} from "../adapters/registry.js";
import type {
  EntryMode,
  ToolId,
  ToolSelection,
} from "../adapters/types.js";
import { loadHookRoutes } from "./hook-router.js";
import { REPO_AGENT_TOOLS } from "./tool-manifest.js";
import {
  OPENCODE_PLUGIN_PATH,
  opencodePluginSource,
} from "./opencode-plugin.js";

export type IntegrationTool = ToolId;
export type { EntryMode, ToolSelection };
const start = "# >>> repo-agent integration managed";
const end = "# <<< repo-agent integration managed";
const skillMarker = "<!-- repo-agent managed skill v1 -->";
const commandMarker = "<!-- repo-agent managed command v1 -->";
const managedSkillFiles = [
  "SKILL.md",
  "agents/openai.yaml",
  "scripts/install.mjs",
  "references/command-map.md",
] as const;

const hookCommand = (tool: IntegrationTool, event: string) =>
  tool === "codex"
    ? `node "$(git rev-parse --show-toplevel)/repo-agent/repo-agent.bundle.js" hook ${event} --tool ${tool}`
    : `node repo-agent/repo-agent.bundle.js hook ${event} --tool ${tool}`;

const hookCommandWindows = (tool: IntegrationTool, event: string) =>
  `powershell.exe -NoProfile -Command "$r=(git rev-parse --show-toplevel); & node (Join-Path $r 'repo-agent/repo-agent.bundle.js') hook ${event} --tool ${tool}"`;

async function updateManagedText(
  filePath: string,
  block: string,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped"> {
  const previous = await exists(filePath) ? await readFile(filePath, "utf8") : "";
  const expression = new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n?`, "g");
  const base = previous.replace(expression, "").trimEnd();
  const next = block
    ? `${base ? `${base}\n\n` : ""}${block}\n`
    : base ? `${base}\n` : "";
  if (next === previous) return "skipped";
  if (!dryRun) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, next, "utf8");
  }
  return previous ? "updated" : "created";
}

async function updateJsonc(
  filePath: string,
  changes: Array<{ path: (string | number)[]; value: unknown }>,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped"> {
  const fileExists = await exists(filePath);
  if (!fileExists && changes.every((change) => change.value === undefined)) {
    return "skipped";
  }
  let content = fileExists ? await readFile(filePath, "utf8") : "{}\n";
  const errors: ParseError[] = [];
  parse(content, errors);
  if (errors.length) throw new CliError("E_CONFIG_PARSE", `无法安全合并 ${path.basename(filePath)}。`, filePath);
  const previous = content;
  for (const change of changes) {
    content = applyEdits(content, modify(content, change.path, change.value, {
      formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" },
    }));
  }
  if (!content.endsWith("\n")) content += "\n";
  if (content === previous) return "skipped";
  if (!dryRun) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }
  return fileExists ? "updated" : "created";
}

async function updateOwnedFile(
  filePath: string,
  content: string | null,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped"> {
  const fileExists = await exists(filePath);
  if (content === null) {
    if (!fileExists) return "skipped";
    if (!dryRun) await rm(filePath, { force: true });
    return "updated";
  }
  const previous = fileExists ? await readFile(filePath, "utf8") : null;
  if (previous === content) return "skipped";
  if (!dryRun) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, content, "utf8");
  }
  return fileExists ? "updated" : "created";
}

async function packagedSkillRoot(): Promise<string | null> {
  const executable = process.argv[1];
  if (!executable) return null;
  const directory = path.dirname(path.resolve(executable));
  const skill = path.join(directory, "SKILL.md");
  if (!(await exists(skill))) return null;
  const content = await readFile(skill, "utf8");
  return content.includes(skillMarker) ? directory : null;
}

async function removeEmpty(directory: string): Promise<void> {
  try {
    await rmdir(directory);
  } catch (error) {
    if (
      (error as NodeJS.ErrnoException).code !== "ENOENT" &&
      (error as NodeJS.ErrnoException).code !== "ENOTEMPTY"
    ) throw error;
  }
}

async function syncManagedSkill(
  sourceRoot: string | null,
  destinationRoot: string,
  remove: boolean,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped"> {
  if (!remove && !sourceRoot) return "skipped";
  const destinationSkill = path.join(destinationRoot, "SKILL.md");
  const destinationExists = await exists(destinationSkill);
  if (destinationExists) {
    const current = await readFile(destinationSkill, "utf8");
    if (!current.includes(skillMarker)) {
      throw new CliError(
        "E_INTEGRATION_CONFLICT",
        `目标 Skill 不是 repo-agent 托管文件，已停止修改：${destinationSkill}`,
        destinationSkill,
      );
    }
  } else {
    const remainingFiles = (
      await Promise.all(
        managedSkillFiles
          .filter((relative) => relative !== "SKILL.md")
          .map(async (relative) => ({
            relative,
            exists: await exists(path.join(destinationRoot, relative)),
          })),
      )
    ).filter((item) => item.exists);
    const matchesSource = sourceRoot && remainingFiles.length
      ? (
        await Promise.all(remainingFiles.map(async ({ relative }) =>
          await readFile(path.join(destinationRoot, relative), "utf8") ===
            await readFile(path.join(sourceRoot, relative), "utf8")
        ))
      ).every(Boolean)
      : false;
    if (remainingFiles.length && !matchesSource) {
      throw new CliError(
        "E_INTEGRATION_CONFLICT",
        `目标 Skill 目录存在非托管内容，已停止修改：${destinationRoot}`,
        destinationRoot,
      );
    }
  }

  if (remove) {
    if (!destinationExists) return "skipped";
    if (!dryRun) {
      for (const relative of managedSkillFiles) {
        await rm(path.join(destinationRoot, relative), { force: true });
      }
      await removeEmpty(path.join(destinationRoot, "agents"));
      await removeEmpty(path.join(destinationRoot, "scripts"));
      await removeEmpty(path.join(destinationRoot, "references"));
      await removeEmpty(destinationRoot);
    }
    return "updated";
  }
  if (!sourceRoot) return "skipped";

  let changed = !destinationExists;
  const contents = new Map<string, string>();
  for (const relative of managedSkillFiles) {
    const source = path.join(sourceRoot, relative);
    if (!(await exists(source))) {
      throw new CliError(
        "E_CONFIG_SCHEMA",
        `离线包 Skill 缺少文件：${relative}`,
        source,
      );
    }
    const incoming = await readFile(source, "utf8");
    contents.set(relative, incoming);
    const destination = path.join(destinationRoot, relative);
    const previous = await exists(destination)
      ? await readFile(destination, "utf8")
      : null;
    if (previous !== incoming) changed = true;
  }
  if (!changed) return "skipped";
  if (!dryRun) {
    for (const [relative, content] of contents) {
      const destination = path.join(destinationRoot, relative);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, content, "utf8");
    }
  }
  return destinationExists ? "updated" : "created";
}

function openCodeCommandSource(): string {
  return `---
description: 打开 repo-agent 交互式控制中心
---

${commandMarker}

使用 skill 工具加载名为 repo-agent 的项目 Skill，并严格按照该 Skill 的流程处理以下用户意图：

$ARGUMENTS

如果没有参数，显示 repo-agent 用户操作菜单。不要提供构建、打包或发布命令。
`;
}

async function updateManagedCommand(
  filePath: string,
  content: string | null,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped"> {
  const fileExists = await exists(filePath);
  if (fileExists) {
    const previous = await readFile(filePath, "utf8");
    if (!previous.includes(commandMarker)) {
      throw new CliError(
        "E_INTEGRATION_CONFLICT",
        `目标命令不是 repo-agent 托管文件，已停止修改：${filePath}`,
        filePath,
      );
    }
    if (content === previous) return "skipped";
  } else if (content === null) {
    return "skipped";
  }
  if (!dryRun) {
    if (content === null) await rm(filePath, { force: true });
    else {
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf8");
    }
  }
  return fileExists ? "updated" : "created";
}

const openCodePromptTools = REPO_AGENT_TOOLS
  .filter((tool) => tool.approvalMode === "prompt")
  .map((tool) => `repo-agent_${tool.name}`);

async function updateOpenCodeConfig(
  filePath: string,
  remove: boolean,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped"> {
  const fileExists = await exists(filePath);
  const content = fileExists ? await readFile(filePath, "utf8") : "{}\n";
  const errors: ParseError[] = [];
  const document = parse(content, errors) as {
    permission?: string | Record<string, unknown>;
  } | undefined;
  if (errors.length) {
    throw new CliError("E_CONFIG_PARSE", "无法安全合并 opencode.json。", filePath);
  }
  let permissionChange: unknown = document?.permission;
  if (typeof permissionChange === "string") {
    if (permissionChange === "allow" && !remove) {
      throw new CliError(
        "E_CONFIG_PARSE",
        "opencode.json 的 permission 为全局 allow，无法安全追加 repo-agent 写工具审批；请改为对象形式。",
        filePath,
      );
    }
  } else {
    const permissions: Record<string, unknown> = {
      ...(permissionChange ?? {}),
    };
    for (const tool of openCodePromptTools) {
      if (remove) {
        if (permissions[tool] === "ask") delete permissions[tool];
      } else if (permissions[tool] !== "deny") {
        permissions[tool] = "ask";
      }
    }
    permissionChange = Object.keys(permissions).length ? permissions : undefined;
  }
  return updateJsonc(filePath, [
    {
      path: ["mcp", "repo-agent"],
      value: remove
        ? undefined
        : {
            type: "local",
            command: ["node", "repo-agent/repo-agent.bundle.js", "mcp", "stdio"],
            enabled: true,
            environment: { REPO_AGENT_INTEGRATION_VERSION: VERSION },
          },
    },
    { path: ["permission"], value: permissionChange },
  ], dryRun);
}

function codexToml(): string {
  const approvedTools = REPO_AGENT_TOOLS
    .filter((tool) => tool.approvalMode === "approve")
    .map((tool) =>
      `[mcp_servers.repo_agent.tools.${tool.name}]
approval_mode = "approve"`
    )
    .join("\n\n");
  return `${start}
# version = ${VERSION}
[mcp_servers.repo_agent]
command = "node"
args = ["repo-agent/repo-agent.bundle.js", "mcp", "stdio"]
enabled = true
required = false
default_tools_approval_mode = "prompt"

${approvedTools}
${end}`;
}

function hookGroups(tool: IntegrationTool, event: string) {
  const command = hookCommand(tool, event);
  const handler = tool === "claude-code"
    ? {
        type: "command",
        command: "node",
        args: [
          "${CLAUDE_PROJECT_DIR}/repo-agent/repo-agent.bundle.js",
          "hook",
          event,
          "--tool",
          tool,
        ],
        timeout: 15,
        statusMessage: "正在检查 repo-agent 配置",
      }
    : {
        type: "command",
        command,
        commandWindows: hookCommandWindows(tool, event),
        timeout: 15,
        statusMessage: "正在检查 repo-agent 配置",
      };
  return [
    {
      hooks: [handler],
    },
  ];
}

function isRepoAgentHook(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return serialized.includes("repo-agent.bundle.js") &&
    (serialized.includes("handshake") ||
      serialized.includes("\"hook\"") ||
      serialized.includes(" hook "));
}

async function updateHooks(
  filePath: string,
  tool: IntegrationTool,
  remove: boolean,
  dryRun: boolean,
): Promise<"created" | "updated" | "skipped"> {
  const fileExists = await exists(filePath);
  if (remove && !fileExists) return "skipped";
  const content = fileExists ? await readFile(filePath, "utf8") : "{}\n";
  const errors: ParseError[] = [];
  const document = parse(content, errors) as {
    hooks?: Record<string, unknown>;
  } | undefined;
  if (errors.length) {
    throw new CliError("E_CONFIG_PARSE", `无法安全合并 ${path.basename(filePath)}。`, filePath);
  }
  const changes: Array<{ path: (string | number)[]; value: unknown }> = [];
  for (const event of ["SessionStart", "UserPromptSubmit", "PreToolUse", "Stop"]) {
    const existing = document?.hooks?.[event];
    if (existing !== undefined && !Array.isArray(existing)) {
      throw new CliError(
        "E_CONFIG_PARSE",
        `${path.basename(filePath)} 中 hooks.${event} 不是数组，已停止修改以保护现有配置。`,
        filePath,
      );
    }
    const preserved = (existing ?? []).filter((group: unknown) => !isRepoAgentHook(group));
    const value = remove
      ? preserved.length ? preserved : undefined
      : [...preserved, ...hookGroups(
          tool,
          event === "SessionStart"
            ? "session-start"
            : event === "UserPromptSubmit"
              ? "user-prompt-submit"
              : event === "PreToolUse"
                ? "pre-tool-use"
              : "stop",
        )];
    changes.push({ path: ["hooks", event], value });
  }
  return updateJsonc(filePath, changes, dryRun);
}

export interface ActivationResult {
  ok: true;
  command: "activate";
  tool: ToolSelection;
  entry: EntryMode;
  configured: boolean;
  effective: false;
  state: "pending_reload";
  reloadRequired: true;
  reloadType: "new_session";
  created: string[];
  updated: string[];
  skipped: string[];
  message: string;
}

function resolveEntryMode(
  tool: ToolId,
  entry: EntryMode,
): Exclude<EntryMode, "auto"> {
  const capability = getToolAdapter(tool).capabilities;
  const resolved = entry === "auto" ? capability.defaultEntry : entry;
  if (resolved === "hook" && !capability.supportsHooks) {
    throw new CliError("E_UNSUPPORTED_ENTRY", `${tool} 不支持 hook entry。`);
  }
  if (resolved === "plugin" && !capability.supportsPlugin) {
    throw new CliError("E_UNSUPPORTED_ENTRY", `${tool} 不支持 plugin entry。`);
  }
  if (resolved === "mcp-only" && !capability.supportsMcp) {
    throw new CliError("E_UNSUPPORTED_ENTRY", `${tool} 不支持 mcp-only entry。`);
  }
  return resolved;
}

export async function validateIntegrationSelection(
  root: string,
  selected: ToolSelection,
  entry: EntryMode,
): Promise<void> {
  const adapters = await selectToolAdapters(root, selected);
  for (const adapter of adapters) resolveEntryMode(adapter.id, entry);
}

export async function activateIntegrations(
  root: string,
  selected: ToolSelection,
  dryRun = false,
  entry: EntryMode = "auto",
): Promise<ActivationResult> {
  const adapters = await selectToolAdapters(root, selected);
  const selectedTools = adapters.map((adapter) => adapter.id);
  const resolvedEntries = new Map(
    selectedTools.map((tool) => [tool, resolveEntryMode(tool, entry)]),
  );
  const actions: Array<[
    string,
    () => Promise<"created" | "updated" | "skipped">,
  ]> = [];
  const entryFor = (tool: ToolId): Exclude<EntryMode, "auto"> =>
    resolvedEntries.get(tool) ?? resolveEntryMode(tool, entry);
  const skillSource = await packagedSkillRoot();
  if (selectedTools.includes("claude-code")) {
    await syncManagedSkill(
      skillSource,
      path.join(root, ".claude", "skills", "repo-agent"),
      entryFor("claude-code") === "none",
      true,
    );
  }
  if (selectedTools.includes("codex")) {
    await syncManagedSkill(
      skillSource,
      path.join(root, ".agents", "skills", "repo-agent"),
      entryFor("codex") === "none",
      true,
    );
  }
  if (selectedTools.includes("opencode")) {
    const remove = entryFor("opencode") === "none";
    await syncManagedSkill(
      skillSource,
      path.join(root, ".opencode", "skills", "repo-agent"),
      remove,
      true,
    );
    if (remove || skillSource) {
      await updateManagedCommand(
        path.join(root, ".opencode", "commands", "repo-agent.md"),
        remove ? null : openCodeCommandSource(),
        true,
      );
    }
  }
  if (selectedTools.includes("claude-code")) {
    const mode = entryFor("claude-code");
    actions.push([".mcp.json", () => updateJsonc(path.join(root, ".mcp.json"), [{
      path: ["mcpServers", "repo-agent"],
      value: mode === "none"
        ? undefined
        : {
            command: "node",
            args: ["repo-agent/repo-agent.bundle.js", "mcp", "stdio"],
            env: { REPO_AGENT_INTEGRATION_VERSION: VERSION },
          },
    }], dryRun)]);
    actions.push([".claude/settings.json", () => updateHooks(
      path.join(root, ".claude", "settings.json"),
      "claude-code",
      mode !== "hook",
      dryRun,
    )]);
    actions.push([".claude/skills/repo-agent", () => syncManagedSkill(
      skillSource,
      path.join(root, ".claude", "skills", "repo-agent"),
      mode === "none",
      dryRun,
    )]);
  }
  if (selectedTools.includes("codex")) {
    const mode = entryFor("codex");
    actions.push([".codex/config.toml", () => updateManagedText(
      path.join(root, ".codex", "config.toml"),
      mode === "none" ? "" : codexToml(),
      dryRun,
    )]);
    actions.push([".codex/hooks.json", () => updateHooks(
      path.join(root, ".codex", "hooks.json"),
      "codex",
      mode !== "hook",
      dryRun,
    )]);
    actions.push([".agents/skills/repo-agent", () => syncManagedSkill(
      skillSource,
      path.join(root, ".agents", "skills", "repo-agent"),
      mode === "none",
      dryRun,
    )]);
  }
  if (selectedTools.includes("opencode")) {
    const mode = entryFor("opencode");
    actions.push(["opencode.json", () => updateOpenCodeConfig(
      path.join(root, "opencode.json"),
      mode === "none",
      dryRun,
    )]);
    actions.push([OPENCODE_PLUGIN_PATH, () => updateOwnedFile(
      path.join(root, OPENCODE_PLUGIN_PATH),
      mode === "plugin" ? opencodePluginSource() : null,
      dryRun,
    )]);
    actions.push([".opencode/skills/repo-agent", () => syncManagedSkill(
      skillSource,
      path.join(root, ".opencode", "skills", "repo-agent"),
      mode === "none",
      dryRun,
    )]);
    if (mode === "none" || skillSource) {
      actions.push([".opencode/commands/repo-agent.md", () => updateManagedCommand(
        path.join(root, ".opencode", "commands", "repo-agent.md"),
        mode === "none" ? null : openCodeCommandSource(),
        dryRun,
      )]);
    }
  }
  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  for (const [relativePath, apply] of actions) {
    const result = await apply();
    (result === "created" ? created : result === "updated" ? updated : skipped).push(relativePath);
  }
  if (!dryRun) {
    const statePath = path.join(root, ".repo-agent-runtime", "activation.json");
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify({
      version: 1,
      configuredVersion: VERSION,
      tools: selectedTools,
      entries: Object.fromEntries(selectedTools.map((tool) => [tool, entryFor(tool)])),
      state: "pending_reload",
      reloadType: "new_session",
      configuredAt: new Date().toISOString(),
    }, null, 2)}\n`);
  }
  return {
    ok: true,
    command: "activate",
    tool: selected,
    entry,
    configured: selectedTools.some((tool) => entryFor(tool) !== "none"),
    effective: false,
    state: "pending_reload",
    reloadRequired: true,
    reloadType: "new_session",
    created,
    updated,
    skipped,
    message: selectedTools.length
      ? "配置已完成；请信任项目配置和 hooks，并新建会话。"
      : "未检测到已有工具配置；可使用 --tool all 或指定工具进行接入。",
  };
}

async function filesContain(
  checks: Array<{ file: string; values: string[] }>,
): Promise<boolean> {
  for (const check of checks) {
    if (!(await exists(check.file))) return false;
    const content = await readFile(check.file, "utf8");
    if (!check.values.every((value) => content.includes(value))) return false;
  }
  return true;
}

async function openCodePermissionsCurrent(file: string): Promise<boolean> {
  if (!(await exists(file))) return false;
  const errors: ParseError[] = [];
  const document = parse(await readFile(file, "utf8"), errors) as {
    permission?: string | Record<string, unknown>;
  } | undefined;
  if (errors.length) return false;
  if (document?.permission === "ask" || document?.permission === "deny") {
    return true;
  }
  if (!document?.permission || typeof document.permission !== "object") {
    return false;
  }
  const permissions = document.permission;
  return openCodePromptTools.every((toolName) =>
    permissions[toolName] === "ask" ||
    permissions[toolName] === "deny"
  );
}

async function configIsCurrent(
  root: string,
  tool: IntegrationTool,
  entry: Exclude<EntryMode, "auto">,
): Promise<boolean> {
  if (entry === "none") return false;
  const requiresHook = entry === "hook";
  if (tool === "codex") {
    if (
      !requiresHook &&
      await hasRepoAgentHooks(path.join(root, ".codex", "hooks.json"))
    ) return false;
    if (
      requiresHook &&
      !(await hooksAreCurrent(path.join(root, ".codex", "hooks.json")))
    ) return false;
    return filesContain([{
      file: path.join(root, ".codex", "config.toml"),
      values: [
        "mcp_servers.repo_agent",
        `version = ${VERSION}`,
        'default_tools_approval_mode = "prompt"',
        ...REPO_AGENT_TOOLS
          .filter((item) => item.approvalMode === "approve")
          .map((item) => `[mcp_servers.repo_agent.tools.${item.name}]`),
      ],
    }]);
  }
  if (tool === "claude-code") {
    if (
      !requiresHook &&
      await hasRepoAgentHooks(path.join(root, ".claude", "settings.json"))
    ) return false;
    if (
      requiresHook &&
      !(await hooksAreCurrent(path.join(root, ".claude", "settings.json")))
    ) return false;
    return filesContain([{
      file: path.join(root, ".mcp.json"),
      values: ["repo-agent", `"REPO_AGENT_INTEGRATION_VERSION": "${VERSION}"`],
    }]);
  }
  if (tool === "opencode") {
    const baseCurrent = await filesContain([{
      file: path.join(root, "opencode.json"),
      values: [
        "repo-agent",
        `"REPO_AGENT_INTEGRATION_VERSION": "${VERSION}"`,
      ],
    }]);
    if (
      !baseCurrent ||
      !(await openCodePermissionsCurrent(path.join(root, "opencode.json")))
    ) return false;
    if (entry !== "plugin") return true;
    return filesContain([{
      file: path.join(root, OPENCODE_PLUGIN_PATH),
      values: [`Generated by repo-agent ${VERSION}`, '"chat.message"', '"tool.execute.before"'],
    }]);
  }
  return false;
}

async function hasRepoAgentHooks(file: string): Promise<boolean> {
  if (!(await exists(file))) return false;
  const errors: ParseError[] = [];
  const document = parse(await readFile(file, "utf8"), errors) as {
    hooks?: Record<string, unknown>;
  } | undefined;
  if (errors.length || !document?.hooks) return false;
  return Object.values(document.hooks).some((groups) =>
    Array.isArray(groups) && groups.some(isRepoAgentHook)
  );
}

async function hooksAreCurrent(file: string): Promise<boolean> {
  if (!(await exists(file))) return false;
  const errors: ParseError[] = [];
  const document = parse(await readFile(file, "utf8"), errors) as {
    hooks?: Record<string, unknown>;
  } | undefined;
  if (errors.length || !document?.hooks) return false;
  const expected = new Map([
    ["SessionStart", "session-start"],
    ["UserPromptSubmit", "user-prompt-submit"],
    ["PreToolUse", "pre-tool-use"],
    ["Stop", "stop"],
  ]);
  return [...expected].every(([event, commandEvent]) => {
    const groups = document.hooks?.[event];
    return Array.isArray(groups) && groups.some((group) => {
      const serialized = JSON.stringify(group);
      return isRepoAgentHook(group) && serialized.includes(commandEvent);
    });
  });
}

async function configStatus(
  root: string,
  tool: IntegrationTool,
  entry: Exclude<EntryMode, "auto">,
): Promise<"missing" | "stale" | "current"> {
  if (await configIsCurrent(root, tool, entry)) return "current";
  const primaryFile = tool === "codex"
    ? path.join(root, ".codex", "config.toml")
    : tool === "claude-code"
      ? path.join(root, ".mcp.json")
      : path.join(root, "opencode.json");
  if (!(await exists(primaryFile))) return "missing";
  return (await readFile(primaryFile, "utf8")).includes("repo-agent")
    ? "stale"
    : "missing";
}

export async function handshake(options: {
  root: string;
  tool: ToolSelection;
  hook?: "session-start";
}) {
  if (options.hook !== undefined && options.hook !== "session-start") {
    throw new CliError("E_HOOK_INPUT", "无效的内部 Hook 激活来源。");
  }
  const selectedTools = (await selectToolAdapters(options.root, options.tool))
    .map((adapter) => adapter.id);
  const projectInitialized = await exists(
    path.join(options.root, ".repo-agent", "config.yaml"),
  );
  let hookRouterReady = false;
  if (projectInitialized) {
    try {
      await loadHookRoutes(options.root);
      hookRouterReady = true;
    } catch {
      hookRouterReady = false;
    }
  }
  const statePath = path.join(options.root, ".repo-agent-runtime", "activation.json");
  const state = await exists(statePath)
    ? JSON.parse(await readFile(statePath, "utf8")) as Record<string, unknown>
    : {};
  const checks = [];
  const entries = state.entries && typeof state.entries === "object"
    ? state.entries as Record<string, Exclude<EntryMode, "auto">>
    : {};
  for (const tool of selectedTools) {
    const entry = entries[tool] ?? getToolAdapter(tool).capabilities.defaultEntry;
    const integrationStatus = await configStatus(options.root, tool, entry);
    const configured = integrationStatus !== "missing";
    const versionCurrent =
      integrationStatus === "current" &&
      (state.configuredVersion === undefined || state.configuredVersion === VERSION);
    checks.push({
      tool,
      entry,
      configured,
      configStatus: integrationStatus,
      configuredVersion: state.configuredVersion ?? null,
      requiredVersion: VERSION,
      status: !projectInitialized || integrationStatus === "missing"
        ? "not_activated"
        : !hookRouterReady
          ? "repair_required"
        : !versionCurrent
          ? "repair_required"
          : options.hook ? "active" : state.state ?? "pending_reload",
    });
  }
  if (
    options.hook &&
    projectInitialized &&
    hookRouterReady &&
    checks.length > 0 &&
    checks.every((check) => check.configStatus === "current")
  ) {
    await mkdir(path.dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify({
      ...state,
      configuredVersion: VERSION,
      tools: selectedTools,
      state: "active",
      reloadType: "none",
      activatedAt: new Date().toISOString(),
      lastHook: options.hook,
    }, null, 2)}\n`);
  }
  const status = !projectInitialized || checks.length === 0
    ? "not_activated"
    : checks.some((check) => check.status === "not_activated")
    ? "not_activated"
    : checks.some((check) => check.status === "repair_required")
      ? "repair_required"
      : checks.some((check) => check.status === "pending_reload")
        ? "pending_reload"
        : "active";
  return {
    ok: true,
    command: "handshake",
    status,
    tool: options.tool,
    projectInitialized,
    hookRouterReady,
    checks,
    reloadRequired: status === "pending_reload",
    reloadType: status === "pending_reload" ? "new_session" : "none",
    suggestedCommand: !projectInitialized
      ? "node repo-agent/repo-agent.bundle.js init --mode team"
      : !hookRouterReady
        ? "node repo-agent/repo-agent.bundle.js validate --strict"
      : status === "not_activated" || status === "repair_required"
        ? `node repo-agent/repo-agent.bundle.js activate --repair --tool ${options.tool}`
        : null,
    warnings: [
      ...(!projectInitialized ? ["项目尚未初始化。"] : []),
      ...(projectInitialized && !hookRouterReady
        ? ["Hook Router 配置缺失或无效。"]
        : []),
    ],
  };
}

export async function deactivateIntegrations(
  root: string,
  selected: ToolSelection,
  dryRun = false,
) {
  const selectedTools = (await selectToolAdapters(root, selected)).map((adapter) => adapter.id);
  const changed: string[] = [];
  if (selectedTools.includes("codex")) {
    await syncManagedSkill(
      null,
      path.join(root, ".agents", "skills", "repo-agent"),
      true,
      true,
    );
  }
  if (selectedTools.includes("claude-code")) {
    await syncManagedSkill(
      null,
      path.join(root, ".claude", "skills", "repo-agent"),
      true,
      true,
    );
  }
  if (selectedTools.includes("opencode")) {
    await syncManagedSkill(
      null,
      path.join(root, ".opencode", "skills", "repo-agent"),
      true,
      true,
    );
    await updateManagedCommand(
      path.join(root, ".opencode", "commands", "repo-agent.md"),
      null,
      true,
    );
  }
  if (selectedTools.includes("codex")) {
    if ((await updateManagedText(path.join(root, ".codex", "config.toml"), "", dryRun)) !== "skipped") {
      changed.push(".codex/config.toml");
    }
    if ((await updateHooks(
      path.join(root, ".codex", "hooks.json"),
      "codex",
      true,
      dryRun,
    )) !== "skipped") changed.push(".codex/hooks.json");
    if ((await syncManagedSkill(
      null,
      path.join(root, ".agents", "skills", "repo-agent"),
      true,
      dryRun,
    )) !== "skipped") changed.push(".agents/skills/repo-agent");
  }
  if (selectedTools.includes("claude-code")) {
    if ((await updateJsonc(path.join(root, ".mcp.json"), [
      { path: ["mcpServers", "repo-agent"], value: undefined },
    ], dryRun)) !== "skipped") changed.push(".mcp.json");
    if ((await updateHooks(
      path.join(root, ".claude", "settings.json"),
      "claude-code",
      true,
      dryRun,
    )) !== "skipped") changed.push(".claude/settings.json");
    if ((await syncManagedSkill(
      null,
      path.join(root, ".claude", "skills", "repo-agent"),
      true,
      dryRun,
    )) !== "skipped") changed.push(".claude/skills/repo-agent");
  }
  if (selectedTools.includes("opencode")) {
    if ((await updateOpenCodeConfig(
      path.join(root, "opencode.json"),
      true,
      dryRun,
    )) !== "skipped") changed.push("opencode.json");
    if ((await updateOwnedFile(
      path.join(root, OPENCODE_PLUGIN_PATH),
      null,
      dryRun,
    )) !== "skipped") changed.push(OPENCODE_PLUGIN_PATH);
    if ((await syncManagedSkill(
      null,
      path.join(root, ".opencode", "skills", "repo-agent"),
      true,
      dryRun,
    )) !== "skipped") changed.push(".opencode/skills/repo-agent");
    if ((await updateManagedCommand(
      path.join(root, ".opencode", "commands", "repo-agent.md"),
      null,
      dryRun,
    )) !== "skipped") changed.push(".opencode/commands/repo-agent.md");
  }
  if (!dryRun) {
    const statePath = path.join(root, ".repo-agent-runtime", "activation.json");
    if (await exists(statePath)) await writeFile(statePath, `${JSON.stringify({
      version: 1,
      state: "inactive",
      tools: selectedTools,
      updatedAt: new Date().toISOString(),
    }, null, 2)}\n`);
  }
  return {
    ok: true,
    command: "deactivate",
    tool: selected,
    changed,
    dryRun,
    reloadRequired: true,
    reloadType: "new_session",
    message: "接入配置已移除；请新建会话使变更完全生效。",
  };
}
