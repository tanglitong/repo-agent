import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = path.join(root, "dist", "repo-agent.bundle.js");

async function temporaryProject() {
  return mkdtemp(path.join(tmpdir(), "repo-agent-test-"));
}

async function run(args, cwd) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [bundle, ...args], {
    cwd,
  });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}

async function runWithInput(args, cwd, input) {
  return new Promise((resolve, reject) => {
    const child = execFile(process.execPath, [bundle, ...args], { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stdout, stderr }));
        return;
      }
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
    });
    child.stdin.end(JSON.stringify(input));
  });
}

test("--version returns only the stable version", async () => {
  const result = await run(["--version"], root);
  assert.equal(result.stdout, "1.0.0");
  assert.equal(result.stderr, "");
});

test("init dry-run returns stable JSON and writes nothing", async () => {
  const project = await temporaryProject();
  await writeFile(
    path.join(project, "package.json"),
    JSON.stringify({ scripts: { test: "node --test", lint: "eslint ." } }),
  );
  const result = await run(["init", "--dry-run", "--json"], project);
  const payload = JSON.parse(result.stdout);

  assert.equal(payload.ok, true);
  assert.equal(payload.dryRun, true);
  assert.equal(payload.mode, "team");
  assert.ok(!payload.wouldCreate.includes("AGENTS.md"));
  assert.ok(payload.wouldCreate.includes(".repo-agent/hooks/routes.yaml"));
  assert.ok(payload.wouldCreate.includes(".repo-agent/generated/init_report.md"));
  assert.ok(payload.wouldCreate.includes(".repo-agent/README.md"));
  assert.ok(payload.wouldCreate.includes(".gitignore"));
  assert.ok(payload.activation.created.includes(".codex/hooks.json"));
  assert.ok(payload.activation.created.includes(".claude/settings.json"));
  await assert.rejects(readFile(path.join(project, ".repo-agent", "config.yaml")));
  await assert.rejects(readFile(path.join(project, ".gitignore")));
});

