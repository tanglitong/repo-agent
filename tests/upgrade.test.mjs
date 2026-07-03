import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = path.join(root, "dist", "repo-agent.bundle.js");
const archive = path.join(root, "release", "repo-agent-node-offline.zip");

async function run(directory, args) {
  const { stdout } = await execFileAsync(
    process.execPath,
    [bundle, ...args, "--json"],
    { cwd: directory },
  );
  return JSON.parse(stdout.trim());
}

async function baseProject() {
  const directory = await mkdtemp(path.join(tmpdir(), "repo-agent-upgrade-"));
  await writeFile(path.join(directory, "package.json"), JSON.stringify({
    scripts: { test: "node --test", typecheck: "tsc --noEmit" },
  }));
  await run(directory, ["init"]);
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  const memoryPath = path.join(directory, ".repo-agent", "memories", "repo.md");
  await writeFile(
    configPath,
    (await readFile(configPath, "utf8")).replace(
      "min_relevance: 0.15",
      "min_relevance: 0.2",
    ),
  );
  await writeFile(memoryPath, "# 仓库\n\n团队沉淀资产，升级不得覆盖。\n");
  await writeFile(
    path.join(directory, ".gitignore"),
    `node_modules/

# repo-agent 本地与生成文件
.repo-agent/generated/
.repo-agent.local.yaml
`,
  );
  return directory;
}

async function extractArchive(destination) {
  const entries = unzipSync(await readFile(archive));
  for (const [relativePath, content] of Object.entries(entries)) {
    const target = path.join(destination, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}

async function filesBelow(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(target, base));
    else result.push(path.relative(base, target).replaceAll("\\", "/"));
  }
  return result.sort();
}

