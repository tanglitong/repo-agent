#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  cp,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");

function parseArguments(values) {
  const result = {
    target: process.cwd(),
    mode: "team",
    tool: "all",
    entry: "auto",
    dryRun: false,
    json: false,
  };
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") result.dryRun = true;
    else if (value === "--json") result.json = true;
    else if (["--target", "--mode", "--tool", "--entry"].includes(value)) {
      const next = values[index + 1];
      if (!next) throw new Error(`${value} 缺少参数。`);
      result[value.slice(2)] = next;
      index += 1;
    } else {
      throw new Error(`不支持的参数：${value}`);
    }
  }
  if (!["team", "personal"].includes(result.mode)) {
    throw new Error("--mode 只能是 team 或 personal。");
  }
  if (!["all", "codex", "claude-code", "opencode"].includes(result.tool)) {
    throw new Error("--tool 只能是 all、codex、claude-code 或 opencode。");
  }
  if (!["auto", "hook", "plugin", "mcp-only", "none"].includes(result.entry)) {
    throw new Error("--entry 无效。");
  }
  return result;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function safeRelativePath(value) {
  return value &&
    !path.isAbsolute(value) &&
    !value.split(/[\\/]/u).includes("..");
}

async function verifyPackage() {
  const checksumFile = path.join(packageRoot, "CHECKSUMS.txt");
  if (!(await exists(checksumFile))) {
    throw new Error("安装包缺少 CHECKSUMS.txt，拒绝安装。");
  }
  const lines = (await readFile(checksumFile, "utf8")).trim().split("\n");
  for (const line of lines) {
    const separator = line.indexOf("  ");
    const expected = separator > 0 ? line.slice(0, separator) : "";
    const relative = separator > 0 ? line.slice(separator + 2) : "";
    if (!/^[a-f0-9]{64}$/u.test(expected) || !safeRelativePath(relative)) {
      throw new Error(`无效的校验和记录：${line}`);
    }
    const content = await readFile(path.join(packageRoot, relative));
    const actual = createHash("sha256").update(content).digest("hex");
    if (actual !== expected) {
      throw new Error(`安装包校验失败：${relative}`);
    }
  }
}

async function run(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(
        signal
          ? `repo-agent 初始化被信号 ${signal} 终止。`
          : `repo-agent 初始化失败，退出码 ${code}。`,
      ));
    });
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const targetRoot = path.resolve(options.target);
  const targetInfo = await stat(targetRoot).catch(() => null);
  if (!targetInfo?.isDirectory()) {
    throw new Error(`目标项目目录不存在：${targetRoot}`);
  }
  if (Number(process.versions.node.split(".")[0]) < 18) {
    throw new Error("repo-agent 需要 Node.js 18 或更高版本。");
  }

  await verifyPackage();

  const targetPackage = path.join(targetRoot, "repo-agent");
  const sameLocation = path.resolve(targetPackage) === packageRoot;
  const targetExists = await exists(targetPackage);
  if (targetExists && !sameLocation) {
    throw new Error(
      `目标已存在 repo-agent/，未执行覆盖。请运行 node repo-agent/repo-agent.bundle.js update。`,
    );
  }

  let bundle = path.join(packageRoot, "repo-agent.bundle.js");
  if (!options.dryRun && !sameLocation) {
    const staging = path.join(
      targetRoot,
      `repo-agent.installing-${process.pid}-${Date.now()}`,
    );
    await rm(staging, { recursive: true, force: true });
    try {
      await mkdir(path.dirname(staging), { recursive: true });
      await cp(packageRoot, staging, {
        recursive: true,
        force: false,
        errorOnExist: true,
      });
      await rename(staging, targetPackage);
    } catch (error) {
      await rm(staging, { recursive: true, force: true });
      throw error;
    }
    bundle = path.join(targetPackage, "repo-agent.bundle.js");
  }

  const initArgs = [
    bundle,
    "init",
    "--mode",
    options.mode,
    "--tool",
    options.tool,
    "--entry",
    options.entry,
    ...(options.dryRun ? ["--dry-run"] : []),
    ...(options.json ? ["--json"] : []),
  ];
  await run(process.execPath, initArgs, targetRoot);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (process.argv.includes("--json")) {
    console.error(JSON.stringify({
      ok: false,
      error: { code: "E_SKILL_INSTALL", message },
      warnings: [],
    }));
  } else {
    console.error(`[E_SKILL_INSTALL] ${message}`);
  }
  process.exitCode = 1;
});
