/**
 * First-run detection for VibeFrame CLI
 * Shows a welcome banner when user has never configured the tool
 */

import { access } from "node:fs/promises";
import chalk from "chalk";
import { CONFIG_PATH } from "../config/index.js";
import { PROVIDER_ENV_VARS } from "../config/schema.js";
import { loadEnv } from "./api-key.js";

/**
 * Check if this is the user's first run (no config and no env vars set)
 */
export async function isFirstRun(): Promise<boolean> {
  // Check if config file exists
  try {
    await access(CONFIG_PATH);
    return false;
  } catch {
    // Config doesn't exist, check env vars
  }

  // Load .env files
  loadEnv();

  // Check if any provider API key is set in environment
  for (const envVar of Object.values(PROVIDER_ENV_VARS)) {
    if (process.env[envVar]) {
      return false;
    }
  }

  return true;
}

/**
 * Show a friendly welcome banner for first-time users
 */
export function showFirstRunBanner(): void {
  console.log();
  console.log(chalk.cyan.bold("  Welcome to VibeFrame!"));
  console.log();
  console.log(`  Get started:`);
  console.log(`    ${chalk.green("vibe setup")}        Configure API keys ${chalk.dim("(1 min)")}`);
  console.log(`    ${chalk.green("vibe doctor")}       Check what's ready`);
  console.log(`    ${chalk.green("vibe --help")}       See all commands`);
  console.log();
  console.log(chalk.dim("  Tip: some commands work without API keys (silence-cut, fade, noise-reduce)."));
  console.log(chalk.dim("  Run 'vibe doctor' to see everything available."));
  console.log();
}
