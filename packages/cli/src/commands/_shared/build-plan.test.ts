import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { createBuildPlan } from "./build-plan.js";
import { projectConfigJson } from "./project-config.js";

async function makeProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "vibe-build-plan-"));
  await mkdir(resolve(dir, "assets"), { recursive: true });
  await writeFile(resolve(dir, "vibe.config.json"), projectConfigJson({ name: "promo", aspect: "16:9" }), "utf-8");
  await writeFile(resolve(dir, "STORYBOARD.md"), `# Promo

## Beat hook - Hook

\`\`\`yaml
duration: 4
narration: "Say the thing."
backdrop: "Clean product frame."
\`\`\`

Body.
`, "utf-8");
  return dir;
}

describe("createBuildPlan", () => {
  it("reports missing generated assets and estimated cost", async () => {
    const dir = await makeProject();
    const plan = await createBuildPlan({ projectDir: dir, stage: "assets" });
    expect(plan.beats).toHaveLength(1);
    expect(plan.missing).toContain("assets");
    expect(plan.providers).toContain("auto-tts");
    expect(plan.providers).toContain("openai");
    expect(plan.estimatedCostUsd).toBe(3.05);
  });

  it("does not estimate cost for cached assets", async () => {
    const dir = await makeProject();
    await writeFile(resolve(dir, "assets/narration-hook.mp3"), "fake", "utf-8");
    await writeFile(resolve(dir, "assets/backdrop-hook.png"), "fake", "utf-8");
    const plan = await createBuildPlan({ projectDir: dir, stage: "assets" });
    expect(plan.estimatedCostUsd).toBe(0);
    expect(plan.beats[0].assets.narration?.exists).toBe(true);
    expect(plan.beats[0].assets.backdrop?.exists).toBe(true);
  });
});
