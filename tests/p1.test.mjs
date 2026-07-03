import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = path.join(root, "dist", "repo-agent.bundle.js");

async function project() {
  const directory = await mkdtemp(path.join(tmpdir(), "repo-agent-p1-"));
  await writeFile(
    path.join(directory, "package.json"),
    JSON.stringify({ scripts: { test: "node --test", typecheck: "tsc --noEmit" } }),
  );
  await execFileAsync(process.execPath, [bundle, "init", "--json"], { cwd: directory });
  return directory;
}

async function jsonRun(directory, args) {
  const { stdout } = await execFileAsync(process.execPath, [bundle, ...args, "--json"], {
    cwd: directory,
  });
  return JSON.parse(stdout.trim());
}

async function mcp(directory, requests) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bundle, "mcp", "stdio"], { cwd: directory });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || `stdio exited ${code}`));
      resolve(
        stdout.trim().split("\n").filter(Boolean).map(JSON.parse).map((item) => ({
          ...item,
          ...(item.result?.structuredContent
            ? { result: item.result.structuredContent }
            : {}),
        })),
      );
    });
    child.stdin.end(`${requests.map((request, index) => JSON.stringify({
      jsonrpc: "2.0",
      id: index + 1,
      method: "tools/call",
      params: { name: request.method, arguments: request.params },
    })).join("\n")}\n`);
  });
}

test("validate accepts initialized P0/P1 structure", async () => {
  const directory = await project();
  const payload = await jsonRun(directory, ["validate"]);
  assert.equal(payload.ok, true);
  assert.equal(payload.command, "validate");
  assert.deepEqual(payload.errors, []);
});

test("strict validation rejects undeclared repo-agent tool overrides", async () => {
  const directory = await project();
  const registryPath = path.join(
    directory,
    ".repo-agent",
    "tools",
    "registry.yaml",
  );
  await writeFile(
    registryPath,
    `${await readFile(registryPath, "utf8")}  - { id: mcp__repo_agent__not_declared, type: governance, risk: low }\n`,
  );
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [bundle, "validate", "--strict", "--json"],
      { cwd: directory },
    ),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.ok(
        payload.errors.some((item) => item.code === "E_TOOL_MANIFEST_DRIFT"),
      );
      return true;
    },
  );
});

test("context returns trusted approved assets and high OAuth risk", async () => {
  const directory = await project();
  const payload = await jsonRun(directory, ["context", "修复 OAuth invalid state bug"]);
  const context = payload.data;
  assert.equal(context.risk.level, "high");
  assert.ok(context.trustedAssets.every((item) => item.trusted === true));
  assert.equal(context.recommendedFixPatterns[0].id, "fix.auth.oauth-invalid-state");
  assert.deepEqual(context.recurringErrorRecommendations, []);
  assert.ok(context.recommendedTests.includes("npm run test"));
});

test("commit options recommend review requests for auth work in Git", async () => {
  const directory = await project();
  await execFileAsync("git", ["init", "-q"], { cwd: directory });
  const payload = await jsonRun(directory, ["commit-options", "--task", "change auth permissions"]);
  assert.equal(payload.data.riskLevel, "high");
  assert.equal(payload.data.recommendedAction, "create_review_request");
});

test("commit options preserve non-ASCII Git paths", async () => {
  const directory = await project();
  await execFileAsync("git", ["init", "-q"], { cwd: directory });
  await execFileAsync("git", ["config", "user.email", "repo-agent-test@example.invalid"], {
    cwd: directory,
  });
  await execFileAsync("git", ["config", "user.name", "repo-agent-test"], { cwd: directory });
  await execFileAsync("git", ["add", "-A"], { cwd: directory });
  await execFileAsync("git", ["commit", "-qm", "initialize"], { cwd: directory });
  await writeFile(path.join(directory, "使用说明.md"), "# 使用说明\n");

  const payload = await jsonRun(directory, ["commit-options", "--task", "更新使用说明"]);
  assert.ok(payload.data.changedFiles.includes("使用说明.md"));
  assert.equal(payload.data.riskLevel, "low");
});

test("candidate lifecycle writes only candidate directories and enters suggestions", async () => {
  const directory = await project();
  const proposed = await jsonRun(directory, [
    "memory",
    "propose",
    "--id",
    "memory.auth.oauth-negative-tests",
    "--content",
    "OAuth changes must cover invalid, missing, and expired state tests.",
    "--task",
    "Fix OAuth state",
  ]);
  assert.equal(proposed.data.candidate.status, "candidate");
  assert.match(proposed.data.path, /^\.repo-agent-private\/memory_candidates\//);
  assert.match(await readFile(path.join(directory, proposed.data.path), "utf8"), /trusted/);

  const list = await jsonRun(directory, ["memory", "list-candidates"]);
  assert.equal(list.data.candidates.length, 1);
  const context = await jsonRun(directory, ["context", "OAuth state negative tests"]);
  assert.equal(context.data.candidateSuggestions.length, 1);
  assert.equal(context.data.candidateSuggestions[0].trusted, false);
});

test("candidate propose rejects possible secrets without writing", async () => {
  const directory = await project();
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [
        bundle,
        "memory",
        "propose",
        "--id",
        "memory.auth.bad-secret",
        "--content",
        "api_key=very-sensitive-value",
        "--json",
      ],
      { cwd: directory },
    ),
    (error) => {
      assert.equal(JSON.parse(error.stdout.trim()).error.code, "E_SECRET_DETECTED");
      return true;
    },
  );
  const list = await jsonRun(directory, ["memory", "list-candidates"]);
  assert.equal(list.data.candidates.length, 0);
});

