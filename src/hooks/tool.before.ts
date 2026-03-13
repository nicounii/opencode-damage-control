import type { Plugin } from "@opencode-ai/plugin";
import { checkBashPatterns } from "../lib/patterns";
import { checkPathProtection } from "../lib/path-check";
import { loadConfig, getDefaultConfig } from "../lib/config";

let configLoaded = false;
let defaultConfig: ReturnType<typeof getDefaultConfig>;
let mergedConfig: ReturnType<typeof getDefaultConfig>;

function getMergedConfig() {
  if (!configLoaded) {
    defaultConfig = getDefaultConfig();
    const userConfig = loadConfig();
    mergedConfig = {
      enabled: userConfig.enabled ?? defaultConfig.enabled,
      logLevel: userConfig.logLevel ?? defaultConfig.logLevel,
      defaultAction: userConfig.defaultAction ?? defaultConfig.defaultAction,
      bashToolPatterns: userConfig.bashToolPatterns?.length
        ? userConfig.bashToolPatterns
        : defaultConfig.bashToolPatterns,
      zeroAccessPaths: userConfig.zeroAccessPaths?.length
        ? userConfig.zeroAccessPaths
        : defaultConfig.zeroAccessPaths,
      readOnlyPaths: userConfig.readOnlyPaths?.length
        ? userConfig.readOnlyPaths
        : defaultConfig.readOnlyPaths,
      noDeletePaths: userConfig.noDeletePaths?.length
        ? userConfig.noDeletePaths
        : defaultConfig.noDeletePaths,
    };
    configLoaded = true;
  }
  return mergedConfig;
}

export const DamageControl: Plugin = async () => {
  const cfg = getMergedConfig();

  if (!cfg.enabled) {
    return {};
  }

  return {
    "tool.execute.before": async (input: any, output: any) => {
      const toolName = input.tool;
      const toolArgs = output.args || {};

      if (toolName === "bash") {
        const command = toolArgs.command;
        if (!command) {
          return;
        }

        const patternResult = checkBashPatterns(command, cfg.bashToolPatterns);

        if (patternResult.matched) {
          const message = formatBlockMessage(command, patternResult.reason);
          if (cfg.logLevel === "debug") {
            console.error(`[damage-control] ${message}`);
          }
          throw new Error(message);
        }

        const pathResult = checkPathProtection(
          command,
          command,
          cfg.zeroAccessPaths,
          cfg.readOnlyPaths,
          cfg.noDeletePaths,
          toolName
        );

        if (pathResult.blocked) {
          const message = formatBlockMessage(command, pathResult.reason);
          if (cfg.logLevel === "debug") {
            console.error(`[damage-control] ${message}`);
          }
          throw new Error(message);
        }

        const extractedPaths = extractPathsFromCommand(command);
        for (const filePath of extractedPaths) {
          const pathCheck = checkPathProtection(
            command,
            filePath,
            cfg.zeroAccessPaths,
            cfg.readOnlyPaths,
            cfg.noDeletePaths,
            toolName
          );
          if (pathCheck.blocked) {
            const message = formatBlockMessage(command, pathCheck.reason);
            if (cfg.logLevel === "debug") {
              console.error(`[damage-control] ${message}`);
            }
            throw new Error(message);
          }
        }
      }

      if (toolName === "write" || toolName === "edit") {
        const filePath = toolArgs.filePath;
        if (!filePath) {
          return;
        }

        const pathResult = checkPathProtection(
          "",
          filePath,
          cfg.zeroAccessPaths,
          cfg.readOnlyPaths,
          cfg.noDeletePaths,
          toolName
        );

        if (pathResult.blocked) {
          const message = formatPathBlockMessage(filePath, pathResult.reason);
          if (cfg.logLevel === "debug") {
            console.error(`[damage-control] ${message}`);
          }
          throw new Error(message);
        }
      }
    },
  };
};

function formatBlockMessage(command: string, reason?: string): string {
  const truncated = command.length > 80 ? command.slice(0, 80) + "..." : command;
  return `🚫 DAMAGE CONTROL: Blocked dangerous command

Reason: ${reason || "Blocked by pattern"}
Command: ${truncated}`;
}

function formatPathBlockMessage(filePath: string, reason?: string): string {
  return `🚫 DAMAGE CONTROL: Blocked operation on protected path

Reason: ${reason || "Path is protected"}
Path: ${filePath}`;
}

function extractPathsFromCommand(command: string): string[] {
  const paths: string[] = [];
  
  const pathRegex = /(?:^|\s)([~./][^\s]*|[a-zA-Z]:\\[^\s]+|[/][^\s]+)/g;
  let match;
  
  while ((match = pathRegex.exec(command)) !== null) {
    const path = match[1];
    if (path && !path.includes('*')) {
      paths.push(path);
    }
  }
  
  return paths;
}

export default DamageControl;
