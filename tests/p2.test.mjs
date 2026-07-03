import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = path.join(root, "dist", "repo-agent.bundle.js");

async function setup() {
  const directory = await mkdtemp(path.join(tmpdir(), "repo-agent-p2-"));
  await writeFile(path.join(directory, "package.json"), JSON.stringify({
    scripts: { test: "node --test", typecheck: "tsc --noEmit" },
  }));
  await execFileAsync(process.execPath, [bundle, "init", "--json"], { cwd: directory });
  return directory;
}

async function run(directory, args) {
  const { stdout } = await execFileAsync(process.execPath, [bundle, ...args, "--json"], { cwd: directory });
  return JSON.parse(stdout.trim());
}

async function protocol(directory, mode, requests) {
  return new Promise((resolve, reject) => {
    const legacyRequests = requests.map(
      (request) => !Array.isArray(request) && !request.jsonrpc,
    );
    const child = spawn(process.execPath, [bundle, ...mode], { cwd: directory });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || `protocol exited ${code}`));
      resolve(stdout.trim().split("\n").filter(Boolean).map(JSON.parse).map((item, index) => {
        if (legacyRequests[index] && item.result?.structuredContent) {
          return { ...item, result: item.result.structuredContent };
        }
        const code = item.error?.message?.match(/^(E_[A-Z_]+):/)?.[1];
        return code ? { ...item, error: { ...item.error, code } } : item;
      }));
    });
    const wireRequests = mode.join(" ") === "mcp stdio"
      ? requests.map((request, index) =>
        Array.isArray(request) || request.jsonrpc
          ? request
          : {
              jsonrpc: "2.0",
              id: index + 1,
              method: "tools/call",
              params: {
                name: request.method,
                arguments: request.params,
              },
            })
      : requests;
    child.stdin.end(`${wireRequests.map(JSON.stringify).join("\n")}\n`);
  });
}

test("P1 supplemental adapters, budget, required actions, and recurrence are present", async () => {
  const directory = await setup();
  await readFile(path.join(directory, ".repo-agent/adapters/opencode.yaml"));
  await readFile(path.join(directory, ".opencode", "plugins", "repo-agent.js"));
  const context = (await run(directory, ["context", "OAuth auth bug"])).data;
  assert.equal(context.contextBudget.maxChars, 24000);
  assert.ok(context.contextBudget.estimatedTokens > 0);
  assert.ok(context.risk.requiredActions.includes("write_plan"));
  assert.equal(context.recommendedWorkflow, "workflow.security-change");
  const featureContext = (await run(directory, ["context", "implement customer profile"])).data;
  assert.equal(featureContext.recommendedWorkflow, "workflow.feature");
  await readFile(path.join(directory, ".repo-agent", "workflows", "feature.yaml"));
  const status = (await run(directory, ["status"])).data;
  assert.deepEqual(
    [...status.adapters].sort(),
    ["claude-code", "codex", "opencode"],
  );
  const schema = await readFile(path.join(root, "schemas/fix_pattern.schema.json"), "utf8");
  assert.match(schema, /recurrence/);
});

test("context budget never truncates trusted policies", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  const config = await readFile(configPath, "utf8");
  await writeFile(configPath, config.replace("max_chars: 24000", "max_chars: 100"));
  const context = (await run(directory, ["context", "security change"])).data;
  const protectedPolicy = context.relevantInstructions.find(
    (item) => item.source === ".repo-agent/policies/protected_files.yaml",
  );
  assert.match(protectedPolicy.content, /protected_files/);
  assert.equal(context.contextBudget.exceeded, true);
  assert.ok(context.warnings.some((warning) => warning.includes("强制策略")));
});

test("token budget is enforced independently from character budget", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  const config = await readFile(configPath, "utf8");
  await writeFile(
    configPath,
    config
      .replace("max_chars: 24000", "max_chars: 100000")
      .replace("max_tokens_estimate: 6000", "max_tokens_estimate: 1"),
  );
  const context = (await run(directory, ["context", "普通任务"])).data;
  assert.ok(context.contextBudget.estimatedTokens > 1);
  assert.equal(context.contextBudget.exceeded, true);
});

