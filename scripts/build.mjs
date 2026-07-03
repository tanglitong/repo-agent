import { build } from "esbuild";
import { chmod, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await build({
  entryPoints: ["src/cli.ts"],
  outfile: "dist/repo-agent.bundle.js",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  banner: {
    js: `#!/usr/bin/env node
import { createRequire as __repoAgentCreateRequire } from "node:module";
const require = __repoAgentCreateRequire(import.meta.url);`,
  },
  legalComments: "eof",
  sourcemap: false,
});

if (process.platform !== "win32") {
  await chmod("dist/repo-agent.bundle.js", 0o755);
}
console.log("Built dist/repo-agent.bundle.js");
