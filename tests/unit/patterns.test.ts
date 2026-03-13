import { describe, it, expect } from "vitest";
import { matchPattern, checkBashPatterns } from "../../src/lib/patterns";
import type { BashToolPattern } from "../../src/lib/types";

describe("Pattern Matching", () => {
  describe("matchPattern", () => {
    it("should match rm -rf pattern", () => {
      expect(matchPattern("rm -rf /tmp", "\\brm\\s+-[rRf]")).toBe(true);
    });

    it("should match rm -r pattern", () => {
      expect(matchPattern("rm -r folder/", "\\brm\\s+-[rRf]")).toBe(true);
    });

    it("should match rm -R pattern", () => {
      expect(matchPattern("rm -R docs/", "\\brm\\s+-[rRf]")).toBe(true);
    });

    it("should match rm -f pattern", () => {
      expect(matchPattern("rm -f file.txt", "\\brm\\s+-[rRf]")).toBe(true);
    });

    it("should not match safe rm command", () => {
      expect(matchPattern("rm file.txt", "\\brm\\s+-[rRf]")).toBe(false);
    });

    it("should match git reset --hard", () => {
      expect(
        matchPattern("git reset --hard HEAD~1", "\\bgit\\s+reset\\s+--hard\\b")
      ).toBe(true);
    });

    it("should match git push -f", () => {
      expect(
        matchPattern("git push -f origin main", "\\bgit\\s+push\\s+(-[^\\s]*)*-f\\b")
      ).toBe(true);
    });

    it("should match chmod 777", () => {
      expect(
        matchPattern("chmod 777 /path", "\\bchmod\\s+(-[^\\s]+\\s+)*777\\b")
      ).toBe(true);
    });

    it("should match sudo rm", () => {
      expect(matchPattern("sudo rm -rf /", "\\bsudo\\s+rm\\b")).toBe(true);
    });

    it("should match terraform destroy", () => {
      expect(
        matchPattern("terraform destroy", "\\bterraform\\s+destroy\\b")
      ).toBe(true);
    });

    it("should match redis FLUSHALL", () => {
      expect(
        matchPattern("redis-cli FLUSHALL", "\\bredis-cli\\s+FLUSHALL")
      ).toBe(true);
    });

    it("should match DELETE without WHERE", () => {
      expect(
        matchPattern("DELETE FROM users;", "DELETE\\s+FROM\\s+\\w+\\s*;")
      ).toBe(true);
    });

    it("should be case insensitive", () => {
      expect(matchPattern("RM -RF /tmp", "\\brm\\s+-[rRf]")).toBe(true);
    });
  });

  describe("checkBashPatterns", () => {
    const testPatterns: BashToolPattern[] = [
      { pattern: "\\brm\\s+-[rRf]", reason: "rm with recursive flag", action: "block" },
      { pattern: "\\bgit\\s+reset\\s+--hard\\b", reason: "git reset --hard", action: "block" },
      { pattern: "\\bchmod\\s+(-[^\\s]+\\s+)*777\\b", reason: "chmod 777", action: "block" },
    ];

    it("should return block for matched pattern", () => {
      const result = checkBashPatterns("rm -rf /tmp", testPatterns);
      expect(result.matched).toBe(true);
      expect(result.action).toBe("block");
      expect(result.reason).toBe("rm with recursive flag");
    });

    it("should return no match for safe commands", () => {
      const result = checkBashPatterns("ls -la", testPatterns);
      expect(result.matched).toBe(false);
    });

    it("should handle ask action patterns", () => {
      const askPatterns: BashToolPattern[] = [
        { pattern: "\\bgit\\s+branch\\s+-D", reason: "force delete branch", action: "ask" },
      ];
      const result = checkBashPatterns("git branch -D feature", askPatterns);
      expect(result.matched).toBe(true);
      expect(result.action).toBe("ask");
    });

    it("should default to block when action not specified", () => {
      const noActionPatterns: BashToolPattern[] = [
        { pattern: "\\brm\\s+-[rRf]", reason: "dangerous" },
      ];
      const result = checkBashPatterns("rm -rf /", noActionPatterns);
      expect(result.matched).toBe(true);
      expect(result.action).toBe("block");
    });

    it("should handle multiple patterns and return first match", () => {
      const multiPatterns: BashToolPattern[] = [
        { pattern: "\\brm\\s+-[rRf]", reason: "rm -rf" },
        { pattern: "\\bchmod\\s+777", reason: "chmod 777" },
      ];
      const result = checkBashPatterns("rm -rf /tmp", multiPatterns);
      expect(result.matched).toBe(true);
      expect(result.reason).toBe("rm -rf");
    });

    it("should handle invalid regex gracefully", () => {
      const invalidPatterns: BashToolPattern[] = [
        { pattern: "[invalid", reason: "invalid regex" },
      ];
      const result = checkBashPatterns("any command", invalidPatterns);
      expect(result.matched).toBe(false);
    });
  });
});
