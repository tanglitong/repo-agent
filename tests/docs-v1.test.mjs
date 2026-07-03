import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = path.join(root, "dist", "repo-agent.bundle.js");

test("文档中的治理命令都存在于 --help", async () => {
  const help = (await execFileAsync(process.execPath, [bundle, "--help"], {
    cwd: root,
  })).stdout;
  for (const command of [
    "closure status|recover",
    "evidence explain <asset-id>",
    "learning analyze",
    "candidate promote",
    "lifecycle propose",
    "lifecycle apply",
    "lifecycle restore",
    "health check",
  ]) {
    assert.match(help, new RegExp(command.replace(/[|()[\]{}+?*.]/g, "\\$&")));
  }
});

test("文档、模板和 Schema 保持 1.0.0 首发基线", async () => {
  const documents = await Promise.all(
    [
      "README.md",
      path.join("docs", "zh-CN", "usage.md"),
      path.join("docs", "zh-CN", "architecture.md"),
    ].map((file) =>
      readFile(path.join(root, file), "utf8")
    ),
  );
  for (const document of documents) {
    assert.match(document, /1\.0\.0/);
    assert.doesNotMatch(document, /2\.0\.0|Weight v2|Config v2/);
  }
  const schema = JSON.parse(
    await readFile(path.join(root, "schemas", "config.schema.json"), "utf8"),
  );
  assert.equal(schema.properties.version.const, 1);
  const lockSchema = JSON.parse(
    await readFile(path.join(root, "schemas", "lock.schema.json"), "utf8"),
  );
  assert.equal(lockSchema.properties.version.const, 1);
});

test("开源社区文件、许可证和仓库元数据完整", async () => {
  const requiredFiles = [
    "LICENSE",
    "THIRD_PARTY_NOTICES",
    "CONTRIBUTING.md",
    "CODE_OF_CONDUCT.md",
    "SUPPORT.md",
    "CHANGELOG.md",
    path.join(".github", "ISSUE_TEMPLATE", "bug_report.yml"),
    path.join(".github", "ISSUE_TEMPLATE", "feature_request.yml"),
    path.join(".github", "PULL_REQUEST_TEMPLATE.md"),
  ];
  for (const file of requiredFiles) {
    assert.ok((await readFile(path.join(root, file), "utf8")).trim());
  }
  const license = await readFile(path.join(root, "LICENSE"), "utf8");
  assert.match(license, /^MIT License$/m);
  assert.match(license, /Copyright \(c\) 2026 tanglitong/);
  const thirdPartyNotices = await readFile(
    path.join(root, "THIRD_PARTY_NOTICES"),
    "utf8",
  );
  for (const dependency of ["jsonc-parser 3.3.1", "minimatch 9.0.9", "yaml 2.9.0"]) {
    assert.match(thirdPartyNotices, new RegExp(dependency.replace(".", "\\.")));
  }
  const packageJson = JSON.parse(
    await readFile(path.join(root, "package.json"), "utf8"),
  );
  assert.equal(packageJson.license, "MIT");
  assert.equal(
    packageJson.repository.url,
    "git+https://github.com/tanglitong/repo-agent.git",
  );
  assert.equal(packageJson.bugs.url, "https://github.com/tanglitong/repo-agent/issues");
});

test("文档默认阈值与配置模板一致", async () => {
  const template = await readFile(
    path.join(root, "templates", "config.yaml.template"),
    "utf8",
  );
  const usage = await readFile(
    path.join(root, "docs", "zh-CN", "usage.md"),
    "utf8",
  );
  for (const value of [
    "stale: 0.45",
    "archive: 0.30",
    "stale: 90",
    "archive: 180",
    "private_retention: 180",
    "freshness_half_life_days: 180",
  ]) {
    assert.match(template, new RegExp(value.replace(".", "\\.")));
  }
  assert.match(usage, /Health(（[^）]*）)? `<0\.45` 持续 90 天/);
  assert.match(usage, /Health(（[^）]*）)? `<0\.30` 持续 180 天/);
});

test("Git 边界文档与托管规则一致", async () => {
  const usage = await readFile(
    path.join(root, "docs", "zh-CN", "usage.md"),
    "utf8",
  );
  const manager = await readFile(
    path.join(root, "src", "core", "gitignore-manager.ts"),
    "utf8",
  );
  for (const entry of [
    ".repo-agent-private/",
    ".repo-agent-runtime/",
    ".repo-agent/generated/",
    ".repo-agent/catalog/",
  ]) {
    assert.match(usage, new RegExp(entry.replace(/[./]/g, "\\$&")));
    assert.match(manager, new RegExp(entry.replace(/[./]/g, "\\$&")));
  }
});

test("三端能力矩阵与公开入口保持一致", async () => {
  const documents = await Promise.all(
    [
      "README.md",
      path.join("docs", "zh-CN", "usage.md"),
      path.join("docs", "zh-CN", "architecture.md"),
    ].map((file) =>
      readFile(path.join(root, file), "utf8")
    ),
  );
  for (const document of documents) {
    assert.match(document, /Codex/);
    assert.match(document, /Claude Code/);
    assert.match(document, /OpenCode/);
    assert.doesNotMatch(document, /Cursor|generic-stdio|repo-agent stdio|repo-agent launch/);
  }
  const help = (await execFileAsync(process.execPath, [bundle, "--help"], {
    cwd: root,
  })).stdout;
  assert.match(help, /auto\|hook\|plugin\|mcp-only\|none/);
  assert.doesNotMatch(help, /cursor|repo-agent stdio|repo-agent launch/);
});

test("配置只暴露有运行时消费者的字段", async () => {
  const template = await readFile(
    path.join(root, "templates", "config.yaml.template"),
    "utf8",
  );
  for (const removed of [
    "project:",
    "logging:",
    "trace:",
    "compression:",
    "execution:",
    "workflow_policy:",
  ]) {
    assert.doesNotMatch(template, new RegExp(`^${removed}`, "m"));
  }
  const schema = JSON.parse(
    await readFile(path.join(root, "schemas", "config.schema.json"), "utf8"),
  );
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.context.additionalProperties, false);
});

test("压缩包文档使用面向安装用户的事实源", async () => {
  assert.equal(
    await readFile(path.join(root, "repo-agent", "README.md"), "utf8"),
    await readFile(path.join(root, "packaging", "README.md"), "utf8"),
  );
  assert.equal(
    await readFile(path.join(root, "repo-agent", "使用文档.md"), "utf8"),
    await readFile(path.join(root, "docs", "zh-CN", "usage.md"), "utf8"),
  );
  const packagedReadme = await readFile(
    path.join(root, "repo-agent", "README.md"),
    "utf8",
  );
  assert.match(packagedReadme, /\$repo-agent/);
  assert.match(packagedReadme, /\.\/使用文档\.md/);
  assert.doesNotMatch(
    packagedReadme,
    /package:offline|release:prepare|release:verify/,
  );
});