test("team init creates the complete P0a structure", async () => {
  const project = await temporaryProject();
  await writeFile(
    path.join(project, "package.json"),
    JSON.stringify({
      scripts: { test: "node --test", typecheck: "tsc --noEmit" },
      dependencies: { react: "19.0.0" },
    }),
  );
  await writeFile(path.join(project, "package-lock.json"), "{}");
  await run(["init", "--mode", "team", "--json"], project);

  const config = await readFile(path.join(project, ".repo-agent", "config.yaml"), "utf8");
  const publicConfigTemplate = await readFile(
    path.join(root, "templates", "config.yaml.template"),
    "utf8",
  );
  assert.equal(config, publicConfigTemplate.replace("{{MODE}}", "team"));
  const commitPolicy = await readFile(
    path.join(project, ".repo-agent", "commit_policy.yaml"),
    "utf8",
  );
  const report = await readFile(
    path.join(project, ".repo-agent", "generated", "init_report.md"),
    "utf8",
  );
  const lock = await readFile(
    path.join(project, ".repo-agent", "lock.yaml"),
    "utf8",
  );

  assert.match(config, /mode: team/);
  assert.match(config, /mode: offline/);
  assert.match(commitPolicy, /default_mode: ask/);
  assert.match(report, /包管理器：npm/);
  assert.match(report, /框架：React/);
  assert.match(lock, /generated_at: .+T.+Z/);
  await assert.rejects(readFile(path.join(project, "AGENTS.md")));
  const gitignore = await readFile(path.join(project, ".gitignore"), "utf8");
  assert.match(gitignore, /^# repo-agent：个人配置$/m);
  assert.match(gitignore, /^\/\.repo-agent\/generated\/$/m);
  assert.match(gitignore, /^\/\.repo-agent\/catalog\/$/m);
  assert.match(gitignore, /^\/\.repo-agent\.local\.yaml$/m);
  assert.match(gitignore, /^\/\.repo-agent\.local\.yml$/m);
  assert.match(gitignore, /^\.repo-agent\/\*\*\/\*\.sqlite3$/m);
  assert.match(gitignore, /^\.repo-agent\/\*\*\/\*\.faiss$/m);
  assert.match(gitignore, /^\.repo-agent\/\*\*\/\*\.tmp$/m);
  assert.match(gitignore, /^\.env\.\*$/m);
  assert.match(gitignore, /^!\.env\.example$/m);
  assert.match(gitignore, /^Thumbs\.db$/m);
  assert.doesNotMatch(gitignore, /^\.repo-agent\/$/m);
  await readFile(path.join(project, ".repo-agent", "policies", "protected_files.yaml"));
  await readFile(path.join(project, ".repo-agent", "hooks", "routes.yaml"));
  await readFile(path.join(project, ".repo-agent", "skills", "approved", "bugfix.red-green-refactor.yaml"));
  await readFile(path.join(project, ".repo-agent", "workflows", "feature.yaml"));
  const usageGuide = await readFile(path.join(project, ".repo-agent", "README.md"), "utf8");
  assert.match(usageGuide, /repo-agent 项目使用说明/);
  assert.match(usageGuide, /常用命令/);
  assert.match(usageGuide, /task_closure/);
  await readFile(path.join(project, ".codex", "hooks.json"));
  await readFile(path.join(project, ".claude", "settings.json"));
});

test("init safely and idempotently merges repo-agent rules into an existing .gitignore", async () => {
  const project = await temporaryProject();
  const original = "node_modules/\r\nlogs/\r\n";
  await writeFile(path.join(project, ".gitignore"), original);

  const first = JSON.parse((await run(["init", "--json"], project)).stdout);
  const merged = await readFile(path.join(project, ".gitignore"), "utf8");
  assert.ok(first.updated.includes(".gitignore"));
  assert.ok(merged.startsWith(original));
  assert.match(merged, /^\/\.repo-agent\/generated\/\r?$/m);
  assert.equal(merged.match(/^logs\/\r?$/gm)?.length, 1);
  assert.doesNotMatch(merged, /^\.repo-agent\/\r?$/m);
  assert.match(
    await readFile(path.join(project, ".repo-agent", "generated", "init_report.md"), "utf8"),
    /## 更新的文件[\s\S]*- \.gitignore/,
  );

  const second = JSON.parse((await run(["init", "--json"], project)).stdout);
  assert.ok(second.skipped.includes(".gitignore"));
  assert.equal(await readFile(path.join(project, ".gitignore"), "utf8"), merged);
  await assert.rejects(readFile(path.join(project, "AGENTS.repo-agent.generated.md")));
});

test("init ignores local artifacts while keeping team governance files committable", async () => {
  const project = await temporaryProject();
  await execFileAsync("git", ["init", "-q"], { cwd: project });
  await run(["init", "--json"], project);
  await mkdir(path.join(project, "repo-agent"), { recursive: true });
  await writeFile(path.join(project, "repo-agent", "repo-agent.bundle.js"), "bundle");

  const isIgnored = async (relativePath) => {
    try {
      await execFileAsync(
        "git",
        ["check-ignore", "--quiet", "--no-index", relativePath],
        { cwd: project },
      );
      return true;
    } catch (error) {
      if (error?.code === 1) return false;
      throw error;
    }
  };

  assert.equal(await isIgnored("AGENTS.md"), false);
  assert.equal(await isIgnored(".repo-agent/config.yaml"), false);
  assert.equal(await isIgnored(".repo-agent/memory_candidates/candidate.yaml"), false);
  assert.equal(await isIgnored(".repo-agent-private/memory_candidates/candidate.yaml"), true);
  assert.equal(await isIgnored(".repo-agent/learning_inbox/item.yaml"), true);
  assert.equal(await isIgnored(".repo-agent/generated/audit.json"), true);
  assert.equal(await isIgnored(".repo-agent/catalog/skills.index.yaml"), true);
  assert.equal(await isIgnored(".repo-agent.local.yml"), true);
  assert.equal(await isIgnored(".repo-agent/index/vectors.faiss"), true);
  assert.equal(await isIgnored(".env.local"), true);
  assert.equal(await isIgnored(".env.example"), false);
  assert.equal(await isIgnored("repo-agent/repo-agent.bundle.js"), false);
});

test("a Git clone validates without empty local directories and creates candidates lazily", async () => {
  const project = await temporaryProject();
  const cloneParent = await temporaryProject();
  const clone = path.join(cloneParent, "clone");
  await execFileAsync("git", ["init", "-q"], { cwd: project });
  await execFileAsync("git", ["config", "user.email", "repo-agent-test@example.invalid"], {
    cwd: project,
  });
  await execFileAsync("git", ["config", "user.name", "repo-agent-test"], { cwd: project });
  await run(["init", "--mode", "team", "--json"], project);
  await execFileAsync("git", ["add", "-A"], { cwd: project });
  await execFileAsync("git", ["commit", "-qm", "initialize repo-agent"], { cwd: project });
  await execFileAsync("git", ["clone", "-q", project, clone]);

  await assert.rejects(readFile(path.join(clone, ".repo-agent", "memory_candidates")));
  await assert.rejects(readFile(path.join(clone, ".repo-agent", "skills", "candidates")));
  await assert.rejects(readFile(path.join(clone, ".repo-agent", "fix_patterns", "candidates")));
  await assert.rejects(readFile(path.join(clone, ".repo-agent", "generated")));

  const validation = JSON.parse((await run(["validate", "--strict", "--json"], clone)).stdout);
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);

  const proposed = JSON.parse((await run([
    "memory",
    "propose",
    "--id",
    "memory.clone.lazy-candidate",
    "--content",
    "候选目录在首次写入时自动创建。",
    "--json",
  ], clone)).stdout);
  assert.match(proposed.data.path, /^\.repo-agent-private\/memory_candidates\//);
  await readFile(path.join(clone, proposed.data.path));

  const inbox = JSON.parse((await run([
    "learning",
    "inbox",
    "--task",
    "clone 后首次记录经验",
    "--observation",
    "先验证再修复",
    "--json",
  ], clone)).stdout);
  await readFile(path.join(clone, inbox.data.path));

  const patch = JSON.parse((await run(["patch", "create", "--json"], clone)).stdout);
  await readFile(path.join(clone, patch.data.path));

  const recurring = JSON.parse(
    (await run(["recurring-errors", "analyze", "--json"], clone)).stdout,
  );
  await readFile(path.join(clone, recurring.data.path));
});

test("personal mode uses a distinct conservative commit policy", async () => {
  const project = await temporaryProject();
  await run(["init", "--mode", "personal", "--json"], project);
  const config = await readFile(path.join(project, ".repo-agent", "config.yaml"), "utf8");
  const policy = await readFile(path.join(project, ".repo-agent", "commit_policy.yaml"), "utf8");
  assert.match(config, /mode: personal/);
  assert.match(policy, /default_mode: keep_local/);
});

test("init finds the project root when invoked from a nested directory", async () => {
  const project = await temporaryProject();
  const nested = path.join(project, "src", "feature");
  await mkdir(nested, { recursive: true });
  await writeFile(path.join(project, "package.json"), "{}");

  const result = await run(["init", "--dry-run", "--json"], nested);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.root, await realpath(project));
  assert.ok(payload.wouldCreate.includes(".repo-agent/config.yaml"));
});

