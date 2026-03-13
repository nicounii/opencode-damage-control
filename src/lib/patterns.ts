import type { BashToolPattern, PatternMatchResult } from "./types";

export function matchPattern(
  command: string,
  pattern: string
): boolean {
  try {
    const regex = new RegExp(pattern, "i");
    return regex.test(command);
  } catch {
    return false;
  }
}

export function checkBashPatterns(
  command: string,
  patterns: BashToolPattern[]
): PatternMatchResult {
  for (const item of patterns) {
    const { pattern, reason, action } = item;

    if (matchPattern(command, pattern)) {
      return {
        matched: true,
        reason,
        action: action || "block",
      };
    }
  }

  return { matched: false };
}

export function createPatternTester(patterns: BashToolPattern[]) {
  return (command: string): PatternMatchResult => {
    return checkBashPatterns(command, patterns);
  };
}
