import path from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { exists } from "../utils/fs.js";

export const managedGitignoreStart = "# >>> repo-agent managed";
export const managedGitignoreEnd = "# <<< repo-agent managed";

export const gitignoreSections = [
  {
    title: "repo-agent：团队运行程序",
    entries: [
      "!/repo-agent/",
      "!/repo-agent/**",
    ],
  },
  {
    title: "repo-agent：个人配置",
    entries: [
      "/.repo-agent.local.yaml",
      "/.repo-agent.local.yml",
      "/.repo-agent-private/",
    ],
  },
  {
    title: "repo-agent：派生文件与运行状态",
    entries: [
      "/.repo-agent/generated/",
      "/.repo-agent/catalog/",
      "/.repo-agent/cache/",
      "/.repo-agent/index/",
      "/.repo-agent/traces/",
      "/.repo-agent/logs/",
      "/.repo-agent/runs/",
      "/.repo-agent/artifacts/",
      "/.repo-agent/sessions/",
      "/.repo-agent/worktrees/",
      "/.repo-agent/tmp/",
      "/.repo-agent/embeddings/",
      "/.repo-agent/learning_inbox/",
      "/.repo-agent-runtime/",
    ],
  },
  {
    title: "repo-agent：本地数据、索引、日志与临时文件",
    entries: [
      ".repo-agent/**/*.db",
      ".repo-agent/**/*.sqlite",
      ".repo-agent/**/*.sqlite3",
      ".repo-agent/**/*.jsonl",
      ".repo-agent/**/*.log",
      ".repo-agent/**/*.faiss",
      ".repo-agent/**/*.ann",
      ".repo-agent/**/*.hnsw",
      ".repo-agent/**/*.vec",
      ".repo-agent/**/*.bin",
      ".repo-agent/**/*.tmp",
      ".repo-agent/**/*.temp",
      ".repo-agent/**/*.bak",
      ".repo-agent/**/*.swp",
      ".repo-agent/**/*.swo",
    ],
  },
  {
    title: "敏感文件（示例模板除外）",
    entries: [
      ".env",
      ".env.*",
      "!.env.example",
      "!.env.sample",
      "!.env.template",
      "!.env.*.example",
      "!.env.*.sample",
      "!.env.*.template",
      "*.pem",
      "*.key",
      "*.p12",
      "*.pfx",
      "id_rsa",
      "id_rsa.*",
      "!id_rsa.pub",
      "id_ed25519",
      "id_ed25519.*",
      "!id_ed25519.pub",
      "secrets.*",
      "!secrets.example.*",
      "*.secret",
      "*.secrets",
    ],
  },
  {
    title: "操作系统临时文件",
    entries: [".DS_Store", "Thumbs.db"],
  },
];

const legacyHeaders = new Set([
  "# repo-agent 本地与生成文件",
  ...gitignoreSections.map((section) => `# ${section.title}`),
]);

export function renderManagedGitignore(eol = "\n"): string {
  const body = gitignoreSections
    .map((section) => [`# ${section.title}`, ...section.entries].join(eol))
    .join(`${eol}${eol}`);
  return [
    managedGitignoreStart,
    "# 此区块由 repo-agent 自动维护，请把自定义规则写在区块之外。",
    body,
    managedGitignoreEnd,
  ].join(eol);
}

function stripManagedAndLegacyBlocks(content: string): string {
  const lines = content.split(/\r?\n/);
  const kept: string[] = [];
  let inManaged = false;
  let inLegacy = false;
  for (const line of lines) {
    if (line.trim() === managedGitignoreStart) {
      inManaged = true;
      continue;
    }
    if (inManaged) {
      if (line.trim() === managedGitignoreEnd) inManaged = false;
      continue;
    }
    if (legacyHeaders.has(line.trim())) {
      inLegacy = true;
      continue;
    }
    if (inLegacy) {
      if (!line.trim()) inLegacy = false;
      continue;
    }
    kept.push(line);
  }
  while (kept.length && !kept.at(-1)?.trim()) kept.pop();
  return kept.join("\n");
}

export interface GitignoreMergeResult {
  action: "created" | "updated" | "skipped" | "wouldCreate" | "wouldUpdate";
  previous: string;
  next: string;
}

export async function ensureManagedGitignore(
  root: string,
  dryRun: boolean,
): Promise<GitignoreMergeResult> {
  const gitignorePath = path.join(root, ".gitignore");
  const fileExists = await exists(gitignorePath);
  const previous = fileExists ? await readFile(gitignorePath, "utf8") : "";
  const eol = previous.includes("\r\n") ? "\r\n" : "\n";
  const userContent = stripManagedAndLegacyBlocks(previous).replaceAll("\n", eol);
  const next = `${userContent ? `${userContent}${eol}${eol}` : ""}${renderManagedGitignore(eol)}${eol}`;
  if (next === previous) return { action: "skipped", previous, next };
  if (dryRun) {
    return {
      action: fileExists ? "wouldUpdate" : "wouldCreate",
      previous,
      next,
    };
  }
  await writeFile(gitignorePath, next, "utf8");
  return { action: fileExists ? "updated" : "created", previous, next };
}

export function gitignoreSuggestion(): string {
  return `${renderManagedGitignore()}\n`;
}
