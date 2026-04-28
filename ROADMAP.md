# VibeFrame Roadmap

> Active per-release detail lives in [`CHANGELOG.md`](CHANGELOG.md).
> The v0.58-era architectural pivot doc is preserved for historical
> context at [`docs/archive/ROADMAP-v0.58.md`](docs/archive/ROADMAP-v0.58.md)
> — its substance landed in v0.59 (`compose-scenes-with-skills`) and v0.60
> (`vibe scene build`), so it no longer drives active development.
>
> This file is the longer-running plan: what shipped (Phases 1-4),
> what's on the horizon (Phases 5-7).

---

## Shipped (Phases 1-3) ✅

- **Phase 1 — Foundation:** Turborepo monorepo, Zustand+Immer timeline, FFmpeg.wasm export, CLI package.
- **Phase 2 — AI Providers:** 13 providers across text/audio/image/video (OpenAI, Claude, Gemini, Grok, OpenRouter, Ollama, Whisper, ElevenLabs, Kokoro, Runway, Kling, Veo, Replicate, fal.ai). See [`MODELS.md`](MODELS.md) for the canonical list.
- **Phase 3 — MCP Integration:** `@vibeframe/mcp-server` exposes 66 tools + project state resources for Claude Desktop / Cursor / any MCP host.

---

## Phase 4 — AI-Native Editing ✅ (mostly shipped, ongoing polish)

This is where day-to-day work happens. Major capabilities all delivered through v0.58:

### BUILD-from-text (Scene authoring)
- `vibe scene build` — v0.60 one-shot STORYBOARD.md → MP4 driver (per-beat YAML cues, sha256 cache)
- `vibe scene init/add/lint/render` — primitives behind the orchestrator

### PROCESS existing video (`vibe pipeline`)
- `vibe pipeline highlights` / `auto-shorts` (FFmpeg + Whisper + Claude analysis)
- `vibe pipeline animated-caption` (6 styles across ASS fast-path and Remotion overlay)
- (`vibe pipeline script-to-video` deprecated v0.63 — superseded by `vibe scene build`)

### Smart editing & analysis (`vibe edit` / `vibe analyze`)
silence-cut, jump-cut, caption, grade, reframe, speed-ramp, fade, noise-reduce, text-overlay, upscale-video, interpolate, fill-gaps, translate-srt, image edit, video review (100+ commands total).

### Voice & audio
TTS (ElevenLabs + Kokoro local fallback), voice-clone, dub, duck, music generation, sound effects, isolation.

### Scene authoring (Hyperframes-backed)
`vibe scene init/add/lint/render/build` produces editable per-scene HTML instead of opaque MP4s. v0.58 added the DESIGN.md hard-gate + 8 named visual styles. v0.59 shipped `compose-scenes-with-skills` (Claude + vendored Hyperframes skill bundle, sha256 cache, per-beat fanout). v0.60 added `vibe scene build` — one-shot STORYBOARD.md → MP4 with per-beat YAML cues for narration / backdrop / duration. The cinematic demo MP4 (`assets/demos/cinematic-v060.mp4`) is the first end-to-end output of this stack.

### CLI UX
Aliases (`gen`, `ed`, `az`, `pipe`, …), `--describe`, `--dry-run` cost preview, `--json`/auto-JSON, `--quiet`, `--fields`, structured exit codes (0–6), provider auto-fallback, `vibe doctor`, `vibe context`, `vibe demo`, smart error hints, `--budget-usd` ceiling.

### Video as Code
`vibe run pipeline.yaml` — 20+ actions, `$step.output` references, `.pipeline-state.yaml` checkpointing, `--dry-run`/`--resume`, budget ceilings. See [`examples/README.md`](examples/README.md).

### Agent surface
`vibe agent` REPL (BYO LLM × 6 — Claude / OpenAI / Gemini / Grok / OpenRouter / Ollama). MCP server bundled (66 tools). Claude Code skill pack (`/vibe-pipeline`, `/vibe-scene`) — consolidated 4 → 2 in v0.62.

### Demo & showcase
- [x] Asciinema recordings (CLI / agent / Claude Code) — README hero
- [x] [`DEMO.md`](DEMO.md) three-surface follow-along
- [x] Cinematic-finish demo MP4 (v0.60.0) — [`assets/demos/cinematic-v060.mp4`](assets/demos/cinematic-v060.mp4), produced by `vibe scene build` end-to-end
- [x] VHS tape recordings (`assets/demos/{cli,agent,host-agent,host-agent-i2v}.tape`) — reproducible per-surface demos (v0.61+)
- [x] `vibe init` setup wizard (v0.61) — post-install scaffold of `CLAUDE.md` / `AGENTS.md` / `.env.example` based on detected agent host

### Open items in Phase 4 (tracked as GitHub issues)

These were the v0.61+ candidates from earlier ROADMAP drafts. Each now has a tracking issue with current code references and acceptance criteria:

- **[#202](https://github.com/vericontext/vibeframe/issues/202)** — Multi-provider T2I in `scene build` (Gemini + Grok routing; help text fix)
- **[#203](https://github.com/vericontext/vibeframe/issues/203)** — I2V backdrop integration (motion video from Runway / Kling / Veo / fal.ai instead of still + Ken-Burns)
- **[#204](https://github.com/vericontext/vibeframe/issues/204)** — `compose-scenes-with-skills` narration awareness (word-level transcript timings into compose prompt)
- **[#205](https://github.com/vericontext/vibeframe/issues/205)** — Local subject tracking (MediaPipe / YOLO / SAM-2) for `vibe edit reframe --track` — `help wanted`
- **[#206](https://github.com/vericontext/vibeframe/issues/206)** — Tracking: drop Hyperframes `workers: 1` workaround once heygen-com/hyperframes#334 ships

---

## Phase 5 — Server Infrastructure 📋

Overcome browser memory limits + heavy AI content sizes.

- Hybrid rendering: FFmpeg.wasm for draft preview (<4 GB), server-side FFmpeg for final export
- Docker-based server rendering service
- Chunked upload/download for AI video outputs (Runway/Kling/Veo all produce large files)
- Project state persistence (Supabase / Postgres)
- **Live Link** — CLI ↔ Web UI sync via WebSocket so CLI commands stream real-time preview updates

---

## Phase 6 — Local-First Sync 📋

Offline-first editing with optional collaboration.

- CRDT-based state (Yjs or Automerge)
- Offline-capable editing
- Conflict-free merge on reconnect

> Design principle: local-first by default. Collaboration is additive, never required.

---

## Phase 7 — Ecosystem 📋

- Plugin architecture
- Community templates & presets
- Effect sharing (JSON export/import)
- REST API + webhooks for automation
- SDK for custom integrations

---

## Design principles

1. **AI-Native** — AI is the foundation, not a feature
2. **CLI-First** — terminal before UI; agents before humans
3. **Provider-Agnostic** — swap AI providers freely
4. **MCP Compatible** — standard protocol for AI tools
5. **Local-First** — works offline, sync when online
6. **Hybrid Rendering** — client for preview, server for heavy lifting

## Legend

✅ shipped · 🚧 in progress · 📋 planned
