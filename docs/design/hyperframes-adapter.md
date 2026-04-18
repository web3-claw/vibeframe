# Hyperframes Render Backend — Design

Status: draft (Phase 1, Step 1.2 of [#37](https://github.com/vericontext/vibeframe/issues/37))
Prereq: `docs/discovery/lottie-hyperframes.md`

## Goal

Let `vibe export` and `vibe run` render VibeFrame timelines through Hyperframes' HTML→MP4 engine as an alternative to the existing FFmpeg-filter-graph backend.

**Why**: HTML-native composition unlocks CSS animations, GSAP, Three.js, and Lottie overlays in a single pipeline. Current FFmpeg path is great for simple clip concat/trim/basic effects but has no path to motion graphics or programmatic animation.

## Scope

In-scope this phase:
- New backend `hyperframes` selectable via YAML/CLI flag
- Mapping VibeFrame `TimelineState` → HTML project + `window.__hf` seek protocol
- Media elements (video/audio) declared via Hyperframes' `HfMediaElement`
- Core effects translated to CSS filters or seek-time calculations (fadeIn/fadeOut, blur, brightness, contrast, saturation, volume)

Not in scope (follow-ups):
- Text overlays with rich typography (Phase 2)
- Lottie overlay via `<dotlottie-player>` (Phase 2)
- GSAP timeline generation (future)
- Transitions (dissolve, wipe, slide) — FFmpeg backend stays default until covered

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  vibe export / vibe run                                    │
│                                                            │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │ TimelineState    │        │ RenderBackend interface  │  │
│  │ (project.vibe.json)       │                          │  │
│  │                  │   ──▶  │ - ffmpeg  (existing)     │  │
│  │                  │        │ - hyperframes (new)      │  │
│  └──────────────────┘        └──────────────────────────┘  │
│                                        │                    │
│                                        ▼                    │
│                   ┌──────────────────────────────────┐     │
│                   │ HyperframesAdapter               │     │
│                   │                                  │     │
│                   │ 1. renderToHtmlProject(state)    │     │
│                   │    → /tmp/<id>/index.html        │     │
│                   │    → /tmp/<id>/assets/*          │     │
│                   │                                  │     │
│                   │ 2. createRenderJob(config)       │     │
│                   │ 3. executeRenderJob(job, dir)    │     │
│                   └──────────────────────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    @hyperframes/producer
                    (Puppeteer + FFmpeg)
```

## RenderBackend interface

```ts
// packages/cli/src/pipeline/renderers/types.ts
export interface RenderBackend {
  name: string;
  render(options: RenderOptions): Promise<RenderResult>;
}

export interface RenderOptions {
  projectState: TimelineState;           // from @vibeframe/core
  outputPath: string;                    // final .mp4
  fps?: 24 | 30 | 60;
  quality?: "draft" | "standard" | "high";
  format?: "mp4" | "webm" | "mov";
  onProgress?: (pct: number, stage: string) => void;
  signal?: AbortSignal;
}

export interface RenderResult {
  success: boolean;
  outputPath?: string;
  durationMs?: number;
  framesRendered?: number;
  error?: string;
}
```

## Hyperframes adapter — HTML generation

Generated project layout:
```
<tmpdir>/
  index.html           ← entry; implements window.__hf
  assets/              ← copied media files (video/audio/image)
    clip-<id>.mp4
    clip-<id>.mp3
    ...
```

`index.html` template:
```html
<!doctype html>
<html><head>
  <style>
    html, body { margin: 0; width: {W}px; height: {H}px; overflow: hidden; background: #000; }
    .clip { position: absolute; inset: 0; display: none; }
  </style>
</head><body>
  <!-- One element per clip, toggled via seek() -->
  <div id="{clip.id}" class="clip" style="z-index: {track.order};">
    <!-- content: <video>, <audio>, <img>, or <div>+text -->
  </div>
  ...

  <script>
    const elements = Array.from(document.querySelectorAll('.clip'));
    const clips = /* JSON-embedded clip metadata */;

    function interpolateKeyframes(kfs, t) { /* linear/easeIn/easeOut */ }
    function applyEffects(el, effects, t) { /* CSS filters + opacity */ }

    window.__hf = {
      duration: /* project.duration */,
      media: [/* HfMediaElement[] from video/audio clips */],
      seek(t) {
        for (const c of clips) {
          const el = document.getElementById(c.id);
          const active = t >= c.startTime && t < c.startTime + c.duration;
          el.style.display = active ? 'block' : 'none';
          if (active) applyEffects(el, c.effects, t - c.startTime);
        }
      }
    };
  </script>
</body></html>
```

## Effect mapping (Phase 1 set)

| VibeFrame Effect | HTML/CSS translation | Notes |
|---|---|---|
| `fadeIn` / `fadeOut` | `opacity` ∈ [0, intensity] computed in seek() | No CSS transition — seek() is idempotent |
| `blur` | `filter: blur(Npx)` | Keyframes → interpolated radius |
| `brightness` | `filter: brightness(N)` | |
| `contrast` | `filter: contrast(N)` | |
| `saturation` | `filter: saturate(N)` | |
| `speed` | Modify `sourceTime` calculation | `media.mediaOffset` stays; inject frame at offset + (t - start) × rate |
| `volume` | Declared in `HfMediaElement.volume` | Per-clip constant; keyframed volume = follow-up |
| `custom` | Ignored with warning in Phase 1 | Requires user-supplied shader/JS |

Multiple concurrent filters compose: `filter: brightness(1.1) contrast(1.2) blur(2px)`.

## Media handling

Chrome headless in BeginFrame mode cannot play `<video>`/`<audio>`. Hyperframes works around this by pre-extracting frames and audio tracks from elements declared in `window.__hf.media`. VibeFrame adapter builds this array from `video` and `audio`-type clips:

```ts
window.__hf.media = state.clips
  .map(c => resolveSource(state, c))
  .filter(s => s.type === 'video' || s.type === 'audio')
  .map(({ clip, source }) => ({
    elementId: clip.id,
    src: absoluteUrl(source.url),
    startTime: clip.startTime,
    endTime: clip.startTime + clip.duration,
    mediaOffset: clip.sourceStartOffset,
    volume: 1,
    hasAudio: source.type === 'video' ? true : true,
  }));
```

Image clips become `<img>` elements — no media pre-extraction needed.

## Resolution

From `project.aspectRatio`:
- `16:9` → 1920×1080
- `9:16` → 1080×1920
- `1:1`  → 1080×1080
- `4:5`  → 1080×1350

Embedded in `<style>` of `index.html` and as `window.__hf.width/height` (Hyperframes reads body dimensions at probe time).

## FPS / quality

`RenderConfig` passed straight through to `createRenderJob`. Defaults: `fps=30`, `quality="standard"`, `format="mp4"`.

Quality presets map to H.264 CRF:
- draft: crf 28
- standard: crf 23
- high: crf 18

(Overridable via `RenderConfig.crf` when needed.)

## Chrome resolution

Hyperframes uses `puppeteer-core` — no bundled Chromium. Strategy:

1. Check `process.env.CHROME_PATH` / `HYPERFRAMES_CHROME_PATH`
2. Auto-detect via `puppeteer.executablePath()` if full `puppeteer` is installed
3. Fall back to system Chrome paths (macOS `/Applications/Google Chrome.app/...`, Linux `/usr/bin/google-chrome`)
4. If none, emit structured error suggesting `brew install --cask google-chrome` or `npx puppeteer browsers install chrome`

Document in `vibe doctor` so users see missing-Chrome before running.

## Wiring into `vibe`

### CLI (`vibe export`)
Add `--backend <ffmpeg|hyperframes>` flag. Default `ffmpeg` (no behavior change for existing users).

### YAML (`vibe run`)
```yaml
name: my-video
render:
  backend: hyperframes
  fps: 30
  quality: standard
  format: mp4
steps:
  - ...
```

### Agent / MCP
Expose `render_backend` param on `export` tool (optional string enum).

## Testing plan

1. **Unit**: `seekFrame(state, t)` correctness — given fixture timeline, expect correct active clips + interpolated effect params
2. **Integration**: Minimal 2-clip (image + text) project renders to a non-zero MP4 with expected duration ±0.1s
3. **Smoke**: The probe project at `~/dev/vibe-probes/hf-probe/test-project/` re-renders via the adapter
4. **Regression**: Existing FFmpeg backend untouched; `vibe export` with no `--backend` flag behaves identically

## Phased delivery

- **v0.47.0**: Adapter lands behind `--backend hyperframes`; docs mark as experimental
- **v0.48.0**: Lottie overlay via Phase 2 (user-supplied JSON → `<dotlottie-player>` element)
- **v0.49.0**: Text overlays with rich typography; transitions (dissolve/fade)
- **v0.50.0**: Promote as default backend if stable, keep `--backend ffmpeg` as opt-out

## Open questions

- [ ] Does Hyperframes' `HfMediaElement` handle `mediaOffset` with non-zero values correctly? (Test in Step 1.4.)
- [ ] Per-frame volume keyframes vs constant volume? Current plan: constant only in Phase 1.
- [ ] Should adapter copy media files into `assets/` or use absolute `file://` URLs? Copy is safer but slower.
