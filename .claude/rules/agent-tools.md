---
description: CLI to Agent tool synchronization rules and current tool registry
globs:
  - "packages/cli/src/agent/**"
  - "packages/cli/src/commands/**"
---

# CLI ↔ Agent Tool Synchronization

When adding or modifying CLI AI commands, **consider whether they should be exposed as Agent tools**.

## When to Add Agent Tools

Add an Agent tool wrapper when CLI command:
- Is frequently used in workflows (e.g., `script-to-video`, `highlights`)
- Benefits from natural language invocation
- Can operate autonomously without interactive prompts
- Has complex parameters that LLM can help construct

## How to Add Agent Tools for CLI Commands

1. **Extract core logic** from CLI command into an exported function:
   ```typescript
   // In packages/cli/src/commands/ai.ts
   export interface MyCommandOptions { ... }
   export interface MyCommandResult { ... }
   export async function executeMyCommand(options: MyCommandOptions): Promise<MyCommandResult>
   ```

2. **Create Agent tool** that calls the exported function:
   ```typescript
   // In packages/cli/src/agent/tools/ai.ts
   import { executeMyCommand } from "../../commands/ai.js";

   const myCommandDef: ToolDefinition = { name: "ai_my_command", ... };
   const myCommandHandler: ToolHandler = async (args, context) => {
     const result = await executeMyCommand({ ... });
     return { success: result.success, output: ... };
   };
   ```

3. **Register the tool** in `registerAITools()`:
   ```typescript
   registry.register(myCommandDef, myCommandHandler);
   ```

## Files to Update

When adding new AI CLI commands:
- `packages/cli/src/commands/ai.ts` - CLI command + exported function
- `packages/cli/src/agent/tools/ai.ts` - Agent tool wrapper (if applicable)
- `CLAUDE.md` - Update tool counts
- `ROADMAP.md` - Mark `[x]` and update CLI status section

## Current Agent AI Tools (25)

| Tool | CLI Command | Description |
|------|-------------|-------------|
| `ai_image` | `vibe ai image` | Generate images (OpenAI/Gemini/Stability) |
| `ai_video` | `vibe ai video` | Generate video (Runway) |
| `ai_kling` | `vibe ai kling` | Generate video (Kling) |
| `ai_veo` | `vibe ai video -p veo` | Generate video (Google Veo 3.1) |
| `ai_tts` | `vibe ai tts` | Text-to-speech (ElevenLabs) |
| `ai_sfx` | `vibe ai sfx` | Sound effects (ElevenLabs) |
| `ai_music` | `vibe ai music` | Music generation (Replicate) |
| `ai_storyboard` | `vibe ai storyboard` | Script → storyboard (Claude) |
| `ai_motion` | `vibe ai motion` | Motion graphics render & composite (Remotion, Gemini video-aware) |
| `ai_script_to_video` | `vibe ai script-to-video` | Full video pipeline |
| `ai_highlights` | `vibe ai highlights` | Extract highlights |
| `ai_auto_shorts` | `vibe ai auto-shorts` | Generate shorts |
| `ai_gemini_video` | `vibe ai gemini-video` | Video analysis (Gemini) |
| `ai_analyze` | `vibe ai analyze` | Unified media analysis (image/video/YouTube) |
| `ai_gemini_edit` | `vibe ai gemini-edit` | Multi-image editing (Gemini) |
| `ai_regenerate_scene` | `vibe ai regenerate-scene` | Regenerate specific scene(s) |
| `ai_text_overlay` | `vibe ai text-overlay` | Apply text overlays (FFmpeg drawtext) |
| `ai_review` | `vibe ai review` | AI video review & auto-fix (Gemini) |
| `ai_silence_cut` | `vibe ai silence-cut` | Remove silent segments (FFmpeg or Gemini smart detection) |
| `ai_jump_cut` | `vibe ai jump-cut` | Remove filler words (Whisper + FFmpeg) |
| `ai_caption` | `vibe ai caption` | Transcribe + burn styled captions (Whisper + FFmpeg) |
| `ai_noise_reduce` | `vibe ai noise-reduce` | Audio/video noise removal (FFmpeg) |
| `ai_fade` | `vibe ai fade` | Fade in/out effects (FFmpeg) |
| `ai_thumbnail` | `vibe ai thumbnail` | Generate or extract best thumbnail (Gemini + FFmpeg) |
| `ai_translate_srt` | `vibe ai translate-srt` | Translate SRT subtitles (Claude/OpenAI) |
