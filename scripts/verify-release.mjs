import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { unzipSync } from "fflate";

const root = path.resolve(".");
const installedRoot = path.join(root, "repo-agent");
const archive = path.join(root, "release", "repo-agent-node-offline.zip");
const sourcePackage = JSON.parse(await readFile(
  path.join(root, "package.json"),
  "utf8",
));

async function filesBelow(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const values = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? filesBelow(target, base)
      : [path.relative(base, target).replaceAll("\\", "/")];
  }));
  return values.flat().sort();
}

const digest = (value) =>
  createHash("sha256").update(value).digest("hex");

async function verifySourceTree(relativeDirectory) {
  const sourceRoot = path.join(root, relativeDirectory);
  const packagedRoot = path.join(installedRoot, relativeDirectory);
  const sourceFiles = await filesBelow(sourceRoot);
  const packagedFiles = await filesBelow(packagedRoot);
  if (JSON.stringify(sourceFiles) !== JSON.stringify(packagedFiles)) {
    throw new Error(`源码与发布目录清单不一致：${relativeDirectory}`);
  }
  for (const relative of sourceFiles) {
    const source = await readFile(path.join(sourceRoot, relative));
    const packaged = await readFile(path.join(packagedRoot, relative));
    if (digest(source) !== digest(packaged)) {
      throw new Error(`源码与发布文件不一致：${relativeDirectory}/${relative}`);
    }
  }
}

async function verifySourceFile(sourceRelative, installedRelative) {
  const source = await readFile(path.join(root, sourceRelative));
  const installed = await readFile(path.join(installedRoot, installedRelative));
  if (digest(source) !== digest(installed)) {
    throw new Error(`源码与发布文件不一致：${installedRelative}`);
  }
}

const zip = unzipSync(await readFile(archive));
const installedFiles = await filesBelow(installedRoot);
const archiveFiles = Object.keys(zip)
  .filter((name) => name.startsWith("repo-agent/") && !name.endsWith("/"))
  .map((name) => name.slice("repo-agent/".length))
  .sort();

if (JSON.stringify(installedFiles) !== JSON.stringify(archiveFiles)) {
  throw new Error("repo-agent/ 与离线 ZIP 的文件清单不一致。");
}

for (const relative of installedFiles) {
  const installed = await readFile(path.join(installedRoot, relative));
  const packaged = zip[`repo-agent/${relative}`];
  if (!packaged || digest(installed) !== digest(packaged)) {
    throw new Error(`发布文件不一致：${relative}`);
  }
}

const bundle = await readFile(path.join(root, "dist", "repo-agent.bundle.js"));
if (digest(bundle) !== digest(await readFile(
  path.join(installedRoot, "repo-agent.bundle.js"),
))) {
  throw new Error("dist 与安装目录的 bundle 不一致。");
}
for (const directory of ["templates", "schemas", "builtin"]) {
  await verifySourceTree(directory);
}
for (const directory of ["agents", "scripts", "references"]) {
  const sourceRoot = path.join(root, "packaging", "repo-agent", directory);
  const installedDirectory = path.join(installedRoot, directory);
  const sourceFiles = await filesBelow(sourceRoot);
  const installedSkillFiles = await filesBelow(installedDirectory);
  if (JSON.stringify(sourceFiles) !== JSON.stringify(installedSkillFiles)) {
    throw new Error(`Skill 源码与发布目录清单不一致：${directory}`);
  }
  for (const relative of sourceFiles) {
    await verifySourceFile(
      path.join("packaging", "repo-agent", directory, relative),
      path.join(directory, relative),
    );
  }
}
await verifySourceFile("packaging/repo-agent/SKILL.md", "SKILL.md");
await verifySourceFile("packaging/README.md", "README.md");
await verifySourceFile("LICENSE", "LICENSE");
await verifySourceFile("THIRD_PARTY_NOTICES", "THIRD_PARTY_NOTICES");
await verifySourceFile(
  path.join("docs", "zh-CN", "usage.md"),
  "使用文档.md",
);

const version = (
  await readFile(path.join(installedRoot, "VERSION"), "utf8")
).trim();
if (version !== sourcePackage.version) {
  throw new Error(`发布版本不一致：${version} != ${sourcePackage.version}`);
}
const manifest = JSON.parse(await readFile(
  path.join(installedRoot, "RELEASE-MANIFEST.json"),
  "utf8",
));
if (
  manifest.package_format !== 1 ||
  manifest.upgrade_protocol !== 1 ||
  manifest.tool_version !== version ||
  !Array.isArray(manifest.migrations)
) {
  throw new Error("RELEASE-MANIFEST.json 与发布协议或版本不一致。");
}

const checksumLines = (
  await readFile(path.join(installedRoot, "CHECKSUMS.txt"), "utf8")
).trim().split("\n");
const checksumPaths = checksumLines.map((line) => line.split(/  /)[1]);
const expectedChecksumPaths = installedFiles.filter(
  (relative) => relative !== "CHECKSUMS.txt",
);
if (
  new Set(checksumPaths).size !== checksumPaths.length ||
  JSON.stringify([...checksumPaths].sort()) !==
    JSON.stringify(expectedChecksumPaths)
) {
  throw new Error("CHECKSUMS.txt 的文件清单存在缺失、重复或额外条目。");
}
for (const line of checksumLines) {
  const [expected, relative] = line.split(/  /);
  if (!expected || !relative) throw new Error(`无效 Checksum 行：${line}`);
  const actual = digest(await readFile(path.join(installedRoot, relative)));
  if (actual !== expected) throw new Error(`Checksum 不一致：${relative}`);
}

console.log(`Release verified: ${installedFiles.length} files`);
