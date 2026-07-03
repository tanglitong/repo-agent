import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

export async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function isWritable(directory: string): Promise<boolean> {
  try {
    await access(directory, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return undefined;
  }
}

export async function writeFileExclusive(
  filePath: string,
  content: string | Uint8Array,
): Promise<"created" | "skipped"> {
  await mkdir(path.dirname(filePath), { recursive: true });
  try {
    await writeFile(filePath, content, { encoding: "utf8", flag: "wx" });
    return "created";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return "skipped";
    throw error;
  }
}

export async function listFiles(directory: string): Promise<string[]> {
  if (!(await exists(directory))) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(target) : [target];
    }),
  );
  return files.flat().sort();
}
