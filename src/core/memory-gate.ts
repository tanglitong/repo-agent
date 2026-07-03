import type { ContextItem } from "../types/context.js";

export interface MemoryGateDecision {
  memoryId: string;
  admitted: boolean;
  reason: string;
  warnings: string[];
}

export function evaluateMemory(memory: ContextItem): MemoryGateDecision {
  if (!memory.trusted) {
    return {
      memoryId: memory.id ?? memory.source,
      admitted: false,
      reason: "不可信或候选 memory 不能进入可信上下文。",
      warnings: ["候选内容仅供参考。"],
    };
  }
  if ((memory.finalWeight ?? 0.7) < 0.3) {
    return {
      memoryId: memory.id ?? memory.source,
      admitted: false,
      reason: "Memory 的最终权重低于最低阈值。",
      warnings: [],
    };
  }
  return {
    memoryId: memory.id ?? memory.source,
    admitted: true,
    reason: "已批准且可信的 memory 通过了规则式信任门控。",
    warnings: [],
  };
}