test("init preserves existing AGENTS.md and existing .repo-agent config", async () => {
  const project = await temporaryProject();
  await mkdir(path.join(project, ".repo-agent"), { recursive: true });
  await writeFile(path.join(project, "AGENTS.md"), "user-owned agents file\n");
  await writeFile(path.join(project, ".repo-agent", "config.yaml"), "user-owned config\n");

  const result = await run(["init", "--json"], project);
  const payload = JSON.parse(result.stdout);

  const agents = await readFile(path.join(project, "AGENTS.md"), "utf8");
  assert.match(agents, /^user-owned agents file\n/);
  assert.equal(agents, "user-owned agents file\n");
  assert.equal(
    await readFile(path.join(project, ".repo-agent", "config.yaml"), "utf8"),
    "user-owned config\n",
  );
  await assert.rejects(readFile(path.join(project, "AGENTS.repo-agent.generated.md")));
  assert.ok(payload.skipped.includes(".repo-agent/config.yaml"));
});

test("doctor reports capabilities as JSON without mixed logs", async () => {
  const project = await temporaryProject();
  await run(["init", "--json"], project);
  const result = await run(["doctor", "--json"], project);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.node.supported, true);
  assert.equal(payload.project.initialized, true);
  assert.equal(payload.capabilities.mcpCompatible, true);
});

test("doctor fails readiness when the project is not initialized", async () => {
  const project = await temporaryProject();
  await assert.rejects(
    run(["doctor", "--json"], project),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.equal(payload.ok, false);
      assert.equal(payload.project.initialized, false);
      assert.equal(
        payload.checks.find((check) => check.id === "project_structure").ok,
        false,
      );
      return true;
    },
  );
});

test("init activates project integrations and handshake tracks reload state", async () => {
  const project = await temporaryProject();
  const initialized = JSON.parse((await run(["init", "--tool", "all", "--json"], project)).stdout);
  assert.equal(initialized.activation.state, "pending_reload");
  assert.equal(initialized.activation.reloadRequired, true);
  const codexConfig = await readFile(path.join(project, ".codex", "config.toml"), "utf8");
  assert.match(codexConfig, /mcp_servers\.repo_agent/);
  assert.match(codexConfig, /default_tools_approval_mode = "prompt"/);
  assert.match(
    codexConfig,
    /\[mcp_servers\.repo_agent\.tools\.get_health_metrics\]\napproval_mode = "approve"/,
  );
  assert.doesNotMatch(
    codexConfig,
    /\[mcp_servers\.repo_agent\.tools\.promote_candidate\]/,
  );
  assert.doesNotMatch(codexConfig, /^cwd\s*=/m);
  assert.doesNotMatch(
    await readFile(path.join(project, ".repo-agent", "tools", "registry.yaml"), "utf8"),
    /mcp__repo_agent__/,
  );
  assert.match(await readFile(path.join(project, ".mcp.json"), "utf8"), /repo-agent/);
  assert.match(await readFile(path.join(project, "opencode.json"), "utf8"), /repo-agent/);
  await assert.rejects(readFile(path.join(project, "CLAUDE.md")));

  const pending = JSON.parse((await run(["handshake", "--tool", "auto", "--json"], project)).stdout);
  assert.equal(pending.status, "pending_reload");
  await runWithInput(
    ["hook", "session-start", "--tool", "codex"],
    project,
    { session_id: "activation-session", hook_event_name: "SessionStart" },
  );
  const active = JSON.parse(
    (await run(["handshake", "--tool", "auto", "--json"], project)).stdout,
  );
  assert.equal(active.status, "active");
  const state = JSON.parse(
    await readFile(path.join(project, ".repo-agent-runtime", "activation.json"), "utf8"),
  );
  assert.equal(state.state, "active");

  const opencodePath = path.join(project, "opencode.json");
  await writeFile(
    opencodePath,
    (await readFile(opencodePath, "utf8")).replace(
      "REPO_AGENT_INTEGRATION_VERSION",
      "OLD_REPO_AGENT_INTEGRATION_VERSION",
    ),
  );
  const stale = JSON.parse(
    (await run(["handshake", "--tool", "opencode", "--json"], project)).stdout,
  );
  assert.equal(stale.status, "repair_required");
  assert.match(stale.suggestedCommand, /activate --repair/);

  await rm(path.join(project, ".repo-agent"), { recursive: true, force: true });
  await rm(path.join(project, ".repo-agent-runtime"), { recursive: true, force: true });
  const notInitialized = JSON.parse((await run([
    "handshake", "--tool", "codex", "--json",
  ], project)).stdout);
  assert.equal(notInitialized.status, "not_activated");
  assert.equal(notInitialized.projectInitialized, false);
  assert.match(notInitialized.suggestedCommand, /init --mode team/);
  await assert.rejects(
    readFile(path.join(project, ".repo-agent-runtime", "activation.json")),
  );
});

