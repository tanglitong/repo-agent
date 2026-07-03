import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { zipSync } from "fflate";
import { parse } from "yaml";

const releaseRoot = path.resolve("release");
const stageRoot = path.join(releaseRoot, "stage");
const packageRoot = path.join(stageRoot, "repo-agent");
const output = path.join(releaseRoot, "repo-agent-node-offline.zip");
const synchronizeInstalled = process.argv.includes("--sync-installed");
const sourcePackage = JSON.parse(await readFile("package.json", "utf8"));
const version = sourcePackage.version;

await rm(stageRoot, { recursive: true, force: true });
await rm(output, { force: true });
await mkdir(packageRoot, { recursive: true });

await cp("dist/repo-agent.bundle.js", path.join(packageRoot, "repo-agent.bundle.js"));
for (const directory of ["templates", "schemas", "builtin"]) {
  await cp(directory, path.join(packageRoot, directory), { recursive: true });
}
for (const directory of ["agents", "scripts", "references"]) {
  await cp(
    path.join("packaging", "repo-agent", directory),
    path.join(packageRoot, directory),
    { recursive: true },
  );
}
await cp("packaging/repo-agent/SKILL.md", path.join(packageRoot, "SKILL.md"));
await cp("packaging/README.md", path.join(packageRoot, "README.md"));
await cp("LICENSE", path.join(packageRoot, "LICENSE"));
await cp(
  "THIRD_PARTY_NOTICES",
  path.join(packageRoot, "THIRD_PARTY_NOTICES"),
);
await cp(
  path.join("docs", "zh-CN", "usage.md"),
  path.join(packageRoot, "使用文档.md"),
);
await writeFile(path.join(packageRoot, "VERSION"), `${version}\n`);
await writeFile(
  path.join(packageRoot, "package.json"),
  `${JSON.stringify({
    name: "repo-agent-offline",
    private: true,
    license: sourcePackage.license,
    type: "module",
  }, null, 2)}\n`,
);

async function filesBelow(directory, base = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return filesBelow(target, base);
      return [path.relative(base, target).replaceAll("\\", "/")];
    }),
  );
  return nested.flat().sort();
}

const migrations = [];
const migrationRoot = path.join(packageRoot, "builtin", "migrations");
await mkdir(migrationRoot, { recursive: true });
for (const relativePath of (await filesBelow(migrationRoot))) {
  if (!/\.ya?ml$/i.test(relativePath)) continue;
  const packagePath = `builtin/migrations/${relativePath}`;
  const content = await readFile(path.join(packageRoot, packagePath));
  const migration = parse(content.toString("utf8"));
  migrations.push({
    id: migration.id,
    from: migration.from,
    to: migration.to,
    file: packagePath,
    sha256: createHash("sha256").update(content).digest("hex"),
  });
}
await writeFile(
  path.join(packageRoot, "RELEASE-MANIFEST.json"),
  `${JSON.stringify({
    package_format: 1,
    upgrade_protocol: 1,
    tool_version: version,
    minimum_upgrader_version: "1.0.0",
    asset_versions: {
      template: version,
      schema: version,
      builtin_policy: version,
      builtin_skill: version,
      builtin_fix_pattern: version,
    },
    migrations,
  }, null, 2)}\n`,
);

const checksumTargets = (await filesBelow(packageRoot)).filter(
  (relativePath) => relativePath !== "CHECKSUMS.txt",
);
const checksums = [];
for (const relativePath of checksumTargets) {
  const content = await readFile(path.join(packageRoot, relativePath));
  checksums.push(`${createHash("sha256").update(content).digest("hex")}  ${relativePath}`);
}
await writeFile(path.join(packageRoot, "CHECKSUMS.txt"), `${checksums.join("\n")}\n`);

const zipEntries = {};
for (const relativePath of await filesBelow(packageRoot)) {
  zipEntries[`repo-agent/${relativePath}`] = await readFile(
    path.join(packageRoot, relativePath),
  );
}
await writeFile(output, zipSync(zipEntries, { level: 9 }));
if (synchronizeInstalled) {
  await rm(path.resolve("repo-agent"), { recursive: true, force: true });
  await cp(packageRoot, path.resolve("repo-agent"), { recursive: true });
}
await rm(stageRoot, { recursive: true, force: true });
console.log(
  synchronizeInstalled
    ? `Created ${output} and synchronized repo-agent/`
    : `Created ${output}`,
);
