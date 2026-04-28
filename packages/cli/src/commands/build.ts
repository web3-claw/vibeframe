import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { resolve } from "node:path";

import {
  executeSceneBuild,
  type SceneBuildMode,
  type SceneBuildProgressEvent,
  type SceneBuildResult,
} from "./_shared/scene-build.js";
import { exitWithError, generalError, isJsonMode, isQuietMode, outputSuccess, usageError } from "./output.js";

const VALID_MODES: SceneBuildMode[] = ["agent", "batch", "auto"];

export const buildCommand = new Command("build")
  .description("Build a VibeFrame video project from STORYBOARD.md")
  .argument("[project-dir]", "Video project directory", ".")
  .option("--mode <mode>", "Build mode: agent|batch|auto", "auto")
  .option("--effort <level>", "Compose effort tier (batch mode only): low|medium|high", "medium")
  .option("--composer <provider>", "Batch composer: claude|openai|gemini")
  .option("--skip-narration", "Don't dispatch TTS even when beats declare narration cues")
  .option("--skip-backdrop", "Don't dispatch image-gen even when beats declare backdrop cues")
  .option("--skip-render", "Compose only — don't render to MP4")
  .option("--tts <provider>", "TTS provider: auto|elevenlabs|kokoro")
  .option("--voice <id>", "Voice id")
  .option("--image-provider <name>", "Image provider: openai")
  .option("--quality <q>", "Image quality: standard|hd", "hd")
  .option("--image-size <s>", "Image size: 1024x1024|1536x1024|1024x1536", "1536x1024")
  .option("--force", "Re-dispatch primitives even when assets already exist")
  .option("--dry-run", "Preview parameters without dispatching")
  .addHelpText("after", `
Examples:
  $ vibe init my-video --profile agent
  $ vibe build my-video --mode agent --tts kokoro
  $ vibe build my-video --skip-render

Advanced equivalent: \`vibe scene build\`.`)
  .action(async (projectDirArg: string, options) => {
    const startedAt = Date.now();
    const projectDir = resolve(projectDirArg);
    const mode = String(options.mode ?? "auto") as SceneBuildMode;
    if (!VALID_MODES.includes(mode)) {
      exitWithError(usageError(`Invalid --mode: ${mode}`, `Must be one of: ${VALID_MODES.join(", ")}`));
    }

    const params = {
      projectDir,
      mode,
      effort: options.effort,
      composer: options.composer,
      skipNarration: options.skipNarration ?? false,
      skipBackdrop: options.skipBackdrop ?? false,
      skipRender: options.skipRender ?? false,
      ttsProvider: options.tts,
      voice: options.voice,
      imageProvider: options.imageProvider,
      imageQuality: options.quality,
      imageSize: options.imageSize,
      force: options.force ?? false,
    };

    if (options.dryRun) {
      if (!isJsonMode() && !isQuietMode()) {
        printBuildDryRun(projectDirArg, params);
        return;
      }
      outputSuccess({
        command: "build",
        startedAt,
        dryRun: true,
        data: { params },
      });
      return;
    }

    const spinner = isJsonMode() || isQuietMode() ? null : ora("Building video project...").start();
    const result = await executeSceneBuild({
      projectDir,
      mode,
      effort: options.effort,
      composer: options.composer,
      skipNarration: options.skipNarration,
      skipBackdrop: options.skipBackdrop,
      skipRender: options.skipRender,
      ttsProvider: options.tts,
      voice: options.voice,
      imageProvider: options.imageProvider,
      imageQuality: options.quality,
      imageSize: options.imageSize,
      force: options.force,
      onProgress: (e: SceneBuildProgressEvent) => {
        if (!spinner) return;
        if (e.type === "phase-start") spinner.text = `Phase: ${e.phase}...`;
        else if (e.type === "render-done") spinner.text = `Rendered: ${e.outputPath}`;
      },
    });

    if (!result.success) {
      spinner?.fail(`Build failed: ${result.error}`);
      if (isJsonMode()) {
        outputSuccess({ command: "build", startedAt, data: { ...result } });
        process.exitCode = 1;
        return;
      }
      exitWithError(generalError(result.error ?? "Build failed"));
    }

    if (isJsonMode() || isQuietMode()) {
      outputSuccess({ command: "build", startedAt, data: { ...result } });
      return;
    }

    if (result.phase === "needs-author") {
      printNeedsAuthor(result);
      return;
    }

    printBuildResult(spinner, result, projectDirArg);
  });

type BuildDryRunParams = {
  projectDir: string;
  mode: SceneBuildMode;
  effort: unknown;
  composer: unknown;
  skipNarration: boolean;
  skipBackdrop: boolean;
  skipRender: boolean;
  ttsProvider: unknown;
  voice: unknown;
  imageProvider: unknown;
  imageQuality: unknown;
  imageSize: unknown;
  force: boolean;
};

