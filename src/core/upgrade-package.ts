import path from "node:path";
import { createHash } from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  realpath,
  stat,
} from "node:fs/promises";
import { unzipSync } from "fflate";
import { parse } from "yaml";
import { CliError } from "../errors.js";
import { normalizeRepoPath } from "../utils/path-match.js";

const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 128 * 1024 * 1024;
const MAX_ENTRIES = 5000;

export interface UpgradeManifest {
  package_format: 1;
  upgrade_protocol: 1;
  tool_version: string;
  minimum_upgrader_version: string;
  asset_versions: {
    template: string;
    schema: string;
    builtin_policy: string;
    builtin_skill: string;
    builtin_fix_pattern: string;
  };
  migrations: Array<{
    id: string;
    from: string;
    to: string;
    file: string;
    sha256: string;
  }>;
}

export interface UpgradeMigration {
  id: string;
  from: string;
  to: string;
  create_dirs?: string[];
  add_files_if_missing?: Array<{
    source: string;
    target: string;
    category?: "default" | "policy" | "skill" | "fix_pattern";
  }>;
  config_defaults?: Array<{
    file: string;
    path: string;
    value: unknown;
  }>;
  review_required?: string[];
}

export interface UpgradePackage {
  source: string;
  kind: "zip" | "directory";
  manifest: UpgradeManifest;
  files: Map<string, Uint8Array>;
  migrations: UpgradeMigration[];
  read(relativePath: string): Uint8Array;
}

function packageError(message: string, source?: string): CliError {
  return new CliError("E_UPGRADE_PACKAGE_INVALID", message, source);
}

function safePackagePath(input: string): string {
  if (input.includes("\\") || input.includes("\0")) {
    throw packageError(`升级包包含非法路径：${input}`);
  }
  try {
    return normalizeRepoPath(input);
  } catch {
    throw packageError(`升级包路径越界：${input}`);
  }
}

function safeMigrationTarget(input: string, label: string): string {
  const normalized = safePackagePath(input);
  if (normalized !== ".repo-agent" && !normalized.startsWith(".repo-agent/")) {
    throw packageError(`${label} 只能写入 .repo-agent/：${input}`);
  }
  return normalized;
}

async function listDirectoryFiles(directory: string, base = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested: string[] = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw packageError(`升级目录不能包含符号链接：${target}`);
    if (entry.isDirectory()) nested.push(...await listDirectoryFiles(target, base));
    else if (entry.isFile()) nested.push(path.relative(base, target).replaceAll("\\", "/"));
  }
  return nested.sort();
}

async function readDirectoryPackage(source: string): Promise<Map<string, Uint8Array>> {
  const direct = path.resolve(source);
  const directChecksum = path.join(direct, "CHECKSUMS.txt");
  let root = direct;
  try {
    if (!(await stat(directChecksum)).isFile()) throw new Error("not a file");
  } catch {
    root = path.join(direct, "repo-agent");
  }
  const rootReal = await realpath(root);
  const files = new Map<string, Uint8Array>();
  for (const relativePath of await listDirectoryFiles(root)) {
    const safe = safePackagePath(relativePath);
    const target = path.join(root, ...safe.split("/"));
    const targetReal = await realpath(target);
    if (targetReal !== rootReal && !targetReal.startsWith(`${rootReal}${path.sep}`)) {
      throw packageError(`升级目录文件越界：${relativePath}`);
    }
    if (!(await lstat(target)).isFile()) throw packageError(`升级目录条目不是普通文件：${relativePath}`);
    files.set(safe, await readFile(target));
  }
  return files;
}

