import { describe, it, expect } from "vitest";
import { checkPathProtection } from "../../src/lib/path-check";

describe("Path Protection", () => {
  describe("zeroAccessPaths", () => {
    const zeroAccess = [".env", "~/.ssh/", "*.pem"];
    const readOnly: string[] = [];
    const noDelete: string[] = [];

    it("should block write to .env", () => {
      const result = checkPathProtection("echo test > .env", ".env", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("zeroAccess");
    });

    it("should block read from ~/.ssh/", () => {
      const result = checkPathProtection("cat ~/.ssh/id_rsa", "~/.ssh/id_rsa", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("zeroAccess");
    });

    it("should block access to *.pem files", () => {
      const result = checkPathProtection("cat server.pem", "server.pem", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("zeroAccess");
    });

    it("should not block access to safe paths", () => {
      const result = checkPathProtection("cat src/main.ts", "src/main.ts", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(false);
    });
  });

  describe("readOnlyPaths", () => {
    const zeroAccess: string[] = [];
    const readOnly = ["/etc/", "package-lock.json", "node_modules/"];
    const noDelete: string[] = [];

    it("should block write to /etc/", () => {
      const result = checkPathProtection("echo test > /etc/passwd", "/etc/passwd", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("readOnly");
    });

    it("should block write to package-lock.json", () => {
      const result = checkPathProtection("echo {} > package-lock.json", "package-lock.json", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("readOnly");
    });

    it("should block write to node_modules/", () => {
      const result = checkPathProtection("rm node_modules/package", "node_modules/package", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("readOnly");
    });

    it("should allow read from read-only paths", () => {
      const result = checkPathProtection("cat /etc/hosts", "/etc/hosts", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(false);
    });

    it("should allow read of package-lock.json", () => {
      const result = checkPathProtection("cat package-lock.json", "package-lock.json", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(false);
    });
  });

  describe("noDeletePaths", () => {
    const zeroAccess: string[] = [];
    const readOnly: string[] = [];
    const noDelete = [".git/", "README.md"];

    it("should block delete of .git/", () => {
      const result = checkPathProtection("rm -rf .git/", ".git/", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("noDelete");
    });

    it("should block delete of README.md", () => {
      const result = checkPathProtection("rm README.md", "README.md", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
      expect(result.pathType).toBe("noDelete");
    });

    it("should allow write to no-delete paths", () => {
      const result = checkPathProtection("echo # Hello > README.md", "README.md", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(false);
    });

    it("should allow read from no-delete paths", () => {
      const result = checkPathProtection("cat README.md", "README.md", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(false);
    });
  });

  describe("glob patterns", () => {
    const zeroAccess = ["*.pem", "*.key"];
    const readOnly = ["*.lock", "*.json"];
    const noDelete: string[] = [];

    it("should match glob patterns in zeroAccess", () => {
      const result = checkPathProtection("cat server.pem", "server.pem", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
    });

    it("should match glob patterns in readOnly for write", () => {
      const result = checkPathProtection("echo {} > package.lock", "package.lock", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(true);
    });

    it("should not match non-matching globs", () => {
      const result = checkPathProtection("cat src/main.ts", "src/main.ts", zeroAccess, readOnly, noDelete);
      expect(result.blocked).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle empty path arrays", () => {
      const result = checkPathProtection("rm -rf /", "/", [], [], []);
      expect(result.blocked).toBe(false);
    });

    it("should handle paths with ~ correctly expanded", () => {
      const result = checkPathProtection("cat ~/.bashrc", "~/.bashrc", ["~/.bashrc"], [], []);
      expect(result.blocked).toBe(true);
    });

    it("should handle partial path matches for directories", () => {
      const result = checkPathProtection("cat /etc/passwd", "/etc/", ["/etc/"], [], []);
      expect(result.blocked).toBe(true);
    });
  });
});
