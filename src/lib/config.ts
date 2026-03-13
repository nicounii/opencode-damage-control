import { readFileSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import type { DamageControlConfig } from "./types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_CONFIG: DamageControlConfig = {
  enabled: true,
  logLevel: "warn",
  defaultAction: "block",
  bashToolPatterns: [],
  zeroAccessPaths: [],
  readOnlyPaths: [],
  noDeletePaths: [],
};

export function getConfigPath(): string | null {
  const candidates = [
    process.env.OPENCODE_PROJECT_DIR
      ? join(process.env.OPENCODE_PROJECT_DIR, ".opencode", "damage-control.json")
      : null,
    join(process.cwd(), ".opencode", "damage-control.json"),
    join(process.env.HOME || "", ".config", "opencode", "damage-control.json"),
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    if (path && existsSync(path)) {
      return path;
    }
  }

  return null;
}

export function loadConfig(): DamageControlConfig {
  const configPath = getConfigPath();

  if (!configPath) {
    return DEFAULT_CONFIG;
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(content);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
  } catch (error) {
    console.error(`[damage-control] Failed to load config from ${configPath}:`, error);
    return DEFAULT_CONFIG;
  }
}

export function getDefaultConfig(): DamageControlConfig {
  const defaultPath = resolve(__dirname, "../config/default.json");

  if (existsSync(defaultPath)) {
    try {
      const content = readFileSync(defaultPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  return DEFAULT_CONFIG;
}
