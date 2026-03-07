# AI Provider Models

> Single source of truth for AI model information used across VibeFrame.

---

## Agent LLM Providers (5)

Used for natural language processing in Agent mode (`vibe` command).

| Provider | Model | API Model ID | Env Key | CLI Option |
|----------|-------|-------------|---------|------------|
| OpenAI | GPT-4o | `gpt-4o` | `OPENAI_API_KEY` | `-p openai` |
| Claude | Sonnet 4.6 | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` | `-p claude` |
| Gemini | 2.5 Flash | `gemini-2.5-flash` | `GOOGLE_API_KEY` | `-p gemini` |
| xAI | Grok-4 | `grok-4` | `XAI_API_KEY` | `-p xai` |
| Ollama | Local models | user-configured | - | `-p ollama` |

**OpenAI model options:**

`gpt-4o` is the default — widely available, strong function calling, cost-effective for agentic loops. You can override per-session:

| Model ID | Variant | Notes |
|----------|---------|-------|
| `gpt-4o` | Standard | **Default**. Best balance of speed, cost, and tool calling stability |
| `gpt-5.2-chat-latest` | GPT-5.2 Instant | Latest/fastest. Chat Completions API ✓. Pricing: $1.75/M input, $14/M output |
| `gpt-5.2` | GPT-5.2 Thinking | More capable reasoning. Chat Completions API ✓. Same pricing as Instant |

> `gpt-5.2-pro` is **not** available via Chat Completions (Responses API only) — not usable for Agent mode.

To use GPT-5.2 in agent mode: `vibe agent -p openai --model gpt-5.2-chat-latest`

**Why Gemini 2.5 Flash, not 3.1 Pro?**

Agent mode runs an agentic loop — the LLM is called repeatedly (potentially dozens of times per task) to reason and call tools. For this use case:

- **Speed matters**: Flash responds ~3–5× faster than Pro, keeping the interactive session snappy
- **Tool calling stability**: `gemini-2.5-flash` has well-tested, stable function calling support; `gemini-3.1-pro-preview` is a preview model with potentially unstable behavior in multi-turn tool calling loops
- **Cost**: Flash is significantly cheaper per token — important when a single agent task may trigger 20+ LLM calls
- **Preview models in production**: Preview models can change response format or have stricter rate limits unsuitable for agentic loops

`gemini-3.1-pro-preview` is available for **motion graphics code generation** (`vibe generate motion -m gemini-3.1-pro`) where its superior creative reasoning matters for a single, expensive generation call.

---

## Motion Graphics LLM (vibe generate motion)

Used for Remotion component code generation (`vibe generate motion`).

| Alias | Model | Provider | Env Key | CLI Option | Notes |
|-------|-------|----------|---------|------------|-------|
| `sonnet` | `claude-sonnet-4-6` | Claude | `ANTHROPIC_API_KEY` | `-m sonnet` | **Default** |
| `opus` | `claude-opus-4-6` | Claude | `ANTHROPIC_API_KEY` | `-m opus` | Best quality |
| `gemini` | `gemini-2.5-pro` | Gemini | `GOOGLE_API_KEY` | `-m gemini` | Fast alternative |
| `gemini-3.1-pro` | `gemini-3.1-pro-preview` | Gemini | `GOOGLE_API_KEY` | `-m gemini-3.1-pro` | Gemini 3.1 Pro |

---

## Text-to-Image (5)

| Provider | Model | Env Key | CLI Option | Notes |
|----------|-------|---------|------------|-------|
| OpenAI | `gpt-image-1.5` | `OPENAI_API_KEY` | `-p openai` | Quality tiers: low ($0.009), medium ($0.035), high ($0.133) |
| Gemini | `gemini-2.5-flash-image` | `GOOGLE_API_KEY` | `-p gemini` | Default. Nano Banana Flash - fast |
| Gemini | `gemini-3.1-flash-image-preview` | `GOOGLE_API_KEY` | `-p gemini -m 3.1-flash` | Nano Banana 2 - Image Search grounding, 512px |
| Gemini | `gemini-3-pro-image-preview` | `GOOGLE_API_KEY` | `-p gemini -m pro` | Nano Banana Pro - higher quality, up to 4K |
| Stability | `stable-diffusion-xl` | `STABILITY_API_KEY` | `-p stability` | For image editing (upscale, remove-bg, outpaint) |

### Image Aspect Ratios (Gemini)

All Gemini image models support 14 aspect ratios: `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9`

### Image Editing (Gemini)

| Model | Max Input Images | Features |
|-------|------------------|----------|
| Flash | 3 | Fast editing, 1K output |
| 3.1 Flash | 3 | Image Search grounding, 512px-1K output |
| Pro | 14 | Multi-image composition, up to 4K output |

---

## Text-to-Video (4)

> Models marked **Audio: Yes** generate synchronized sound (dialogue, SFX, ambient). Silent models need separate `vibe generate speech` / `vibe generate sound-effect`.

| Provider | Model | Duration | Audio | Env Key | CLI Option | Notes |
|----------|-------|----------|-------|---------|------------|-------|
| xAI Grok | `grok-imagine-video` | 1-15 sec | Yes | `XAI_API_KEY` | `-p grok` | **Default**. #2 Elo, best lip-sync/native audio |
| Kling | `kling-v2-5-turbo` | 5-10 sec | No | `KLING_API_KEY` | `-p kling` | Fast (~36s generation) |
| Kling | `kling-v2-6` | 5-10 sec | No | `KLING_API_KEY` | `-p kling -m v2.6` | Higher quality |
| Kling | `kling-3.0-omni` | 3-15 sec | Yes | `KLING_API_KEY` | `-p kling -m 3.0` | #1 Elo, multi-shot |
| Veo | `veo-3.1-fast-generate-preview` | 4-8 sec | Yes | `GOOGLE_API_KEY` | `-p veo` | Native audio, fast |
| Veo | `veo-3.1-generate-preview` | 4-8 sec | Yes | `GOOGLE_API_KEY` | `-p veo --veo-model 3.1` | Native audio, higher quality |
| Veo | `veo-3.0-generate-preview` | 5-8 sec | Yes | `GOOGLE_API_KEY` | `-p veo --veo-model 3.0` | Native audio |
| Runway | `gen4.5` | 5-10 sec | No | `RUNWAY_API_SECRET` | `-p runway` | Best physics |

### Veo Advanced Options

| Option | Values | Description |
|--------|--------|-------------|
| `--negative-prompt` | text | What to avoid in the generated video |
| `--resolution` | 720p, 1080p, 4k | Video resolution |
| `--last-frame` | image path | Frame interpolation (first→last frame) |
| `--ref-images` | image paths (max 3) | Character consistency (Veo 3.1 only) |
| `--person` | allow_all, allow_adult | Person generation setting |
| `veo-extend` | operation-name | Extend a previously generated Veo video |

### Image-to-Video

Same providers as text-to-video. Note: Kling uses `kling-v1-5` model for base64 images (v2.x requires URL).

---

## Audio (2)

| Provider | Capability | Env Key | Notes |
|----------|------------|---------|-------|
| ElevenLabs | TTS, SFX, Voice Clone | `ELEVENLABS_API_KEY` | Default voice: Rachel |
| Whisper | Transcription | `OPENAI_API_KEY` | OpenAI API |
| Replicate | Music generation | `REPLICATE_API_TOKEN` | MusicGen model |

---

## Quick Reference

### Environment Variables

```bash
# LLM Providers
export OPENAI_API_KEY="sk-..."        # GPT, Whisper, GPT Image 1.5
export ANTHROPIC_API_KEY="sk-ant-..." # Claude
export GOOGLE_API_KEY="AIza..."       # Gemini (image, Veo video)
export XAI_API_KEY="xai-..."          # xAI Grok

