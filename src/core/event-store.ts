import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  open,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { exists } from "../utils/fs.js";
import { CliError } from "../errors.js";

export type RuntimeEventType =
  | "preflight_opened"
  | "context_built"
  | "tool_allowed"
  | "tool_blocked"
  | "closure_step_completed"
  | "closure_step_failed"
  | "turn_closed";

export interface RuntimeEvent {
  version: 1;
  eventId: string;
  eventType: RuntimeEventType;
  sessionId: string;
  turnId: string;
  preflightId: string;
  occurredAt: string;
  producer: "hook" | "cli" | "mcp";
  idempotencyKey: string;
  payload: Record<string, unknown>;
}

const maxEventBytes = 256 * 1024;
const maxEventsPerPreflight = 10_000;

const safe = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 160) || "unknown";

function runtimeRoot(root: string) {
  return path.join(root, ".repo-agent-runtime");
}

function eventFile(root: string, sessionId: string, preflightId: string) {
  return path.join(
    runtimeRoot(root),
    "events",
    safe(sessionId),
    `${safe(preflightId)}.jsonl`,
  );
}

function lockFile(root: string, preflightId: string) {
  return path.join(runtimeRoot(root), "locks", `${safe(preflightId)}.lock`);
}

export function closureStepKey(preflightId: string, step: string, version = 1) {
  return createHash("sha256")
    .update(`${preflightId}\n${step}\n${version}`)
    .digest("hex");
}

async function withPreflightLock<T>(
  root: string,
  preflightId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const target = lockFile(root, preflightId);
  await mkdir(path.dirname(target), { recursive: true });
  let handle;
  for (let attempt = 0; attempt < 200; attempt += 1) {
    try {
      handle = await open(target, "wx");
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  if (!handle) {
    throw new CliError("E_RUNTIME_LOCK", `无法获取 Preflight 锁：${preflightId}`);
  }
  try {
    return await operation();
  } finally {
    await handle.close();
    await unlink(target).catch(() => undefined);
  }
}

export async function readRuntimeEvents(
  root: string,
  sessionId: string,
  preflightId: string,
): Promise<{ events: RuntimeEvent[]; warnings: string[] }> {
  const file = eventFile(root, sessionId, preflightId);
  if (!(await exists(file))) return { events: [], warnings: [] };
  const lines = (await readFile(file, "utf8")).split("\n").filter(Boolean);
  const events: RuntimeEvent[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  for (const [index, line] of lines.entries()) {
    try {
      const event = JSON.parse(line) as RuntimeEvent;
      if (ids.has(event.eventId)) {
        warnings.push(`事件 ID 重复：${event.eventId}`);
        continue;
      }
      ids.add(event.eventId);
      events.push(event);
    } catch {
      warnings.push(`事件日志第 ${index + 1} 行损坏。`);
    }
  }
  return { events, warnings };
}

export async function appendRuntimeEvent(
  root: string,
  input: Omit<RuntimeEvent, "version" | "eventId" | "occurredAt"> & {
    eventId?: string;
    occurredAt?: string;
  },
): Promise<{ event: RuntimeEvent; appended: boolean }> {
  return withPreflightLock(root, input.preflightId, async () => {
    const current = await readRuntimeEvents(
      root,
      input.sessionId,
      input.preflightId,
    );
    const duplicate = current.events.find(
      (event) => event.idempotencyKey === input.idempotencyKey,
    );
    if (duplicate) return { event: duplicate, appended: false };
    if (current.events.length >= maxEventsPerPreflight) {
      throw new CliError(
        "E_RUNTIME_LIMIT",
        `Preflight 事件数量超过上限：${input.preflightId}`,
      );
    }
    const event: RuntimeEvent = {
      version: 1,
      eventId: input.eventId ?? randomUUID(),
      occurredAt: input.occurredAt ?? new Date().toISOString(),
      eventType: input.eventType,
      sessionId: input.sessionId,
      turnId: input.turnId,
      preflightId: input.preflightId,
      producer: input.producer,
      idempotencyKey: input.idempotencyKey,
      payload: input.payload,
    };
    if (current.events.some((item) => item.eventId === event.eventId)) {
      throw new CliError("E_RUNTIME_DUPLICATE", `事件 ID 已存在：${event.eventId}`);
    }
    const serialized = `${JSON.stringify(event)}\n`;
    if (Buffer.byteLength(serialized) > maxEventBytes) {
      throw new CliError("E_RUNTIME_LIMIT", "单个运行时事件超过 256KB。");
    }
    const file = eventFile(root, input.sessionId, input.preflightId);
    await mkdir(path.dirname(file), { recursive: true });
    const previous = await exists(file) ? await readFile(file, "utf8") : "";
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporary, previous + serialized, "utf8");
    await rename(temporary, file);
    return { event, appended: true };
  });
}

export async function writeRuntimeSnapshot(
  root: string,
  relativePath: string,
  value: unknown,
) {
  const file = path.join(runtimeRoot(root), relativePath);
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

export const runtimePath = (root: string, ...segments: string[]) =>
  path.join(runtimeRoot(root), ...segments);
