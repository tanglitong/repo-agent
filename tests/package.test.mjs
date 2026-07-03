import test from "node:test";
import assert from "node:assert/strict";
import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";
import { parse as parseYaml } from "yaml";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("offline package builds without a tracked migrations directory", async () => {
  const sourceRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-clean-source-"));
  for (const directory of ["templates", "schemas", "packaging", "docs"]) {
    await cp(path.join(root, directory), path.join(sourceRoot, directory), {
      recursive: true,
    });
  }
  await mkdir(path.join(sourceRoot, "builtin"), { recursive: true });
  await cp(
    path.join(root, "builtin", "README.md"),
    path.join(sourceRoot, "builtin", "README.md"),
  );
  await mkdir(path.join(sourceRoot, "dist"), { recursive: true });
  await cp(
    path.join(root, "dist", "repo-agent.bundle.js"),
    path.join(sourceRoot, "dist", "repo-agent.bundle.js"),
  );
  for (const file of ["package.json", "LICENSE", "THIRD_PARTY_NOTICES"]) {
    await cp(path.join(root, file), path.join(sourceRoot, file));
  }

  await execFileAsync(
    process.execPath,
    [path.join(root, "scripts", "package-offline.mjs")],
    { cwd: sourceRoot },
  );
  const entries = unzipSync(
    await readFile(
      path.join(sourceRoot, "release", "repo-agent-node-offline.zip"),
    ),
  );
  const manifest = JSON.parse(
    Buffer.from(entries["repo-agent/RELEASE-MANIFEST.json"]).toString("utf8"),
  );
  assert.deepEqual(manifest.migrations, []);
  await rm(sourceRoot, { recursive: true, force: true });
});

test("source, ZIP, and committed installation are byte-consistent", async () => {
  const distBundle = await readFile(
    path.join(root, "dist", "repo-agent.bundle.js"),
  );
  const archive = path.join(root, "release", "repo-agent-node-offline.zip");
  const packagedBundle = unzipSync(await readFile(archive))[
    "repo-agent/repo-agent.bundle.js"
  ];
  assert.ok(packagedBundle);
  assert.equal(
    createHash("sha256").update(distBundle).digest("hex"),
    createHash("sha256").update(packagedBundle).digest("hex"),
  );
  const installedBundle = await readFile(
    path.join(root, "repo-agent", "repo-agent.bundle.js"),
  );
  assert.equal(
    createHash("sha256").update(distBundle).digest("hex"),
    createHash("sha256").update(installedBundle).digest("hex"),
  );
  const verified = await execFileAsync(
    process.execPath,
    [path.join(root, "scripts", "verify-release.mjs")],
    { cwd: root },
  );
  assert.match(verified.stdout, /Release verified/);
});

