import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  createAndWriteJobRecord,
  inspectProjectStatus,
  normalizeJobStatus,
  readJobRecord,
  refreshJobRecord,
} from "./status-jobs.js";

async function tempProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "vibe-status-jobs-"));
  await writeFile(join(dir, "STORYBOARD.md"), "# Story\n\n## Beat hook\n", "utf-8");
  return dir;
}

describe("status job records", () => {
  it("writes and reads local job records", async () => {
    const dir = await tempProject();
    const record = await createAndWriteJobRecord({
      id: "job_test",
      now: new Date("2026-01-01T00:00:00.000Z"),
      jobType: "generate-video",
      provider: "runway",
      providerTaskId: "task_123",
      providerTaskType: "text2video",
      projectDir: dir,
      workingDirectory: dir,
      command: "generate video --no-wait",
      prompt: "A long launch video prompt",
    });

    expect(record.id).toBe("job_test");
    expect(record.retryWith).toContain(`vibe status job job_test --project ${resolve(dir)} --json`);
    expect(record.retryWith).toContain("vibe generate video-status task_123 -p runway --json");

    const raw = await readFile(join(dir, ".vibeframe", "jobs", "job_test.json"), "utf-8");
    expect(JSON.parse(raw)).toMatchObject({ id: "job_test", providerTaskId: "task_123" });

    const read = await readJobRecord("job_test", dir);
    expect(read?.provider).toBe("runway");
  });

  it("summarizes build, review, and job state for a project", async () => {
    const dir = await tempProject();
    await mkdir(join(dir, ".vibeframe", "jobs"), { recursive: true });
    await writeFile(join(dir, "build-report.json"), JSON.stringify({
      success: true,
      phase: "done",
      selectedStage: "all",
      outputPath: "renders/final.mp4",
      warnings: [],
    }), "utf-8");
    await writeFile(join(dir, "review-report.json"), JSON.stringify({
      kind: "render",
      status: "warn",
      score: 82,
      issues: [{ severity: "warning", code: "X", message: "Check" }],
    }), "utf-8");
    await createAndWriteJobRecord({
      id: "job_music",
      jobType: "generate-music",
      provider: "replicate",
      providerTaskId: "music_1",
      projectDir: dir,
      command: "generate music --no-wait",
      status: "completed",
    });

    const status = await inspectProjectStatus(dir);
    expect(status.build).toMatchObject({ success: true, phase: "done" });
    expect(status.review).toMatchObject({ status: "warn", score: 82, issueCount: 1 });
    expect(status.jobs).toMatchObject({ total: 1, completed: 1, active: 0 });
  });

  it("normalizes provider status strings", () => {
    expect(normalizeJobStatus("processing")).toBe("running");
    expect(normalizeJobStatus("in_progress")).toBe("running");
    expect(normalizeJobStatus("canceled")).toBe("cancelled");
    expect(normalizeJobStatus("wat")).toBe("unknown");
  });

  it("keeps unsupported provider refresh local", async () => {
    const dir = await tempProject();
    const record = await createAndWriteJobRecord({
      id: "job_grok",
      jobType: "generate-video",
      provider: "grok",
      providerTaskId: "grok_1",
      projectDir: dir,
      command: "generate video --no-wait",
    });

    const result = await refreshJobRecord(record);
    expect(result.refreshed).toBe(false);
    expect(result.live.supported).toBe(false);
    expect(result.warnings[0]).toContain("not supported");
  });
});