test("activation is idempotent and preserves unrelated tool configuration", async () => {
  const project = await temporaryProject();
  const existingHook = {
    hooks: [{
      type: "command",
      command: "node existing-hook.js",
    }],
  };
  await mkdir(path.join(project, ".codex"), { recursive: true });
  await mkdir(path.join(project, ".claude"), { recursive: true });
  await writeFile(path.join(project, "package.json"), "{}\n");
  await writeFile(path.join(project, "AGENTS.md"), "团队原有说明\n");
  await writeFile(path.join(project, ".codex", "hooks.json"), JSON.stringify({
    hooks: { SessionStart: [existingHook], UserPromptSubmit: [existingHook] },
  }));
  await writeFile(path.join(project, ".claude", "settings.json"), JSON.stringify({
    permissions: { allow: ["Read"] },
    hooks: { SessionStart: [existingHook], UserPromptSubmit: [existingHook] },
  }));
  await writeFile(path.join(project, ".mcp.json"), JSON.stringify({
    mcpServers: { existing: { command: "node", args: ["existing.js"] } },
  }));
  await writeFile(path.join(project, "opencode.json"), JSON.stringify({
    theme: "system",
    mcp: { existing: { type: "local", command: ["node", "existing.js"] } },
  }));

  await run(["init", "--json"], project);
  await run(["activate", "--repair", "--tool", "auto", "--json"], project);

  const codexHooks = JSON.parse(await readFile(path.join(project, ".codex", "hooks.json"), "utf8"));
  const claudeSettings = JSON.parse(
    await readFile(path.join(project, ".claude", "settings.json"), "utf8"),
  );
  assert.equal(codexHooks.hooks.SessionStart.length, 2);
  assert.match(
    codexHooks.hooks.SessionStart[1].hooks[0].commandWindows,
    /^powershell\.exe -NoProfile/,
  );
  assert.equal(claudeSettings.hooks.UserPromptSubmit.length, 2);
  assert.deepEqual(claudeSettings.permissions, { allow: ["Read"] });
  assert.ok(JSON.parse(await readFile(path.join(project, ".mcp.json"), "utf8")).mcpServers.existing);
  assert.ok(JSON.parse(await readFile(path.join(project, "opencode.json"), "utf8")).mcp.existing);

  await run(["deactivate", "--tool", "auto", "--json"], project);
  const deactivatedCodex = JSON.parse(
    await readFile(path.join(project, ".codex", "hooks.json"), "utf8"),
  );
  const deactivatedClaude = JSON.parse(
    await readFile(path.join(project, ".claude", "settings.json"), "utf8"),
  );
  assert.equal(deactivatedCodex.hooks.SessionStart.length, 1);
  assert.equal(deactivatedClaude.hooks.UserPromptSubmit.length, 1);
  assert.doesNotMatch(
    await readFile(path.join(project, "AGENTS.md"), "utf8"),
    /repo-agent integration managed/,
  );
  assert.match(await readFile(path.join(project, "AGENTS.md"), "utf8"), /团队原有说明/);
  assert.ok(JSON.parse(await readFile(path.join(project, ".mcp.json"), "utf8")).mcpServers.existing);
  assert.ok(JSON.parse(await readFile(path.join(project, "opencode.json"), "utf8")).mcp.existing);
});

