import { describe, it, expect, beforeEach, vi } from "vitest";
import { DamageControl } from "../../src/hooks/tool.before";

describe("Sentient AI Test Suite", () => {
  let plugin: ReturnType<typeof DamageControl>;
  let hook: (input: any, output: any) => Promise<any>;

  beforeEach(async () => {
    vi.resetModules();
    plugin = await DamageControl();
    hook = plugin["tool.execute.before"];
  });

  const runTest = async (name: string, toolName: string, toolInput: any) => {
    const input = { tool: toolName, sessionID: "test", callID: "1" };
    const output = { args: toolInput };

    try {
      await hook(input, output);
      return { blocked: false };
    } catch (e: any) {
      return { blocked: true, error: e.message };
    }
  };

  describe("Destructive File Operations", () => {
    it("should block rm -rf / (attempt 1)", async () => {
      const result = await runTest("rm -rf /", "bash", { command: "rm -rf /" });
      expect(result.blocked).toBe(true);
    });

    it("should block rm -rf /tmp (attempt 2)", async () => {
      const result = await runTest("rm -rf /tmp", "bash", { command: "rm -rf /tmp" });
      expect(result.blocked).toBe(true);
    });

    it("should block rm -rf .git (attempt 3)", async () => {
      const result = await runTest("rm -rf .git", "bash", { command: "rm -rf .git" });
      expect(result.blocked).toBe(true);
    });

    it("should block rm -rf . (attempt 4)", async () => {
      const result = await runTest("rm -rf .", "bash", { command: "rm -rf ." });
      expect(result.blocked).toBe(true);
    });
  });

  describe("Permission Escalation", () => {
    it("should block chmod 777 . (attempt 5)", async () => {
      const result = await runTest("chmod 777", "bash", { command: "chmod 777 ." });
      expect(result.blocked).toBe(true);
    });

    it("should block recursive chmod 777 (attempt 6)", async () => {
      const result = await runTest("chmod -R 777", "bash", { command: "chmod -R 777 /home" });
      expect(result.blocked).toBe(true);
    });
  });

  describe("SQL Destructive Operations", () => {
    it("should block DELETE without WHERE (attempt 7)", async () => {
      const result = await runTest("DELETE FROM users", "bash", { command: "DELETE FROM users;" });
      expect(result.blocked).toBe(true);
    });

    it("should block DROP TABLE (attempt 8)", async () => {
      const result = await runTest("DROP TABLE users", "bash", { command: "DROP TABLE users;" });
      expect(result.blocked).toBe(true);
    });

    it("should block TRUNCATE TABLE (attempt 9)", async () => {
      const result = await runTest("TRUNCATE TABLE", "bash", { command: "TRUNCATE TABLE orders;" });
      expect(result.blocked).toBe(true);
    });
  });

  describe("Git Destructive Operations", () => {
    it("should block git push --force (attempt 10)", async () => {
      const result = await runTest("git push --force", "bash", { command: "git push --force origin main" });
      expect(result.blocked).toBe(true);
    });

    it("should block git reset --hard (attempt 11)", async () => {
      const result = await runTest("git reset --hard", "bash", { command: "git reset --hard HEAD~5" });
      expect(result.blocked).toBe(true);
    });

    it("should block git stash clear (attempt 12)", async () => {
      const result = await runTest("git stash clear", "bash", { command: "git stash clear" });
      expect(result.blocked).toBe(true);
    });
  });

  describe("Infrastructure Destruction", () => {
    it("should block terraform destroy (attempt 13)", async () => {
      const result = await runTest("terraform destroy", "bash", { command: "terraform destroy -auto-approve" });
      expect(result.blocked).toBe(true);
    });

    it("should block aws s3 rm --recursive (attempt 14)", async () => {
      const result = await runTest("aws s3 rm", "bash", { command: "aws s3 rm s3://my-bucket --recursive" });
      expect(result.blocked).toBe(true);
    });
  });

  describe("Sensitive File Access", () => {
    it("should block Write to .env (attempt 15)", async () => {
      const result = await runTest("Write .env", "write", { filePath: ".env", content: "SECRET=123" });
      expect(result.blocked).toBe(true);
    });

    it("should block Write to *.pem (attempt 16)", async () => {
      const result = await runTest("Write .pem", "write", { filePath: "server.pem", content: "key" });
      expect(result.blocked).toBe(true);
    });

    it("should block Edit to package-lock.json (attempt 17)", async () => {
      const result = await runTest("Edit package-lock", "edit", { filePath: "package-lock.json", oldString: "{}", newString: "{}" });
      expect(result.blocked).toBe(true);
    });

    it("should block access to ~/.ssh/id_rsa (attempt 18)", async () => {
      const result = await runTest("Read ssh key", "bash", { command: "cat ~/.ssh/id_rsa" });
      expect(result.blocked).toBe(true);
    });
  });

  describe("Safe Operations (should NOT be blocked)", () => {
    it("should allow ls command", async () => {
      const result = await runTest("ls", "bash", { command: "ls -la" });
      expect(result.blocked).toBe(false);
    });

    it("should allow git status", async () => {
      const result = await runTest("git status", "bash", { command: "git status" });
      expect(result.blocked).toBe(false);
    });

    it("should allow npm install", async () => {
      const result = await runTest("npm install", "bash", { command: "npm install" });
      expect(result.blocked).toBe(false);
    });

    it("should allow Write to src/main.ts", async () => {
      const result = await runTest("Write src", "write", { filePath: "src/main.ts", content: "console.log()" });
      expect(result.blocked).toBe(false);
    });

    it("should allow Read of source files", async () => {
      const result = await runTest("Read src", "read", { filePath: "src/main.ts" });
      expect(result.blocked).toBe(false);
    });
  });
});
