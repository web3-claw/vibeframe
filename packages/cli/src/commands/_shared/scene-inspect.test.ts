import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { inspectProject } from "./scene-inspect.js";
import { projectConfigJson } from "./project-config.js";

async function makeTmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), "vibe-scene-inspect-"));
}

describe("inspectProject", () => {
  it("reports missing compositions and writes review-report.json by default", async () => {
    const dir = await makeTmp();
    await writeFile(resolve(dir, "vibe.config.json"), projectConfigJson({ name: "promo" }), "utf-8");
    await writeFile(resolve(dir, "DESIGN.md"), "# Design\n", "utf-8");
    await writeFile(resolve(dir, "index.html"), "<!doctype html><html><body></body></html>", "utf-8");
    await writeFile(resolve(dir, "STORYBOARD.md"), `# Promo

## Beat hook - Hook

\`\`\`yaml
duration: 3
narration: "Hello."
\`\`\`

Body.
`, "utf-8");

    const result = await inspectProject({ projectDir: dir });
    expect(result.status).toBe("fail");
    expect(result.checks.storyboard.beatCount).toBe(1);
    expect(result.checks.compositions.missing).toEqual(["compositions/scene-hook.html"]);
    expect(result.issues.some((issue) => issue.code === "MISSING_COMPOSITION")).toBe(true);
    expect(result.reportPath).toBe(resolve(dir, "review-report.json"));
  });

  it("returns a structured failure when the project directory is missing", async () => {
    const result = await inspectProject({
      projectDir: resolve(await makeTmp(), "missing"),
      writeReport: false,
    });
    expect(result.status).toBe("fail");
    expect(result.issues[0].code).toBe("PROJECT_NOT_FOUND");
    expect(result.retryWith[0]).toContain("vibe init");
  });
});

