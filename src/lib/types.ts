export interface BashToolPattern {
  pattern: string;
  reason: string;
  action?: "block" | "ask";
}

export interface DamageControlConfig {
  enabled: boolean;
  logLevel: "debug" | "warn" | "error";
  defaultAction: "block" | "ask" | "allow";
  bashToolPatterns: BashToolPattern[];
  zeroAccessPaths: string[];
  readOnlyPaths: string[];
  noDeletePaths: string[];
}

export interface ToolInput {
  command?: string;
  filePath?: string;
  content?: string;
  oldString?: string;
  newString?: string;
}

export interface ToolBeforeInput {
  tool_name: string;
  tool_input: ToolInput;
}

export interface ToolBeforeOutput {
  tool_input?: ToolInput;
  error?: string;
}

export interface PatternMatchResult {
  matched: boolean;
  reason?: string;
  action?: "block" | "ask";
}

export interface PathCheckResult {
  blocked: boolean;
  reason?: string;
  pathType?: "zeroAccess" | "readOnly" | "noDelete";
}

export type OperationType =
  | "write"
  | "append"
  | "edit"
  | "move"
  | "copy"
  | "delete"
  | "chmod"
  | "chown"
  | "read";
