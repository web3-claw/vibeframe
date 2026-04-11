/**
 * Video as Code — Pipeline type definitions
 *
 * A pipeline is a declarative YAML file that defines a sequence of steps.
 * Each step maps to an existing execute function in the CLI.
 */

/** Supported pipeline actions (maps to execute functions) */
export type PipelineAction =
  // Generate
  | "generate-image"
  | "generate-video"
  | "generate-tts"
  | "generate-sfx"
  | "generate-music"
  | "generate-storyboard"
  | "generate-motion"
  // Edit
  | "edit-silence-cut"
  | "edit-jump-cut"
  | "edit-caption"
  | "edit-noise-reduce"
  | "edit-fade"
  | "edit-translate-srt"
  | "edit-text-overlay"
  | "edit-grade"
  | "edit-speed-ramp"
  | "edit-reframe"
  | "edit-interpolate"
  | "edit-upscale"
  | "edit-image"
  // Audio
  | "audio-transcribe"
  | "audio-isolate"
  | "audio-dub"
  | "audio-duck"
  // Detect
  | "detect-scenes"
  | "detect-silence"
  | "detect-beats"
  // Analyze
  | "analyze-video"
  | "analyze-media"
  // Review
  | "review-video"
  // Meta
  | "export";

/** A single step in the pipeline */
export interface PipelineStep {
  /** Unique step identifier (used for variable references) */
  id: string;
  /** Action to execute */
  action: PipelineAction;
  /** Step parameters (action-specific, may contain $refs) */
  [key: string]: unknown;
}

/** Pipeline manifest (parsed from YAML) */
export interface PipelineManifest {
  /** Pipeline name */
  name: string;
  /** Optional description */
  description?: string;
  /** Pipeline version */
  version?: number;
  /** Steps to execute */
  steps: PipelineStep[];
}

/** Result of a single step execution */
export interface StepResult {
  id: string;
  action: PipelineAction;
  success: boolean;
  /** Primary output path */
  output?: string;
  /** All result data (action-specific) */
  data?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
  /** Execution time in ms */
  duration?: number;
}

/** Result of full pipeline execution */
export interface PipelineResult {
  success: boolean;
  name: string;
  steps: StepResult[];
  completedSteps: number;
  totalSteps: number;
  totalDuration?: number;
  outputDir?: string;
  error?: string;
}
