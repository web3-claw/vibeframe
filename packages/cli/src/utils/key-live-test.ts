/**
 * Lightweight live-test for API keys. Each tester hits the provider's
 * cheapest authenticated endpoint (typically a list-models route) and
 * reports ok / not-ok. Tests run with a short timeout so a hung
 * provider doesn't stall `vibe doctor`.
 *
 * Coverage is intentionally partial: providers without a free
 * authenticated GET (fal, Kling, Runway, ImgBB) report `skipped: true`
 * with a short reason. Adding a new provider tester is a one-row patch
 * to the `TESTERS` table at the bottom.
 */

const DEFAULT_TIMEOUT_MS = 5000;

export interface KeyLiveTestResult {
  /** Did the call succeed (2xx)? */
  ok: boolean;
  /** True when the provider has no cheap test endpoint. */
  skipped?: boolean;
  /** HTTP status when applicable. */
  status?: number;
  /** Short human-readable reason — set on skip or failure. */
  message?: string;
}

interface Tester {
  name: string;
  test(key: string, signal: AbortSignal): Promise<KeyLiveTestResult>;
}

async function getOk(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<KeyLiveTestResult> {
  try {
    const res = await fetch(url, { method: "GET", headers, signal });
    if (res.ok) return { ok: true, status: res.status };
    return {
      ok: false,
      status: res.status,
      message: `${res.status} ${res.statusText || ""}`.trim(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: msg };
  }
}

const TESTERS: Record<string, Tester> = {
  anthropic: {
    name: "Anthropic",
    test: (key, signal) =>
      getOk(
        "https://api.anthropic.com/v1/models",
        { "x-api-key": key, "anthropic-version": "2023-06-01" },
        signal,
      ),
  },
  openai: {
    name: "OpenAI",
    test: (key, signal) =>
      getOk(
        "https://api.openai.com/v1/models",
        { Authorization: `Bearer ${key}` },
        signal,
      ),
  },
  google: {
    name: "Google",
    test: (key, signal) =>
      getOk(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
        {},
        signal,
      ),
  },
  xai: {
    name: "xAI",
    test: (key, signal) =>
      getOk(
        "https://api.x.ai/v1/models",
        { Authorization: `Bearer ${key}` },
        signal,
      ),
  },
  elevenlabs: {
    name: "ElevenLabs",
    test: (key, signal) =>
      getOk("https://api.elevenlabs.io/v1/user", { "xi-api-key": key }, signal),
  },
  replicate: {
    name: "Replicate",
    test: (key, signal) =>
      getOk(
        "https://api.replicate.com/v1/account",
        { Authorization: `Bearer ${key}` },
        signal,
      ),
  },
  openrouter: {
    name: "OpenRouter",
    test: (key, signal) =>
      getOk(
        "https://openrouter.ai/api/v1/models",
        { Authorization: `Bearer ${key}` },
        signal,
      ),
  },
  // Runway: /v1/organization is a read-only GET that returns tier info
  // (free, doesn't consume credits). Requires the X-Runway-Version
  // header alongside the Bearer token — without it the request 401s.
  runway: {
    name: "Runway",
    test: (key, signal) =>
      getOk(
        "https://api.dev.runwayml.com/v1/organization",
        {
          Authorization: `Bearer ${key}`,
          "X-Runway-Version": "2024-11-06",
        },
        signal,
      ),
  },
  // The three below still have no cheap authenticated GET as of v0.83:
  // fal lacks a documented validation endpoint, Kling auth is per-
  // request HMAC-signed, ImgBB's only authenticated route is image
  // upload. Surface them as `skipped` so the user knows we didn't
  // blank-check.
  fal: {
    name: "fal.ai",
    test: async () => ({ ok: false, skipped: true, message: "no auth-only endpoint published" }),
  },
  kling: {
    name: "Kling",
    test: async () => ({ ok: false, skipped: true, message: "per-request HMAC; can't test cheaply" }),
  },
  imgbb: {
    name: "ImgBB",
    test: async () => ({ ok: false, skipped: true, message: "only auth route is image upload" }),
  },
};

/**
 * Run a live test for one provider key. Returns `{ ok: false, skipped:
 * true }` for providers without a cheap test, so the caller can render
 * a different glyph.
 */
export async function testKey(
  configKey: string,
  key: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<KeyLiveTestResult> {
  const tester = TESTERS[configKey];
  if (!tester) {
    return { ok: false, skipped: true, message: "no tester registered" };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await tester.test(key, ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

/** Lookup table introspection — used by tests + doctor's print loop. */
export function isTestableProvider(configKey: string): boolean {
  const t = TESTERS[configKey];
  if (!t) return false;
  // The four "skipped" testers return `skipped: true` synchronously; we
  // can't tell from the table alone, so just check membership.
  return true;
}
