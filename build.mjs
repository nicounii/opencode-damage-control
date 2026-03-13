import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("Building with tsc...");

try {
  execSync("npx tsc", { 
    cwd: __dirname,
    stdio: "inherit"
  });
  console.log("Build complete!");
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}
