import {
  executeDetectScenes,
  executeDetectSilence,
  executeDetectBeats,
} from "@vibeframe/cli/commands/detect";

export const detectionTools = [
  {
    name: "detect_scenes",
    description: "Detect scene changes in video using FFmpeg. No API key needed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        videoPath: { type: "string", description: "Path to the input video file" },
        threshold: { type: "number", description: "Scene change threshold 0-1 (default: 0.3)" },
        outputPath: { type: "string", description: "Optional: save results as JSON file" },
      },
      required: ["videoPath"],
    },
  },
  {
    name: "detect_silence",
    description: "Detect silence periods in audio/video using FFmpeg. No API key needed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        mediaPath: { type: "string", description: "Path to the audio/video file" },
        noise: { type: "string", description: "Noise threshold in dB (default: -30)" },
        duration: { type: "string", description: "Minimum silence duration in seconds (default: 0.5)" },
        outputPath: { type: "string", description: "Optional: save results as JSON file" },
      },
      required: ["mediaPath"],
    },
  },
  {
    name: "detect_beats",
    description: "Detect beats in audio for music sync using FFmpeg loudness analysis. No API key needed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        audioPath: { type: "string", description: "Path to the audio file" },
        outputPath: { type: "string", description: "Optional: save results as JSON file" },
      },
      required: ["audioPath"],
    },
  },
];

export async function handleDetectionToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "detect_scenes": {
      const result = await executeDetectScenes({
        videoPath: args.videoPath as string,
        threshold: args.threshold as number | undefined,
        outputPath: args.outputPath as string | undefined,
      });
      if (!result.success) return `Scene detection failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        sceneCount: result.scenes?.length,
        totalDuration: result.totalDuration,
        scenes: result.scenes,
      });
    }

    case "detect_silence": {
      const result = await executeDetectSilence({
        mediaPath: args.mediaPath as string,
        noise: args.noise as string | undefined,
        duration: args.duration as string | undefined,
        outputPath: args.outputPath as string | undefined,
      });
      if (!result.success) return `Silence detection failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        silenceCount: result.silences?.length,
        silences: result.silences,
      });
    }

    case "detect_beats": {
      const result = await executeDetectBeats({
        audioPath: args.audioPath as string,
        outputPath: args.outputPath as string | undefined,
      });
      if (!result.success) return `Beat detection failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        beatCount: result.beatCount,
        beats: result.beats,
      });
    }

    default:
      throw new Error(`Unknown detection tool: ${name}`);
  }
}
