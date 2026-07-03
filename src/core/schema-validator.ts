import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { exists } from "../utils/fs.js";
import { CliError } from "../errors.js";

type JsonSchema = Record<string, unknown>;

function valueType(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function validateNode(
  value: unknown,
  schema: JsonSchema,
  location: string,
  errors: string[],
): void {
  if ("const" in schema && value !== schema.const) {
    errors.push(`${location} 必须等于 ${JSON.stringify(schema.const)}。`);
  }
  if (
    Array.isArray(schema.enum) &&
    !schema.enum.some((item) => item === value)
  ) {
    errors.push(`${location} 不在允许值范围内。`);
  }
  if (
    typeof schema.type === "string" &&
    (
      schema.type === "integer"
        ? typeof value !== "number" || !Number.isInteger(value)
        : valueType(value) !== schema.type
    )
  ) {
    errors.push(`${location} 必须是 ${schema.type}。`);
    return;
  }
  if (
    typeof value === "number" &&
    typeof schema.minimum === "number" &&
    value < schema.minimum
  ) {
    errors.push(`${location} 不能小于 ${schema.minimum}。`);
  }
  if (
    typeof value === "number" &&
    typeof schema.maximum === "number" &&
    value > schema.maximum
  ) {
    errors.push(`${location} 不能大于 ${schema.maximum}。`);
  }
  if (
    typeof value === "string" &&
    typeof schema.minLength === "number" &&
    value.length < schema.minLength
  ) {
    errors.push(`${location} 长度不能小于 ${schema.minLength}。`);
  }
  if (schema.type === "object" && value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const required = Array.isArray(schema.required)
      ? schema.required.map(String)
      : [];
    for (const key of required) {
      if (!(key in record)) errors.push(`${location}.${key} 是必填字段。`);
    }
    const properties = schema.properties &&
        typeof schema.properties === "object"
      ? schema.properties as Record<string, JsonSchema>
      : {};
    for (const [key, child] of Object.entries(properties)) {
      if (key in record) validateNode(record[key], child, `${location}.${key}`, errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(record)) {
        if (!(key in properties)) errors.push(`${location}.${key} 是未知字段。`);
      }
    } else if (
      schema.additionalProperties &&
      typeof schema.additionalProperties === "object"
    ) {
      for (const [key, childValue] of Object.entries(record)) {
        if (key in properties) continue;
        validateNode(
          childValue,
          schema.additionalProperties as JsonSchema,
          `${location}.${key}`,
          errors,
        );
      }
    }
  }
  if (schema.type === "array" && Array.isArray(value)) {
    if (
      typeof schema.minItems === "number" &&
      value.length < schema.minItems
    ) {
      errors.push(`${location} 至少需要 ${schema.minItems} 项。`);
    }
    if (
      schema.uniqueItems === true &&
      new Set(value.map((item) => JSON.stringify(item))).size !== value.length
    ) {
      errors.push(`${location} 不能包含重复项。`);
    }
    if (schema.items && typeof schema.items === "object") {
      value.forEach((item, index) =>
        validateNode(
          item,
          schema.items as JsonSchema,
          `${location}[${index}]`,
          errors,
        )
      );
    }
  }
}

async function schemaPath(
  root: string,
  schemaName: string,
): Promise<string> {
  const bundleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(bundleDirectory, "schemas", schemaName),
    path.join(bundleDirectory, "..", "schemas", schemaName),
    path.join(root, "repo-agent", "schemas", schemaName),
    path.join(root, "schemas", schemaName),
  ];
  for (const candidate of candidates) {
    if (await exists(candidate)) return candidate;
  }
  throw new CliError(
    "E_CONFIG_SCHEMA",
    `缺少运行时 Schema：${schemaName}`,
  );
}

export async function validateWithSchema(
  root: string,
  schemaName: string,
  value: unknown,
): Promise<void> {
  const file = await schemaPath(root, schemaName);
  const schema = JSON.parse(await readFile(file, "utf8")) as JsonSchema;
  const errors: string[] = [];
  validateNode(value, schema, "$", errors);
  if (errors.length) {
    throw new CliError("E_CONFIG_SCHEMA", errors.join(" "), schemaName);
  }
}