test("strict validation rejects local policy relaxation", async () => {
  const directory = await setup();
  let strict = await run(directory, ["validate", "--strict"]);
  assert.equal(strict.ok, true);
  await writeFile(path.join(directory, ".repo-agent.local.yaml"), "audit:\n  enabled: false\n");
  await assert.rejects(
    execFileAsync(process.execPath, [bundle, "validate", "--strict", "--json"], { cwd: directory }),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.equal(payload.ok, false);
      assert.ok(payload.errors.some((item) => item.code === "E_LOCAL_CONFIG_RELAXES_POLICY"));
      return true;
    },
  );
});

test("strict validation rejects malformed approved assets and secrets never reach context", async () => {
  const directory = await setup();
  await writeFile(
    path.join(directory, ".repo-agent", "skills", "approved", "invalid.yaml"),
    "id: skill.invalid.missing-steps\n",
  );
  await writeFile(
    path.join(directory, ".repo-agent", "memories", "leak.md"),
    "# Leak\npassword is hunter2\nAuthorization: Bearer abcdefghijklmnop\n",
  );
  await assert.rejects(
    execFileAsync(process.execPath, [bundle, "validate", "--strict", "--json"], { cwd: directory }),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.ok(payload.errors.some((item) => item.code === "E_CONFIG_SCHEMA"));
      assert.ok(payload.errors.some((item) => item.code === "E_SECRET_DETECTED"));
      return true;
    },
  );
  await assert.rejects(
    execFileAsync(
      process.execPath,
      [bundle, "context", "leak password", "--json"],
      { cwd: directory },
    ),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.equal(payload.error.code, "E_CONFIG_SCHEMA");
      assert.doesNotMatch(error.stdout, /hunter2|abcdefghijklmnop/);
      return true;
    },
  );
});

test("learning inbox create, list, and triage work without approving assets", async () => {
  const directory = await setup();
  const created = (await run(directory, [
    "learning", "inbox",
    "--task", "OAuth regression",
    "--observation", "First add a failing test, then fix the callback.",
  ])).data;
  assert.equal(created.item.status, "untriaged");
  const listed = (await run(directory, ["learning", "inbox"])).data;
  assert.equal(listed.items.length, 1);
  const triaged = (await run(directory, ["learning", "triage", created.item.id])).data;
  assert.equal(triaged.item.status, "triaged");
  assert.equal(triaged.classification.classification, "skill_candidate");
});

test("import, health, tool registry, and patch commands provide P2 behavior", async () => {
  const directory = await setup();
  await writeFile(path.join(directory, "CLAUDE.md"), "# Existing rules\n");
  const scan = (await run(directory, ["import", "scan"])).data;
  const plan = (await run(directory, ["import", "plan"])).data;
  assert.ok(scan.sources.includes("CLAUDE.md"));
  assert.ok(plan.importPlan.some((item) => item.source === "CLAUDE.md" && item.trusted === false));

  const tool = await protocol(directory, ["mcp", "stdio"], [
    { method: "check_policy", params: { toolId: "tool.network.fetch" } },
    { method: "redact_secrets", params: { input: "token=secret-value" } },
    { method: "detect_duplicates", params: {} },
    { method: "generate_patch_summary", params: {} },
  ]);
  assert.equal(tool[0].result.blocked, true);
  assert.equal(tool[1].result.redacted, "token=[REDACTED]");
  assert.deepEqual(tool[2].result.duplicates, []);
  assert.equal(tool[3].result.generatedPatch, false);

  await execFileAsync("git", ["init", "-q"], { cwd: directory });
  await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: directory });
  await execFileAsync("git", ["config", "user.name", "Test"], { cwd: directory });
  await writeFile(path.join(directory, "tracked.txt"), "before\n");
  await execFileAsync("git", ["add", "tracked.txt"], { cwd: directory });
  await execFileAsync("git", ["commit", "-qm", "base"], { cwd: directory });
  await writeFile(path.join(directory, "tracked.txt"), "after\n");
  await writeFile(path.join(directory, "untracked.txt"), "new file\n");
  const dryPatch = (await run(directory, ["patch", "create", "--dry-run"])).data;
  assert.equal(dryPatch.dryRun, true);
  const patch = (await run(directory, ["patch", "create"])).data;
  assert.ok(patch.bytes > 0);
  const patchContent = await readFile(path.join(directory, patch.path), "utf8");
  assert.match(patchContent, /tracked\.txt/);
  assert.match(patchContent, /untracked\.txt/);
  assert.ok(patch.untrackedFiles.includes("untracked.txt"));

  const health = (await run(directory, ["health", "check"])).data;
  assert.equal(typeof health.score, "number");
  assert.ok(Array.isArray(health.actions));
});

