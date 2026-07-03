import { createInterface } from "node:readline";
import { invokeTool } from "./tools.js";
import { VERSION } from "../index.js";
import { CliError } from "../errors.js";
import {
  getRepoAgentTool,
  REPO_AGENT_TOOLS,
} from "../core/tool-manifest.js";

function validateToolInput(name: string, args: unknown): Record<string, unknown> {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new CliError("E_INVALID_TOOL_INPUT", "工具参数必须是对象。");
  }
  const value = args as Record<string, unknown>;
  const schema = getRepoAgentTool(name)?.inputSchema;
  if (!schema) throw new CliError("E_UNKNOWN_COMMAND", `未知工具：${name}`);
  const properties = schema.properties as Record<string, { type?: string }> | undefined;
  const allowed = new Set(Object.keys(properties ?? {}));
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) {
    throw new CliError(
      "E_INVALID_TOOL_INPUT",
      `工具 ${name} 包含未知参数：${unknown.join(", ")}`,
    );
  }
  for (const required of (schema.required as string[] | undefined) ?? []) {
    if (!(required in value) || value[required] === "") {
      throw new CliError("E_INVALID_TOOL_INPUT", `工具 ${name} 缺少参数：${required}`);
    }
  }
  for (const [key, item] of Object.entries(value)) {
    const expected = properties?.[key]?.type;
    if (expected && expected !== typeof item && !(expected === "array" && Array.isArray(item))) {
      throw new CliError("E_INVALID_TOOL_INPUT", `工具 ${name} 参数 ${key} 类型错误。`);
    }
  }
  return value;
}

interface JsonRpcRequest {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

function errorResponse(
  id: unknown,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

async function handleRequest(
  root: string,
  value: unknown,
): Promise<JsonRpcResponse | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return errorResponse(null, -32600, "无效的 JSON-RPC 请求。");
  }
  const request = value as JsonRpcRequest;
  const isNotification = request.id === undefined;
  if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return isNotification
      ? null
      : errorResponse(request.id, -32600, "无效的 JSON-RPC 请求。");
  }
  if (isNotification) {
    return null;
  }
  const params = request.params && typeof request.params === "object"
    ? request.params as Record<string, unknown>
    : {};
  try {
    let result: unknown;
    if (request.method === "initialize") {
      const requestedVersion = typeof params.protocolVersion === "string"
        ? params.protocolVersion
        : "2025-03-26";
      result = {
        protocolVersion:
          requestedVersion === "2025-03-26"
            ? requestedVersion
            : "2025-03-26",
        capabilities: { tools: {} },
        serverInfo: { name: "repo-agent", version: VERSION },
        instructions: "开始任务时先调用 get_context_pack，并遵循返回的 Policy、Memory、Skill 和风险要求。任务结束时由 Stop Hook 自动完成提交建议、脱敏审计、学习分流和重复错误分析。不得直接修改 approved 资产；新经验只能生成 candidate。",
      };
    } else if (request.method === "ping") {
      result = {};
    } else if (request.method === "tools/list") {
      result = {
        tools: REPO_AGENT_TOOLS.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: tool.annotations,
        })),
      };
    } else if (request.method === "tools/call") {
      const name = String(params.name ?? "");
      const args = validateToolInput(name, params.arguments ?? {});
      const toolValue = await invokeTool(root, name, args);
      result = {
        content: [{ type: "text", text: JSON.stringify(toolValue) }],
        structuredContent: toolValue,
        isError: false,
      };
    } else {
      return errorResponse(
        request.id,
        -32601,
        `未找到 method：${request.method}`,
      );
    }
    return { jsonrpc: "2.0", id: request.id, result };
  } catch (error) {
    return errorResponse(
      request.id,
      error instanceof CliError ? -32602 : -32603,
      error instanceof CliError
        ? `${error.code}: ${error.message}`
        : (error as Error).message,
    );
  }
}

export async function runMcpServer(root: string): Promise<void> {
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      process.stdout.write(
        `${JSON.stringify(errorResponse(null, -32700, `JSON 解析失败：${(error as Error).message}`))}\n`,
      );
      continue;
    }
    const values = Array.isArray(parsed) ? parsed : [parsed];
    if (values.length === 0) {
      process.stdout.write(
        `${JSON.stringify(errorResponse(null, -32600, "JSON-RPC 批请求不能为空。"))}\n`,
      );
      continue;
    }
    const responses = (
      await Promise.all(values.map((value) => handleRequest(root, value)))
    ).filter((response): response is JsonRpcResponse => response !== null);
    if (!responses.length) continue;
    process.stdout.write(
      `${JSON.stringify(Array.isArray(parsed) ? responses : responses[0])}\n`,
    );
  }
}
