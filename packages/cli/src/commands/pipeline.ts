/**
 * @module pipeline
 *
 * Top-level `vibe pipeline` command group for AI video pipelines.
 *
 * Commands:
 *   pipeline script-to-video  - Full script-to-video pipeline
 *   pipeline regenerate-scene - Regenerate specific scene(s)
 *   pipeline highlights       - Extract highlights from long-form content
 *   pipeline auto-shorts      - Generate short-form clips from long-form video
 *   pipeline viral            - Viral optimizer for multi-platform export
 *   pipeline b-roll           - B-roll matching using Whisper + Claude Vision
 *   pipeline narrate          - Auto-narration (Gemini + Claude/OpenAI + ElevenLabs)
 *
 * @dependencies Whisper, Claude, Gemini, ElevenLabs, Kling, Runway, FFmpeg
 */

import { Command } from "commander";
import { resolve, dirname, basename } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import chalk from "chalk";
import ora from "ora";
import { Project, type ProjectFile } from "../engine/index.js";
import { ffprobeDuration } from "../utils/exec-safe.js";
import { getAudioDuration } from "../utils/audio.js";
import { formatTime } from "./ai-helpers.js";
import { autoNarrate } from "./ai-narrate.js";
import { registerScriptPipelineCommands } from "./ai-script-pipeline-cli.js";
import { registerHighlightsCommands } from "./ai-highlights.js";
import { registerViralCommand } from "./ai-viral.js";
import { registerBrollCommand } from "./ai-broll.js";
import { executeAnimatedCaption, type AnimatedCaptionStyle } from "./ai-animated-caption.js";
import { isJsonMode, outputResult } from "./output.js";

export const pipelineCommand = new Command("pipeline")
  .description(
    "AI video pipelines (script-to-video, highlights, shorts, animated-caption)"
  )
  .addHelpText(
    "after",
    `
Examples:
  $ vibe pipeline script-to-video "A day in the life..." -o ./output/ -g kling
  $ vibe pipeline script-to-video "..." -o ./output/ --images-only
  $ vibe pipeline highlights long-video.mp4 -o highlights.json -d 60
  $ vibe pipeline auto-shorts long-video.mp4 -o shorts/ -n 3 --add-captions
  $ vibe pipeline animated-caption video.mp4 -o captioned.mp4 -s highlight
  $ vibe pipeline animated-caption video.mp4 -o out.mp4 -s karaoke-sweep --fast

Required API Keys (pipelines use multiple providers):
  script-to-video:     ANTHROPIC_API_KEY + GOOGLE_API_KEY + ELEVENLABS_API_KEY
                       + video provider key (KLING_API_KEY / RUNWAY_API_SECRET / GOOGLE_API_KEY)
  highlights:          GOOGLE_API_KEY (Gemini analysis)
  auto-shorts:         GOOGLE_API_KEY + OPENAI_API_KEY (optional captions)
  animated-caption:    OPENAI_API_KEY (Whisper transcription)

Use '--dry-run' to preview parameters before execution.
Run 'vibe setup --show' to check API key status.
`
  );

// ── pipeline script-to-video & regenerate-scene ────────────────────────

registerScriptPipelineCommands(pipelineCommand);

// ── pipeline highlights & auto-shorts ──────────────────────────────────

registerHighlightsCommands(pipelineCommand);

// ── pipeline viral ─────────────────────────────────────────────────────

registerViralCommand(pipelineCommand);

// ── pipeline b-roll ────────────────────────────────────────────────────

registerBrollCommand(pipelineCommand);

// ── pipeline narrate ───────────────────────────────────────────────────

