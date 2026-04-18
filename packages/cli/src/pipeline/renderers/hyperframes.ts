/**
 * Hyperframes render backend adapter (Phase 1 — scaffold).
 *
 * Maps VibeFrame `TimelineState` onto an HTML project that implements
 * `window.__hf` seek protocol, then hands off to `@hyperframes/producer`
 * for Chrome BeginFrame → FFmpeg rendering.
 *
 * Design: docs/design/hyperframes-adapter.md
 * Discovery: docs/discovery/lottie-hyperframes.md
 *
 * NOTE: This file is a scaffold. The heavy lifting (HTML generation,
 * effect mapping, media copy) is tracked by the TODO markers and will
 * land in subsequent PRs against #37.
 */

import type { RenderBackend, RenderOptions, RenderResult } from "./types.js";

/**
 * Build a Hyperframes adapter. The `@hyperframes/producer` dependency is
 * not yet in package.json — it's added in the first implementation PR so
 * this scaffold compiles clean against the current dep set.
 */
export function createHyperframesBackend(): RenderBackend {
  return {
    name: "hyperframes",

    async preflight() {
      // TODO(#37): check Chrome resolution
      // - process.env.CHROME_PATH / HYPERFRAMES_CHROME_PATH
      // - puppeteer.executablePath() if installed
      // - platform-specific fallbacks (/Applications/Google Chrome.app/..., /usr/bin/google-chrome)
      return {
        ok: false,
        reason: "Hyperframes backend scaffold — implementation pending (see #37).",
      };
    },

    async render(_options: RenderOptions): Promise<RenderResult> {
      // TODO(#37): full pipeline
      //   1. renderToHtmlProject(projectState) → temp dir
      //       - generate index.html from template
      //       - embed clips JSON (ids, startTime, duration, effects, track order)
      //       - emit window.__hf with duration, width, height, media[], seek(t)
      //       - copy video/audio/image assets into <tmp>/assets/
      //   2. resolve Chrome path (preflight already ran)
      //   3. dynamic import @hyperframes/producer
      //   4. createRenderJob({ fps, quality, format, entryFile: "index.html", crf })
      //   5. executeRenderJob(job, tmpDir, outputPath, onProgress)
      //   6. return RenderResult (success, outputPath, durationMs, framesRendered)
      return {
        success: false,
        error: "Hyperframes backend scaffold — not yet implemented (see #37).",
      };
    },
  };
}

/**
 * Translate VibeFrame's `aspectRatio` string into Hyperframes pixel dims.
 * Kept here so the HTML template and the seek protocol agree on canvas size.
 */
export function aspectToResolution(ratio: string): { width: number; height: number } {
  switch (ratio) {
    case "16:9": return { width: 1920, height: 1080 };
    case "9:16": return { width: 1080, height: 1920 };
    case "1:1":  return { width: 1080, height: 1080 };
    case "4:5":  return { width: 1080, height: 1350 };
    default:     return { width: 1920, height: 1080 };
  }
}

/**
 * Map VibeFrame quality preset to H.264 CRF values suitable for Hyperframes.
 * `standard` matches the FFmpeg backend's default quality.
 */
export function qualityToCrf(quality: "draft" | "standard" | "high" = "standard"): number {
  return quality === "draft" ? 28 : quality === "high" ? 18 : 23;
}
