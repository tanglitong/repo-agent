import path from "node:path";
import { mkdir, open, readFile, unlink } from "node:fs/promises";
import {
  appendRuntimeEvent,
  closureStepKey,
  readRuntimeEvents,
  runtimePath,
  writeRuntimeSnapshot,
} from "./event-store.js";
import { exists, listFiles } from "../utils/fs.js";

export const closureSteps = [
  "commit_advice",
  "audit_recorded",
  "observation_captured",
  "recurring_analyzed",
  "lifecycle_evaluated",
  "metrics_updated",
] as const;

export type ClosureStep = typeof closureSteps[number];
export type ClosureStatus =
  | "opened"
  | "executing"
  | "closure_pending"
  | "closed"
  | "retryable_failed"
  | "abandoned";

export interface ClosureReceipt {
  version: 1;
  preflightId: string;
  sessionId: string;
  turnId: string;
  status: ClosureStatus;
  openedAt: string;
  updatedAt: string;
  completedSteps: ClosureStep[];
  failedSteps: Array<{ step: ClosureStep; message: string; failedAt: string }>;
}

function receiptPath(sessionId: string, preflightId: string) {
  return path.join(
    "closures",
    sessionId.replace(/[^a-zA-Z0-9._-]/g, "_"),
    `${preflightId.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`,
  );
}

export async function readClosureReceipt(
  root: string,
  sessionId: string,
  preflightId: string,
): Promise<ClosureReceipt | null> {
  const file = runtimePath(root, receiptPath(sessionId, preflightId));
  if (!(await exists(file))) return null;
  return JSON.parse(await readFile(file, "utf8")) as ClosureReceipt;
}

export async function openClosure(input: {
  root: string;
  sessionId: string;
  turnId: string;
  preflightId: string;
  openedAt?: string;
}) {
  const existing = await readClosureReceipt(
    input.root,
    input.sessionId,
    input.preflightId,
  );
  if (existing) return existing;
  const now = input.openedAt ?? new Date().toISOString();
  const receipt: ClosureReceipt = {
    version: 1,
    preflightId: input.preflightId,
    sessionId: input.sessionId,
    turnId: input.turnId,
    status: "opened",
    openedAt: now,
    updatedAt: now,
    completedSteps: [],
    failedSteps: [],
  };
  await writeRuntimeSnapshot(
    input.root,
    receiptPath(input.sessionId, input.preflightId),
    receipt,
  );
  return receipt;
}

export async function markClosureStep(input: {
  root: string;
  sessionId: string;
  turnId: string;
  preflightId: string;
  step: ClosureStep;
  producer: "hook" | "cli" | "mcp";
  payload?: Record<string, unknown>;
}) {
  let receipt = await openClosure(input);
  if (receipt.completedSteps.includes(input.step)) {
    return { receipt, marked: false };
  }
  await appendRuntimeEvent(input.root, {
    eventType: "closure_step_completed",
    sessionId: input.sessionId,
    turnId: input.turnId,
    preflightId: input.preflightId,
    producer: input.producer,
    idempotencyKey: closureStepKey(input.preflightId, input.step),
    payload: { step: input.step, ...(input.payload ?? {}) },
  });
  receipt = {
    ...receipt,
    status: "closure_pending",
    updatedAt: new Date().toISOString(),
    completedSteps: [...new Set([...receipt.completedSteps, input.step])],
    failedSteps: receipt.failedSteps.filter((item) => item.step !== input.step),
  };
  await writeRuntimeSnapshot(
    input.root,
    receiptPath(input.sessionId, input.preflightId),
    receipt,
  );
  return { receipt, marked: true };
}

