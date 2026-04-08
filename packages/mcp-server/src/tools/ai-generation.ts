import { executeMotion } from "@vibeframe/cli/commands/ai-motion";
import { executeAnimatedCaption } from "@vibeframe/cli/commands/ai-animated-caption";
import { executeRegenerateScene } from "@vibeframe/cli/commands/ai-script-pipeline";

export const aiGenerationTools = [
  {
    name: "generate_motion",
    description: "Generate motion graphics using Claude or Gemini + Remotion. Requires ANTHROPIC_API_KEY (Claude) or GOOGLE_API_KEY (Gemini).",
    inputSchema: {
      type: "object" as const,
      properties: {
        description: { type: "string", description: "Description of the motion graphic to generate" },
        duration: { type: "number", description: "Duration in seconds (default: 5)" },
        width: { type: "number", description: "Width in pixels (default: 1920)" },
        height: { type: "number", description: "Height in pixels (default: 1080)" },
        fps: { type: "number", description: "Frames per second (default: 30)" },
        style: { type: "string", description: "Visual style guidance" },
        render: { type: "boolean", description: "Render with Remotion (default: false, returns TSX only)" },
        video: { type: "string", description: "Base video path to composite motion graphic onto" },
        image: { type: "string", description: "Reference image for color/mood analysis" },
        model: {
          type: "string",
          enum: ["sonnet", "opus", "gemini", "gemini-3.1-pro"],
          description: "LLM model for code generation (default: sonnet)",
        },
        output: { type: "string", description: "Output path (TSX if code-only, MP4 if rendered)" },
      },
      required: ["description"],
    },
  },
  {
    name: "edit_animated_caption",
    description: "Add animated word-by-word captions (TikTok/Reels style). Supports highlight, bounce, pop-in, neon, karaoke-sweep, typewriter styles. Requires OPENAI_API_KEY for Whisper.",
    inputSchema: {
      type: "object" as const,
      properties: {
        videoPath: { type: "string", description: "Path to the input video file" },
        outputPath: { type: "string", description: "Path for the output video" },
        style: {
          type: "string",
          enum: ["highlight", "bounce", "pop-in", "neon", "karaoke-sweep", "typewriter"],
          description: "Animation style (default: highlight)",
        },
        highlightColor: { type: "string", description: "Highlight/accent color (default: #FFD700)" },
        fontSize: { type: "number", description: "Font size in pixels" },
        position: {
          type: "string",
          enum: ["top", "center", "bottom"],
          description: "Caption position (default: bottom)",
        },
        wordsPerGroup: { type: "number", description: "Words per caption group (default: 4)" },
        maxChars: { type: "number", description: "Max characters per group (default: 30)" },
        language: { type: "string", description: "Language code for transcription (default: en)" },
        fast: { type: "boolean", description: "Use ASS rendering instead of Remotion (faster but fewer styles)" },
      },
      required: ["videoPath", "outputPath"],
    },
  },
  {
    name: "pipeline_regenerate_scene",
    description: "Regenerate specific scenes in an existing script-to-video project. Can regenerate video, image, or narration independently.",
    inputSchema: {
      type: "object" as const,
      properties: {
        projectDir: { type: "string", description: "Path to the project output directory containing storyboard.json" },
        scenes: {
          type: "array",
          items: { type: "number" },
          description: "1-indexed scene numbers to regenerate",
        },
        videoOnly: { type: "boolean", description: "Only regenerate video (keep existing image)" },
        narrationOnly: { type: "boolean", description: "Only regenerate narration audio" },
        imageOnly: { type: "boolean", description: "Only regenerate scene image" },
        generator: {
          type: "string",
          enum: ["kling", "runway", "veo"],
          description: "Video generation provider",
        },
        imageProvider: {
          type: "string",
          enum: ["gemini", "openai", "grok"],
          description: "Image generation provider",
        },
        voice: { type: "string", description: "ElevenLabs voice name or ID" },
        aspectRatio: {
          type: "string",
          enum: ["16:9", "9:16", "1:1"],
          description: "Video aspect ratio",
        },
        retries: { type: "number", description: "Max retries per video generation call (default: 2)" },
      },
      required: ["projectDir", "scenes"],
    },
  },
];

export async function handleAiGenerationToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "generate_motion": {
      const result = await executeMotion({
        description: args.description as string,
        duration: args.duration as number | undefined,
        width: args.width as number | undefined,
        height: args.height as number | undefined,
        fps: args.fps as number | undefined,
        style: args.style as string | undefined,
        render: args.render as boolean | undefined,
        video: args.video as string | undefined,
        image: args.image as string | undefined,
        model: args.model as string | undefined,
        output: args.output as string | undefined,
      });
      if (!result.success) return `Motion generation failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        codePath: result.codePath,
        renderedPath: result.renderedPath,
        compositedPath: result.compositedPath,
      });
    }

    case "edit_animated_caption": {
      const result = await executeAnimatedCaption({
        videoPath: args.videoPath as string,
        outputPath: args.outputPath as string,
        style: (args.style as string | undefined) as "highlight" | "bounce" | "pop-in" | "neon" | "karaoke-sweep" | "typewriter" || "highlight",
        highlightColor: (args.highlightColor as string) || "#FFD700",
        fontSize: args.fontSize as number | undefined,
        position: (args.position as "top" | "center" | "bottom") || "bottom",
        wordsPerGroup: args.wordsPerGroup as number | undefined,
        maxChars: args.maxChars as number | undefined,
        language: args.language as string | undefined,
        fast: args.fast as boolean | undefined,
      });
      if (!result.success) return `Animated caption failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        outputPath: result.outputPath,
        wordCount: result.wordCount,
        groupCount: result.groupCount,
        style: result.style,
        tier: result.tier,
      });
    }

    case "pipeline_regenerate_scene": {
      const result = await executeRegenerateScene({
        projectDir: args.projectDir as string,
        scenes: args.scenes as number[],
        videoOnly: args.videoOnly as boolean | undefined,
        narrationOnly: args.narrationOnly as boolean | undefined,
        imageOnly: args.imageOnly as boolean | undefined,
        generator: args.generator as "kling" | "runway" | "veo" | undefined,
        imageProvider: args.imageProvider as "gemini" | "openai" | "grok" | undefined,
        voice: args.voice as string | undefined,
        aspectRatio: args.aspectRatio as "16:9" | "9:16" | "1:1" | undefined,
        retries: args.retries as number | undefined,
      });
      if (!result.success) return `Scene regeneration failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        regeneratedScenes: result.regeneratedScenes,
        failedScenes: result.failedScenes,
      });
    }

    default:
      throw new Error(`Unknown AI generation tool: ${name}`);
  }
}