test("commit options honor commit_policy and distinguish team from personal mode", async () => {
  async function initialized(mode) {
    const directory = await mkdtemp(path.join(tmpdir(), `repo-agent-${mode}-`));
    await execFileAsync("git", ["init", "-q"], { cwd: directory });
    await execFileAsync("git", ["config", "user.email", "test@example.com"], { cwd: directory });
    await execFileAsync("git", ["config", "user.name", "Test"], { cwd: directory });
    await execFileAsync(process.execPath, [bundle, "init", "--mode", mode, "--json"], { cwd: directory });
    await writeFile(path.join(directory, ".gitignore"), ".repo-agent/generated/\n");
    await execFileAsync("git", ["add", "-A"], { cwd: directory });
    await execFileAsync("git", ["commit", "-qm", "initialized"], { cwd: directory });
    await writeFile(path.join(directory, "README.md"), "change\n");
    return directory;
  }
  const team = await initialized("team");
  const personal = await initialized("personal");
  assert.equal((await run(team, ["commit-options"])).data.recommendedAction, "direct_commit");
  assert.equal((await run(personal, ["commit-options"])).data.recommendedAction, "keep_local");

  const policyPath = path.join(team, ".repo-agent", "commit_policy.yaml");
  const policy = await readFile(policyPath, "utf8");
  await writeFile(
    policyPath,
    policy.replace("require_review_request_for:\n", "require_review_request_for:\n  - README.md\n"),
  );
  await execFileAsync("git", ["add", ".repo-agent/commit_policy.yaml"], { cwd: team });
  await execFileAsync("git", ["commit", "-qm", "require README review"], { cwd: team });
  const governed = (await run(team, ["commit-options"])).data;
  assert.equal(governed.recommendedAction, "create_review_request");
  assert.equal(governed.riskLevel, "high");
});

test("recurring error analysis aggregates distinct Preflights and proposes only a candidate", async () => {
  const directory = await setup();
  const requests = [1, 2, 3].map(() => ({
    method: "record_trace",
    params: {
      task: "修复缓存刷新失败",
      outcome: "cache refresh failed error",
      outcomeStatus: "failure",
      preflightId: `preflight-${Math.random()}`,
    },
  }));
  await protocol(directory, ["mcp", "stdio"], requests);
  const analyzed = (await run(directory, ["recurring-errors", "analyze"])).data;
  assert.equal(analyzed.signals[0].normalizedError.key, "error.general.cache-refresh-failed-error");
  assert.equal(analyzed.signals[0].occurrences, 3);
  const recommendations = (await run(directory, [
    "recurring-errors", "recommend", "--task", "cache refresh failed",
  ])).data;
  assert.equal(recommendations.recommendations[0].occurrences, 3);
  const proposed = (await run(directory, [
    "recurring-errors", "propose-fix-pattern",
    analyzed.signals[0].id,
    "--dry-run",
  ])).data;
  assert.equal(proposed.dryRun, true);
  assert.match(proposed.path, /^\.repo-agent-private\/fix_patterns\/candidates\//);
  assert.equal(proposed.candidate.recurrence.occurrences, 3);
});

test("recurring error analysis honors configured thresholds and disable switch", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  const original = await readFile(configPath, "utf8");
  await writeFile(
    configPath,
    original.replace("propose_fix_pattern: 3", "propose_fix_pattern: 99"),
  );
  await protocol(directory, ["mcp", "stdio"], [1, 2].map(() => ({
    method: "record_trace",
    params: {
      task: "Widget pipeline",
      outcome: "widget pipeline failed error",
      outcomeStatus: "failure",
      preflightId: `preflight-${Math.random()}`,
    },
  })));
  const belowThreshold = (await run(directory, ["recurring-errors", "analyze"])).data;
  assert.equal(belowThreshold.signals[0].occurrences, 2);
  assert.equal(belowThreshold.signals[0].status, "watching");

  const configured = await readFile(configPath, "utf8");
  await writeFile(
    configPath,
    configured.replace(
      "recurring_error_policy:\n  enabled: true",
      "recurring_error_policy:\n  enabled: false",
    ),
  );
  const disabled = (await run(directory, ["recurring-errors", "analyze"])).data;
  assert.equal(disabled.disabled, true);
  assert.deepEqual(disabled.signals, []);
  const recommendations = (await run(directory, [
    "recurring-errors", "recommend", "--task", "OAuth invalid state",
  ])).data;
  assert.deepEqual(recommendations.recommendations, []);
});

