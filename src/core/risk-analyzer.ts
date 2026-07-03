import type { RiskLevel, RiskResult } from "../types/context.js";
import { checkPolicy } from "./policy-engine.js";

const highRiskTerms = [
  "auth",
  "oauth",
  "billing",
  "permission",
  "migration",
  "ci/cd",
  "deployment",
  "security",
];
const highRiskPaths = [
  "auth",
  "billing",
  "permission",
  "database/migrations",
  ".github/workflows",
  "infra/",
  "terraform/",
  ".repo-agent/policies",
  ".repo-agent/memories",
  ".repo-agent/skills/approved",
  ".repo-agent/fix_patterns/approved",
  ".openspec",
  "docs/adr",
];

export async function analyzeRisk(
  root: string,
  input: {
    task?: string;
    paths?: string[];
    command?: string;
    executionEnvironment?: Record<string, unknown>;
  },
): Promise<RiskResult> {
  const task = (input.task ?? "").toLowerCase();
  const paths = input.paths ?? [];
  const policy = await checkPolicy(root, { paths, command: input.command });
  const reasons = [...policy.reasons];
  const matchedPaths = paths.filter((file) =>
    highRiskPaths.some((pattern) => file.toLowerCase().includes(pattern)),
  );
  const matchedTerms = highRiskTerms.filter((term) => task.includes(term));
  let level: RiskLevel = "medium";

  if (policy.blocked) level = "blocked";
  else if (matchedPaths.length || matchedTerms.length) {
    level = "high";
    if (matchedTerms.length) reasons.push(`任务命中高风险关键词：${matchedTerms.join("、")}。`);
    if (matchedPaths.length) reasons.push("变更文件包含高风险路径。");
  } else if (
    paths.length > 0 &&
    paths.every((file) => /(^|\/)(readme|docs?\/)|\.md$/i.test(file))
  ) {
    level = "low";
    reasons.push("全部变更文件均为文档。");
  } else if (!task && !paths.length) {
    level = "low";
    reasons.push("未提供任务描述或变更文件。");
  }
  if (
    input.executionEnvironment?.sandboxed === false &&
    input.command &&
    policy.blocked
  ) {
    reasons.push("在无沙箱环境中请求了危险命令。");
  }
  if (input.executionEnvironment?.networkAccess === "unrestricted") {
    reasons.push("执行环境允许不受限制的网络访问。");
    if (level === "low" || level === "medium") level = "high";
  }

  return {
    level,
    reasons: [...new Set(reasons)],
    matchedPaths,
    requiresResearch: level === "high" || level === "blocked",
    requiredVerifications:
      level === "high" || level === "blocked"
        ? ["审核相关项目规范和策略。", "运行负向测试和回归测试。"]
        : [],
    requiredActions:
      level === "high" || level === "blocked"
        ? ["write_plan", "collect_evidence", "run_tests", "create_review_request"]
        : level === "medium"
          ? ["run_tests", "request_confirmation"]
          : ["run_tests"],
  };
}
