import * as esbuild from "esbuild";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: [resolve(__dirname, "src/index.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: resolve(__dirname, "dist/index.js"),
  format: "esm",
  sourcemap: true,
  external: ["@opencode-ai/plugin"],
});

console.log("Build complete!");
