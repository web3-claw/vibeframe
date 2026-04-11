/**
 * Smart provider auto-resolution
 * 1. Check ~/.vibeframe/config.yaml defaults (if set)
 * 2. Fall back to first provider with a configured API key
 */

import { hasApiKey } from "./api-key.js";

interface ProviderCandidate {
  name: string;
  envVar: string;
  label: string;
}

const IMAGE_PROVIDERS: ProviderCandidate[] = [
  { name: "gemini", envVar: "GOOGLE_API_KEY", label: "Gemini" },
  { name: "openai", envVar: "OPENAI_API_KEY", label: "OpenAI" },
  { name: "grok", envVar: "XAI_API_KEY", label: "Grok" },
];

const VIDEO_PROVIDERS: ProviderCandidate[] = [
  { name: "grok", envVar: "XAI_API_KEY", label: "Grok" },
  { name: "veo", envVar: "GOOGLE_API_KEY", label: "Veo" },
  { name: "kling", envVar: "KLING_API_KEY", label: "Kling" },
  { name: "runway", envVar: "RUNWAY_API_SECRET", label: "Runway" },
];

const SPEECH_PROVIDERS: ProviderCandidate[] = [
  { name: "elevenlabs", envVar: "ELEVENLABS_API_KEY", label: "ElevenLabs" },
];

const PROVIDER_MAP: Record<string, ProviderCandidate[]> = {
  image: IMAGE_PROVIDERS,
  video: VIDEO_PROVIDERS,
  speech: SPEECH_PROVIDERS,
};

/** Cached config defaults (loaded once per process) */
let configDefaults: Record<string, string> | null = null;

/**
 * Load provider defaults from config (async, cached).
 * Call once at startup if you want config-aware resolution.
 */
export async function loadProviderDefaults(): Promise<void> {
  try {
    const { loadConfig } = await import("../config/index.js");
    const config = await loadConfig();
    if (config?.defaults) {
      configDefaults = {};
      if (config.defaults.imageProvider) configDefaults.image = config.defaults.imageProvider;
      if (config.defaults.videoProvider) configDefaults.video = config.defaults.videoProvider;
    }
  } catch {
    configDefaults = null;
  }
}

/**
 * Resolve the best available provider for a given category.
 * Priority: 1) config defaults  2) first provider with API key
 */
export function resolveProvider(
  category: "image" | "video" | "speech"
): { name: string; label: string } | null {
  const candidates = PROVIDER_MAP[category];
  if (!candidates) return null;

  // Check config default first
  if (configDefaults?.[category]) {
    const preferred = candidates.find(c => c.name === configDefaults![category]);
    if (preferred && hasApiKey(preferred.envVar)) {
      return { name: preferred.name, label: preferred.label };
    }
  }

  // Fall back to first available
  for (const candidate of candidates) {
    if (hasApiKey(candidate.envVar)) {
      return { name: candidate.name, label: candidate.label };
    }
  }

  return null;
}
