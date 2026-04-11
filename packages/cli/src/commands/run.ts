/**
 * `vibe run` command — Execute declarative YAML video pipelines.
 *
 * Video as Code: define reproducible, shareable video workflows in YAML.
 * Each step maps to an existing CLI command's execute function.
 *
 * Usage:
 *   vibe run pipeline.yaml
 *   vibe run pipeline.yaml --dry-run
 *   vibe run pipeline.yaml --resume
 *   vibe run pipeline.yaml -o ./output/
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { loadPipeline, executePipeline } from "../pipeline/index.js";
import { outputResult, exitWithError, generalError } from "./output.js";

export const runCommand = new Command("run")
  .description("Execute a YAML video pipeline (Video as Code)")
  .argument("<pipeline>", "Path to pipeline YAML file")
  .option("-o, --output <dir>", "Output directory for step results")
  .option("--dry-run", "Validate and show execution plan without running")
  .option("--resume", "Resume from last checkpoint (skip completed steps)")
  .option("--fail-fast", "Stop on first failed step (default: continue)")
  .option("--json", "Output results as JSON")
  .addHelpText("after", `
Examples:
  $ vibe run my-pipeline.yaml
  $ vibe run my-pipeline.yaml --dry-run
  $ vibe run my-pipeline.yaml --resume -o ./output/
  $ vibe run my-pipeline.yaml --fail-fast

Pipeline YAML format:
  name: my-video
  steps:
    - id: image
      action: generate-image
      prompt: "sunset over mountains"
      output: backdrop.png
    - id: narration
      action: generate-tts
      text: "Welcome to the show"
      output: voice.mp3
    - id: video
      action: generate-video
      prompt: "camera push in"
      image: $image.output
      duration: 10
      output: scene.mp4

Variable references: $step_id.output, $step_id.data.field, \${ENV_VAR}

Cost: Depends on steps. Use --dry-run to preview before executing.
Run 'vibe schema run' for structured parameter info.
`)
  .action(async (pipelinePath: string, options) => {
    const isJson = options.json || process.env.VIBE_JSON_OUTPUT === "1";

    try {
      // Load and validate pipeline
      const manifest = await loadPipeline(pipelinePath);

      if (!isJson) {
        console.log();
        console.log(chalk.bold.cyan(`  Pipeline: ${manifest.name}`));
        if (manifest.description) console.log(chalk.dim(`  ${manifest.description}`));
        console.log(chalk.dim(`  ${manifest.steps.length} steps`));
        console.log(chalk.dim("  " + "─".repeat(50)));
        console.log();
      }

      // Dry run
      if (options.dryRun) {
        const result = await executePipeline(manifest, { dryRun: true, outputDir: options.output });

        if (isJson) {
          outputResult({
            dryRun: true,
            command: "run",
            name: manifest.name,
            steps: result.steps.map(s => ({ id: s.id, action: s.action })),
            totalSteps: result.totalSteps,
          });
        } else {
          console.log(chalk.bold("  Execution Plan:"));
          console.log();
          for (let i = 0; i < result.steps.length; i++) {
            const step = result.steps[i];
            console.log(`  ${chalk.dim(`${i + 1}.`)} ${chalk.bold(step.id)} ${chalk.dim(`→ ${step.action}`)}`);
          }
          console.log();
          console.log(chalk.dim("  Run without --dry-run to execute."));
        }
        return;
      }

      // Execute pipeline
      const spinner = !isJson ? ora("Starting pipeline...").start() : null;

      const result = await executePipeline(manifest, {
        outputDir: options.output,
        resume: options.resume,
        failFast: options.failFast,
      });

      spinner?.stop();

      if (isJson) {
        outputResult({
          success: result.success,
          name: result.name,
          completedSteps: result.completedSteps,
          totalSteps: result.totalSteps,
          totalDuration: result.totalDuration,
          outputDir: result.outputDir,
          steps: result.steps.map(s => ({
            id: s.id,
            action: s.action,
            success: s.success,
            output: s.output,
            duration: s.duration,
            error: s.error,
          })),
        });
      } else {
        console.log();
        for (const step of result.steps) {
          const icon = step.success ? chalk.green("✓") : chalk.red("✗");
          const time = step.duration ? chalk.dim(` (${(step.duration / 1000).toFixed(1)}s)`) : "";
          const output = step.output ? chalk.dim(` → ${step.output}`) : "";
          console.log(`  ${icon} ${step.id}${time}${output}`);
          if (!step.success && step.error) {
            console.log(`    ${chalk.red(step.error)}`);
          }
        }

        console.log();
        console.log(chalk.dim("  " + "─".repeat(50)));
        console.log(`  ${chalk.bold(`${result.completedSteps}/${result.totalSteps} steps completed`)}${result.success ? chalk.green(" ✓") : ""}`);
        if (result.totalDuration) {
          console.log(chalk.dim(`  Total: ${(result.totalDuration / 1000).toFixed(1)}s`));
        }
        if (result.outputDir) {
          console.log(chalk.dim(`  Output: ${result.outputDir}`));
        }
        console.log();

        if (!result.success) {
          console.log(chalk.dim("  Use --resume to retry failed steps."));
          console.log();
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      exitWithError(generalError(msg));
    }
  });