function printBuildDryRun(projectDirArg: string, params: BuildDryRunParams): void {
  console.log();
  console.log(chalk.bold.cyan("VibeFrame Build - dry run"));
  console.log(chalk.dim("-".repeat(60)));
  console.log(`  Project:       ${chalk.bold(projectDirArg)}`);
  console.log(`  Mode:          ${chalk.bold(params.mode)}`);
  console.log(`  Composer:      ${chalk.bold(String(params.composer ?? "auto"))}`);
  console.log(`  TTS:           ${chalk.bold(String(params.ttsProvider ?? "auto"))}${params.skipNarration ? chalk.dim(" (skipped)") : ""}`);
  console.log(`  Image:         ${chalk.bold(String(params.imageProvider ?? "openai"))} ${chalk.dim(`${params.imageQuality} ${params.imageSize}`)}${params.skipBackdrop ? chalk.dim(" (skipped)") : ""}`);
  console.log(`  Render:        ${chalk.bold(params.skipRender ? "skip" : "yes")}`);
  console.log(`  Regenerate:    ${chalk.bold(params.force ? "yes" : "cache when possible")}`);
  console.log();
  console.log(chalk.dim("No assets, provider calls, or video files were created."));
}

function printNeedsAuthor(result: SceneBuildResult): void {
  console.log(chalk.cyan("Agent authoring required"));
  console.log();
  console.log(chalk.bold.cyan("Missing compositions"));
  console.log(chalk.dim("-".repeat(60)));
  const missing = result.composePrompts?.beats.filter((beat) => !beat.exists) ?? [];
  if (missing.length === 0) {
    console.log(chalk.dim("  No missing files were reported. Re-run `vibe build` to continue."));
  } else {
    for (const beat of missing) {
      const dur = beat.duration !== undefined ? chalk.dim(` ${beat.duration}s`) : "";
      console.log(`  ${chalk.bold(beat.id)}${dur} -> ${beat.outputPath}`);
    }
  }
  console.log();
  console.log(chalk.bold.cyan("Next"));
  console.log(chalk.dim("-".repeat(60)));
  console.log("  Ask your coding agent to author the missing HTML files.");
  console.log("  Then run: vibe build");
  console.log(chalk.dim("  Use `vibe build --mode batch` when you want the CLI to call an LLM composer instead."));
}

function printBuildResult(spinner: ReturnType<typeof ora> | null, result: SceneBuildResult, projectDirArg: string): void {
  spinner?.succeed(chalk.green(result.outputPath ? `Build complete: ${result.outputPath}` : "Build complete"));
  console.log();
  console.log(chalk.bold.cyan("Beats"));
  console.log(chalk.dim("-".repeat(60)));
  for (const beat of result.beats) {
    const narration = formatPrimitiveStatus(beat.narrationStatus, beat.narrationPath);
    const backdrop = formatPrimitiveStatus(beat.backdropStatus, beat.backdropPath);
    console.log(`  ${chalk.bold(beat.beatId.padEnd(12))} narration: ${narration}   backdrop: ${backdrop}`);
    if (beat.narrationError) console.log(chalk.red(`    ! narration: ${beat.narrationError}`));
    if (beat.backdropError) console.log(chalk.red(`    ! backdrop: ${beat.backdropError}`));
  }
  if (result.composeData) {
    console.log();
    console.log(chalk.bold.cyan("Compose"));
    console.log(chalk.dim("-".repeat(60)));
    console.log(`  beats     ${result.composeData.beats}`);
    console.log(`  cache     ${result.composeData.cacheHits} hit / ${result.composeData.beats - result.composeData.cacheHits} fresh`);
    console.log(`  cost      $${result.composeData.totalCostUsd.toFixed(4)}`);
  }
  console.log();
  console.log(chalk.bold.cyan("Next"));
  console.log(chalk.dim("-".repeat(60)));
  if (result.outputPath) {
    console.log(`  Watch: ${result.outputPath}`);
  } else {
    console.log(`  Render: vibe render ${projectDirArg}`);
  }
  console.log(chalk.dim(`  Total: ${(result.totalLatencyMs / 1000).toFixed(1)}s`));
}

function formatPrimitiveStatus(status: string, path?: string): string {
  switch (status) {
    case "generated":
      return chalk.green(path ?? "generated");
    case "cached":
      return chalk.dim(path ?? "cached");
    case "skipped":
      return chalk.dim("skipped");
    case "missing":
      return chalk.yellow("missing cue");
    case "failed":
      return chalk.red("failed");
    default:
      return status;
  }
}
