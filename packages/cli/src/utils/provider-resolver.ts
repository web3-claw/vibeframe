/**
 * Smart provider auto-resolution
 * Picks the best available provider based on configured API keys
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

/**
 * Resolve the best available provider for a given category.
 * Uses hasApiKey() for side-effect-free checking (no prompts).
 * Returns { name, label } of the first provider with a configured API key,
 * or null if none are available.
 */
export function resolveProvider(
  category: "image" | "video" | "speech"
): { name: string; label: string } | null {
  const candidates = PROVIDER_MAP[category];
  if (!candidates) return null;

  for (const candidate of candidates) {
    if (hasApiKey(candidate.envVar)) {
      return { name: candidate.name, label: candidate.label };
    }
  }

  return null;
}
