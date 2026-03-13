import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConfigPath, loadConfig, getDefaultConfig } from "../../src/lib/config";

describe("Config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("getConfigPath", () => {
    it("should return null when no config exists", () => {
      const path = getConfigPath();
      expect(path).toBeNull();
    });
  });

  describe("loadConfig", () => {
    it("should return default config when no config file exists", () => {
      const config = loadConfig();
      expect(config.enabled).toBe(true);
      expect(config.logLevel).toBe("warn");
      expect(config.defaultAction).toBe("block");
    });
  });

  describe("getDefaultConfig", () => {
    it("should return config with patterns", () => {
      const config = getDefaultConfig();
      expect(config.bashToolPatterns).toBeDefined();
      expect(Array.isArray(config.bashToolPatterns)).toBe(true);
    });

    it("should have security patterns loaded", () => {
      const config = getDefaultConfig();
      const rmPattern = config.bashToolPatterns.find(
        (p) => p.pattern.includes("rm") && p.pattern.includes("rRf")
      );
      expect(rmPattern).toBeDefined();
    });

    it("should have zeroAccessPaths defined", () => {
      const config = getDefaultConfig();
      expect(config.zeroAccessPaths).toContain(".env");
      expect(config.zeroAccessPaths).toContain("~/.ssh/");
    });

    it("should have readOnlyPaths defined", () => {
      const config = getDefaultConfig();
      expect(config.readOnlyPaths).toContain("package-lock.json");
      expect(config.readOnlyPaths).toContain("/etc/");
    });

    it("should have noDeletePaths defined", () => {
      const config = getDefaultConfig();
      expect(config.noDeletePaths).toContain(".git/");
      expect(config.noDeletePaths).toContain("README.md");
    });
  });
});
