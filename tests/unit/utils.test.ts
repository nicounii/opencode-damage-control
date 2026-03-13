import { describe, it, expect } from "vitest";
import { expandHomeDir, isGlobPattern, globToRegex, normalizePath, matchesGlob } from "../../src/lib/utils";

describe("Utils", () => {
  describe("expandHomeDir", () => {
    it("should expand ~/ to home directory", () => {
      const result = expandHomeDir("~/test");
      expect(result).toContain("test");
    });

    it("should return unchanged path without ~", () => {
      const result = expandHomeDir("/etc/passwd");
      expect(result).toBe("/etc/passwd");
    });

    it("should handle ~ alone", () => {
      const result = expandHomeDir("~");
      expect(result).toBeTruthy();
    });
  });

  describe("isGlobPattern", () => {
    it("should detect * as glob", () => {
      expect(isGlobPattern("*.txt")).toBe(true);
    });

    it("should detect ? as glob", () => {
      expect(isGlobPattern("?.txt")).toBe(true);
    });

    it("should detect [] as glob", () => {
      expect(isGlobPattern("file[123].txt")).toBe(true);
    });

    it("should return false for literal paths", () => {
      expect(isGlobPattern("file.txt")).toBe(false);
      expect(isGlobPattern("/etc/passwd")).toBe(false);
    });
  });

  describe("globToRegex", () => {
    it("should convert * to regex", () => {
      const regex = globToRegex("*.txt");
      expect(regex.test("file.txt")).toBe(true);
      expect(regex.test("document.txt")).toBe(true);
    });

    it("should convert ? to regex", () => {
      const regex = globToRegex("file?.txt");
      expect(regex.test("file1.txt")).toBe(true);
      expect(regex.test("filea.txt")).toBe(true);
    });

    it("should convert character classes", () => {
      const regex = globToRegex("file[123].txt");
      expect(regex.test("file1.txt")).toBe(true);
      expect(regex.test("file2.txt")).toBe(true);
      expect(regex.test("file4.txt")).toBe(false);
    });

    it("should handle multiple stars", () => {
      const regex = globToRegex("*.js");
      expect(regex.test("app.js")).toBe(true);
      expect(regex.test("src/app.js")).toBe(false);
    });
  });

  describe("normalizePath", () => {
    it("should convert backslashes to forward slashes", () => {
      expect(normalizePath("path\\to\\file")).toBe("path/to/file");
    });

    it("should collapse multiple slashes", () => {
      expect(normalizePath("path//to///file")).toBe("path/to/file");
    });
  });

  describe("matchesGlob", () => {
    it("should match simple glob patterns", () => {
      expect(matchesGlob("file.txt", "*.txt")).toBe(true);
      expect(matchesGlob("document.pdf", "*.txt")).toBe(false);
    });

    it("should match literal filenames", () => {
      expect(matchesGlob(".env", ".env")).toBe(true);
    });
  });
});