test("native hooks consume stdin, inject context, and isolate concurrent sessions", async () => {
  const project = await temporaryProject();
  await writeFile(
    path.join(project, "package.json"),
    JSON.stringify({ scripts: { test: "node --test", typecheck: "tsc --noEmit" } }),
  );
  await run(["init", "--tool", "codex", "--json"], project);

  const started = JSON.parse((await runWithInput(
    ["hook", "session-start", "--tool", "codex"],
    project,
    { session_id: "session-a", cwd: project, hook_event_name: "SessionStart" },
  )).stdout);
  assert.equal(started.hookSpecificOutput.hookEventName, "SessionStart");

  const [first, second] = await Promise.all([
    runWithInput(
      ["hook", "user-prompt-submit", "--tool", "codex"],
      project,
      {
        session_id: "session-a",
        turn_id: "turn-1",
        prompt: "修改登录逻辑",
        hook_event_name: "UserPromptSubmit",
      },
    ),
    runWithInput(
      ["hook", "user-prompt-submit", "--tool", "codex"],
      project,
      {
        session_id: "session-b",
        turn_id: "turn-1",
        prompt: "更新 README",
        hook_event_name: "UserPromptSubmit",
      },
    ),
  ]);
  const firstOutput = JSON.parse(first.stdout);
  const secondOutput = JSON.parse(second.stdout);
  assert.equal(firstOutput.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.equal(secondOutput.hookSpecificOutput.hookEventName, "UserPromptSubmit");
  assert.match(firstOutput.hookSpecificOutput.additionalContext, /修改前必须遵循/);
  assert.match(firstOutput.hookSpecificOutput.additionalContext, /preflight 标识/);
  assert.match(firstOutput.hookSpecificOutput.additionalContext, /Hook Router: task_preflight/);

  const firstLatest = JSON.parse(await readFile(
    path.join(project, ".repo-agent-runtime", "preflights", "sessions", "session-a", "latest.json"),
    "utf8",
  ));
  const secondLatest = JSON.parse(await readFile(
    path.join(project, ".repo-agent-runtime", "preflights", "sessions", "session-b", "latest.json"),
    "utf8",
  ));
  assert.equal(firstLatest.task, "修改登录逻辑");
  assert.equal(secondLatest.task, "更新 README");
  assert.notEqual(firstLatest.id, secondLatest.id);

  const stopped = JSON.parse((await runWithInput(
    ["hook", "stop", "--tool", "codex"],
    project,
    { session_id: "session-a", turn_id: "turn-1", hook_event_name: "Stop" },
  )).stdout);
  assert.match(stopped.systemMessage, /闭环步骤完整/);

  await run([
    "commit-options",
    "--task", "修改登录逻辑",
    "--session-id", "session-a",
    "--json",
  ], project);
  await run([
    "record-trace",
    "--task", "修改登录逻辑",
    "--outcome", "done",
    "--session-id", "session-a",
    "--json",
  ], project);
  const completed = JSON.parse((await runWithInput(
    ["hook", "stop", "--tool", "codex"],
    project,
    { session_id: "session-a", turn_id: "turn-1", hook_event_name: "Stop" },
  )).stdout);
  assert.match(completed.systemMessage, /闭环步骤完整/);

  await runWithInput(
    ["hook", "user-prompt-submit", "--tool", "codex"],
    project,
    {
      session_id: "session-a",
      turn_id: "turn-2",
      prompt: "实现新的资料页面",
      hook_event_name: "UserPromptSubmit",
    },
  );
  const secondTurnStopped = JSON.parse((await runWithInput(
    ["hook", "stop", "--tool", "codex"],
    project,
    { session_id: "session-a", turn_id: "turn-2", hook_event_name: "Stop" },
  )).stdout);
  assert.match(secondTurnStopped.systemMessage, /闭环步骤完整/);
});

test("Hook Router controls injected context, blocking, and closure requirements", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  await writeFile(
    path.join(project, ".repo-agent", "hooks", "routes.yaml"),
    `version: 1
routes:
  session-start:
    handler: session_handshake
  user-prompt-submit:
    handler: task_preflight
    context_sources: [instructions]
    block_on_risk: [high, blocked]
  stop:
    handler: task_closure
    closure_steps: [commit_advice, audit_recorded, observation_captured, recurring_analyzed, lifecycle_evaluated, metrics_updated]
`,
  );

  const routedContext = JSON.parse((await runWithInput(
    ["hook", "user-prompt-submit", "--tool", "codex"],
    project,
    {
      session_id: "routed-session",
      turn_id: "turn-1",
      prompt: "更新 README",
    },
  )).stdout);
  assert.match(routedContext.hookSpecificOutput.additionalContext, /Hook Router: task_preflight/);
  assert.match(routedContext.hookSpecificOutput.additionalContext, /闭环活动: commit_advice/);
  assert.doesNotMatch(routedContext.hookSpecificOutput.additionalContext, /"memories":/);

  const prompt = JSON.parse((await runWithInput(
    ["hook", "user-prompt-submit", "--tool", "codex"],
    project,
    {
      session_id: "routed-session",
      turn_id: "turn-2",
      prompt: "OAuth security change",
    },
  )).stdout);
  assert.equal(prompt.decision, "block");

  await run([
    "record-trace",
    "--task", "OAuth security change",
    "--outcome", "blocked",
    "--session-id", "routed-session",
    "--json",
  ], project);
  const stopped = JSON.parse((await runWithInput(
    ["hook", "stop", "--tool", "codex"],
    project,
    { session_id: "routed-session", turn_id: "turn-2" },
  )).stdout);
  assert.match(stopped.systemMessage, /闭环步骤完整/);

  await writeFile(
    path.join(project, ".repo-agent", "hooks", "routes.yaml"),
    "version: 1\nroutes:\n  session-start:\n    handler: invalid\n",
  );
  const routerStatus = JSON.parse((await run([
    "handshake", "--tool", "codex", "--json",
  ], project)).stdout);
  assert.equal(routerStatus.status, "repair_required");
  assert.equal(routerStatus.hookRouterReady, false);
  assert.match(routerStatus.suggestedCommand, /validate --strict/);
  await assert.rejects(
    run(["validate", "--strict", "--json"], project),
    (error) => JSON.parse(error.stdout).errors.some(
      (item) => item.path === ".repo-agent/hooks/routes.yaml",
    ),
  );
});

test("hook-only integration never modifies project instruction documents", async () => {
  const project = await temporaryProject();
  await writeFile(path.join(project, "AGENTS.md"), "user agents\n");
  await writeFile(path.join(project, "CLAUDE.md"), "user claude\n");
  await run(["init", "--json"], project);
  await assert.rejects(
    run(["activate", "--tool", "opencode", "--entry", "hook", "--json"], project),
    (error) => JSON.parse(error.stdout).error.code === "E_UNSUPPORTED_ENTRY",
  );
  await assert.rejects(
    run(["activate", "--tool", "codex", "--entry", "docs", "--json"], project),
    (error) => JSON.parse(error.stdout).error.code === "E_UNSUPPORTED_ENTRY",
  );
  await assert.rejects(
    run(["activate", "--tool", "codex", "--entry", "hybrid", "--json"], project),
    (error) => JSON.parse(error.stdout).error.code === "E_UNSUPPORTED_ENTRY",
  );
  assert.equal(await readFile(path.join(project, "AGENTS.md"), "utf8"), "user agents\n");
  assert.equal(await readFile(path.join(project, "CLAUDE.md"), "utf8"), "user claude\n");
});