test("private candidates stay local while reviewed candidates can become shared assets", async () => {
  const directory = await project();
  await execFileAsync("git", ["init", "-q"], { cwd: directory });
  const privateCandidate = await jsonRun(directory, [
    "skill", "propose",
    "--id", "skill.review.private-flow",
    "--description", "先读取策略，再运行测试。",
  ]);
  const ignored = await execFileAsync(
    "git",
    ["check-ignore", privateCandidate.data.path],
    { cwd: directory },
  );
  assert.equal(ignored.stdout.trim(), privateCandidate.data.path);

  await assert.rejects(
    jsonRun(directory, [
      "skill", "approve", privateCandidate.data.candidate.candidate_id,
      "--reviewer", "测试审核人",
    ]),
    (error) =>
      JSON.parse(error.stdout).error.message.includes("不允许直接批准"),
  );
  const teamSkill = await jsonRun(directory, [
    "skill", "propose",
    "--id", "skill.review.team-flow",
    "--description", "团队审核后共享的流程。",
    "--visibility", "team",
  ]);
  const approved = await jsonRun(directory, [
    "skill", "approve", teamSkill.data.candidate.candidate_id,
    "--reviewer", "测试审核人",
  ]);
  assert.equal(approved.data.candidate.status, "approved");
  assert.match(approved.data.approvedPath, /^\.repo-agent\/skills\/approved\//);
  assert.match(
    await readFile(path.join(directory, approved.data.approvedPath), "utf8"),
    /status: approved/,
  );

  const teamCandidate = await jsonRun(directory, [
    "memory", "propose",
    "--id", "memory.team.shared-review",
    "--content", "团队共享候选。",
    "--visibility", "team",
  ]);
  assert.match(teamCandidate.data.path, /^\.repo-agent\/memory_candidates\//);
  await assert.rejects(
    execFileAsync("git", ["check-ignore", teamCandidate.data.path], {
      cwd: directory,
    }),
    (error) => error.code === 1,
  );
});

test("skill, fix-pattern, learning, explain, and status P1 commands work", async () => {
  const directory = await project();
  const proposedSkill = await jsonRun(directory, [
    "skill",
    "propose",
    "--id",
    "skill.review.auth-change",
    "--description",
    "First inspect policy, then run negative authentication tests.",
  ]);
  const proposedFix = await jsonRun(directory, [
    "fix-pattern",
    "propose",
    "--id",
    "fix.auth.callback-state",
    "--pattern",
    "OAuth callback state mismatch",
  ]);
  assert.match(proposedSkill.data.path, /^\.repo-agent-private\/skills\/candidates\//);
  assert.match(proposedFix.data.path, /^\.repo-agent-private\/fix_patterns\/candidates\//);

  const skills = await jsonRun(directory, ["skill", "list"]);
  const fixes = await jsonRun(directory, ["fix-pattern", "list"]);
  assert.equal(skills.data.artifacts.length, 1);
  assert.equal(fixes.data.artifacts.length, 1);

  const learning = await jsonRun(directory, [
    "learning",
    "classify",
    "--task",
    "fix bug",
    "--observation",
    "First add a failing test, then fix the code.",
  ]);
  assert.equal(learning.data.classification, "skill_candidate");

  const explanation = await jsonRun(directory, ["explain", "context", "OAuth bug"]);
  assert.equal(explanation.data.risk.level, "high");
  const status = await jsonRun(directory, ["status"]);
  assert.equal(status.data.initialized, true);
  assert.equal(status.data.validate, "ok");
  assert.equal(status.data.pendingCandidates.skill, 1);
  assert.equal(status.data.pendingCandidates.fixPattern, 1);
});

test("MCP serves P0/P1 tools and records a redacted audit", async () => {
  const directory = await project();
  const responses = await mcp(directory, [
    { method: "check_policy", params: { command: "sudo rm -rf /" } },
    { method: "get_context_pack", params: { task: "OAuth bug" } },
    { method: "record_trace", params: { task: "OAuth bug", outcome: "token=secret-value" } },
    { method: "list_skills", params: {} },
  ]);
  assert.equal(responses[0].result.blocked, true);
  assert.equal(responses[1].result.risk.level, "high");
  assert.equal(responses[2].result.recorded, true);
  assert.equal(responses[3].result.length, 1);
  const audit = await readFile(path.join(directory, responses[2].result.path), "utf8");
  assert.doesNotMatch(audit, /secret-value/);
  assert.match(audit, /\[REDACTED\]/);
});
