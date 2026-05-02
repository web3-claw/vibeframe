import { Command } from "commander";
import chalk from "chalk";
import { resolve } from "node:path";

import { createBuildPlan, type BuildStage } from "./_shared/build-plan.js";
import { exitWithError, isJsonMode, outputSuccess, usageError } from "./output.js";

const VALID_STAGES: BuildStage[] = ["assets", "compose", "sync", "render", "all"];

export const planCommand = new Command("plan")
  .description("Read STORYBOARD.md and show build plan, costs, missing cues, and provider needs")
  .argument("[project-dir]", "Video project directory", ".")
  .option("--stage <stage>", `Stage to plan: ${VALID_STAGES.join("|")}`, "all")
  .option("--beat <id>", "Restrict the plan to one beat")
  .option("--mode <mode>", "Build mode: agent|batch|auto", "auto")
  .option("--skip-narration", "Don't include narration generation in the plan")
  .option("--skip-backdrop", "Don't include backdrop image generation in the plan")
  .option("--force", "Plan regeneration even when outputs already exist")
  .option("--max-cost <usd>", "Fail if estimated cost exceeds this USD cap")
  .action(async (projectDirArg: string, options) => {
    const startedAt = Date.now();
    const stage = String(options.stage ?? "all") as BuildStage;
    if (!VALID_STAGES.includes(stage)) {
      exitWithError(usageError(`Invalid --stage: ${stage}`, `Must be one of: ${VALID_STAGES.join(", ")}`));
    }
    const mode = String(options.mode ?? "auto");
    if (!["agent", "batch", "auto"].includes(mode)) {
      exitWithError(usageError(`Invalid --mode: ${mode}`, "Must be one of: agent, batch, auto"));
    }
    const maxCost = options.maxCost !== undefined ? Number.parseFloat(String(options.maxCost)) : undefined;
    if (maxCost !== undefined && (!Number.isFinite(maxCost) || maxCost < 0)) {
      exitWithError(usageError(`Invalid --max-cost: ${String(options.maxCost)}`, "Must be a non-negative USD amount."));
    }

    const projectDir = resolve(projectDirArg);
    const plan = await createBuildPlan({
      projectDir,
      stage,
      beat: options.beat,
      mode: mode as "agent" | "batch" | "auto",
      skipNarration: options.skipNarration,
      skipBackdrop: options.skipBackdrop,
      force: options.force,
    });

    if (maxCost !== undefined && plan.estimatedCostUsd > maxCost) {
      const data = {
        ...plan,
        costCapUsd: maxCost,
        retryWith: [
          ...plan.retryWith,
          `vibe plan ${projectDirArg} --stage ${stage} --skip-backdrop --json`,
          `vibe build ${projectDirArg} --stage ${stage} --max-cost ${plan.estimatedCostUsd} --json`,
        ],
      };
      if (isJsonMode()) {
        outputSuccess({
          command: "plan",
          startedAt,
          data,
          warnings: [`Estimated cost $${plan.estimatedCostUsd.toFixed(2)} exceeds --max-cost $${maxCost.toFixed(2)}.`],
        });
        process.exitCode = 1;
        return;
      }
      exitWithError(usageError(
        `Estimated cost $${plan.estimatedCostUsd.toFixed(2)} exceeds --max-cost $${maxCost.toFixed(2)}.`,
        `Raise --max-cost or reduce the stage/provider scope.`,
      ));
    }

    if (isJsonMode()) {
      outputSuccess({
        command: "plan",
        startedAt,
        data: { ...plan },
        costUsd: 0,
        warnings: plan.warnings,
      });
      return;
    }

    console.log();
    console.log(chalk.bold.cyan("VibeFrame Plan"));
    console.log(chalk.dim("-".repeat(60)));
    console.log(`  Project:       ${projectDirArg}`);
    console.log(`  Stage:         ${stage}`);
    console.log(`  Mode:          ${plan.mode}`);
    console.log(`  Beats:         ${plan.beats.length}${plan.beat ? ` (${plan.beat})` : ""}`);
    console.log(`  Missing:       ${plan.missing.length > 0 ? plan.missing.join(", ") : "none"}`);
    console.log(`  Providers:     ${plan.providers.length > 0 ? plan.providers.join(", ") : "none"}`);
    console.log(`  Est. cost:     $${plan.estimatedCostUsd.toFixed(2)}`);
    if (plan.warnings.length > 0) {
      console.log();
      for (const warning of plan.warnings) console.log(chalk.yellow(`  Warning: ${warning}`));
    }
    if (plan.validation.issues.length > 0) {
      console.log();
      for (const issue of plan.validation.issues) {
        const color = issue.severity === "error" ? chalk.red : chalk.yellow;
        console.log(color(`  [${issue.code}] ${issue.message}`));
      }
    }
  });