async function readZipPackage(source: string): Promise<Map<string, Uint8Array>> {
  const archive = await readFile(source);
  if (archive.byteLength > MAX_ARCHIVE_BYTES) throw packageError("升级 ZIP 超过 64 MiB 限制。", source);
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(archive);
  } catch (error) {
    throw packageError(`无法解压升级 ZIP：${(error as Error).message}`, source);
  }
  const names = Object.keys(entries);
  if (names.length > MAX_ENTRIES) throw packageError("升级 ZIP 文件数量超过限制。", source);
  let expandedBytes = 0;
  const files = new Map<string, Uint8Array>();
  for (const name of names) {
    if (!name.startsWith("repo-agent/")) {
      throw packageError(`升级 ZIP 只能包含 repo-agent/ 顶层目录：${name}`, source);
    }
    const relativePath = safePackagePath(name.slice("repo-agent/".length));
    if (!relativePath || relativePath === ".") continue;
    expandedBytes += entries[name].byteLength;
    if (expandedBytes > MAX_EXPANDED_BYTES) throw packageError("升级 ZIP 解压后超过 128 MiB 限制。", source);
    files.set(relativePath, entries[name]);
  }
  return files;
}

function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function decode(content: Uint8Array, relativePath: string): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(content);
  } catch {
    throw packageError(`升级包文本不是有效 UTF-8：${relativePath}`);
  }
}

function validateChecksums(files: Map<string, Uint8Array>): void {
  const checksumFile = files.get("CHECKSUMS.txt");
  if (!checksumFile) throw packageError("升级包缺少 CHECKSUMS.txt。");
  const expected = new Map<string, string>();
  for (const line of decode(checksumFile, "CHECKSUMS.txt").trim().split(/\r?\n/)) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw packageError(`CHECKSUMS.txt 行格式无效：${line}`);
    const relativePath = safePackagePath(match[2]);
    if (expected.has(relativePath)) throw packageError(`CHECKSUMS.txt 路径重复：${relativePath}`);
    expected.set(relativePath, match[1]);
  }
  const packageFiles = [...files.keys()].filter((file) => file !== "CHECKSUMS.txt").sort();
  if (
    expected.size !== packageFiles.length ||
    packageFiles.some((file) => !expected.has(file))
  ) {
    throw packageError("CHECKSUMS.txt 必须完整覆盖升级包内的所有文件。");
  }
  for (const [relativePath, digest] of expected) {
    const content = files.get(relativePath);
    if (!content || sha256(content) !== digest) {
      throw packageError(`升级包文件校验失败：${relativePath}`);
    }
  }
}

function assertSemver(value: string, label: string): void {
  if (!/^\d+\.\d+\.\d+$/.test(value)) {
    throw packageError(`${label} 不是有效版本号：${value}`);
  }
}

export function compareVersions(left: string, right: string): number {
  assertSemver(left, "版本");
  assertSemver(right, "版本");
  const leftParts = left.split("-")[0].split(".").map(Number);
  const rightParts = right.split("-")[0].split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}

function parseManifest(files: Map<string, Uint8Array>): UpgradeManifest {
  const content = files.get("RELEASE-MANIFEST.json");
  if (!content) throw packageError("升级包缺少 RELEASE-MANIFEST.json。");
  let manifest: UpgradeManifest;
  try {
    manifest = JSON.parse(decode(content, "RELEASE-MANIFEST.json")) as UpgradeManifest;
  } catch (error) {
    throw packageError(`RELEASE-MANIFEST.json 无效：${(error as Error).message}`);
  }
  if (manifest.package_format !== 1 || manifest.upgrade_protocol !== 1) {
    throw packageError("升级包格式或升级协议不受支持。");
  }
  assertSemver(manifest.tool_version, "tool_version");
  assertSemver(manifest.minimum_upgrader_version, "minimum_upgrader_version");
  for (const [name, version] of Object.entries(manifest.asset_versions ?? {})) {
    assertSemver(String(version), `asset_versions.${name}`);
  }
  if (!Array.isArray(manifest.migrations)) throw packageError("migrations 必须是数组。");
  return manifest;
}

