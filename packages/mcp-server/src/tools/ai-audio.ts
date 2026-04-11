import {
  executeTranscribe,
  executeIsolate,
  executeVoiceClone,
  executeDub,
  executeDuck,
} from "@vibeframe/cli/commands/ai-audio";

export const aiAudioTools = [
  {
    name: "audio_transcribe",
    description: "Transcribe audio using OpenAI Whisper. Outputs text, SRT, or VTT. Requires OPENAI_API_KEY.",
    inputSchema: {
      type: "object" as const,
      properties: {
        audioPath: { type: "string", description: "Input audio file path" },
        language: { type: "string", description: "Language code (e.g., en, ko)" },
        output: { type: "string", description: "Output file path (format auto-detected from extension: .json, .srt, .vtt)" },
        format: { type: "string", description: "Output format override: json, srt, vtt" },
      },
      required: ["audioPath"],
    },
  },
  {
    name: "audio_isolate",
    description: "Isolate vocals from audio using ElevenLabs. Requires ELEVENLABS_API_KEY.",
    inputSchema: {
      type: "object" as const,
      properties: {
        audioPath: { type: "string", description: "Input audio file path" },
        output: { type: "string", description: "Output audio file path (default: vocals.mp3)" },
      },
      required: ["audioPath"],
    },
  },
  {
    name: "audio_voice_clone",
    description: "Clone a voice from audio samples using ElevenLabs. Requires ELEVENLABS_API_KEY.",
    inputSchema: {
      type: "object" as const,
      properties: {
        samplePaths: {
          type: "array",
          items: { type: "string" },
          description: "Audio sample file paths (1-25 files)",
        },
        name: { type: "string", description: "Voice name" },
        description: { type: "string", description: "Voice description" },
        removeNoise: { type: "boolean", description: "Remove background noise from samples" },
      },
      required: ["samplePaths", "name"],
    },
  },
  {
    name: "audio_dub",
    description: "Dub audio/video to another language (transcribe + translate + TTS). Requires OPENAI_API_KEY, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY.",
    inputSchema: {
      type: "object" as const,
      properties: {
        mediaPath: { type: "string", description: "Input media file (video or audio)" },
        language: { type: "string", description: "Target language code (e.g., es, ko, ja)" },
        source: { type: "string", description: "Source language code (default: auto-detect)" },
        voice: { type: "string", description: "ElevenLabs voice ID for output" },
        analyzeOnly: { type: "boolean", description: "Only analyze timing, don't generate audio" },
        output: { type: "string", description: "Output file path" },
      },
      required: ["mediaPath", "language"],
    },
  },
  {
    name: "audio_duck",
    description: "Auto-duck background music when voice is present using FFmpeg sidechain compression. Free, no API key needed.",
    inputSchema: {
      type: "object" as const,
      properties: {
        musicPath: { type: "string", description: "Background music file path" },
        voicePath: { type: "string", description: "Voice/narration track path" },
        output: { type: "string", description: "Output audio file path" },
        threshold: { type: "string", description: "Sidechain threshold in dB (default: -30)" },
        ratio: { type: "string", description: "Compression ratio (default: 3)" },
      },
      required: ["musicPath", "voicePath"],
    },
  },
];

export async function handleAiAudioToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  switch (name) {
    case "audio_transcribe": {
      const result = await executeTranscribe({
        audioPath: args.audioPath as string,
        language: args.language as string | undefined,
        output: args.output as string | undefined,
        format: args.format as string | undefined,
      });
      if (!result.success) return `Transcription failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        text: result.text?.slice(0, 500),
        segmentCount: result.segments?.length,
        detectedLanguage: result.detectedLanguage,
        outputPath: result.outputPath,
      });
    }

    case "audio_isolate": {
      const result = await executeIsolate({
        audioPath: args.audioPath as string,
        output: args.output as string | undefined,
      });
      if (!result.success) return `Audio isolation failed: ${result.error}`;
      return JSON.stringify({ success: true, outputPath: result.outputPath });
    }

    case "audio_voice_clone": {
      const result = await executeVoiceClone({
        samplePaths: args.samplePaths as string[],
        name: args.name as string,
        description: args.description as string | undefined,
        removeNoise: args.removeNoise as boolean | undefined,
      });
      if (!result.success) return `Voice cloning failed: ${result.error}`;
      return JSON.stringify({ success: true, voiceId: result.voiceId, name: result.name });
    }

    case "audio_dub": {
      const result = await executeDub({
        mediaPath: args.mediaPath as string,
        language: args.language as string,
        source: args.source as string | undefined,
        voice: args.voice as string | undefined,
        analyzeOnly: args.analyzeOnly as boolean | undefined,
        output: args.output as string | undefined,
      });
      if (!result.success) return `Dubbing failed: ${result.error}`;
      return JSON.stringify({
        success: true,
        outputPath: result.outputPath,
        sourceLanguage: result.sourceLanguage,
        targetLanguage: result.targetLanguage,
        segmentCount: result.segmentCount,
      });
    }

    case "audio_duck": {
      const result = await executeDuck({
        musicPath: args.musicPath as string,
        voicePath: args.voicePath as string,
        output: args.output as string | undefined,
        threshold: args.threshold as string | undefined,
        ratio: args.ratio as string | undefined,
      });
      if (!result.success) return `Audio ducking failed: ${result.error}`;
      return JSON.stringify({ success: true, outputPath: result.outputPath });
    }

    default:
      throw new Error(`Unknown AI audio tool: ${name}`);
  }
}