test("recurring analysis ignores successful discussions and upserts one stable inbox item", async () => {
  const directory = await setup();
  await protocol(directory, ["mcp", "stdio"], [{
    method: "record_trace",
    params: {
      task: "Review error handling and bug reports",
      outcome: "Review completed successfully; no failure occurred.",
      outcomeStatus: "success",
    },
  }]);
  const successful = (await run(directory, ["recurring-errors", "analyze"])).data;
  assert.deepEqual(successful.signals, []);

  await protocol(directory, ["mcp", "stdio"], [1, 2, 3].map(() => ({
    method: "record_trace",
    params: {
      task: "Cache refresh",
      outcome: "cache refresh failed error",
      outcomeStatus: "failure",
      preflightId: `preflight-${Math.random()}`,
    },
  })));
  await run(directory, ["recurring-errors", "analyze"]);
  await run(directory, ["recurring-errors", "analyze"]);
  const inboxRoot = path.join(directory, ".repo-agent-private", "learning_inbox");
  const entries = (await readdir(inboxRoot)).filter((file) => file.endsWith(".yaml"));
  assert.equal(entries.length, 1);
  const item = await readFile(path.join(inboxRoot, entries[0]), "utf8");
  assert.match(item, /dedupe_key: recurring\.general\.cache-refresh-failed-error/);
  assert.match(item, /created_by: repo-agent-recurring/);
  assert.match(item, /已出现 3 次/);
});

test("MCP-compatible stdio supports initialize, tools/list, and tools/call", async () => {
  const directory = await setup();
  const responses = await protocol(directory, ["mcp", "stdio"], [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: {} },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "get_context_pack", arguments: { task: "OAuth bug" } },
    },
  ]);
  assert.equal(responses[0].result.serverInfo.name, "repo-agent");
  const contextTool = responses[1].result.tools.find((tool) => tool.name === "get_context_pack");
  assert.ok(contextTool);
  assert.match(contextTool.description, /项目上下文包/);
  assert.equal(responses[1].result.tools.length, 26);
  assert.equal(
    new Set(responses[1].result.tools.map((tool) => tool.name)).size,
    responses[1].result.tools.length,
  );
  assert.ok(
    responses[1].result.tools.every((tool) =>
      tool.inputSchema.additionalProperties === false &&
      typeof tool.annotations.readOnlyHint === "boolean" &&
      typeof tool.annotations.destructiveHint === "boolean"
    ),
  );
  assert.equal(
    responses[1].result.tools.find((tool) => tool.name === "get_health_metrics")
      .annotations.readOnlyHint,
    true,
  );
  assert.equal(
    responses[1].result.tools.find((tool) => tool.name === "promote_candidate")
      .annotations.readOnlyHint,
    false,
  );
  assert.ok(responses[1].result.tools.some((tool) => tool.name === "resolve_conflicts"));
  assert.equal(responses[2].result.structuredContent.risk.level, "high");
});

test("MCP notifications produce no response and batch requests are supported", async () => {
  const directory = await setup();
  const responses = await protocol(directory, ["mcp", "stdio"], [
    {
      jsonrpc: "2.0",
      method: "notifications/cancelled",
      params: { requestId: 1 },
    },
    { jsonrpc: "2.0", id: 2, method: "ping" },
  ]);
  assert.equal(responses.length, 1);
  assert.equal(responses[0].id, 2);

  const batch = await protocol(directory, ["mcp", "stdio"], [[
    { jsonrpc: "2.0", id: 3, method: "ping" },
    { jsonrpc: "2.0", method: "notifications/initialized" },
  ]]);
  assert.equal(batch.length, 1);
  assert.equal(batch[0].length, 1);
  assert.equal(batch[0][0].id, 3);

  const unknown = await protocol(directory, ["mcp", "stdio"], [
    { jsonrpc: "2.0", id: 4, method: "missing/method" },
  ]);
  assert.equal(unknown[0].error.code, -32601);
});

