/**
 * ai-helpers.ts — Shared utility functions used across AI commands.
 *
 * These were extracted from ai.ts to improve maintainability.
 * ai.ts imports and re-uses these internally.
 */

import { Project } from "../engine/index.js";

/**
 * Download a video from URL, handling Veo/Google API authentication.
 * Uses x-goog-api-key header (not query param) for Google API URLs.
 *
 * @param url - Video URL to download
 * @param apiKey - Google API key (caller should resolve from env/config)
 */
export async function downloadVideo(url: string, apiKey?: string): Promise<Buffer> {
  const headers: Record<string, string> = {};
  if (url.includes("generativelanguage.googleapis.com") && apiKey) {
    headers["x-goog-api-key"] = apiKey;
  }
  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Format a duration in seconds to m:ss.s display format */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}:${secs.padStart(4, "0")}`;
}

/** Apply a single AI edit suggestion to a project */
export function applySuggestion(project: Project, suggestion: any): boolean {
  const { type, clipIds, params } = suggestion;

  if (clipIds.length === 0) return false;
  const clipId = clipIds[0];

  switch (type) {
    case "trim":
      if (params.newDuration) {
        return project.trimClipEnd(clipId, params.newDuration);
      }
      break;
    case "add-effect":
      if (params.effectType) {
        const effect = project.addEffect(clipId, {
          type: params.effectType,
          startTime: params.startTime || 0,
          duration: params.duration || 1,
          params: params.effectParams || {},
        });
        return effect !== null;
      }
      break;
    case "delete":
      return project.removeClip(clipId);
  }

  return false;
}
