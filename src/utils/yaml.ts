import { readFile } from "node:fs/promises";
import { parse, stringify } from "yaml";
import { CliError } from "../errors.js";

export async function readYaml<T>(filePath: string): Promise<T> {
  try {
    return parse(await readFile(filePath, "utf8")) as T;
  } catch (error) {
    throw new CliError(
      "E_CONFIG_PARSE",
      `解析 ${filePath} 失败：${(error as Error).message}`,
      filePath,
    );
  }
}

export function stringifyYaml(value: unknown): string {
  return stringify(value, { lineWidth: 0 });
}