function parseMigrations(
  files: Map<string, Uint8Array>,
  manifest: UpgradeManifest,
): UpgradeMigration[] {
  const migrations: UpgradeMigration[] = [];
  const ids = new Set<string>();
  for (const item of manifest.migrations) {
    if (ids.has(item.id)) throw packageError(`migration id 重复：${item.id}`);
    ids.add(item.id);
    const migrationPath = safePackagePath(item.file);
    const content = files.get(migrationPath);
    if (!content || sha256(content) !== item.sha256) {
      throw packageError(`migration 文件缺失或摘要不匹配：${migrationPath}`);
    }
    const migration = parse(decode(content, migrationPath)) as UpgradeMigration;
    if (
      migration.id !== item.id ||
      migration.from !== item.from ||
      migration.to !== item.to
    ) {
      throw packageError(`migration 元数据不一致：${item.id}`);
    }
    assertSemver(migration.from, `${item.id}.from`);
    assertSemver(migration.to, `${item.id}.to`);
    for (const directory of migration.create_dirs ?? []) {
      safeMigrationTarget(directory, "create_dirs");
    }
    for (const file of migration.add_files_if_missing ?? []) {
      safePackagePath(file.source);
      safeMigrationTarget(file.target, "add_files_if_missing.target");
      if (!files.has(file.source)) throw packageError(`migration 源文件不存在：${file.source}`);
    }
    for (const proposal of migration.config_defaults ?? []) {
      const configFile = safeMigrationTarget(proposal.file, "config_defaults.file");
      if (
        ![".repo-agent/config.yaml", ".repo-agent/commit_policy.yaml"].includes(configFile)
      ) {
        throw packageError(`config_defaults 只能建议 config.yaml 或 commit_policy.yaml：${proposal.file}`);
      }
      if (!/^[A-Za-z0-9_.-]+(?:\.[A-Za-z0-9_.-]+)*$/.test(proposal.path)) {
        throw packageError(`配置字段路径无效：${proposal.path}`);
      }
    }
    migrations.push(migration);
  }
  return migrations;
}

export function resolveMigrationChain(
  migrations: UpgradeMigration[],
  from: string,
  to: string,
): UpgradeMigration[] {
  if (from === to) return [];
  const paths: UpgradeMigration[][] = [];
  const visit = (version: string, chain: UpgradeMigration[], seen: Set<string>): void => {
    if (version === to) {
      paths.push(chain);
      return;
    }
    for (const migration of migrations.filter((item) => item.from === version)) {
      if (seen.has(migration.to) || compareVersions(migration.to, to) > 0) continue;
      visit(migration.to, [...chain, migration], new Set([...seen, migration.to]));
      if (paths.length > 1) return;
    }
  };
  visit(from, [], new Set([from]));
  if (paths.length === 0) throw new CliError("E_UPGRADE_PATH_MISSING", `缺少 ${from} → ${to} 的迁移链。`);
  if (paths.length > 1) throw new CliError("E_UPGRADE_PATH_AMBIGUOUS", `存在多条 ${from} → ${to} 迁移链。`);
  return paths[0];
}

export async function loadUpgradePackage(source: string): Promise<UpgradePackage> {
  const resolved = path.resolve(source);
  let sourceStat;
  try {
    sourceStat = await stat(resolved);
  } catch {
    throw packageError(`升级来源不存在：${source}`, source);
  }
  const kind = sourceStat.isDirectory() ? "directory" : "zip";
  const files = kind === "directory"
    ? await readDirectoryPackage(resolved)
    : await readZipPackage(resolved);
  validateChecksums(files);
  const manifest = parseManifest(files);
  const migrations = parseMigrations(files, manifest);
  return {
    source: resolved,
    kind,
    manifest,
    files,
    migrations,
    read(relativePath: string) {
      const safe = safePackagePath(relativePath);
      const content = files.get(safe);
      if (!content) throw packageError(`升级包文件不存在：${safe}`);
      return content;
    },
  };
}