test("asset maintenance never deletes shared assets during evaluation", async () => {
  const directory = await setup();
  const privateRoot = path.join(directory, ".repo-agent-private");
  await import("node:fs/promises").then(({ mkdir }) =>
    mkdir(privateRoot, { recursive: true })
  );
  await writeFile(
    path.join(privateRoot, "weights.json"),
    JSON.stringify({
      "memory.repo": {
        usageCount: 1,
        successCount: 0,
        failureCount: 1,
        lastUsedAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      },
    }),
  );
  const result = (await run(directory, ["maintain", "--dry-run"])).data;
  assert.ok(Array.isArray(result.staleApproved));
  assert.equal(result.sharedAssetsDeleted, false);
  await readFile(path.join(directory, ".repo-agent", "memories", "repo.md"));
});

test("Evidence v1 separates retrieval from validated quality", async () => {
  const directory = await setup();
  const evidenceRoot = path.join(directory, ".repo-agent-private", "evidence");
  await import("node:fs/promises").then(({ mkdir }) => mkdir(evidenceRoot, { recursive: true }));
  const occurredAt = new Date().toISOString();
  const events = [
    {
      version: 1,
      evidenceId: "retrieved-only",
      assetId: "memory.repo",
      preflightId: "preflight-retrieved",
      sessionId: "session-1",
      occurredAt,
      type: "retrieved",
      outcomeSource: "agent",
      confidence: 0.5,
    },
    ...Array.from({ length: 3 }, (_, index) => ({
      version: 1,
      evidenceId: `success-${index}`,
      assetId: "memory.testing",
      preflightId: `preflight-success-${index}`,
      sessionId: `session-${index}`,
      occurredAt,
      type: "validated_success",
      outcomeSource: "test",
      confidence: 1,
    })),
  ];
  await writeFile(
    path.join(evidenceRoot, "events.jsonl"),
    `${events.map(JSON.stringify).join("\n")}\n`,
  );
  const retrieved = (await run(directory, ["evidence", "explain", "memory.repo"])).data;
  const validated = (await run(directory, ["evidence", "explain", "memory.testing"])).data;
  assert.equal(retrieved.summary.retrieved, 1);
  assert.equal(retrieved.summary.validatedSuccess, 0);
  assert.ok(validated.summary.lifecycleHealth > retrieved.summary.lifecycleHealth);
});

test("team lifecycle only proposes changes until a reviewer applies them", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  const lifecycleConfig = await readFile(configPath, "utf8");
  await writeFile(
    configPath,
    lifecycleConfig
      .replace("stale: 0.45", "stale: 1")
      .replace("archive: 0.30", "archive: 1")
      .replace("stale: 90", "stale: 0")
      .replace("archive: 180", "archive: 0")
      .replace("delete: 180", "delete: 0"),
  );
  const lowMemory = path.join(directory, ".repo-agent", "memories", "low-value.md");
  await writeFile(lowMemory, "# 低价值\n\n长期未使用的普通知识。\n");
  const maintained = (await run(directory, ["maintain"])).data;
  const proposal = maintained.proposals.find(
    (item) => item.proposal.asset_id === "memory.low-value",
  );
  assert.ok(proposal);
  await readFile(lowMemory);
  assert.equal(maintained.sharedAssetsDeleted, false);
  const applied = (await run(directory, [
    "lifecycle", "apply", proposal.proposal.proposal_id,
    "--reviewer", "生命周期审核人",
  ])).data;
  assert.equal(applied.proposal.status, "applied");
  await assert.rejects(readFile(lowMemory));
  await readFile(path.join(directory, ".repo-agent", "archive", "memories", "low-value.md"));
  await readFile(path.join(directory, ".repo-agent", "memories", "security.md"));
  assert.ok(!maintained.proposals.some((item) => item.proposal.asset_id === "memory.security"));
});