pipelineCommand
  .command("narrate")
  .description("Generate AI narration for a video file or project (deprecated)")
  .argument("<input>", "Video file or project file (.vibe.json)")
  .option("-o, --output <dir>", "Output directory for generated files", ".")
  .option("-v, --voice <name>", "ElevenLabs voice name (rachel, adam, josh, etc.)", "rachel")
  .option("-s, --style <style>", "Narration style: informative, energetic, calm, dramatic", "informative")
  .option("-l, --language <lang>", "Language code (e.g., en, ko)", "en")
  .option("-p, --provider <name>", "LLM for script generation: claude (default), openai", "claude")
  .option("--add-to-project", "Add narration to project (only for .vibe.json input)")
  .option("--dry-run", "Preview pipeline parameters without executing")
  .action(async (inputPath: string, options) => {
    try {
      console.warn(chalk.yellow("Warning: 'pipeline narrate' is deprecated. Use individual commands instead:"));
      console.warn(chalk.dim("  vibe analyze video <video> 'describe scenes' → vibe generate speech '<script>'"));
      console.warn();

      const absPath = resolve(process.cwd(), inputPath);
      if (!existsSync(absPath)) {
        console.error(chalk.red(`File not found: ${absPath}`));
        process.exit(1);
      }

      if (options.dryRun) {
        outputResult({ dryRun: true, command: "pipeline narrate", params: { inputPath, voice: options.voice, style: options.style, language: options.language, provider: options.provider } });
        return;
      }

      console.log();
      console.log(chalk.bold.cyan("Auto-Narrate Pipeline"));
      console.log(chalk.dim("─".repeat(60)));
      console.log();

      const isProject = inputPath.endsWith(".vibe.json");
      let videoPath: string;
      let project: Project | null = null;
      let outputDir = resolve(process.cwd(), options.output);

      if (isProject) {
        // Load project to find video source
        const content = await readFile(absPath, "utf-8");
        const data: ProjectFile = JSON.parse(content);
        project = Project.fromJSON(data);
        const sources = project.getSources();
        const videoSource = sources.find((s) => s.type === "video");

        if (!videoSource) {
          console.error(chalk.red("No video source found in project"));
          process.exit(1);
        }

        videoPath = resolve(dirname(absPath), videoSource.url);
        if (!existsSync(videoPath)) {
          console.error(chalk.red(`Video file not found: ${videoPath}`));
          process.exit(1);
        }

        // Use project directory as output if not specified
        if (options.output === ".") {
          outputDir = dirname(absPath);
        }

        console.log(`Project: ${chalk.bold(project.getMeta().name)}`);
      } else {
        videoPath = absPath;
        console.log(`Video: ${chalk.bold(basename(videoPath))}`);
      }

      // Get video duration
      const durationSpinner = ora("Analyzing video...").start();
      let duration: number;
      try {
        duration = await ffprobeDuration(videoPath);
        durationSpinner.succeed(chalk.green(`Duration: ${formatTime(duration)}`));
      } catch {
        durationSpinner.fail(chalk.red("Failed to get video duration"));
        process.exit(1);
      }

      // Validate style option
      const validStyles = ["informative", "energetic", "calm", "dramatic"];
      if (!validStyles.includes(options.style)) {
        console.error(chalk.red(`Invalid style: ${options.style}`));
        console.error(chalk.dim(`Valid styles: ${validStyles.join(", ")}`));
        process.exit(1);
      }

      // Generate narration
      const generateSpinner = ora("Generating narration...").start();

      generateSpinner.text = "Analyzing video with Gemini...";
      const result = await autoNarrate({
        videoPath,
        duration,
        outputDir,
        voice: options.voice,
        style: options.style as "informative" | "energetic" | "calm" | "dramatic",
        language: options.language,
        scriptProvider: options.provider as "claude" | "openai",
      });

      if (!result.success) {
        generateSpinner.fail(chalk.red(`Failed: ${result.error}`));
        process.exit(1);
      }

      generateSpinner.succeed(chalk.green("Narration generated successfully"));

      if (isJsonMode()) {
        outputResult({ success: true, audioPath: result.audioPath, segments: result.segments?.map(s => ({ startTime: s.startTime, endTime: s.endTime, text: s.text })) });
        return;
      }

      // Display result
      console.log();
      console.log(chalk.bold.cyan("Generated Files"));
      console.log(chalk.dim("─".repeat(60)));
      console.log(`  Audio: ${chalk.green(result.audioPath)}`);
      console.log(`  Script: ${chalk.green(resolve(outputDir, "narration-script.txt"))}`);

      if (result.segments && result.segments.length > 0) {
        console.log();
        console.log(chalk.bold.cyan("Narration Segments"));
        console.log(chalk.dim("─".repeat(60)));
        for (const seg of result.segments.slice(0, 5)) {
          console.log(`  [${formatTime(seg.startTime)} - ${formatTime(seg.endTime)}] ${chalk.dim(seg.text.substring(0, 50))}${seg.text.length > 50 ? "..." : ""}`);
        }
        if (result.segments.length > 5) {
          console.log(chalk.dim(`  ... and ${result.segments.length - 5} more segments`));
        }
      }

      // Add to project if requested
      if (options.addToProject && project && isProject) {
        const addSpinner = ora("Adding narration to project...").start();

        // Get audio duration
        let audioDuration: number;
        try {
          audioDuration = await getAudioDuration(result.audioPath!);
        } catch {
          audioDuration = duration; // Fallback to video duration
        }

        // Add audio source
        const audioSource = project.addSource({
          name: "Auto-generated narration",
          url: basename(result.audioPath!),
          type: "audio",
          duration: audioDuration,
        });

        // Add audio clip to audio track
        const audioTrack = project.getTracks().find((t) => t.type === "audio");
        if (audioTrack) {
          project.addClip({
            sourceId: audioSource.id,
            trackId: audioTrack.id,
            startTime: 0,
            duration: Math.min(audioDuration, duration),
            sourceStartOffset: 0,
            sourceEndOffset: Math.min(audioDuration, duration),
          });
        }

        // Save updated project
        await writeFile(absPath, JSON.stringify(project.toJSON(), null, 2), "utf-8");
        addSpinner.succeed(chalk.green("Narration added to project"));
      }

      console.log();
      console.log(chalk.bold.green("Auto-narrate complete!"));

      if (!options.addToProject && isProject) {
        console.log();
        console.log(chalk.dim("Tip: Use --add-to-project to automatically add the narration to your project"));
      }

      console.log();
    } catch (error) {
      console.error(chalk.red("Auto-narrate failed"));
      console.error(error);
      process.exit(1);
    }
  });

