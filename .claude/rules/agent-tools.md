---
description: CLI to Agent tool synchronization rules and current tool registry
globs:
  - "packages/cli/src/agent/**"
  - "packages/cli/src/commands/**"
---

# CLI ↔ Agent Tool Synchronization

When adding or modifying CLI commands, **consider whether they should be exposed as Agent tools**.

## When to Add Agent Tools

Add an Agent tool wrapper when CLI command:
- Is frequently used in workflows (e.g., `script-to-video`, `highlights`)
- Benefits from natural language invocation
- Can operate autonomously without interactive prompts
- Has complex parameters that LLM can help construct

## How to Add Agent Tools for CLI Commands

1. **Extract core logic** from CLI command into an exported function:
   ```typescript
   // In packages/cli/src/commands/ai-<module>.ts
   export interface MyCommandOptions { ... }
   export interface MyCommandResult { ... }
   export async function executeMyCommand(options: MyCommandOptions): Promise<MyCommandResult>
   ```

2. **Create Agent tool** that calls the exported function:
   ```typescript
   // In packages/cli/src/agent/tools/ai-generation.ts (or ai-editing.ts, ai-pipeline.ts)
   import { executeMyCommand } from "../../commands/ai-<module>.js";

   const myCommandDef: ToolDefinition = { name: "generate_my_command", ... };
   const myCommandHandler: ToolHandler = async (args, context) => {
     const result = await executeMyCommand({ ... });
     return { success: result.success, output: ... };
   };
   ```

3. **Register the tool** in `registerAITools()`:
   ```typescript
   registry.register(myCommandDef, myCommandHandler);
   ```

## Tool Naming Convention

**CLI → Agent/MCP:** `vibe <group> <action>` → `<group>_<action>` (snake_case)

Examples:
- `vibe generate image` → `generate_image`
- `vibe edit silence-cut` → `edit_silence_cut`
- `vibe analyze media` → `analyze_media`
- `vibe pipeline highlights` → `pipeline_highlights`
- `vibe audio transcribe` → `audio_transcribe`

## Files to Update

When adding new CLI commands:
- `packages/cli/src/commands/<group>.ts` - CLI command registration (generate.ts, edit-cmd.ts, analyze.ts, audio.ts, pipeline.ts)
- `packages/cli/src/commands/ai-<module>.ts` - Execute function (business logic)
- `packages/cli/src/agent/tools/ai-generation.ts` or `ai-editing.ts` or `ai-pipeline.ts` - Agent tool wrapper
- `CLAUDE.md` - Update tool counts
- `ROADMAP.md` - Mark `[x]` and update CLI status section

## Current Agent AI Tools (23 across 3 files)

### Generate (7 tools — registered in ai-generation.ts)
| Tool | CLI Command | Description |
|------|-------------|-------------|
| `generate_image` | `vibe generate image` | Generate images (OpenAI/Gemini/Stability) |
| `generate_video` | `vibe generate video` | Generate video (Kling/Veo/Runway/Grok) |
| `generate_speech` | `vibe generate speech` | Text-to-speech (ElevenLabs) |
| `generate_sound_effect` | `vibe generate sound-effect` | Sound effects (ElevenLabs) |
| `generate_music` | `vibe generate music` | Music generation (Replicate) |
| `generate_storyboard` | `vibe generate storyboard` | Script → storyboard (Claude) |
| `generate_motion` | `vibe generate motion` | Motion graphics (Remotion) |

### Edit (9 tools — registered in ai-editing.ts)
| Tool | CLI Command | Description |
|------|-------------|-------------|
| `edit_silence_cut` | `vibe edit silence-cut` | Remove silent segments |
| `edit_jump_cut` | `vibe edit jump-cut` | Remove filler words (Whisper + FFmpeg) |
| `edit_caption` | `vibe edit caption` | Transcribe + burn styled captions |
| `edit_noise_reduce` | `vibe edit noise-reduce` | Audio/video noise removal |
| `edit_fade` | `vibe edit fade` | Fade in/out effects |
| `edit_text_overlay` | `vibe edit text-overlay` | Apply text overlays (FFmpeg drawtext) |
| `edit_translate_srt` | `vibe edit translate-srt` | Translate SRT subtitles |
| `analyze_review` | `vibe analyze review` | AI video review & auto-fix (Gemini) |
| `generate_thumbnail` | `vibe generate thumbnail` | Extract best thumbnail (Gemini + FFmpeg) |

### Analyze + Edit + Pipeline (7 tools — registered in ai-pipeline.ts)
| Tool | CLI Command | Description |
|------|-------------|-------------|
| `analyze_media` | `vibe analyze media` | Unified media analysis (image/video/YouTube) |
| `analyze_video` | `vibe analyze video` | Video analysis (Gemini) |
| `edit_image` | `vibe edit image` | Multi-image editing (Gemini) |
| `pipeline_script_to_video` | `vibe pipeline script-to-video` | Full video pipeline |
| `pipeline_highlights` | `vibe pipeline highlights` | Extract highlights |
| `pipeline_auto_shorts` | `vibe pipeline auto-shorts` | Generate shorts |
| `pipeline_regenerate_scene` | `vibe pipeline regenerate-scene` | Regenerate specific scene(s) |

### Audio (1 tool in media category)
| Tool | CLI Command | Description |
|------|-------------|-------------|
| `audio_transcribe` | `vibe audio transcribe` | Transcription (Whisper) |