test("init validates integration compatibility before writing files", async () => {
  const project = await temporaryProject();
  await assert.rejects(
    run([
      "init",
      "--tool",
      "all",
      "--entry",
      "hook",
      "--json",
    ], project),
    (error) => JSON.parse(error.stdout).error.code === "E_UNSUPPORTED_ENTRY",
  );
  await assert.rejects(readFile(path.join(project, ".repo-agent", "config.yaml")));
  await assert.rejects(readFile(path.join(project, ".gitignore")));
  await assert.rejects(readFile(path.join(project, "AGENTS.md")));
});

test("update repairs integrations and entry mode changes remove obsolete hooks", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  assert.match(
    await readFile(path.join(project, ".codex", "hooks.json"), "utf8"),
    /pre-tool-use/,
  );

  await run([
    "activate", "--tool", "codex", "--entry", "mcp-only", "--json",
  ], project);
  await writeFile(
    path.join(project, ".gitignore"),
    `repo-agent/\n${await readFile(path.join(project, ".gitignore"), "utf8")}`,
  );
  const hooks = await readFile(path.join(project, ".codex", "hooks.json"), "utf8");
  assert.doesNotMatch(hooks, /repo-agent\.bundle\.js/);
  const codexConfigPath = path.join(project, ".codex", "config.toml");
  await writeFile(
    codexConfigPath,
    (await readFile(codexConfigPath, "utf8")).replace(
      'default_tools_approval_mode = "prompt"',
      'default_tools_approval_mode = "auto"',
    ),
  );

  const synced = JSON.parse((await run([
    "update", "--tool", "codex", "--entry", "hook", "--json",
  ], project)).stdout);
  assert.equal(synced.ok, true);
  assert.equal(synced.data.action, "refresh");
  assert.equal(synced.data.initialized, true);
  assert.equal(synced.data.initializedNow, false);
  assert.equal(synced.data.wouldInitialize, false);
  assert.equal(synced.data.validation.ok, true);
  assert.equal(synced.data.gitignore.action, "updated");
  await execFileAsync("git", ["init", "-q"], { cwd: project });
  await mkdir(path.join(project, "repo-agent"), { recursive: true });
  await writeFile(path.join(project, "repo-agent", "repo-agent.bundle.js"), "bundle");
  await assert.rejects(
    execFileAsync(
      "git",
      ["check-ignore", "--quiet", "--no-index", "repo-agent/repo-agent.bundle.js"],
      { cwd: project },
    ),
    (error) => error?.code === 1,
  );
  assert.match(
    await readFile(path.join(project, ".codex", "hooks.json"), "utf8"),
    /pre-tool-use/,
  );
  assert.match(
    await readFile(codexConfigPath, "utf8"),
    /default_tools_approval_mode = "prompt"/,
  );

  await assert.rejects(
    run(["handshake", "--tool", "codex", "--hook", "fabricated", "--json"], project),
    (error) => JSON.parse(error.stdout).error.code === "E_UNKNOWN_COMMAND",
  );
});

test("update reports project state without conflating dry-run with initialization", async () => {
  const project = await temporaryProject();
  const preview = JSON.parse((await run([
    "update", "--tool", "all", "--entry", "auto", "--dry-run", "--json",
  ], project)).stdout);
  assert.equal(preview.data.action, "init");
  assert.equal(preview.data.initialized, false);
  assert.equal(preview.data.initializedNow, false);
  assert.equal(preview.data.wouldInitialize, true);
  await assert.rejects(readFile(path.join(project, ".repo-agent", "config.yaml")));

  const applied = JSON.parse((await run([
    "update", "--tool", "all", "--entry", "auto", "--json",
  ], project)).stdout);
  assert.equal(applied.data.action, "init");
  assert.equal(applied.data.initialized, true);
  assert.equal(applied.data.initializedNow, true);
  assert.equal(applied.data.wouldInitialize, false);
});

