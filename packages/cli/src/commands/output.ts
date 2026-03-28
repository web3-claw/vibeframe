/**
 * @module output
 * @description Shared output helper for --json structured output support.
 */

import chalk from "chalk";
import ora from "ora";

// ── Exit Codes ───────────────────────────────────────────────────────────

export enum ExitCode {
  SUCCESS = 0,
  GENERAL = 1,
  USAGE = 2,
  NOT_FOUND = 3,
  AUTH = 4,
  API_ERROR = 5,
  NETWORK = 6,
}

// ── Structured Errors ────────────────────────────────────────────────────

export interface StructuredError {
  success: false;
  error: string;
  code: string;
  exitCode: ExitCode;
  suggestion?: string;
  retryable: boolean;
}

export function usageError(msg: string, suggestion?: string): StructuredError {
  return { success: false, error: msg, code: "USAGE_ERROR", exitCode: ExitCode.USAGE, suggestion, retryable: false };
}

export function authError(envVar: string, provider: string): StructuredError {
  return {
    success: false,
    error: `${provider} API key required.`,
    code: "API_KEY_MISSING",
    exitCode: ExitCode.AUTH,
    suggestion: `Set ${envVar} in .env, or run: vibe setup`,
    retryable: false,
  };
}

export function apiError(msg: string, retryable = false): StructuredError {
  return { success: false, error: msg, code: "API_ERROR", exitCode: ExitCode.API_ERROR, suggestion: retryable ? "Retry the command." : undefined, retryable };
}

export function notFoundError(path: string): StructuredError {
  return { success: false, error: `File not found: ${path}`, code: "NOT_FOUND", exitCode: ExitCode.NOT_FOUND, retryable: false };
}

export function networkError(msg: string): StructuredError {
  return { success: false, error: msg, code: "NETWORK_ERROR", exitCode: ExitCode.NETWORK, suggestion: "Check your internet connection and retry.", retryable: true };
}

export function generalError(msg: string, suggestion?: string): StructuredError {
  return { success: false, error: msg, code: "ERROR", exitCode: ExitCode.GENERAL, suggestion, retryable: false };
}

/** Output structured error then exit */
export function exitWithError(err: StructuredError): never {
  if (isJsonMode()) {
    console.log(JSON.stringify(err, null, 2));
  } else {
    console.error(chalk.red(`\n  ${err.error}`));
    if (err.suggestion) {
      console.error(chalk.dim(`  ${err.suggestion}`));
    }
    console.error();
  }
  process.exit(err.exitCode);
}

// ── Output Modes ─────────────────────────────────────────────────────────

/** Check if --json flag is active */
export function isJsonMode(): boolean {
  return process.env.VIBE_JSON_OUTPUT === "1";
}

/** Check if --quiet flag is active */
export function isQuietMode(): boolean {
  return process.env.VIBE_QUIET_OUTPUT === "1";
}

/** Output result - JSON mode outputs JSON, quiet mode outputs primary value only */
export function outputResult(result: Record<string, unknown>): void {
  if (isJsonMode()) {
    // Apply --fields filtering if specified
    const fields = process.env.VIBE_OUTPUT_FIELDS;
    if (fields) {
      const keys = fields.split(",").map((k) => k.trim());
      const filtered: Record<string, unknown> = {};
      for (const key of keys) {
        if (key in result) filtered[key] = result[key];
      }
      // Always include success
      if ("success" in result) filtered.success = result.success;
      console.log(JSON.stringify(filtered, null, 2));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } else if (isQuietMode()) {
    // In quiet mode, output the primary value only (path, url, or id)
    const primary = result.output ?? result.path ?? result.url ?? result.id ?? result.result;
    if (primary !== undefined) console.log(String(primary));
  }
}

/** Wrap console output - suppressed in JSON/quiet mode */
export function log(...args: unknown[]): void {
  if (!isJsonMode() && !isQuietMode()) {
    console.log(...args);
  }
}

/** Create a spinner that is silent in JSON/quiet mode */
export function spinner(text: string): ReturnType<typeof ora> {
  if (isJsonMode() || isQuietMode()) {
    return ora({ text, isSilent: true });
  }
  return ora(text);
}

/** Suggest next steps - only in human interactive mode */
export function suggestNext(tip: string): void {
  if (!isJsonMode() && !isQuietMode() && process.stdout.isTTY) {
    console.log(chalk.dim(`\n  Tip: ${tip}`));
  }
}

/** Output an error - always outputs (JSON mode writes to stdout as JSON) */
export function outputError(error: string, details?: Record<string, unknown>): void {
  if (isJsonMode()) {
    console.log(JSON.stringify({ success: false, error, ...details }, null, 2));
  } else {
    console.error(error);
  }
}
