import { describe, it, expect, vi, beforeEach } from "vitest";
import { DamageControl } from "../../src/hooks/tool.before";

describe("Tool Execute Before Hook", () => {
  let plugin: ReturnType<typeof DamageControl>;

  beforeEach(async () => {
    vi.resetModules();
    plugin = await DamageControl();
  });

  describe("Bash tool blocking", () => {
    it("should block rm -rf command", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "bash", sessionID: "test", callID: "1" };
      const output = { args: { command: "rm -rf /tmp/test" } };

      await expect(hook(input, output)).rejects.toThrow("Blocked");
    });

    it("should block git reset --hard", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "bash", sessionID: "test", callID: "1" };
      const output = { args: { command: "git reset --hard HEAD~1" } };

      await expect(hook(input, output)).rejects.toThrow();
    });

    it("should block terraform destroy", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "bash", sessionID: "test", callID: "1" };
      const output = { args: { command: "terraform destroy -auto-approve" } };

      await expect(hook(input, output)).rejects.toThrow();
    });

    it("should allow safe commands", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "bash", sessionID: "test", callID: "1" };
      const output = { args: { command: "ls -la" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });

    it("should allow git status", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "bash", sessionID: "test", callID: "1" };
      const output = { args: { command: "git status" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });
  });

  describe("Write tool blocking", () => {
    it("should block Write to .env", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "write", sessionID: "test", callID: "1" };
      const output = { args: { filePath: ".env", content: "KEY=value" } };

      await expect(hook(input, output)).rejects.toThrow();
    });

    it("should block Write to *.pem", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "write", sessionID: "test", callID: "1" };
      const output = { args: { filePath: "server.pem", content: "key data" } };

      await expect(hook(input, output)).rejects.toThrow();
    });

    it("should allow Write to safe paths", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "write", sessionID: "test", callID: "1" };
      const output = { args: { filePath: "src/main.ts", content: "console.log('hello')" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });
  });

  describe("Edit tool blocking", () => {
    it("should block Edit to package-lock.json", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "edit", sessionID: "test", callID: "1" };
      const output = { args: { filePath: "package-lock.json", oldString: "{}", newString: "{}" } };

      await expect(hook(input, output)).rejects.toThrow();
    });

    it("should allow Edit to source files", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "edit", sessionID: "test", callID: "1" };
      const output = { args: { filePath: "src/utils.ts", oldString: "foo", newString: "bar" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });
  });

  describe("non-protected tools", () => {
    it("should allow Read tool", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "read", sessionID: "test", callID: "1" };
      const output = { args: { filePath: "src/main.ts" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });

    it("should allow Glob tool", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "glob", sessionID: "test", callID: "1" };
      const output = { args: { pattern: "**/*.ts" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle empty command", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "bash", sessionID: "test", callID: "1" };
      const output = { args: { command: "" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });

    it("should handle missing args", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "bash", sessionID: "test", callID: "1" };
      const output = { args: {} };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });

    it("should handle missing filePath for Write", async () => {
      const hook = plugin["tool.execute.before"];
      const input = { tool: "write", sessionID: "test", callID: "1" };
      const output = { args: { content: "test" } };

      await expect(hook(input, output)).resolves.toBeUndefined();
    });
  });
});