// ── pipeline animated-caption ────────────────────────────────────────────

const ANIMATED_CAPTION_STYLES = ["highlight", "bounce", "pop-in", "neon", "karaoke-sweep", "typewriter"];

pipelineCommand
  .command("animated-caption")
  .description("Add animated captions with word-by-word effects (Whisper + Remotion/ASS)")
  .argument("<video>", "Video file path")
  .option("-s, --style <preset>", "Style preset (default: highlight)", "highlight")
  .option("--highlight-color <color>", "Active word highlight color", "#FFFF00")
  .option("--font-size <px>", "Font size (default: auto based on resolution)")
  .option("--position <pos>", "Caption position: top, center, bottom", "bottom")
  .option("--words-per-group <n>", "Words shown at once (default: auto 3-5)")
  .option("--max-chars <n>", "Max characters per group")
  .option("-l, --language <lang>", "Whisper language hint")
  .option("--fast", "Use ASS/FFmpeg only (no Remotion, forces ASS tier styles)")
  .option("-o, --output <path>", "Output file path")
  .option("--dry-run", "Preview parameters without executing")
  .addHelpText(
    "after",
    `
Examples:
  $ vibe pipeline animated-caption video.mp4 -o captioned.mp4
  $ vibe pipeline animated-caption video.mp4 -o out.mp4 -s bounce
  $ vibe pipeline animated-caption video.mp4 -o out.mp4 -s karaoke-sweep --fast

Styles:
  highlight (default)  TikTok-style background highlight on active word (Remotion)
  bounce               Words spring-animate in (Remotion)
  pop-in               Words scale-up on entry (Remotion)
  neon                 Glowing neon effect on active word (Remotion)
  karaoke-sweep        Color sweep across active word (ASS/FFmpeg, fast)
  typewriter           Words appear one by one (ASS/FFmpeg, fast)

Required API Key: OPENAI_API_KEY (Whisper transcription)
`,
  )
  .action(async (videoPath: string, options) => {
    try {
      const absVideoPath = resolve(process.cwd(), videoPath);
      if (!existsSync(absVideoPath)) {
        console.error(chalk.red(`File not found: ${absVideoPath}`));
        process.exit(1);
      }

      // Validate style
      if (!ANIMATED_CAPTION_STYLES.includes(options.style)) {
        console.error(chalk.red(`Invalid style: ${options.style}`));
        console.error(chalk.dim(`Valid styles: ${ANIMATED_CAPTION_STYLES.join(", ")}`));
        process.exit(1);
      }

      const outputFile = options.output || videoPath.replace(/(\.\w+)$/, "-captioned$1");

      if (options.dryRun) {
        outputResult({
          dryRun: true,
          command: "pipeline animated-caption",
          params: {
            videoPath: absVideoPath,
            outputPath: outputFile,
            style: options.style,
            highlightColor: options.highlightColor,
            fontSize: options.fontSize ? parseInt(options.fontSize) : "auto",
            position: options.position,
            wordsPerGroup: options.wordsPerGroup ? parseInt(options.wordsPerGroup) : "auto",
            maxChars: options.maxChars ? parseInt(options.maxChars) : "auto",
            language: options.language || "auto",
            fast: !!options.fast,
          },
        });
        return;
      }

      console.log();
      console.log(chalk.bold.cyan("Animated Caption Pipeline"));
      console.log(chalk.dim("─".repeat(60)));
      console.log(`  Video: ${chalk.bold(basename(absVideoPath))}`);
      console.log(`  Style: ${chalk.bold(options.style)}`);
      console.log(`  Mode:  ${chalk.bold(options.fast ? "ASS (fast)" : "Remotion")}`);
      console.log();

      const spinner = ora("Processing animated captions...").start();

      const result = await executeAnimatedCaption({
        videoPath: absVideoPath,
        outputPath: outputFile,
        style: options.style as AnimatedCaptionStyle,
        highlightColor: options.highlightColor,
        fontSize: options.fontSize ? parseInt(options.fontSize) : undefined,
        position: options.position as "top" | "center" | "bottom",
        wordsPerGroup: options.wordsPerGroup ? parseInt(options.wordsPerGroup) : undefined,
        maxChars: options.maxChars ? parseInt(options.maxChars) : undefined,
        language: options.language,
        fast: options.fast,
      });

      if (!result.success) {
        spinner.fail(chalk.red(result.error || "Animated caption failed"));
        process.exit(1);
      }

      spinner.succeed(chalk.green("Animated captions applied successfully"));

      if (isJsonMode()) {
        outputResult({
          success: true,
          outputPath: result.outputPath,
          wordCount: result.wordCount,
          groupCount: result.groupCount,
          style: result.style,
          tier: result.tier,
        });
        return;
      }

      console.log();
      console.log(chalk.bold.cyan("Result"));
      console.log(chalk.dim("─".repeat(60)));
      console.log(`  Output:  ${chalk.green(result.outputPath)}`);
      console.log(`  Words:   ${result.wordCount}`);
      console.log(`  Groups:  ${result.groupCount}`);
      console.log(`  Style:   ${result.style}`);
      console.log(`  Tier:    ${result.tier}`);
      console.log();
    } catch (error) {
      console.error(chalk.red("Animated caption failed"));
      console.error(error);
      process.exit(1);
    }
  });
