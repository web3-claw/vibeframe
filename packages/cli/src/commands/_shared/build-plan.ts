import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { parseStoryboard } from "./storyboard-parse.js";
import { readProjectConfig, type LoadedProjectConfig } from "./project-config.js";
import { validateStoryboardMarkdown, type StoryboardValidationIssue } from "./storyboard-edit.js";

export type BuildStage = "assets" | "compose" | "sync" | "render" | "all";

export interface BuildPlanBeat {
  id: string;
  heading: string;
  durationSec: number | null;
  cues: Record<string, unknown>;
  assets: {
    narration: AssetPlan | null;
    backdrop: AssetPlan | null;
    video: AssetPlan | null;
    music: AssetPlan | null;
  };
  composition: {
    path: string;
    exists: boolean;
  };
}

export interface AssetPlan {
  cue: string;
  path: string;
  exists: boolean;
  willGenerate: boolean;
  estimatedCostUsd: number;
}

export interface BuildPlanResult {
  projectDir: string;
  config: LoadedProjectConfig;
  stage: BuildStage;
  mode: "agent" | "batch" | "auto";
  beat: string | null;
  beats: BuildPlanBeat[];
  missing: string[];
  providers: string[];
  estimatedCostUsd: number;
  warnings: string[];
  retryWith: string[];
  validation: {
    ok: boolean;
    issues: StoryboardValidationIssue[];
  };
}

export interface CreateBuildPlanOptions {
  projectDir: string;
  stage?: BuildStage;
  beat?: string;
  mode?: "agent" | "batch" | "auto";
  skipNarration?: boolean;
  skipBackdrop?: boolean;
  force?: boolean;
}

const NARRATION_COST_USD = 0.05;
const BACKDROP_COST_USD = 3;
const VIDEO_COST_USD = 5;
const MUSIC_COST_USD = 0.5;
const COMPOSE_COST_USD = 0.06;

