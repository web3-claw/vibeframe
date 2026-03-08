# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.23.4] - 2026-03-08

### Fixed
- Runway error message: gen4.5 no longer incorrectly requires an input image (gen4_turbo still does)
- "Runway Gen-3" display string updated to show actual model name (gen4.5/gen4_turbo)
- Agent tool Kling image-to-video now auto-uploads base64 images to ImgBB (was failing with base64 error)
- KlingProvider comments updated to reflect current v2.5+ models (removed stale v1/v1.5/v1.6/v2.0/v2.1 references)

### Changed
- MODELS.md Image-to-Video section rewritten with per-provider table (image input type, I2V support)
- Removed outdated `kling-v1-5` reference from MODELS.md
- Added `grok` provider to legacy `vibe ai video` command (was only in `vibe generate video`)
- CLI reference updated with Image-to-Video examples for all providers

## [0.19.4] - 2026-02-24

### Security
- Eliminated 95+ command injection vulnerabilities across 20 files
- Replaced all `exec()`/`execSync()` template literal calls with safe `execFile`-based `execSafe()` utility
- Shell `rm`/`rmdir`/`mv` commands replaced with `node:fs/promises` equivalents

### Added
- `packages/cli/src/utils/exec-safe.ts` — safe subprocess execution utilities
- `bugs` field in all package.json files
- CODE_OF_CONDUCT.md (Contributor Covenant v2.1)

## [0.19.3] - 2026-02-24

### Changed
- Refactored `ai.ts` (9000+ lines) into 10 focused modules
- Removed deprecated REPL mode (-2,198 lines)
- Updated default OpenAI Agent model from GPT-4.5 to GPT-4o
- Documented GPT-5.2 model options in MODELS.md

### Fixed
- LICENSE now correctly references "VibeFrame Contributors"
- Removed stray test artifacts from repository root

### Added
- `ai-analyze.ts` - unified media analysis (image/video/YouTube)
- `ai-highlights.ts` - highlight extraction and auto-shorts
- `ai-review.ts` - AI video review and auto-fix
- `ai-script-pipeline.ts` - full script-to-video pipeline
- `ai-video.ts` - video generation (Runway, Kling, Grok)
- `ai-edit.ts` - post-production editing commands
- `ai-image.ts` - image generation commands
- `ai-audio.ts` - audio generation commands
- `ai-motion.ts` - motion graphics commands

## [0.19.0] - 2026-02-20

### Added
- OSS quality improvements and diverse motion styles
- Test guides for contributors
- GitHub Actions CI with Node 20/22 matrix
- `ai translate-srt` command for subtitle translation
- `ai thumbnail` command for thumbnail generation/extraction

## [0.18.0] - 2026-02-15

### Added
- MCP server published as `@vibeframe/mcp-server` on npm
- Agent mode with 5 LLM providers (OpenAI, Claude, Gemini, Ollama, xAI)
- 58 agent tools across 7 categories
- `ai motion` command for Remotion-based motion graphics
- `ai caption` command for Whisper + FFmpeg caption burning
- `ai noise-reduce` command for audio/video noise removal
- `ai fade` command for fade in/out effects

## [0.17.0] - 2026-02-10

### Added
- `ai script-to-video` pipeline (storyboard -> TTS -> images -> video)
- `ai highlights` command for extracting video highlights
- `ai auto-shorts` command for generating short-form content
- `ai review` command with Gemini video analysis
- Kling v2.5/v2.6 video generation support
- xAI Grok video generation via Grok Imagine

## [0.16.0] - 2026-02-05

### Added
- `ai silence-cut` command (FFmpeg + Gemini smart detection)
- `ai jump-cut` command (Whisper filler word detection)
- `ai text-overlay` command (FFmpeg drawtext)
- Gemini multi-image editing (`ai gemini-edit`)
- Video analysis with Gemini (`ai gemini-video`, `ai analyze`)

## [0.15.0] - 2026-01-28

### Added
- Initial CLI with project, timeline, and export commands
- Core timeline data structures with Zustand + Immer
- FFmpeg-based video export
- OpenAI, Claude, Gemini AI provider integrations
- ElevenLabs TTS and SFX support
- Stability AI image editing
- Remotion motion graphics foundation