test("automatic lifecycle removes expired private candidates and inbox entries", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  await writeFile(
    configPath,
    (await readFile(configPath, "utf8"))
      .replace("private_retention: 180", "private_retention: 0"),
  );
  const candidate = (await run(directory, [
    "memory",
    "propose",
    "--id", "memory.cleanup.private-item",
    "--content", "临时候选应按保留策略自动清理。",
  ])).data;
  const inbox = (await run(directory, [
    "learning",
    "inbox",
    "--task", "临时经验",
    "--observation", "先检查，再清理。",
  ])).data;
  const maintained = (await run(directory, ["maintain"])).data;
  assert.ok(maintained.removedPrivateCandidates.includes(candidate.path));
  assert.ok(maintained.removedPrivateInbox.includes(inbox.path));
  await assert.rejects(readFile(path.join(directory, candidate.path)));
  await assert.rejects(readFile(path.join(directory, inbox.path)));
});

test("archived assets require an explicit Restore Candidate and review", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  await writeFile(
    configPath,
    (await readFile(configPath, "utf8"))
      .replace("stale: 0.45", "stale: 1")
      .replace("archive: 0.30", "archive: 1")
      .replace("stale: 90", "stale: 0")
      .replace("archive: 180", "archive: 0"),
  );
  const source = path.join(
    directory,
    ".repo-agent",
    "memories",
    "restorable.md",
  );
  await writeFile(source, "# Restorable\n\nrestore-marker reusable knowledge.\n");
  const maintained = (await run(directory, ["maintain"])).data;
  const archiveProposal = maintained.proposals.find(
    (item) => item.proposal.asset_id === "memory.restorable",
  );
  await run(directory, [
    "lifecycle", "apply", archiveProposal.proposal.proposal_id,
    "--reviewer", "归档审核人",
  ]);
  await assert.rejects(readFile(source));
  const context = (await run(directory, ["context", "restore-marker"])).data;
  assert.ok(!context.relevantMemories.some((item) => item.id === "memory.restorable"));
  const restore = (await run(directory, [
    "lifecycle", "restore", "memory.restorable",
  ])).data;
  await assert.rejects(readFile(source));
  await run(directory, [
    "lifecycle", "apply", restore.proposal.proposal_id,
    "--reviewer", "恢复审核人",
  ]);
  await readFile(source);
});

test("record_trace dry-run does not write and audit paths cannot escape the repository", async () => {
  const directory = await setup();
  const failed = (await run(directory, [
    "record-trace",
    "--task", "explicit failure",
    "--outcome", "callback failed",
    "--outcome-status", "failure",
  ])).data;
  const failedAudit = JSON.parse(
    await readFile(path.join(directory, failed.path), "utf8"),
  );
  assert.equal(failedAudit.outcome_status, "failure");
  const dryRun = await protocol(directory, ["mcp", "stdio"], [
    { method: "record_trace", params: { task: "dry run", dryRun: true } },
  ]);
  assert.equal(dryRun[0].result.recorded, false);
  assert.equal(dryRun[0].result.dryRun, true);

  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  const config = await readFile(configPath, "utf8");
  await writeFile(configPath, config.replace(
    "write_to: .repo-agent/generated/audits",
    "write_to: ../escaped-audits",
  ));
  const escaped = await protocol(directory, ["mcp", "stdio"], [
    { method: "record_trace", params: { task: "escape" } },
  ]);
  assert.equal(escaped[0].error.code, "E_CONFIG_SCHEMA");
});

test("structured audit secrets are redacted while audit JSON remains valid", async () => {
  const directory = await setup();
  const response = await protocol(directory, ["mcp", "stdio"], [
    {
      method: "record_trace",
      params: {
        task: "structured secret",
        outcome: "completed",
        commitOptions: {
          token: "sensitive-token-value",
          nested: { client_secret: "client-value" },
        },
      },
    },
  ]);
  const auditText = await readFile(path.join(directory, response[0].result.path), "utf8");
  const audit = JSON.parse(auditText);
  assert.equal(audit.commit_options.token, "[REDACTED]");
  assert.equal(audit.commit_options.nested.client_secret, "[REDACTED]");
  assert.doesNotMatch(auditText, /sensitive-token-value|client-value/);
});