# Media Providers
export ELEVENLABS_API_KEY="..."       # TTS, SFX
export STABILITY_API_KEY="sk-..."     # Stability AI
export RUNWAY_API_SECRET="..."        # Runway Gen-4.5
export KLING_API_KEY="..."            # Kling v2.x/3.0
export REPLICATE_API_TOKEN="..."      # Replicate (music)
```

### API Keys by Command

| Command | Required API Key | Model |
|---------|-----------------|-------|
| `vibe` (default) | `OPENAI_API_KEY` | GPT-4o (Agent LLM) |
| `vibe -p claude` | `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 (Agent LLM) |
| `vibe -p gemini` | `GOOGLE_API_KEY` | Gemini 2.5 Flash (Agent LLM) |
| `vibe -p xai` | `XAI_API_KEY` | Grok-4 (Agent LLM) |
| `vibe generate image` | `GOOGLE_API_KEY` | Gemini Nano Banana |
| `vibe generate image -p openai` | `OPENAI_API_KEY` | GPT Image 1.5 |
| `vibe edit image` | `GOOGLE_API_KEY` | Gemini Nano Banana |
| `vibe generate speech` | `ELEVENLABS_API_KEY` | ElevenLabs |
| `vibe generate video` | `XAI_API_KEY` | Grok Imagine (default) |
| `vibe generate video -p kling` | `KLING_API_KEY` | Kling v2.5-turbo |
| `vibe generate video -p veo` | `GOOGLE_API_KEY` | Veo 3.1 |
