import path from "node:path";

export const DEFAULT_ASSET_ROOT = ".repo-agent";
export const PRIVATE_ASSET_ROOT = ".repo-agent-private";

export interface AssetRootResolution {
  name: typeof DEFAULT_ASSET_ROOT;
  path: string;
  warnings: string[];
}

export async function resolveAssetRoot(root: string): Promise<AssetRootResolution> {
  return {
    name: DEFAULT_ASSET_ROOT,
    path: path.join(root, DEFAULT_ASSET_ROOT),
    warnings: [],
  };
}

export function defaultAssetPath(root: string, ...segments: string[]): string {
  return path.join(root, DEFAULT_ASSET_ROOT, ...segments);
}

export function relativeAssetPath(
  _assetRoot: AssetRootResolution,
  ...segments: string[]
): string {
  return path.posix.join(DEFAULT_ASSET_ROOT, ...segments);
}

export async function resolveLocalConfigPath(root: string): Promise<string> {
  return path.join(root, ".repo-agent.local.yaml");
}

export function privateAssetPath(root: string, ...segments: string[]): string {
  return path.join(root, PRIVATE_ASSET_ROOT, ...segments);
}
