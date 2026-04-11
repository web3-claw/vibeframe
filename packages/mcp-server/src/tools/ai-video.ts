import {
  executeVideoGenerate,
  executeVideoStatus,
  executeVideoCancel,
  executeVideoExtend,
} from "@vibeframe/cli/commands/ai-video";

export const aiVideoTools = [
  {
    name: "generate_video",
    description: "Generate video using AI. Supports Grok (default, free with audio), Kling, Runway, and Veo. Requires provider-specific API key.",
    inputSchema: {
      type: "object" as const,
      properties: {
        prompt: { type: "string", description: "Text prompt describing the video" },
        provider: {
          type: "string",
          enum: ["grok", "kling", "runway", "veo"],
          description: "Video provider (default: kling)",
        },
        image: { type: "string", description: "Reference image path for image-to-video" },
        duration: { type: "number", description: "Duration in seconds (default: 5)" },
        ratio: { type: "string", description: "Aspect ratio: 16:9, 9:16, 1:1 (default: 16:9)" },
        mode: { type: "string", description: "Kling mode: std or pro" },
        negative: { type: "string", description: "Negative prompt (Kling/Veo)" },
        resolution: { type: "string", description: "Resolution: 720p, 1080p, 4k (Veo only)" },
        veoModel: { type: "string", description: "Veo model: 3.0, 3.1, 3.1-fast" },
        runwayModel: { type: "string", description: "Runway model: gen4.5, gen4_turbo" },
        output: { type: "string", description: "Output file path (downloads video)" },
        wait: { type: "boolean", description: "Wait for completion (default: true)" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_video_status",
    description: "Check video generation status for Runway or Kling tasks.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID from video generation" },
        provider: {
          type: "string",
          enum: ["runway", "kling"],
          description: "Provider (default: runway)",
        },
        taskType: {
          type: "string",
          enum: ["text2video", "image2video"],
          description: "Kling task type (default: text2video)",
        },
        wait: { type: "boolean", description: "Wait for completion" },
        output: { type: "string", description: "Download video when complete" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "generate_video_cancel",
    description: "Cancel a Runway video generation task.",
    inputSchema: {
      type: "object" as const,
      properties: {
        taskId: { type: "string", description: "Task ID to cancel" },
      },
      required: ["taskId"],
    },
  },
  {
    name: "generate_video_extend",
    description: "Extend video duration using Kling or Veo. Requires the video/operation ID from a previous generation.",
    inputSchema: {
      type: "object" as const,
      properties: {
        videoId: { type: "string", description: "Video ID (Kling) or operation name (Veo)" },
        provider: {
          type: "string",
          enum: ["kling", "veo"],
          description: "Provider (default: kling)",
        },
        prompt: { type: "string", description: "Continuation prompt" },
        duration: { type: "number", description: "Duration in seconds" },
        negative: { type: "string", description: "Negative prompt (Kling)" },
        veoModel: { type: "string", description: "Veo model: 3.0, 3.1, 3.1-fast" },
        output: { type: "string", description: "Output file path" },
        wait: { type: "boolean", description: "Wait for completion (default: true)" },
      },
      required: ["videoId"],
    },
  },
];

export async function handleAiVideoToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "generate_video": {
      const result = await executeVideoGenerate({
        prompt: args.prompt as string,
        provider: args.provider as "grok" | "runway" | "kling" | "veo" | undefined,
        image: args.image as string | undefined,
        duration: args.duration as number | undefined,
        ratio: args.ratio as string | undefined,
        mode: args.mode as string | undefined,
        negative: args.negative as string | undefined,
        resolution: args.resolution as string | undefined,
        veoModel: args.veoModel as string | undefined,
        runwayModel: args.runwayModel as string | undefined,
        output: args.output as string | undefined,
        wait: args.wait as boolean | undefined,
      });
      if (!result.success) return `Video generation failed: ${result.error}`;
      return JSON.stringify({ success: true, taskId: result.taskId, status: result.status, videoUrl: result.videoUrl, duration: result.duration, outputPath: result.outputPath, provider: result.provider });
    }

    case "generate_video_status": {
      const result = await executeVideoStatus({
        taskId: args.taskId as string,
        provider: args.provider as "runway" | "kling" | undefined,
        taskType: args.taskType as "text2video" | "image2video" | undefined,
        wait: args.wait as boolean | undefined,
        output: args.output as string | undefined,
      });
      if (!result.success) return `Status check failed: ${result.error}`;
      return JSON.stringify({ success: true, taskId: result.taskId, status: result.status, progress: result.progress, videoUrl: result.videoUrl, outputPath: result.outputPath });
    }

    case "generate_video_cancel": {
      const result = await executeVideoCancel({ taskId: args.taskId as string });
      if (!result.success) return `Cancel failed: ${result.error}`;
      return JSON.stringify({ success: true });
    }

    case "generate_video_extend": {
      const result = await executeVideoExtend({
        videoId: args.videoId as string,
        provider: args.provider as "kling" | "veo" | undefined,
        prompt: args.prompt as string | undefined,
        duration: args.duration as number | undefined,
        negative: args.negative as string | undefined,
        veoModel: args.veoModel as string | undefined,
        output: args.output as string | undefined,
        wait: args.wait as boolean | undefined,
      });
      if (!result.success) return `Video extension failed: ${result.error}`;
      return JSON.stringify({ success: true, taskId: result.taskId, status: result.status, videoUrl: result.videoUrl, duration: result.duration, outputPath: result.outputPath });
    }

    default:
      throw new Error(`Unknown AI video tool: ${name}`);
  }
}