async function futurePackage() {
  const directory = await mkdtemp(path.join(tmpdir(), "repo-agent-future-"));
  await extractArchive(directory);
  const packageRoot = path.join(directory, "repo-agent");
  const bundlePath = path.join(packageRoot, "repo-agent.bundle.js");
  const bundleText = await readFile(bundlePath, "utf8");
  assert.match(bundleText, /var VERSION = "1\.0\.0";/);
  await writeFile(bundlePath, bundleText.replace(
    'var VERSION = "1.0.0";',
    'var VERSION = "1.1.0";',
  ));
  await writeFile(path.join(packageRoot, "VERSION"), "1.1.0\n");
  const migrationPath = path.join(
    packageRoot,
    "builtin",
    "migrations",
    "1.0.0-to-1.1.0.yaml",
  );
  await mkdir(path.dirname(migrationPath), { recursive: true });
  const upgradedSkillRelative = "builtin/upgrade-assets/skill.bugfix.red-green-refactor.yaml";
  const upgradedSkillPath = path.join(packageRoot, ...upgradedSkillRelative.split("/"));
  await mkdir(path.dirname(upgradedSkillPath), { recursive: true });
  await writeFile(
    upgradedSkillPath,
    `id: skill.bugfix.red-green-refactor
status: approved
description: 新版红绿重构流程
steps:
  - 先复现失败
  - 实施最小修复
  - 运行完整回归
`,
  );
  const newAdapterRelative = "builtin/upgrade-assets/new-agent-adapter.yaml";
  const newAdapterPath = path.join(packageRoot, ...newAdapterRelative.split("/"));
  await writeFile(
    newAdapterPath,
    "id: adapter.new-agent\nname: 新 Agent\nversion: 1\n",
  );
  const migrationText = `id: migration.1.0.0-to-1.1.0
from: 1.0.0
to: 1.1.0
create_dirs:
  - .repo-agent/generated/upgrades
add_files_if_missing:
  - source: ${upgradedSkillRelative}
    target: .repo-agent/skills/approved/bugfix.red-green-refactor.yaml
    category: skill
  - source: ${newAdapterRelative}
    target: .repo-agent/adapters/new-agent.yaml
    category: default
config_defaults: []
review_required: []
`;
  await writeFile(migrationPath, migrationText);
  const manifestPath = path.join(packageRoot, "RELEASE-MANIFEST.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.tool_version = "1.1.0";
  for (const key of Object.keys(manifest.asset_versions)) manifest.asset_versions[key] = "1.1.0";
  manifest.migrations.push({
    id: "migration.1.0.0-to-1.1.0",
    from: "1.0.0",
    to: "1.1.0",
    file: "builtin/migrations/1.0.0-to-1.1.0.yaml",
    sha256: createHash("sha256").update(migrationText).digest("hex"),
  });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const checksumLines = [];
  for (const relativePath of await filesBelow(packageRoot)) {
    if (relativePath === "CHECKSUMS.txt") continue;
    const content = await readFile(path.join(packageRoot, relativePath));
    checksumLines.push(`${createHash("sha256").update(content).digest("hex")}  ${relativePath}`);
  }
  await writeFile(path.join(packageRoot, "CHECKSUMS.txt"), `${checksumLines.join("\n")}\n`);
  return directory;
}

test("future upgrade plan is read-only and apply preserves accumulated assets", async () => {
  const directory = await baseProject();
  const source = await futurePackage();
  const lockBefore = await readFile(path.join(directory, ".repo-agent", "lock.yaml"), "utf8");
  const configBefore = await readFile(path.join(directory, ".repo-agent", "config.yaml"), "utf8");
  const memoryBefore = await readFile(path.join(directory, ".repo-agent", "memories", "repo.md"), "utf8");

  const planned = await run(directory, ["update", "--source", source, "--dry-run"]);
  assert.equal(planned.currentVersion, "1.0.0");
  assert.equal(planned.targetVersion, "1.1.0");
  assert.equal(planned.upgradeAvailable, true);
  assert.deepEqual(planned.migrationChain, ["migration.1.0.0-to-1.1.0"]);
  assert.equal(await readFile(path.join(directory, ".repo-agent", "lock.yaml"), "utf8"), lockBefore);

  const applied = await run(directory, ["update", "--source", source, "--yes"]);
  assert.equal(applied.applied, true);
  assert.equal(applied.reviewRequired, true);
  assert.ok(applied.runId);
  assert.equal(await readFile(path.join(directory, ".repo-agent", "config.yaml"), "utf8"), configBefore);
  assert.equal(await readFile(path.join(directory, ".repo-agent", "memories", "repo.md"), "utf8"), memoryBefore);
  const lockAfter = await readFile(path.join(directory, ".repo-agent", "lock.yaml"), "utf8");
  assert.match(lockAfter, /version: 1/);
  assert.match(lockAfter, /asset_version: 1\.1\.0/);
  assert.match(lockAfter, /migration\.1\.0\.0-to-1\.1\.0/);
  const gitignore = await readFile(path.join(directory, ".gitignore"), "utf8");
  assert.match(gitignore, /# >>> repo-agent managed/);
  assert.match(gitignore, /# <<< repo-agent managed/);
  assert.match(gitignore, /^node_modules\/$/m);
  await readFile(path.join(directory, applied.reportPath));
  await readFile(path.join(directory, applied.journalPath));
  assert.equal((await run(directory, ["validate", "--strict"])).ok, true);

  const rolledBack = await run(directory, ["update", "--rollback", applied.runId]);
  assert.equal(rolledBack.rolledBack, true);
  assert.equal(await readFile(path.join(directory, ".repo-agent", "lock.yaml"), "utf8"), lockBefore);
  assert.equal(await readFile(path.join(directory, ".repo-agent", "config.yaml"), "utf8"), configBefore);
  assert.equal(await readFile(path.join(directory, ".repo-agent", "memories", "repo.md"), "utf8"), memoryBefore);
});

test("upgrade accepts an extracted package directory and dry-run writes nothing", async () => {
  const directory = await baseProject();
  const extractionRoot = await futurePackage();
  const lockBefore = await readFile(path.join(directory, ".repo-agent", "lock.yaml"), "utf8");
  const result = await run(directory, [
    "update",
    "--source",
    extractionRoot,
    "--dry-run",
  ]);
  assert.equal(result.dryRun, true);
  assert.equal(result.applied, false);
  assert.equal(result.sourceKind, "directory");
  assert.equal(await readFile(path.join(directory, ".repo-agent", "lock.yaml"), "utf8"), lockBefore);
});

test("upgrade rejects a package whose content no longer matches checksums", async () => {
  const directory = await baseProject();
  const extractionRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-tampered-"));
  const entries = unzipSync(await readFile(archive));
  for (const [relativePath, content] of Object.entries(entries)) {
    const target = path.join(extractionRoot, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  await writeFile(
    path.join(extractionRoot, "repo-agent", "VERSION"),
    "tampered\n",
  );
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [bundle, "update", "--source", extractionRoot, "--dry-run", "--json"],
      { cwd: directory },
    ),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.equal(payload.error.code, "E_UPGRADE_PACKAGE_INVALID");
      return true;
    },
  );
});

test("one-command upgrade stages, validates, and switches an installed tool, then rolls it back", async () => {
  const project = await mkdtemp(path.join(tmpdir(), "repo-agent-tool-switch-"));
  await extractArchive(project);
  const installedBundle = path.join(project, "repo-agent", "repo-agent.bundle.js");
  await execFileAsync(process.execPath, [installedBundle, "init", "--json"], { cwd: project });
  const source = await futurePackage();

  const { stdout } = await execFileAsync(
    process.execPath,
    [installedBundle, "update", "--source", source, "--yes", "--json"],
    { cwd: project },
  );
  const result = JSON.parse(stdout.trim());
  assert.equal(result.applied, true);
  assert.equal(result.toolSwitched, true);
  assert.equal(result.reviewRequired, true);
  assert.equal(result.upgradeCandidates.length, 1);
  assert.equal(result.configProposals.length, 0);
  await readFile(path.join(project, result.upgradeCandidates[0].path));
  await readFile(path.join(project, ".repo-agent", "adapters", "new-agent.yaml"));
  assert.doesNotMatch(
    await readFile(path.join(project, ".repo-agent", "config.yaml"), "utf8"),
    /upgrade_test/,
  );
  assert.doesNotMatch(
    await readFile(
      path.join(project, ".repo-agent", "skills", "approved", "bugfix.red-green-refactor.yaml"),
      "utf8",
    ),
    /新版红绿重构流程/,
  );
  assert.equal(
    (await execFileAsync(process.execPath, [installedBundle, "--version"], { cwd: project })).stdout.trim(),
    "1.1.0",
  );
  assert.match(await readFile(path.join(project, ".repo-agent", "lock.yaml"), "utf8"), /asset_version: 1\.1\.0/);
  const pendingStatus = JSON.parse((await execFileAsync(
    process.execPath,
    [installedBundle, "update", "--source", source, "--dry-run", "--json"],
    { cwd: project },
  )).stdout.trim());
  assert.equal(pendingStatus.upgradeAvailable, false);
  assert.equal(pendingStatus.upgradeState, "pending_review");
  assert.ok(pendingStatus.pendingReview.length >= 1);

  await execFileAsync(
    process.execPath,
    [installedBundle, "update", "--rollback", result.runId, "--json"],
    { cwd: project },
  );
  assert.equal(
    (await execFileAsync(process.execPath, [installedBundle, "--version"], { cwd: project })).stdout.trim(),
    "1.0.0",
  );
  await assert.rejects(readFile(path.join(project, ".repo-agent", "adapters", "new-agent.yaml")));
});
