# Phase 0 Discovery — Lottie + Hyperframes (2026-04-18)

Goal: determine which integrations are **realistically implementable today** so Phase 1/2 plans are grounded in what's shipped, not what's marketed.

Probe location: `~/dev/vibe-probes/{hf-probe,lottie-probe}` (outside this repo to avoid dependency pollution).

## Findings

### Hyperframes — ✅ library-ready

| Probe | Result |
|---|---|
| npm | `@hyperframes/producer@0.4.4` published |
| License (GitHub LICENSE) | Apache 2.0 — MIT-compatible |
| License (npm package.json) | "Proprietary" — **metadata inconsistency**, source is Apache |
| Module type | ESM only (`"type": "module"`) |
| TypeScript types | Full `.d.ts` shipped |
| Library API | Rich: `createRenderJob`, `executeRenderJob`, `createCaptureSession`, `getCompositionDuration`, `resolveConfig`, … (24 exports) |
| Integration pattern | HTML project dir → `window.__hf` seek protocol → Chrome BeginFrame → FFmpeg encode |
| Lottie support | **Explicit** in docs: *"works with GSAP, Lottie, Three.js, CSS animations"* |

`RenderConfig` shape:
```ts
{ fps: 24|30|60, quality: "draft"|"standard"|"high",
  format?: "mp4"|"webm"|"mov", entryFile?: string,
  crf?: number, videoBitrate?: string, ... }
```

**Runtime deps**: Chromium (not bundled — must be resolved or installed separately), FFmpeg.

### LottieFiles official MCP — ❌ not publicly available

- Marketing mentions "MCP-compatible" integration (Creator can act as an MCP client)
- **No documented public endpoint, no npm/PyPI package, no Claude Desktop config**
- Conclusion: usable *from* Creator, not *to* Creator from our CLI

### Third-party LottieFiles MCP — 🟡 search-only

Repo: [`lemosjs/lottiefiles-mcp-worker`](https://github.com/lemosjs/lottiefiles-mcp-worker), 0★, TypeScript, Cloudflare Workers.

Tools:
- `search_animations`, `get_animation_details`, `get_popular_animations`, `search_animations_by_user`

No **generate** tool. Good for discovering existing free animations, useless for creating new ones.

### LottieGPT (CVPR 2026, OSS) — ❌ not usable yet

- Repo: [`yisuanwang/LottieGPT`](https://github.com/yisuanwang/LottieGPT)
- Status: project page + technical report released; **inference code and model weights unreleased** (still ☐)
- Cannot be integrated today

## Implication for Phase 1/2

The original plan assumed a **prompt → Lottie JSON** generation path. **That path does not exist in 2026-04 for programmatic use.** Lottie creation today is human-authored via Creator/AE, then exported.

Realistic Lottie scope for VibeFrame:
1. **User-provided Lottie JSON** (from Creator, AE, or community libraries) as an overlay asset
2. **Discovery**: optional integration with third-party `lottiefiles-mcp-worker` to search existing animations
3. **Not**: prompt → Lottie generation

## Revised Phase Plan

### Phase 1 — Hyperframes render backend (renamed from Phase 2)

Now P0 because:
- Library API is clean and stable
- HTML composition natively supports Lottie via `<dotlottie-player>` / `<lottie-player>` elements
- Single integration unlocks CSS animations, GSAP, Three.js, and Lottie overlay simultaneously
- No "empty Lottie generation pipeline" sitting around waiting for LottieGPT

Work:
- `packages/cli/src/pipeline/renderers/hyperframes.ts` — adapter
- VibeFrame project timeline → HTML composition with `window.__hf` protocol
- YAML: `render: { backend: hyperframes, fps, quality, format }`
- Chrome resolution: reuse `puppeteer`'s detection, document Chrome install

Effort: 1.5–2 weeks.

### Phase 2 — Lottie overlay via Hyperframes (renamed from Phase 1, shrunk)

Relies on Phase 1. User provides a `.lottie` or `.json` file; pipeline embeds it in the Hyperframes HTML.

Work:
- YAML action: `overlay-lottie` → generates HTML snippet with `<dotlottie-player>` positioned/timed
- CLI: `vibe edit overlay-lottie <video> <lottie> --position --start --duration`
- No separate FFmpeg overlay path needed — Hyperframes handles it

Effort: 3–5 days **on top of Phase 1**.

### Phase 3 — Lottie discovery (optional, lightweight)

Optionally expose the third-party `lottiefiles-mcp-worker` via our MCP tools for search. Or document it as a reference for users — not essential.

Effort: 1–2 days, or skip.

### Out of scope (for now)

- Prompt → Lottie generation — no viable OSS path in 2026-04
- Revisit when LottieGPT releases weights, or if LottieFiles opens an official generation API

## Next action

Proceed to Phase 1 (Hyperframes backend). See `/issues/37`.