test("PreToolUse blocks dangerous commands and Stop automatically closes the turn", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  const blocked = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    {
      session_id: "automatic-session",
      turn_id: "turn-1",
      tool_name: "Bash",
      tool_input: { command: "rm -rf /tmp/example" },
    },
  )).stdout);
  assert.equal(blocked.decision, "block");

  await runWithInput(
    ["hook", "user-prompt-submit", "--tool", "codex"],
    project,
    {
      session_id: "automatic-session",
      turn_id: "turn-1",
      prompt: "修复重复失败问题",
    },
  );
  const stopped = JSON.parse((await runWithInput(
    ["hook", "stop", "--tool", "codex"],
    project,
    {
      session_id: "automatic-session",
      turn_id: "turn-1",
      stop_hook_active: false,
      last_assistant_message: "先复现 error，然后修复并运行测试。",
    },
  )).stdout);
  assert.match(stopped.systemMessage, /闭环步骤完整/);
  const learnedCandidates = (
    await Promise.all([
      path.join(project, ".repo-agent-private", "memory_candidates"),
      path.join(project, ".repo-agent-private", "skills", "candidates"),
      path.join(project, ".repo-agent-private", "fix_patterns", "candidates"),
    ].map((directory) => readdir(directory).catch(() => [])))
  ).flat();
  assert.equal(learnedCandidates.filter((file) => file.endsWith(".yaml")).length, 0);
  const observationFiles = await readdir(
    path.join(project, ".repo-agent-private", "observations"),
    { recursive: true },
  );
  assert.ok(observationFiles.some((file) => file.endsWith(".jsonl")));
  const audits = await readdir(
    path.join(project, ".repo-agent", "generated", "audits"),
  );
  const latestAudit = JSON.parse(await readFile(
    path.join(
      project,
      ".repo-agent",
      "generated",
      "audits",
      audits.filter((file) => file.endsWith(".json")).sort().at(-1),
    ),
    "utf8",
  ));
  assert.equal(latestAudit.outcome_status, "partial");

  const latest = JSON.parse(await readFile(
    path.join(
      project,
      ".repo-agent-runtime",
      "preflights",
      "sessions",
      "automatic-session",
      "latest.json",
    ),
    "utf8",
  ));
  const closureFile = path.join(
    project,
    ".repo-agent-runtime",
    "closures",
    "automatic-session",
    `${latest.id}.json`,
  );
  const receipt = JSON.parse(await readFile(closureFile, "utf8"));
  assert.equal(receipt.status, "closed");
  assert.equal(receipt.completedSteps.length, 6);
  await readFile(
    path.join(project, ".repo-agent-private", "evidence", "materialized.json"),
    "utf8",
  );
});

test("repeated learning requires analysis and explicit team promotion", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  for (let index = 1; index <= 3; index += 1) {
    const session = `learning-session-${index}`;
    await runWithInput(
      ["hook", "user-prompt-submit", "--tool", "codex"],
      project,
      {
        session_id: session,
        turn_id: `turn-${index}`,
        prompt: "沉淀回归测试流程",
      },
    );
    await runWithInput(
      ["hook", "stop", "--tool", "codex"],
      project,
      {
        session_id: session,
        turn_id: `turn-${index}`,
        last_assistant_message: "先运行失败测试，再实施最小修复，最后运行完整回归。",
      },
    );
  }
  const observationRoot = path.join(project, ".repo-agent-private", "observations");
  const observationFile = (await readdir(observationRoot, { recursive: true }))
    .find((file) => file.endsWith(".jsonl"));
  const observationPath = path.join(observationRoot, observationFile);
  const observations = (await readFile(observationPath, "utf8"))
    .trim().split("\n").map(JSON.parse);
  observations[0].observedAt = "2026-06-30T00:00:00.000Z";
  await writeFile(
    observationPath,
    `${observations.map((item) => JSON.stringify(item)).join("\n")}\n`,
  );
  await run(["learning", "analyze", "--json"], project);
  const privateDirectory = path.join(
    project,
    ".repo-agent-private",
    "skills",
    "candidates",
  );
  const teamDirectory = path.join(
    project,
    ".repo-agent",
    "skills",
    "candidates",
  );
  const privateFiles = await readdir(privateDirectory);
  const teamFilesBefore = await readdir(teamDirectory);
  assert.equal(privateFiles.length, 1);
  assert.equal(teamFilesBefore.length, 0);
  const privateCandidate = await readFile(
    path.join(privateDirectory, privateFiles[0]),
    "utf8",
  );
  assert.match(privateCandidate, /promotion_eligible: true/);
  const parsedPrivate = await import("yaml").then(({ parse }) => parse(privateCandidate));
  await run([
    "candidate", "promote", parsedPrivate.candidate_id,
    "--reviewer", "测试审核人", "--json",
  ], project);
  const teamFiles = await readdir(teamDirectory);
  assert.equal(teamFiles.length, 1);
  const teamCandidate = await readFile(path.join(teamDirectory, teamFiles[0]), "utf8");
  assert.match(teamCandidate, /status: team_proposed/);
  assert.match(teamCandidate, /trusted: false/);
});

test("human-readable core command output is primarily Chinese", async () => {
  const project = await temporaryProject();
  const init = await run(["init"], project);
  assert.match(init.stdout, /初始化/);
  const doctorResult = await run(["doctor"], project);
  assert.match(doctorResult.stdout, /环境检查：通过/);
  const validation = await run(["validate"], project);
  assert.match(validation.stdout, /配置校验（普通模式）：通过/);
  const context = await run(["context", "修复 OAuth 问题"], project);
  assert.match(context.stdout, /任务：修复 OAuth 问题/);
  assert.match(context.stdout, /风险等级：高/);
});

test("unknown commands use a stable JSON error code", async () => {
  const project = await temporaryProject();
  await assert.rejects(
    execFileAsync(process.execPath, [bundle, "not-a-command", "--json"], { cwd: project }),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      assert.equal(payload.error.code, "E_UNKNOWN_COMMAND");
      return true;
    },
  );
});

