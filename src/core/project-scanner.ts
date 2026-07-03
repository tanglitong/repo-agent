import path from "node:path";
import { exists, readJson } from "../utils/fs.js";
import type { ProjectProfile } from "../types/project.js";

interface PackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
}

const unique = <T>(items: T[]): T[] => [...new Set(items)];

export async function scanProject(root: string): Promise<ProjectProfile> {
  const packagePath = path.join(root, "package.json");
  const packageJson = (await readJson<PackageJson>(packagePath)) ?? {};
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const language: string[] = [];
  const framework: string[] = [];

  if (await exists(packagePath)) language.push("JavaScript");
  if (await exists(path.join(root, "tsconfig.json"))) language.push("TypeScript");
  if (
    (await exists(path.join(root, "pyproject.toml"))) ||
    (await exists(path.join(root, "requirements.txt")))
  ) language.push("Python");
  if (await exists(path.join(root, "go.mod"))) language.push("Go");
  if (
    (await exists(path.join(root, "pom.xml"))) ||
    (await exists(path.join(root, "build.gradle"))) ||
    (await exists(path.join(root, "build.gradle.kts")))
  ) language.push("Java");

  const frameworkMap: Record<string, string> = {
    next: "Next.js",
    react: "React",
    vue: "Vue",
    angular: "Angular",
    express: "Express",
    fastify: "Fastify",
    nestjs: "NestJS",
    "@nestjs/core": "NestJS",
    vitest: "Vitest",
    jest: "Jest",
  };
  for (const [dependency, name] of Object.entries(frameworkMap)) {
    if (dependency in dependencies) framework.push(name);
  }

  let packageManager: string | undefined;
  if (await exists(path.join(root, "pnpm-lock.yaml"))) packageManager = "pnpm";
  else if (await exists(path.join(root, "yarn.lock"))) packageManager = "yarn";
  else if (await exists(path.join(root, "package-lock.json"))) packageManager = "npm";
  else if (packageJson.packageManager) packageManager = packageJson.packageManager.split("@")[0];

  const scripts = packageJson.scripts ?? {};
  const commandPrefix = packageManager ?? "npm";
  const run = (name: string): string =>
    commandPrefix === "npm" ? `npm run ${name}` : `${commandPrefix} ${name}`;
  const firstScript = (...names: string[]): string | undefined => {
    const name = names.find((candidate) => scripts[candidate]);
    return name ? run(name) : undefined;
  };

  const hasOpenSpec = await exists(path.join(root, ".openspec"));
  const hasAdr = await exists(path.join(root, "docs", "adr"));
  const riskPaths = [
    "src/auth/**",
    "src/billing/**",
    "database/migrations/**",
    ".github/workflows/**",
    "infra/**",
    "terraform/**",
  ];

  return {
    root,
    language: unique(language),
    framework: unique(framework),
    packageManager,
    testCommands: {
      unit: firstScript("test", "test:unit"),
      typecheck: firstScript("typecheck", "type-check"),
      lint: firstScript("lint"),
      specValidate: hasOpenSpec ? "openspec validate" : undefined,
    },
    process: {
      hasOpenSpec,
      openSpecRoot: hasOpenSpec ? ".openspec" : undefined,
      hasAdr,
      adrRoot: hasAdr ? "docs/adr" : undefined,
      hasAgents: await exists(path.join(root, "AGENTS.md")),
      hasSecurity: await exists(path.join(root, "SECURITY.md")),
      hasCiWorkflows: await exists(path.join(root, ".github", "workflows")),
    },
    riskPaths,
  };
}
