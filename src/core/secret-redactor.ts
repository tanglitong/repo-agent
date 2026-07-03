const secretKey =
  String.raw`(?:api[_-]?key|apikey|secret|token|password|private[_-]?key|client[_-]?secret|access[_-]?key)`;
const keyedSecret = new RegExp(
  String.raw`\b(${secretKey})\b\s*(?::|=|\bis\b)\s*["']?([^\s"',}]+)`,
  "gi",
);
const bearerSecret =
  /\b(?:authorization\s*[:=]?\s*)?bearer\s+([a-z0-9._~+/-]{8,})/gi;
const jwtSecret = /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\b/g;
const awsAccessKey = /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g;
const githubToken = /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g;
const privateKeyBlock =
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi;
const privateKeyHeader = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i;

export function containsPossibleSecret(input: string): boolean {
  return (
    new RegExp(keyedSecret.source, "i").test(input) ||
    new RegExp(bearerSecret.source, "i").test(input) ||
    new RegExp(jwtSecret.source).test(input) ||
    new RegExp(awsAccessKey.source).test(input) ||
    new RegExp(githubToken.source).test(input) ||
    privateKeyHeader.test(input)
  );
}

export function redactSecrets(input: string): string {
  return input
    .replace(new RegExp(keyedSecret.source, "gi"), (_match, key: string) => `${key}=[REDACTED]`)
    .replace(new RegExp(bearerSecret.source, "gi"), "Bearer [REDACTED]")
    .replace(new RegExp(jwtSecret.source, "g"), "[REDACTED JWT]")
    .replace(new RegExp(awsAccessKey.source, "g"), "[REDACTED ACCESS KEY]")
    .replace(new RegExp(githubToken.source, "g"), "[REDACTED TOKEN]")
    .replace(new RegExp(privateKeyBlock.source, "gi"), "[REDACTED PRIVATE KEY]");
}

export function redactSecretValues(
  value: unknown,
  key = "",
): unknown {
  if (new RegExp(`^${secretKey}$`, "i").test(key)) return "[REDACTED]";
  if (typeof value === "string") return redactSecrets(value);
  if (Array.isArray(value)) return value.map((item) => redactSecretValues(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [
        childKey,
        redactSecretValues(child, childKey),
      ]),
    );
  }
  return value;
}