test("offline zip runs after extraction without node_modules", async () => {
  const archive = path.join(root, "release", "repo-agent-node-offline.zip");
  const extractionRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-release-"));
  const entries = unzipSync(await readFile(archive));
  for (const [relativePath, content] of Object.entries(entries)) {
    const target = path.join(extractionRoot, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }

  const packagedRoot = path.join(extractionRoot, "repo-agent");
  const skill = await readFile(path.join(packagedRoot, "SKILL.md"), "utf8");
  assert.match(skill, /^---\nname: repo-agent\n/m);
  assert.match(skill, /repo-agent managed skill v1/);
  assert.match(skill, /1\. 更新或修复接入/);
  assert.match(skill, /4\. 经验候选查看、晋升、批准、拒绝、归档和合并/);
  assert.match(skill, /8\. 生命周期提案、审核、归档和恢复/);
  assert.match(skill, /写入类操作必须先按命令表执行 `--dry-run`/);
  assert.match(skill, /必须收集审核者名称/);
  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/u);
  assert.ok(frontmatter);
  assert.deepEqual(
    Object.keys(parseYaml(frontmatter[1])).sort(),
    ["description", "name"],
  );
  const agentMetadata = parseYaml(
    await readFile(path.join(packagedRoot, "agents", "openai.yaml"), "utf8"),
  );
  assert.equal(agentMetadata.policy.allow_implicit_invocation, false);
  assert.match(agentMetadata.interface.default_prompt, /\$repo-agent/);
  const installerSource = await readFile(
    path.join(packagedRoot, "scripts", "install.mjs"),
    "utf8",
  );
  const commandMap = await readFile(
    path.join(packagedRoot, "references", "command-map.md"),
    "utf8",
  );
  for (const route of [
    "candidate promote",
    "recurring-errors propose-fix-pattern",
    "closure recover",
    "lifecycle apply",
  ]) {
    assert.match(commandMap, new RegExp(route));
  }
  assert.match(commandMap, /--reviewer "<审核者>" --dry-run/);
  assert.doesNotMatch(
    `${skill}\n${installerSource}\n${commandMap}`,
    /\bnpm\b|package:offline|release:prepare|release:verify/,
  );
  assert.match(
    await readFile(path.join(packagedRoot, "LICENSE"), "utf8"),
    /^MIT License$/m,
  );
  const thirdPartyNotices = await readFile(
    path.join(packagedRoot, "THIRD_PARTY_NOTICES"),
    "utf8",
  );
  assert.match(thirdPartyNotices, /jsonc-parser 3\.3\.1/);
  assert.match(thirdPartyNotices, /minimatch 9\.0\.9/);
  assert.match(thirdPartyNotices, /yaml 2\.9\.0/);
  const packagedPackage = JSON.parse(
    await readFile(path.join(packagedRoot, "package.json"), "utf8"),
  );
  assert.equal(packagedPackage.license, "MIT");
  await readFile(path.join(packagedRoot, "使用文档.md"), "utf8");
  const { stdout } = await execFileAsync(
    process.execPath,
    [path.join(packagedRoot, "repo-agent.bundle.js"), "--version"],
    { cwd: extractionRoot },
  );
  assert.equal(stdout.trim(), "1.0.0");
  const checksums = await readFile(path.join(packagedRoot, "CHECKSUMS.txt"), "utf8");
  assert.match(checksums, /repo-agent\.bundle\.js/);
  assert.match(checksums, /schemas\/memory_candidate\.schema\.json/);
  for (const line of checksums.trim().split("\n")) {
    const [expected, relativePath] = line.split(/  /);
    const content = await readFile(path.join(packagedRoot, relativePath));
    assert.equal(createHash("sha256").update(content).digest("hex"), expected);
  }
  assert.match(await readFile(path.join(packagedRoot, "VERSION"), "utf8"), /1\.0\.0/);
  const manifest = JSON.parse(
    await readFile(path.join(packagedRoot, "RELEASE-MANIFEST.json"), "utf8"),
  );
  assert.equal(manifest.tool_version, "1.0.0");
  assert.equal(manifest.minimum_upgrader_version, "1.0.0");
  assert.equal(manifest.upgrade_protocol, 1);
  assert.deepEqual(manifest.migrations, []);

  const packagedBundle = path.join(packagedRoot, "repo-agent.bundle.js");
  await writeFile(path.join(extractionRoot, "AGENTS.md"), "用户 AGENTS\n");
  await writeFile(path.join(extractionRoot, "CLAUDE.md"), "用户 CLAUDE\n");
  await execFileAsync(
    process.execPath,
    [packagedBundle, "init", "--tool", "all", "--json"],
    { cwd: extractionRoot },
  );
  const synchronized = await execFileAsync(
    process.execPath,
    [packagedBundle, "update", "--tool", "opencode", "--json"],
    { cwd: extractionRoot },
  );
  assert.equal(JSON.parse(synchronized.stdout).validation.ok, true);
  await readFile(path.join(extractionRoot, "opencode.json"), "utf8");
  await readFile(
    path.join(extractionRoot, ".opencode", "plugins", "repo-agent.js"),
    "utf8",
  );
  await readFile(
    path.join(extractionRoot, ".agents", "skills", "repo-agent", "SKILL.md"),
    "utf8",
  );
  await readFile(
    path.join(extractionRoot, ".claude", "skills", "repo-agent", "SKILL.md"),
    "utf8",
  );
  await readFile(
    path.join(extractionRoot, ".opencode", "skills", "repo-agent", "SKILL.md"),
    "utf8",
  );
  assert.match(
    await readFile(
      path.join(extractionRoot, ".opencode", "commands", "repo-agent.md"),
      "utf8",
    ),
    /repo-agent managed command v1/,
  );
  assert.equal(
    await readFile(path.join(extractionRoot, "AGENTS.md"), "utf8"),
    "用户 AGENTS\n",
  );
  assert.equal(
    await readFile(path.join(extractionRoot, "CLAUDE.md"), "utf8"),
    "用户 CLAUDE\n",
  );

  const node18 = process.env.HOME
    ? path.join(process.env.HOME, ".nvm", "versions", "node", "v18.20.8", "bin", "node")
    : null;
  try {
    if (!node18) return;
    await access(node18);
    const node18Result = await execFileAsync(
      node18,
      [path.join(packagedRoot, "repo-agent.bundle.js"), "--version"],
      { cwd: extractionRoot },
    );
    assert.equal(node18Result.stdout.trim(), "1.0.0");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
});

test("packaged Skill installs repo-agent into an external project", async () => {
  const archive = path.join(root, "release", "repo-agent-node-offline.zip");
  const skillRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-skill-"));
  const targetRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-target-"));
  const entries = unzipSync(await readFile(archive));
  for (const [relativePath, content] of Object.entries(entries)) {
    const target = path.join(skillRoot, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  const packagedRoot = path.join(skillRoot, "repo-agent");
  const installer = path.join(packagedRoot, "scripts", "install.mjs");
  await execFileAsync(process.execPath, [
    installer,
    "--target",
    targetRoot,
    "--mode",
    "team",
    "--tool",
    "codex",
    "--entry",
    "auto",
    "--json",
  ]);

  assert.equal(
    await readFile(
      path.join(targetRoot, "repo-agent", "SKILL.md"),
      "utf8",
    ),
    await readFile(path.join(packagedRoot, "SKILL.md"), "utf8"),
  );
  await readFile(
    path.join(targetRoot, ".agents", "skills", "repo-agent", "SKILL.md"),
    "utf8",
  );
  await readFile(path.join(targetRoot, ".repo-agent", "config.yaml"), "utf8");

  await assert.rejects(
    execFileAsync(process.execPath, [
      installer,
      "--target",
      targetRoot,
      "--json",
    ]),
    /E_SKILL_INSTALL|目标已存在 repo-agent/,
  );
});

test("source development bundle does not install the packaged Skill interface", async () => {
  const targetRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-source-init-"));
  await execFileAsync(process.execPath, [
    path.join(root, "dist", "repo-agent.bundle.js"),
    "init",
    "--tool",
    "codex",
    "--json",
  ], { cwd: targetRoot });
  await assert.rejects(
    readFile(
      path.join(targetRoot, ".agents", "skills", "repo-agent", "SKILL.md"),
      "utf8",
    ),
    /ENOENT/,
  );
});

test("packaged Skill rejects tampered packages and entry none installs no client Skill", async () => {
  const archive = path.join(root, "release", "repo-agent-node-offline.zip");
  const skillRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-skill-tampered-"));
  const targetRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-tampered-target-"));
  const entries = unzipSync(await readFile(archive));
  for (const [relativePath, content] of Object.entries(entries)) {
    const target = path.join(skillRoot, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  const packagedRoot = path.join(skillRoot, "repo-agent");
  await writeFile(path.join(packagedRoot, "VERSION"), "tampered\n");
  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(packagedRoot, "scripts", "install.mjs"),
      "--target",
      targetRoot,
      "--json",
    ]),
    /E_SKILL_INSTALL|校验失败/,
  );
  await assert.rejects(
    readFile(path.join(targetRoot, "repo-agent", "VERSION"), "utf8"),
    /ENOENT/,
  );

  const noneRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-entry-none-"));
  await execFileAsync(process.execPath, [
    path.join(root, "repo-agent", "repo-agent.bundle.js"),
    "init",
    "--tool",
    "all",
    "--entry",
    "none",
    "--json",
  ], { cwd: noneRoot });
  for (const relative of [
    ".agents/skills/repo-agent/SKILL.md",
    ".claude/skills/repo-agent/SKILL.md",
    ".opencode/skills/repo-agent/SKILL.md",
    ".opencode/commands/repo-agent.md",
  ]) {
    await assert.rejects(
      readFile(path.join(noneRoot, relative), "utf8"),
      /ENOENT/,
    );
  }
});

test("Skill integration is repaired, removed safely, and never overwrites conflicts", async () => {
  const archive = path.join(root, "release", "repo-agent-node-offline.zip");
  const extractionRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-skill-integration-"));
  const entries = unzipSync(await readFile(archive));
  for (const [relativePath, content] of Object.entries(entries)) {
    const target = path.join(extractionRoot, ...relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  const bundle = path.join(extractionRoot, "repo-agent", "repo-agent.bundle.js");
  await execFileAsync(process.execPath, [
    bundle,
    "init",
    "--tool",
    "opencode",
    "--json",
  ], { cwd: extractionRoot });

  const skillPath = path.join(
    extractionRoot,
    ".opencode",
    "skills",
    "repo-agent",
    "SKILL.md",
  );
  await rm(skillPath);
  await execFileAsync(process.execPath, [
    bundle,
    "update",
    "--tool",
    "opencode",
    "--json",
  ], { cwd: extractionRoot });
  assert.match(await readFile(skillPath, "utf8"), /repo-agent managed skill v1/);

  const extra = path.join(
    extractionRoot,
    ".opencode",
    "skills",
    "repo-agent",
    "user-note.md",
  );
  await writeFile(extra, "保留我\n");
  await execFileAsync(process.execPath, [
    bundle,
    "deactivate",
    "--tool",
    "opencode",
    "--json",
  ], { cwd: extractionRoot });
  assert.equal(await readFile(extra, "utf8"), "保留我\n");
  await assert.rejects(readFile(skillPath, "utf8"), /ENOENT/);

  const conflictRoot = await mkdtemp(path.join(tmpdir(), "repo-agent-skill-conflict-"));
  const conflictSkill = path.join(
    conflictRoot,
    ".agents",
    "skills",
    "repo-agent",
    "SKILL.md",
  );
  await mkdir(path.dirname(conflictSkill), { recursive: true });
  await writeFile(conflictSkill, "用户自己的 Skill\n");
  await assert.rejects(
    execFileAsync(process.execPath, [
      bundle,
      "init",
      "--tool",
      "codex",
      "--json",
    ], { cwd: conflictRoot }),
    (error) => {
      assert.match(
        String(error.stdout),
        /E_INTEGRATION_CONFLICT|不是 repo-agent 托管文件/,
      );
      return true;
    },
  );
  assert.equal(await readFile(conflictSkill, "utf8"), "用户自己的 Skill\n");
  await assert.rejects(
    readFile(path.join(conflictRoot, ".codex", "config.toml"), "utf8"),
    /ENOENT/,
  );

  const deactivateConflictRoot = await mkdtemp(
    path.join(tmpdir(), "repo-agent-skill-deactivate-conflict-"),
  );
  await execFileAsync(process.execPath, [
    bundle,
    "init",
    "--tool",
    "codex",
    "--json",
  ], { cwd: deactivateConflictRoot });
  const deactivateConflictSkill = path.join(
    deactivateConflictRoot,
    ".agents",
    "skills",
    "repo-agent",
    "SKILL.md",
  );
  await writeFile(deactivateConflictSkill, "用户替换后的 Skill\n");
  await assert.rejects(
    execFileAsync(process.execPath, [
      bundle,
      "deactivate",
      "--tool",
      "codex",
      "--json",
    ], { cwd: deactivateConflictRoot }),
    (error) => {
      assert.match(
        String(error.stdout),
        /E_INTEGRATION_CONFLICT|不是 repo-agent 托管文件/,
      );
      return true;
    },
  );
  assert.equal(
    await readFile(deactivateConflictSkill, "utf8"),
    "用户替换后的 Skill\n",
  );
  assert.match(
    await readFile(
      path.join(deactivateConflictRoot, ".codex", "config.toml"),
      "utf8",
    ),
    /repo-agent integration managed/,
  );
});