test("hook user-prompt-submit returns native block instead of crashing when prompt missing", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  const output = await runWithInput(
    ["hook", "user-prompt-submit", "--tool", "codex"],
    project,
    { session_id: "session-empty", hook_event_name: "UserPromptSubmit" },
  );
  const parsed = JSON.parse(output.stdout);
  assert.equal(parsed.decision, "block");
  assert.match(parsed.reason, /缺少 prompt/);
});

test("commit-options and record-trace inherit task from latest preflight", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  await runWithInput(
    ["hook", "user-prompt-submit", "--tool", "codex"],
    project,
    { session_id: "inherit-session", prompt: "完善登录回归测试" },
  );
  const commit = JSON.parse((await run(
    ["commit-options", "--session-id", "inherit-session", "--json"],
    project,
  )).stdout);
  assert.equal(commit.ok, true);
  const trace = JSON.parse((await run(
    ["record-trace", "--session-id", "inherit-session", "--json"],
    project,
  )).stdout);
  assert.equal(trace.ok, true);
  assert.equal(trace.data.recorded, true);
});

test("retrieval is recorded once and manual outcomes do not imply asset application", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  const testingMemory = path.join(
    project,
    ".repo-agent",
    "memories",
    "testing.md",
  );
  await writeFile(
    testingMemory,
    `${await readFile(testingMemory, "utf8")}\nunique-testing-marker\n`,
  );
  await runWithInput(
    ["hook", "user-prompt-submit", "--tool", "codex"],
    project,
    {
      session_id: "credit-session",
      prompt: "unique-testing-marker",
    },
  );
  await run([
    "record-trace",
    "--session-id", "credit-session",
    "--outcome", "测试通过",
    "--outcome-status", "success",
    "--json",
  ], project);
  const evidence = JSON.parse((await run([
    "evidence", "explain", "memory.testing", "--json",
  ], project)).stdout).data;
  assert.equal(evidence.summary.retrieved, 1);
  assert.equal(evidence.summary.validatedSuccess, 0);
  assert.equal(evidence.summary.validatedFailure, 0);
});

test("status adapters reflect activated tool registry only", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  const status = JSON.parse((await run(["status", "--json"], project)).stdout);
  assert.ok(Array.isArray(status.data.adapters));
  assert.ok(!status.data.adapters.includes("openhands"));
});

test("doctor --json no longer nests a duplicate data envelope", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  const payload = JSON.parse((await run(["doctor", "--json"], project)).stdout);
  assert.equal(payload.ok, true);
  assert.equal(typeof payload.data, "object");
  assert.equal(payload.data.data, undefined);
});

test("PreToolUse combines the built-in manifest, project registry, and client-native approvals", async () => {
  const project = await temporaryProject();
  await run(["init", "--tool", "codex", "--json"], project);
  const readOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    { session_id: "tool-registry-session", tool_name: "Read", tool_input: { file_path: "README.md" } },
  )).stdout);
  assert.equal(readOutput.hookSpecificOutput.hookEventName, "PreToolUse");
  assert.match(readOutput.hookSpecificOutput.additionalContext, /未命中阻止策略/);
  const writeOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    { session_id: "tool-registry-session", tool_name: "Write", tool_input: { file_path: "tmp.txt" } },
  )).stdout);
  assert.match(writeOutput.hookSpecificOutput.additionalContext, /客户端原生审批|需要确认后才能使用/);
  const healthOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    {
      session_id: "tool-registry-session",
      tool_name: "mcp__repo_agent__get_health_metrics",
      tool_input: {},
    },
  )).stdout);
  assert.match(healthOutput.hookSpecificOutput.additionalContext, /未命中阻止策略/);
  const promoteOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    {
      session_id: "tool-registry-session",
      tool_name: "mcp__repo_agent__promote_candidate",
      tool_input: { candidateId: "candidate.example" },
    },
  )).stdout);
  assert.match(promoteOutput.hookSpecificOutput.additionalContext, /客户端原生审批/);
  const claudePromoteOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "claude-code"],
    project,
    {
      session_id: "tool-registry-session",
      tool_name: "mcp__repo_agent__promote_candidate",
      tool_input: { candidateId: "candidate.example" },
    },
  )).stdout);
  assert.equal(claudePromoteOutput.hookSpecificOutput.permissionDecision, "ask");
  const forgedRepoAgentTool = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    {
      session_id: "tool-registry-session",
      tool_name: "mcp__repo_agent__not_declared",
      tool_input: {},
    },
  )).stdout);
  assert.equal(forgedRepoAgentTool.decision, "block");
  assert.match(forgedRepoAgentTool.reason, /Tool Manifest/);
  const unknownOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    { session_id: "tool-registry-session", tool_name: "SomeCustomTool", tool_input: {} },
  )).stdout);
  assert.match(unknownOutput.hookSpecificOutput.additionalContext, /未注册/);
  const planOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    { session_id: "tool-registry-session", tool_name: "update_plan", tool_input: {} },
  )).stdout);
  assert.match(planOutput.hookSpecificOutput.additionalContext, /未命中阻止策略/);
  const safeBashOutput = JSON.parse((await runWithInput(
    ["hook", "pre-tool-use", "--tool", "codex"],
    project,
    { session_id: "tool-registry-session", tool_name: "Bash", tool_input: { command: "git status --short" } },
  )).stdout);
  assert.match(safeBashOutput.hookSpecificOutput.additionalContext, /未命中阻止策略/);
});
