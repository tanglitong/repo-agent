export interface NormalizedError {
  key: string;
  title: string;
  rawSignals: string[];
  keywords: string[];
  scopePaths: string[];
  confidence: number;
}

export function normalizeError(input: string): NormalizedError | null {
  const normalized = input
    .toLowerCase()
    .replace(/\d{4}-\d{2}-\d{2}t[\d:.z+-]+/g, " ")
    .replace(/(?:^|\s)[\w./-]+:\d+(?::\d+)?/g, " ")
    .replace(/\b[a-f0-9]{7,64}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  if (
    /invalid oauth state|oauth.*state mismatch|csrf state validation failed|callback state mismatch|state mismatch/.test(
      normalized,
    )
  ) {
    return {
      key: "error.auth.oauth-invalid-state",
      title: "OAuth state 无效",
      rawSignals: [input],
      keywords: ["oauth", "state", "invalid", "mismatch"],
      scopePaths: ["src/auth/**", "tests/auth/**"],
      confidence: 0.82,
    };
  }
  if (!/error|exception|failed|failure|bug|错误|异常|失败/.test(normalized)) return null;
  const keywords = normalized.split(/[^a-z0-9]+/).filter((token) => token.length > 2).slice(0, 5);
  const slug = keywords.join("-") || "unknown";
  return {
    key: `error.general.${slug}`,
    title: keywords.join(" ") || "未知错误",
    rawSignals: [input],
    keywords,
    scopePaths: [],
    confidence: 0.55,
  };
}
