/**
 * Doctor command - System health check and capability report
 */

import { Command } from "commander";
import chalk from "chalk";
import { access } from "node:fs/promises";
import { CONFIG_PATH } from "../config/index.js";
import { PROVIDER_ENV_VARS } from "../config/schema.js";
import { commandExists } from "../utils/exec-safe.js";
import { execSafe } from "../utils/exec-safe.js";
import { loadEnv } from "../utils/api-key.js";

/** Mapping of env vars to the commands they unlock */
const COMMAND_KEY_MAP: Record<string, string[]> = {
  GOOGLE_API_KEY: [
    "generate image",
    "generate video -p veo",
    "edit image",
    "analyze media",
    "analyze video",
    "analyze review",
  ],
  OPENAI_API_KEY: [
    "agent -p openai",
    "generate image -p openai",
    "edit image -p openai",
    "audio transcribe",
    "edit caption",
    "edit jump-cut",
  ],
  ANTHROPIC_API_KEY: [
    "agent -p claude",
    "generate storyboard",
    "generate motion",
    "edit grade",
    "edit reframe",
    "edit speed-ramp",
    "pipeline script-to-video",
  ],
  XAI_API_KEY: [
    "agent -p xai",
    "generate image -p grok",
    "generate video",
    "edit image -p grok",
  ],
  ELEVENLABS_API_KEY: [
    "generate speech",
    "generate sound-effect",
    "generate music",
    "audio voices",
    "audio voice-clone",
    "audio dub",
  ],
  KLING_API_KEY: ["generate video -p kling"],
  RUNWAY_API_SECRET: ["generate video -p runway"],
  REPLICATE_API_TOKEN: ["generate music -p replicate"],
  IMGBB_API_KEY: ["generate video -p kling (image-to-video)"],
};

/** Commands that need no API key (FFmpeg only) */
const FREE_COMMANDS = [
  "edit silence-cut",
  "edit noise-reduce",
  "edit fade",
  "edit text-overlay",
  "detect scenes",
  "detect silence",
  "detect beats",
  "export",
  "project create/info",
  "timeline (all)",
  "batch import/concat",
];

export const doctorCommand = new Command("doctor")
  .description("Check system health and available commands")
  .option("--json", "Output in JSON format")
  .addHelpText(
    "after",
    `
Examples:
  $ vibe doctor              Show system health and capabilities
  $ vibe doctor --json       Machine-readable output
`
  )
  .action(async (options) => {
    const isJson = options.json || process.env.VIBE_JSON_OUTPUT === "1";
    const results = await runDiagnostics();

    if (isJson) {
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    printReport(results);
  });

interface DiagnosticResults {
  system: {
    node: { version: string; ok: boolean };
    ffmpeg: { version: string | null; ok: boolean };
    config: { path: string; ok: boolean };
  };
  providers: Record<
    string,
    { envVar: string; configured: boolean; commands: string[] }
  >;
  readyCount: number;
  totalCount: number;
}

async function runDiagnostics(): Promise<DiagnosticResults> {
  loadEnv();

  // System checks
  const nodeVersion = process.version;

  let ffmpegVersion: string | null = null;
  const ffmpegExists = commandExists("ffmpeg");
  if (ffmpegExists) {
    try {
      const result = await execSafe("ffmpeg", ["-version"]);
      const match = result.stdout.match(/ffmpeg version (\S+)/);
      ffmpegVersion = match ? match[1] : "unknown";
    } catch {
      ffmpegVersion = "unknown";
    }
  }

  let configExists = false;
  try {
    await access(CONFIG_PATH);
    configExists = true;
  } catch {
    // not configured
  }

  // Provider checks
  const providers: DiagnosticResults["providers"] = {};
  let readyCount = FREE_COMMANDS.length;
  let totalCount = FREE_COMMANDS.length;

  for (const [envVar, commands] of Object.entries(COMMAND_KEY_MAP)) {
    const configured = !!process.env[envVar];
    const providerName =
      Object.entries(PROVIDER_ENV_VARS).find(([, v]) => v === envVar)?.[0] ??
      envVar;
    providers[providerName] = { envVar, configured, commands };
    totalCount += commands.length;
    if (configured) {
      readyCount += commands.length;
    }
  }

  return {
    system: {
      node: { version: nodeVersion, ok: true },
      ffmpeg: { version: ffmpegVersion, ok: ffmpegExists },
      config: { path: CONFIG_PATH, ok: configExists },
    },
    providers,
    readyCount,
    totalCount,
  };
}

function printReport(results: DiagnosticResults): void {
  console.log();
  console.log(chalk.bold("  System"));

  // Node
  const nodeIcon = results.system.node.ok ? chalk.green("OK") : chalk.red("MISSING");
  console.log(`    Node.js    ${results.system.node.version}  ${nodeIcon}`);

  // FFmpeg
  if (results.system.ffmpeg.ok) {
    console.log(
      `    FFmpeg     ${results.system.ffmpeg.version}  ${chalk.green("OK")}`
    );
  } else {
    console.log(`    FFmpeg     ${chalk.red("NOT FOUND")}  ${chalk.dim("Install: brew install ffmpeg")}`);
  }

  // Config
  if (results.system.config.ok) {
    console.log(`    Config     ${chalk.green("OK")}  ${chalk.dim(results.system.config.path)}`);
  } else {
    console.log(
      `    Config     ${chalk.yellow("NOT SET")}  ${chalk.dim("Run: vibe setup")}`
    );
  }

  console.log();
  console.log(chalk.bold("  API Keys"));

  const configured: string[] = [];
  const missing: string[] = [];

  for (const [name, info] of Object.entries(results.providers)) {
    if (info.configured) {
      configured.push(name);
      console.log(
        `    ${chalk.green("OK")}  ${info.envVar.padEnd(24)} ${chalk.dim(info.commands.join(", "))}`
      );
    } else {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    for (const name of missing) {
      const info = results.providers[name];
      console.log(
        `    ${chalk.red("--")}  ${info.envVar.padEnd(24)} ${chalk.dim(info.commands.join(", "))}`
      );
    }
  }

  // Free commands
  console.log();
  console.log(chalk.bold("  No API key needed"));
  console.log(`    ${chalk.dim(FREE_COMMANDS.join(", "))}`);

  // Summary
  console.log();
  const pct = Math.round((results.readyCount / results.totalCount) * 100);
  const readyColor = pct >= 80 ? chalk.green : pct >= 40 ? chalk.yellow : chalk.red;
  console.log(
    `  Ready: ${readyColor(`${results.readyCount}/${results.totalCount}`)} commands (${pct}%)`
  );

  if (missing.length > 0) {
    console.log(chalk.dim(`  Run 'vibe setup' to configure more providers.`));
  }
  console.log();
}
