import { buildDesignMd } from "./scene-project.js";

export interface StoryboardDraft {
  storyboardMd: string;
  designMd: string;
  warnings: string[];
}

export function draftStoryboardFromBrief(opts: {
  name: string;
  brief: string;
  durationSec?: number;
}): StoryboardDraft {
  const total = Number.isFinite(opts.durationSec) && opts.durationSec && opts.durationSec > 0
    ? opts.durationSec
    : 45;
  const beatDurations = splitDuration(total, 3);
  const brief = opts.brief.trim().replace(/\s+/g, " ");
  const product = opts.name;

  const storyboardMd = `---
title: ${JSON.stringify(product)}
duration: ${total}
aspect: 16:9
providers:
  tts: auto
  image: openai
---

# ${product} - Storyboard

Brief: ${brief}

## Beat hook - Hook

\`\`\`yaml
duration: ${beatDurations[0]}
narration: "Open with the viewer's problem and the clearest promise from the brief."
backdrop: "Polished opening frame for: ${escapeCue(brief)}"
motion: "Large kinetic headline, fast proof-oriented reveal, restrained camera push"
\`\`\`

Make the value obvious in one beat. Avoid setup that delays the payoff.

## Beat proof - Proof

\`\`\`yaml
duration: ${beatDurations[1]}
narration: "Show the mechanism that makes the promise believable."
backdrop: "Concrete product or workflow proof frame for: ${escapeCue(brief)}"
motion: "Layered interface panels, highlighted cause-and-effect, precise transitions"
\`\`\`

Turn the brief into a visible workflow, product moment, metric, or before/after.

## Beat close - Close

\`\`\`yaml
duration: ${beatDurations[2]}
narration: "Close with the action or idea the viewer should remember."
backdrop: "Resolved hero frame with clean negative space for: ${escapeCue(brief)}"
motion: "Confident final lockup, subtle parallax, clear call-to-action"
\`\`\`

End on the product name, command, offer, or memorable final line.
`;

  return {
    storyboardMd,
    designMd: buildDesignMd({ name: product }),
    warnings: [
      "Drafted with the local deterministic storyboard template. Refine STORYBOARD.md and DESIGN.md before build.",
    ],
  };
}

function splitDuration(total: number, count: number): number[] {
  const base = Math.max(1, Math.floor((total / count) * 10) / 10);
  const out = Array.from({ length: count }, () => base);
  const used = base * count;
  out[out.length - 1] = Number(Math.max(1, total - used + base).toFixed(1));
  return out;
}

function escapeCue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').slice(0, 180);
}
