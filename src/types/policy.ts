import type { RiskLevel } from "./context.js";

export interface PolicyCheckResult {
  allowed: boolean;
  requiresReview: boolean;
  blocked: boolean;
  reasons: string[];
  matchedRules: string[];
}

export type CommitAction =
  | "keep_local"
  | "direct_commit"
  | "create_review_request"
  | "create_patch";

export interface CommitOptions {
  allowedActions: CommitAction[];
  recommendedAction: CommitAction;
  riskLevel: RiskLevel;
  reasons: string[];
  changedFiles: string[];
  requiredReviewLenses: string[];
  options: Array<{
    action: CommitAction;
    available: boolean;
    reason: string;
  }>;
}