export async function createBuildPlan(opts: CreateBuildPlanOptions): Promise<BuildPlanResult> {
  const projectDir = resolve(opts.projectDir);
  const stage = opts.stage ?? "all";
  const config = await readProjectConfig(projectDir);
  const storyboardPath = join(projectDir, "STORYBOARD.md");
  const warnings: string[] = [];
  const retryWith: string[] = [];

  if (!existsSync(storyboardPath)) {
    return {
      projectDir,
      config,
      stage,
      mode: opts.mode ?? config.config.build.mode,
      beat: opts.beat ?? null,
      beats: [],
      missing: ["storyboard"],
      providers: [],
      estimatedCostUsd: 0,
      warnings: [`STORYBOARD.md not found at ${storyboardPath}.`],
      retryWith: [`vibe init ${projectDir} --from "<brief>" --json`],
      validation: {
        ok: false,
        issues: [{
          severity: "error",
          code: "STORYBOARD_NOT_FOUND",
          message: `STORYBOARD.md not found at ${storyboardPath}.`,
        }],
      },
    };
  }

  const storyboardMd = await readFile(storyboardPath, "utf-8");
  const validation = validateStoryboardMarkdown(storyboardMd);
  const parsed = parseStoryboard(storyboardMd);
  let sourceBeats = parsed.beats;
  if (opts.beat) {
    const selected = sourceBeats.find((beat) => beat.id === opts.beat);
    if (!selected) {
      warnings.push(`Beat "${opts.beat}" not found. Available: ${sourceBeats.map((beat) => beat.id).join(", ")}`);
      retryWith.push(`vibe storyboard list ${projectDir} --json`);
      sourceBeats = [];
    } else {
      sourceBeats = [selected];
    }
  }

  const providers = new Set<string>();
  const missing = new Set<string>();
  let estimatedCostUsd = 0;
  const includeAssets = stage === "all" || stage === "assets";
  const includeCompose = stage === "all" || stage === "compose";

  const beats = sourceBeats.map((beat) => {
    const cue = beat.cues ?? {};
    const narration = typeof cue.narration === "string" && !opts.skipNarration
      ? assetPlan({
          cue: cue.narration,
          path: firstExisting(projectDir, [`assets/narration-${beat.id}.mp3`, `assets/narration-${beat.id}.wav`]) ?? `assets/narration-${beat.id}.mp3`,
          projectDir,
          force: opts.force,
          cost: NARRATION_COST_USD,
          active: includeAssets,
        })
      : null;
    const backdrop = typeof cue.backdrop === "string" && !opts.skipBackdrop
      ? assetPlan({
          cue: cue.backdrop,
          path: `assets/backdrop-${beat.id}.png`,
          projectDir,
          force: opts.force,
          cost: BACKDROP_COST_USD,
          active: includeAssets,
        })
      : null;
    const video = typeof cue.video === "string"
      ? assetPlan({
          cue: cue.video,
          path: `assets/video-${beat.id}.mp4`,
          projectDir,
          force: opts.force,
          cost: VIDEO_COST_USD,
          active: includeAssets,
        })
      : null;
    const music = typeof cue.music === "string"
      ? assetPlan({
          cue: cue.music,
          path: `assets/music-${beat.id}.mp3`,
          projectDir,
          force: opts.force,
          cost: MUSIC_COST_USD,
          active: includeAssets,
        })
      : null;
    const compositionPath = `compositions/scene-${beat.id}.html`;
    const compositionExists = existsSync(join(projectDir, compositionPath));

    for (const asset of [narration, backdrop, video, music]) {
      if (!asset) continue;
      if (asset.willGenerate) {
        estimatedCostUsd += asset.estimatedCostUsd;
        missing.add("assets");
      }
    }
    if (narration?.willGenerate) providers.add(config.config.providers.narration ?? "auto-tts");
    if (backdrop?.willGenerate) providers.add(config.config.providers.image ?? "openai");
    if (video?.willGenerate) providers.add(config.config.providers.video ?? "video-provider");
    if (music?.willGenerate) providers.add(config.config.providers.music ?? "music-provider");
    if (!compositionExists) missing.add("compositions");
    if (includeCompose && !compositionExists && (opts.mode ?? config.config.build.mode) !== "agent") {
      estimatedCostUsd += COMPOSE_COST_USD;
      providers.add(config.config.providers.composer ?? "auto-composer");
    }

    return {
      id: beat.id,
      heading: beat.heading,
      durationSec: beat.duration ?? null,
      cues: cue,
      assets: { narration, backdrop, video, music },
      composition: {
        path: compositionPath,
        exists: compositionExists,
      },
    };
  });

  if (!existsSync(join(projectDir, config.config.composition.entry))) {
    missing.add("root-composition");
    retryWith.push(`vibe build ${projectDir} --stage sync --json`);
  }
  if (config.legacy) {
    warnings.push(`Using legacy ${config.source}; write ${projectDir}/vibe.config.json to use the TO-BE project contract.`);
  }
  if (!validation.ok) {
    retryWith.push(`vibe storyboard validate ${projectDir} --json`);
  }

  return {
    projectDir,
    config,
    stage,
    mode: opts.mode ?? config.config.build.mode,
    beat: opts.beat ?? null,
    beats,
    missing: [...missing],
    providers: [...providers].filter(Boolean),
    estimatedCostUsd: Number(estimatedCostUsd.toFixed(2)),
    warnings,
    retryWith,
    validation: {
      ok: validation.ok,
      issues: validation.issues,
    },
  };
}

function assetPlan(opts: {
  cue: string;
  path: string;
  projectDir: string;
  cost: number;
  active: boolean;
  force?: boolean;
}): AssetPlan {
  const exists = existsSync(join(opts.projectDir, opts.path));
  const willGenerate = opts.active && (!exists || !!opts.force);
  return {
    cue: opts.cue,
    path: opts.path,
    exists,
    willGenerate,
    estimatedCostUsd: willGenerate ? opts.cost : 0,
  };
}

function firstExisting(projectDir: string, paths: string[]): string | null {
  for (const path of paths) {
    if (existsSync(join(projectDir, path))) return path;
  }
  return null;
}