export async function ensureClosure(input: {
  root: string;
  sessionId: string;
  turnId: string;
  preflightId: string;
  producer: "hook" | "cli" | "mcp";
  handlers: Record<ClosureStep, () => Promise<Record<string, unknown> | void>>;
  _lockHeld?: boolean;
}) {
  if (!input._lockHeld) {
    const lock = runtimePath(
      input.root,
      "locks",
      `${input.preflightId.replace(/[^a-zA-Z0-9._-]/g, "_")}.closure.lock`,
    );
    await mkdir(path.dirname(lock), { recursive: true });
    let handle;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try {
        handle = await open(lock, "wx");
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    if (!handle) throw new Error(`无法获取闭环锁：${input.preflightId}`);
    try {
      return await ensureClosure({ ...input, _lockHeld: true });
    } finally {
      await handle.close();
      await unlink(lock).catch(() => undefined);
    }
  }
  let receipt = await openClosure(input);
  if (receipt.status !== "closed" && receipt.status !== "abandoned") {
    receipt = {
      ...receipt,
      status: "executing",
      updatedAt: new Date().toISOString(),
    };
    await writeRuntimeSnapshot(
      input.root,
      receiptPath(input.sessionId, input.preflightId),
      receipt,
    );
  }
  const completedNow: ClosureStep[] = [];
  const failedNow: ClosureReceipt["failedSteps"] = [];
  for (const step of closureSteps) {
    if (receipt.completedSteps.includes(step)) continue;
    try {
      const payload = await input.handlers[step]();
      await appendRuntimeEvent(input.root, {
        eventType: "closure_step_completed",
        sessionId: input.sessionId,
        turnId: input.turnId,
        preflightId: input.preflightId,
        producer: input.producer,
        idempotencyKey: closureStepKey(input.preflightId, step),
        payload: { step, ...(payload ?? {}) },
      });
      completedNow.push(step);
      receipt = {
        ...receipt,
        status: "closure_pending",
        updatedAt: new Date().toISOString(),
        completedSteps: [...new Set([...receipt.completedSteps, step])],
        failedSteps: receipt.failedSteps.filter((item) => item.step !== step),
      };
      await writeRuntimeSnapshot(
        input.root,
        receiptPath(input.sessionId, input.preflightId),
        receipt,
      );
    } catch (error) {
      const failed = {
        step,
        message: (error as Error).message,
        failedAt: new Date().toISOString(),
      };
      failedNow.push(failed);
      receipt = {
        ...receipt,
        status: "retryable_failed",
        updatedAt: failed.failedAt,
        failedSteps: [
          ...receipt.failedSteps.filter((item) => item.step !== step),
          failed,
        ],
      };
      await appendRuntimeEvent(input.root, {
        eventType: "closure_step_failed",
        sessionId: input.sessionId,
        turnId: input.turnId,
        preflightId: input.preflightId,
        producer: input.producer,
        idempotencyKey: `${closureStepKey(input.preflightId, step)}:failed:${failed.failedAt}`,
        payload: { step, message: failed.message },
      });
      await writeRuntimeSnapshot(
        input.root,
        receiptPath(input.sessionId, input.preflightId),
        receipt,
      );
      break;
    }
  }
  if (closureSteps.every((step) => receipt.completedSteps.includes(step))) {
    receipt = {
      ...receipt,
      status: "closed",
      updatedAt: new Date().toISOString(),
    };
    await appendRuntimeEvent(input.root, {
      eventType: "turn_closed",
      sessionId: input.sessionId,
      turnId: input.turnId,
      preflightId: input.preflightId,
      producer: input.producer,
      idempotencyKey: closureStepKey(input.preflightId, "turn_closed"),
      payload: { completedSteps: receipt.completedSteps },
    });
    await writeRuntimeSnapshot(
      input.root,
      receiptPath(input.sessionId, input.preflightId),
      receipt,
    );
  }
  return { receipt, completedNow, failedNow };
}

export async function listClosureReceipts(root: string) {
  const files = (await listFiles(runtimePath(root, "closures")))
    .filter((file) => file.endsWith(".json"));
  return Promise.all(
    files.map(async (file) =>
      JSON.parse(await readFile(file, "utf8")) as ClosureReceipt
    ),
  );
}

export async function abandonExpiredClosures(root: string, hours = 24) {
  const cutoff = Date.now() - hours * 3_600_000;
  const changed: string[] = [];
  for (const receipt of await listClosureReceipts(root)) {
    if (receipt.status === "closed" || receipt.status === "abandoned") continue;
    if (Date.parse(receipt.openedAt) > cutoff) continue;
    const updated = {
      ...receipt,
      status: "abandoned" as const,
      updatedAt: new Date().toISOString(),
    };
    await writeRuntimeSnapshot(
      root,
      receiptPath(receipt.sessionId, receipt.preflightId),
      updated,
    );
    changed.push(receipt.preflightId);
  }
  return changed;
}

export async function closureDiagnostics(root: string) {
  const receipts = await listClosureReceipts(root);
  const eventWarnings: string[] = [];
  for (const receipt of receipts) {
    const result = await readRuntimeEvents(
      root,
      receipt.sessionId,
      receipt.preflightId,
    );
    eventWarnings.push(...result.warnings.map((warning) =>
      `${receipt.preflightId}: ${warning}`
    ));
  }
  return {
    receipts,
    eventWarnings,
    counts: Object.fromEntries(
      ["opened", "executing", "closure_pending", "closed", "retryable_failed", "abandoned"]
        .map((status) => [
          status,
          receipts.filter((item) => item.status === status).length,
        ]),
    ),
  };
}
