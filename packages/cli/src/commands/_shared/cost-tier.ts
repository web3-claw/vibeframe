/**
 * Cost-tier metadata for CLI subcommands.
 *
 * Top-level `vibe --help` shows the four-tier table at the bottom; this
 * module attaches the tier *per subcommand* so users see the cost
 * directly on each `vibe <group> <sub> --help` page. The schema
 * generator also reads it back via the symbol stamped on each Command,
 * exposing the tier as `--describe` JSON for agents.
 *
 * The single source of truth for which tier each subcommand belongs to
 * is `docs/cli-mental-model.md`.
 */

import type { Command } from "commander";
import chalk from "chalk";

export type CostTier = "free" | "low" | "high" | "very-high";

export const TIER_DESCRIPTION: Record<CostTier, string> = {
  "free": "FFmpeg only, no API call",
  "low": "$0.01–$0.10 per call",
  "high": "$1–$5 per call",
  "very-high": "$5–$50+ per call",
};

/**
 * Tier → chalk colorizer. Cool colors for safe tiers, warm for paid ones.
 * Used in `--help` footers (here) and in `vibe schema --list` human output.
 */
export const TIER_COLOR: Record<CostTier, (s: string) => string> = {
  "free": chalk.green,
  "low": chalk.cyan,
  "high": chalk.yellow,
  "very-high": chalk.red,
};

/**
 * Symbol used to stamp a Command with its cost tier. Hidden from
 * Commander's API surface; only `getCostTier` and `--describe` care.
 */
const COST_TIER_KEY = Symbol.for("@vibeframe/cli.costTier");

interface CostTieredCommand {
  [COST_TIER_KEY]?: CostTier;
}

/**
 * Attach a cost tier to a Command — adds a footer to its `--help`
 * output and stamps a private symbol so the schema generator can emit
 * `cost: "<tier>"`.
 *
 * Returns the command for chaining.
 */
export function applyTier<T extends Command>(cmd: T, tier: CostTier): T {
  (cmd as unknown as CostTieredCommand)[COST_TIER_KEY] = tier;
  // Append (rather than replace) so existing addHelpText("after", …)
  // examples blocks are preserved. Color signals tier at a glance —
  // green for free, red for very-high. Falls through chalk's NO_COLOR
  // / non-TTY detection automatically.
  const colored = TIER_COLOR[tier](`Cost: ${tier} (${TIER_DESCRIPTION[tier]})`);
  cmd.addHelpText("after", `\n${colored}\n`);
  return cmd;
}

/**
 * Read back the cost tier from a Command, if `applyTier` was called.
 * Returns `undefined` for commands that haven't opted in (e.g. utility
 * commands like `setup`, `doctor`, `init`).
 */
export function getCostTier(cmd: Command): CostTier | undefined {
  return (cmd as unknown as CostTieredCommand)[COST_TIER_KEY];
}

/**
 * Bulk-apply tiers to a parent's already-registered subcommands by name.
 * Convenient for groups whose subcommands are registered via helper
 * functions (e.g. `registerHighlightsCommands(parent)` adds two
 * subcommands at once) — the caller doesn't have to track which slot
 * was filled most recently.
 *
 * Subcommands not present in `tiers` are left untiered. Names in
 * `tiers` that don't match any subcommand are silently ignored.
 */
export function applyTiers(parent: Command, tiers: Record<string, CostTier>): void {
  for (const cmd of parent.commands) {
    const tier = tiers[cmd.name()];
    if (tier) applyTier(cmd, tier);
  }
}
