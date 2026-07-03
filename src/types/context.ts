import type { ProjectProfile } from "./project.js";

export type RiskLevel = "low" | "medium" | "high" | "blocked";

export interface RepoCapabilities {
  git: boolean;
  writeAccess: boolean;
  testCommands: boolean;
  packageManager: boolean;
  openspec: boolean;
  adr: boolean;
  node: boolean;
  mcpCompatible: boolean;
}

export interface ContextItem {
  id?: string;
  source: string;
  trusted: boolean;
  content: string;
  baseWeight?: number;
  finalWeight?: number;
  relevanceScore?: number;
  retrievalRank?: number;
  qualityScore?: number;
  freshnessScore?: number;
  scopeMatch?: number;
  diversityScore?: number;
  reason?: string;
}

export interface RiskResult {
  level: RiskLevel;
  reasons: string[];
  matchedPaths: string[];
  requiresResearch: boolean;
  requiredVerifications: string[];
  requiredActions: string[];
}

export interface ContextBudget {
  maxChars: number;
  estimatedChars: number;
  maxTokensEstimate?: number;
  estimatedTokens: number;
  truncated: boolean;
  exceeded: boolean;
  truncatedItems: string[];
}

export interface RecurringErrorRecommendation {
  id: string;
  normalizedErrorKey: string;
  occurrences: number;
  summary: string;
  affectedPaths: string[];
  existingFixPatternId?: string;
  suggestedSteps: string[];
  recommendedTests: string[];
  suggestedArtifacts: string[];
  confidence: number;
  trusted: false;
  source: string;
}

export interface ContextPack {
  task: string;
  projectProfile: ProjectProfile;
  capabilities: RepoCapabilities;
  mandatoryInstructions: ContextItem[];
  trustedAssets: ContextItem[];
  untrustedAdvisories: ContextItem[];
  relevantInstructions: ContextItem[];
  relevantMemories: ContextItem[];
  relevantSkills: ContextItem[];
  recommendedFixPatterns: ContextItem[];
  candidateSuggestions: ContextItem[];
  recurringErrorRecommendations: RecurringErrorRecommendation[];
  contextBudget: ContextBudget;
  executionEnvironment?: Record<string, unknown>;
  recommendedWorkflow?: string;
  recommendedTests: string[];
  risk: RiskResult;
  policyNotes: string[];
  conflictNotes: unknown[];
  warnings: string[];
  nextSteps: string[];
}
