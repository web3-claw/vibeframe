/**
 * @module output
 * @description Shared output helper for --json structured output support.
 */

/** Check if --json flag is active */
export function isJsonMode(): boolean {
  return process.env.VIBE_JSON_OUTPUT === "1";
}

/** Output result - JSON mode outputs JSON, otherwise no-op (callers use chalk/ora) */
export function outputResult(result: Record<string, unknown>): void {
  if (isJsonMode()) {
    console.log(JSON.stringify(result, null, 2));
  }
}

/** Wrap console output - suppressed in JSON mode */
export function log(...args: unknown[]): void {
  if (!isJsonMode()) {
    console.log(...args);
  }
}
