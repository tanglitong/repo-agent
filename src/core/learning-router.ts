export type LearningClassification =
  | "memory_candidate"
  | "skill_candidate"
  | "fix_pattern_candidate"
  | "spec_candidate"
  | "adr_candidate"
  | "policy_candidate"
  | "trace_only";

export function classifyLearning(task: string, observation: string): {
  classification: LearningClassification;
  reason: string;
  writableAsCandidate: boolean;
} {
  const text = `${task} ${observation}`.toLowerCase();
  if (/(business rule|requirement|业务规则|需求规范)/.test(text)) {
    return { classification: "spec_candidate", reason: "该观察描述了正式业务规则。", writableAsCandidate: false };
  }
  if (/(architecture|architectural decision|架构|技术选型)/.test(text)) {
    return { classification: "adr_candidate", reason: "该观察描述了架构决策。", writableAsCandidate: false };
  }
  if (/(security boundary|must not|forbidden|安全边界|禁止)/.test(text)) {
    return { classification: "policy_candidate", reason: "该观察描述了策略或安全边界。", writableAsCandidate: false };
  }
  if (/(first|then|finally|steps?|workflow|process|先.*再|步骤|流程)/.test(text)) {
    return { classification: "skill_candidate", reason: "该观察描述了可重复执行的工作流程。", writableAsCandidate: true };
  }
  if (/(error|exception|failure|failed|bug|错误|异常|失败).*(fix|resolve|repair|修复|解决)/.test(text)) {
    return { classification: "fix_pattern_candidate", reason: "该观察描述了错误模式与修复方法的映射。", writableAsCandidate: true };
  }
  if (/(must cover|test mapping|convention|gotcha|踩坑|必须覆盖|约定|测试映射)/.test(text)) {
    return { classification: "memory_candidate", reason: "该观察记录了可复用的项目知识。", writableAsCandidate: true };
  }
  return { classification: "trace_only", reason: "未匹配到适合长期沉淀的学习类别。", writableAsCandidate: false };
}
