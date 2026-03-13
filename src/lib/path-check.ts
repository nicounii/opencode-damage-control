import { expandHomeDir, isGlobPattern, globToRegex } from "./utils";
import type { PathCheckResult, OperationType } from "./types";

const PATH_OPERATION_PATTERNS: Record<OperationType, RegExp[]> = {
  write: [
    /^\s*>/,
    /\btee\s+(?!.*-a).*/,
    /\becho\s+.*>/,
  ],
  append: [
    /^\s*>>/,
    /\btee\s+-a\s+.*/,
    /\btee\s+.*-a.*/,
    /\becho\s+.*>>/,
  ],
  edit: [
    /\bsed\s+-i.*/,
    /\bperl\s+-[^\s]*i.*/,
    /\bawk\s+-i\s+inplace.*/,
  ],
  move: [
    /\bmv\s+.*\s+.*/,
  ],
  copy: [
    /\bcp\s+.*\s+.*/,
  ],
  delete: [
    /\brm\s+.*/,
    /\bunlink\s+.*/,
    /\brmdir\s+.*/,
    /\bshred\s+.*/,
  ],
  chmod: [
    /\bchmod\s+.*/,
  ],
  chown: [
    /\bchown\s+.*/,
    /\bchgrp\s+.*/,
  ],
  read: [
    /\bcat\s+.*/,
    /\bhead\s+.*/,
    /\btail\s+.*/,
    /\bless\s+.*/,
    /\bmore\s+.*/,
    /\bgrep\s+.*/,
    /\bacat\s+.*/,
  ],
};

function getOperationsFromTool(toolName?: string): OperationType[] {
  if (!toolName) return [];
  
  const toolToOps: Record<string, OperationType[]> = {
    write: ["write"],
    edit: ["edit"],
    read: ["read"],
    bash: ["write", "append", "edit", "move", "copy", "delete", "chmod", "chown", "read"],
  };
  
  return toolToOps[toolName.toLowerCase()] || [];
}

function matchesOperation(command: string, operation: OperationType, toolName?: string): boolean {
  if (toolName && !command) {
    const ops = getOperationsFromTool(toolName);
    return ops.includes(operation);
  }
  
  const patterns = PATH_OPERATION_PATTERNS[operation];
  return patterns.some((pattern) => pattern.test(command));
}

export function checkPathProtection(
  command: string,
  filePath: string,
  zeroAccessPaths: string[],
  readOnlyPaths: string[],
  noDeletePaths: string[],
  toolName?: string
): PathCheckResult {
  const expandedPath = expandHomeDir(filePath);

  for (const protectedPath of zeroAccessPaths) {
    const expanded = expandHomeDir(protectedPath);

    if (isGlobPattern(protectedPath)) {
      const regex = globToRegex(protectedPath);
      if (regex.test(expandedPath) || regex.test(filePath)) {
        return {
          blocked: true,
          reason: `Blocked: zero-access pattern ${protectedPath} (no operations allowed)`,
          pathType: "zeroAccess",
        };
      }
    } else if (
      expandedPath.startsWith(expanded) ||
      filePath.startsWith(protectedPath)
    ) {
      return {
        blocked: true,
        reason: `Blocked: zero-access path ${protectedPath} (no operations allowed)`,
        pathType: "zeroAccess",
      };
    }
  }

  for (const protectedPath of readOnlyPaths) {
    const expanded = expandHomeDir(protectedPath);

    if (isGlobPattern(protectedPath)) {
      const regex = globToRegex(protectedPath);
      if (regex.test(expandedPath) || regex.test(filePath)) {
        const operations: OperationType[] = [
          "write",
          "append",
          "edit",
          "move",
          "copy",
          "delete",
          "chmod",
          "chown",
        ];

        for (const op of operations) {
          if (matchesOperation(command, op, toolName)) {
            return {
              blocked: true,
              reason: `Blocked: ${op} operation on read-only path ${protectedPath}`,
              pathType: "readOnly",
            };
          }
        }
      }
    } else if (
      expandedPath.startsWith(expanded) ||
      filePath.startsWith(protectedPath)
    ) {
      const operations: OperationType[] = [
        "write",
        "append",
        "edit",
        "move",
        "copy",
        "delete",
        "chmod",
        "chown",
      ];

      for (const op of operations) {
        if (matchesOperation(command, op, toolName)) {
          return {
            blocked: true,
            reason: `Blocked: ${op} operation on read-only path ${protectedPath}`,
            pathType: "readOnly",
          };
        }
      }
    }
  }

  for (const protectedPath of noDeletePaths) {
    const expanded = expandHomeDir(protectedPath);

    if (isGlobPattern(protectedPath)) {
      const regex = globToRegex(protectedPath);
      if (regex.test(expandedPath) || regex.test(filePath)) {
        if (matchesOperation(command, "delete", toolName)) {
          return {
            blocked: true,
            reason: `Blocked: delete operation on no-delete path ${protectedPath}`,
            pathType: "noDelete",
          };
        }
      }
    } else if (
      expandedPath.startsWith(expanded) ||
      filePath.startsWith(protectedPath)
    ) {
      if (matchesOperation(command, "delete", toolName)) {
        return {
          blocked: true,
          reason: `Blocked: delete operation on no-delete path ${protectedPath}`,
          pathType: "noDelete",
        };
      }
    }
  }

  return { blocked: false };
}
