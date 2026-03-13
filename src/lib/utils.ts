import { homedir } from "os";
import { join } from "path";

export function expandHomeDir(path: string): string {
  if (path.startsWith("~/") || path === "~") {
    return join(homedir(), path.slice(1));
  }
  return path;
}

export function isGlobPattern(pattern: string): boolean {
  return (
    pattern.includes("*") ||
    pattern.includes("?") ||
    pattern.includes("[") ||
    pattern.includes("]")
  );
}

export function globToRegex(pattern: string): RegExp {
  let regexStr = "^";

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];

    if (char === "*") {
      regexStr += "[^/]*";
    } else if (char === "?") {
      regexStr += "[^/]";
    } else if (char === "[") {
      let charClass = "[";
      i++;
      while (i < pattern.length && pattern[i] !== "]") {
        charClass += pattern[i];
        i++;
      }
      charClass += "]";
      regexStr += charClass;
    } else if ("\\^$.|()[]+-".includes(char)) {
      regexStr += "\\" + char;
    } else {
      regexStr += char;
    }
  }

  regexStr += "$";

  return new RegExp(regexStr, "i");
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export function matchesGlob(text: string, pattern: string): boolean {
  const regex = globToRegex(pattern);
  const normalizedText = normalizePath(text);
  return regex.test(normalizedText);
}
