import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = path.join(root, "dist", "repo-agent.bundle.js");

async function setup() {
  const directory = await mkdtemp(path.join(tmpdir(), "repo-agent-release-quality-"));
  await writeFile(path.join(directory, "package.json"), JSON.stringify({
    type: "module",
    scripts: { test: "node --test", typecheck: "tsc --noEmit" },
  }));
  await writeFile(path.join(directory, "SECURITY.md"), "# Security\n");
  await execFileAsync(
    process.execPath,
    [bundle, "init", "--tool", "all", "--json"],
    { cwd: directory },
  );
  return directory;
}

async function run(directory, args) {
  const { stdout } = await execFileAsync(
    process.execPath,
    [bundle, ...args, "--json"],
    { cwd: directory },
  );
  return JSON.parse(stdout.trim());
}

async function hook(directory, event, input) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      process.execPath,
      [bundle, "hook", event, "--tool", "opencode"],
      { cwd: directory },
      (error, stdout, stderr) => {
        if (error) {
          reject(Object.assign(error, { stdout, stderr }));
          return;
        }
        resolve(JSON.parse(stdout.trim()));
      },
    );
    child.stdin.end(JSON.stringify(input));
  });
}

test("OpenCode plugin maps messages, tool checks, and idle closure", async () => {
  const directory = await setup();
  const pluginPath = path.join(
    directory,
    ".opencode",
    "plugins",
    "repo-agent.js",
  );
  const responses = [
    {
      hookSpecificOutput: {
        additionalContext: "repo-agent preflight: test",
      },
    },
    { decision: "block", reason: "blocked by policy" },
    { hookSpecificOutput: { additionalContext: "active" } },
    { systemMessage: "closed" },
  ];
  const calls = [];
  globalThis.Bun = {
    spawn(command, options) {
      const call = { command, options, input: "" };
      calls.push(call);
      const result = responses.shift();
      return {
        stdin: {
          write(value) {
            call.input += String(value);
          },
          end() {},
        },
        stdout: new Response(JSON.stringify(result)).body,
        stderr: new Response("").body,
        exited: Promise.resolve(0),
        kill() {},
      };
    },
  };
  const logs = [];
  const messageRequests = [];
  const client = {
    app: { log: async (entry) => logs.push(entry) },
    session: {
      messages: async (request) => {
        messageRequests.push(request);
        return {
          data: [{
            info: { role: "assistant" },
            parts: [{ type: "text", text: "任务完成" }],
          }],
        };
      },
    },
  };
  const module = await import(
    `${pathToFileURL(pluginPath).href}?test=${Date.now()}`
  );
  const plugin = await module.RepoAgentPlugin({ client, directory });
  const output = {
    message: { id: "message-1" },
    parts: [{
      id: "part-1",
      sessionID: "session-1",
      messageID: "message-1",
      type: "text",
      text: "更新 README",
    }],
  };
  await plugin["chat.message"]({ sessionID: "session-1" }, output);
  assert.match(output.parts.at(-1).text, /repo-agent preflight/);
  assert.equal(JSON.parse(calls[0].input).prompt, "更新 README");

  await assert.rejects(
    plugin["tool.execute.before"](
      { sessionID: "session-1", tool: "bash" },
      { args: { command: "blocked-command" } },
    ),
    /blocked by policy/,
  );
  await plugin.event({
    event: { type: "session.created", properties: { info: { id: "session-1" } } },
  });
  await plugin.event({
    event: { type: "session.idle", properties: { sessionID: "session-1" } },
  });
  assert.deepEqual(
    calls.map((call) => call.command[3]),
    ["user-prompt-submit", "pre-tool-use", "session-start", "stop"],
  );
  assert.equal(JSON.parse(calls[3].input).last_assistant_message, "任务完成");
  assert.deepEqual(messageRequests, [{ path: { id: "session-1" } }]);
  assert.deepEqual(logs, []);
  delete globalThis.Bun;
});

test("strict config rejects fields without a runtime consumer", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  await writeFile(
    configPath,
    `${await readFile(configPath, "utf8")}\nunused_setting: true\n`,
  );
  await assert.rejects(
    run(directory, ["validate", "--strict"]),
    (error) => {
      const payload = JSON.parse(error.stdout.trim());
      return payload.errors.some((item) => item.code === "E_CONFIG_SCHEMA");
    },
  );
});

test("configured growth threshold is honored and summaries keep Markdown valid", async () => {
  const directory = await setup();
  const configPath = path.join(directory, ".repo-agent", "config.yaml");
  await writeFile(
    configPath,
    (await readFile(configPath, "utf8")).replace(
      "background_observation_threshold: 20",
      "background_observation_threshold: 1",
    ),
  );
  await hook(directory, "user-prompt-submit", {
    session_id: "opencode-growth",
    turn_id: "turn-1",
    prompt: "验证候选摘要",
  });
  const longOutcome = `修复完成。[详细说明](/tmp/${"very-long/".repeat(80)}report.md)`;
  await hook(directory, "stop", {
    session_id: "opencode-growth",
    turn_id: "turn-1",
    stop_hook_active: true,
    last_assistant_message: longOutcome,
    outcome_status: "success",
  });
  const marker = JSON.parse(await readFile(
    path.join(
      directory,
      ".repo-agent-private",
      "learning",
      "last-analysis.json",
    ),
    "utf8",
  ));
  assert.equal(marker.observationCount, 1);
  const candidateRoot = path.join(
    directory,
    ".repo-agent-private",
    "memory_candidates",
  );
  const candidates = await readdir(candidateRoot);
  assert.equal(candidates.length, 1);
  const candidate = await readFile(
    path.join(candidateRoot, candidates[0]),
    "utf8",
  );
  assert.doesNotMatch(candidate, /\]\([^)]*$/m);
  assert.match(candidate, /详细说明/);
});

test("candidate backlog is advisory and does not lower readiness score", async () => {
  const directory = await setup();
  await run(directory, [
    "memory",
    "propose",
    "--id", "memory.release.review",
    "--content", "等待人工审核的发布说明。",
  ]);
  const health = await run(directory, ["health", "check"]);
  assert.equal(health.data.score, 100);
  assert.ok(
    health.data.issues.some((item) =>
      item.code === "candidate_backlog" && item.severity === "advisory"
    ),
  );
  assert.deepEqual(health.data.warnings, []);
});
