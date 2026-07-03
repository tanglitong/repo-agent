import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
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

async function newProject() {
  const directory = await mkdtemp(path.join(tmpdir(), "repo-agent-update-"));
  await writeFile(path.join(directory, "package.json"), JSON.stringify({
    scripts: { test: "node --test", typecheck: "tsc --noEmit" },
  }));
  return directory;
}

async function filesBelow(directory, base = directory) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(directory, { withFileTypes: true });
  const values = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) values.push(...await filesBelow(target, base));
    else values.push(path.relative(base, target).replaceAll("\\", "/"));
  }
  return values.sort();
}

async function futurePackage() {
  const directory = await mkdtemp(path.join(tmpdir(), "repo-agent-update-future-"));
  const entries = unzipSync(await readFile(archive));
  for (const [relativePath, content] of Object.entries(entries)) {
    const target = path.join(directory, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  const packageRoot = path.join(directory, "repo-agent");
  const bundlePath = path.join(packageRoot, "repo-agent.bundle.js");
  const bundleText = await readFile(bundlePath, "utf8");
  await writeFile(bundlePath, bundleText.replace(
    'var VERSION = "1.0.0";',
    'var VERSION = "1.1.0";',
  ));
  await writeFile(path.join(packageRoot, "VERSION"), "1.1.0\n");
  const migrationRelative = "builtin/migrations/1.0.0-to-1.1.0.yaml";
  const migrationPath = path.join(packageRoot, ...migrationRelative.split("/"));
  await mkdir(path.dirname(migrationPath), { recursive: true });
  const migrationText = `id: migration.1.0.0-to-1.1.0
from: 1.0.0
to: 1.1.0
create_dirs:
  - .repo-agent/generated/upgrades
add_files_if_missing: []
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
    file: migrationRelative,
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

test("update on an uninitialized project initializes it", async () => {
  const project = await newProject();
  const result = await run(project, ["update"]);
  assert.equal(result.ok, true);
  assert.equal(result.command, "update");
  assert.equal(result.action, "init");
  assert.equal(result.initialized, true);
  assert.equal(result.initializedNow, true);
  await readFile(path.join(project, ".repo-agent", "config.yaml"));
});

test("update on an initialized project without a source refreshes assets", async () => {
  const project = await newProject();
  await run(project, ["update"]);
  const refresh = await run(project, ["update"]);
  assert.equal(refresh.action, "refresh");
  assert.equal(refresh.initialized, true);
  assert.equal(refresh.validation.ok, true);
});

test("update applies a migration when a higher-version source is supplied", async () => {
  const project = await newProject();
  await run(project, ["update"]);
  const source = await futurePackage();
  const result = await run(project, ["update", "--source", source, "--yes"]);
  assert.equal(result.action, "migrate");
  assert.equal(result.applied, true);
  assert.ok(result.runId);
  await readFile(path.join(project, result.reportPath));
  await readFile(path.join(project, result.journalPath));
});

test("update --dry-run on a migration does not write files", async () => {
  const project = await newProject();
  await run(project, ["update"]);
  const source = await futurePackage();
  const lockBefore = await readFile(
    path.join(project, ".repo-agent", "lock.yaml"),
    "utf8",
  );
  const result = await run(project, ["update", "--source", source, "--dry-run"]);
  assert.equal(result.action, "migrate");
  assert.equal(result.dryRun, true);
  assert.equal(result.applied, false);
  assert.equal(
    await readFile(path.join(project, ".repo-agent", "lock.yaml"), "utf8"),
    lockBefore,
  );
});

test("update --rollback without runId rolls back the latest completed run", async () => {
  const project = await newProject();
  await run(project, ["update"]);
  const source = await futurePackage();
  const applied = await run(project, ["update", "--source", source, "--yes"]);
  const rolled = await run(project, ["update", "--rollback"]);
  assert.equal(rolled.action, "rollback");
  assert.equal(rolled.rolledBack, true);
  assert.equal(rolled.runId, applied.runId);
  assert.equal(rolled.restoredVersion, "1.0.0");
});

test("update --rollback with an unknown runId returns E_UPGRADE_ROLLBACK_FAILED", async () => {
  const project = await newProject();
  await run(project, ["update"]);
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [bundle, "update", "--rollback", "9999999999-1.0.0-to-9.9.9", "--json"],
      { cwd: project },
    ),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.equal(payload.error.code, "E_UPGRADE_ROLLBACK_FAILED");
      return true;
    },
  );
});

test("update refuses migration without --yes when non-interactive", async () => {
  const project = await newProject();
  await run(project, ["update"]);
  const source = await futurePackage();
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [bundle, "update", "--source", source, "--json"],
      { cwd: project },
    ),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.equal(payload.error.code, "E_UPGRADE_CONFIRMATION_REQUIRED");
      return true;
    },
  );
});
