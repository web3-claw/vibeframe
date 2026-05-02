import { describe, expect, it } from "vitest";

import {
  parseBlackdetectOutput,
  parseSilencedetectOutput,
} from "./render-inspect.js";

describe("render inspect parsers", () => {
  it("parses ffmpeg blackdetect output", () => {
    const out = `
[blackdetect @ 0x123] black_start:0 black_end:1.24 black_duration:1.24
[blackdetect @ 0x123] black_start:5.5 black_end:6 black_duration:0.5
`;
    expect(parseBlackdetectOutput(out)).toEqual([
      { start: 0, end: 1.24, duration: 1.24 },
      { start: 5.5, end: 6, duration: 0.5 },
    ]);
  });

  it("parses ffmpeg silencedetect output", () => {
    const out = `
[silencedetect @ 0x123] silence_start: 2.1
[silencedetect @ 0x123] silence_end: 4.4 | silence_duration: 2.3
[silencedetect @ 0x123] silence_start: 8
[silencedetect @ 0x123] silence_end: 9.5 | silence_duration: 1.5
`;
    expect(parseSilencedetectOutput(out)).toEqual([
      { start: 2.1, end: 4.4, duration: 2.3 },
      { start: 8, end: 9.5, duration: 1.5 },
    ]);
  });
});

