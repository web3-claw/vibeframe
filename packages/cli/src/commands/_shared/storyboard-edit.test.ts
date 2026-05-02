import { describe, expect, it } from "vitest";

import {
  moveStoryboardBeat,
  setStoryboardCue,
  validateStoryboardMarkdown,
} from "./storyboard-edit.js";
import { parseStoryboard } from "./storyboard-parse.js";

const STORYBOARD = `# Demo

## Beat hook - Hook

\`\`\`yaml
duration: 3
narration: "Old line."
\`\`\`

Body.

## Beat proof - Proof

Body 2.
`;

describe("storyboard-edit", () => {
  it("sets one cue while preserving the beat body", () => {
    const next = setStoryboardCue(STORYBOARD, {
      beatId: "hook",
      key: "narration",
      value: "New line.",
    });
    const parsed = parseStoryboard(next);
    expect(parsed.beats[0].cues?.narration).toBe("New line.");
    expect(parsed.beats[0].body).toContain("Body.");
  });

  it("creates a cue block when a beat has none", () => {
    const next = setStoryboardCue(STORYBOARD, {
      beatId: "proof",
      key: "duration",
      value: "4.5",
    });
    const parsed = parseStoryboard(next);
    expect(parsed.beats[1].cues?.duration).toBe(4.5);
    expect(parsed.beats[1].body).toContain("Body 2.");
  });

  it("moves a beat after another beat", () => {
    const next = moveStoryboardBeat(STORYBOARD, {
      beatId: "hook",
      afterBeatId: "proof",
    });
    expect(parseStoryboard(next).beats.map((beat) => beat.id)).toEqual(["proof", "hook"]);
  });

  it("validates duplicate beat ids and invalid cue shapes", () => {
    const result = validateStoryboardMarkdown(`${STORYBOARD}\n## Beat hook - Again\n\n\`\`\`yaml\nduration: nope\n\`\`\`\n`);
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("DUPLICATE_BEAT_ID");
    expect(result.issues.map((issue) => issue.code)).toContain("INVALID_DURATION");
  });
});
