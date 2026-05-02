import { createHash, randomUUID } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, parse, resolve } from "node:path";

import { executeVideoStatus } from "../ai-video.js";
import { executeMusicStatus } from "../generate/music-status.js";

export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled" | "unknown";
export type JobType = "generate-video" | "generate-music";

export interface JobRecord {
  schemaVersion: "1";
  id: string;
  jobType: JobType;
  status: JobStatus;
  providerStatus?: string;
  createdAt: string;
  updatedAt: string;
  projectDir: string;
  workingDirectory: string;
  command: string;
  provider: string;
  providerTaskId: string;
  providerTaskType?: "text2video" | "image2video";
  progress?: number;
  resultUrl?: string;
  outputPath?: string;
  error?: string;
  promptPreview?: string;
  retryWith: string[];
}

export interface CreateJobRecordOptions {
  id?: string;
  now?: Date;
  jobType: JobType;
  status?: JobStatus;
  provider: string;
  providerTaskId: string;
  providerTaskType?: "text2video" | "image2video";
  projectDir?: string;
  workingDirectory?: string;
  command: string;
  prompt?: string;
  progress?: number;
  resultUrl?: string;
  outputPath?: string;
  error?: string;
}

export interface RefreshJobOptions {
  wait?: boolean;
  output?: string;
  workingDirectory?: string;
  write?: boolean;
}

export interface JobStatusResult {
  schemaVersion: "1";
  job: JobRecord;
  refreshed: boolean;
  live: {
    supported: boolean;
    error?: string;
  };
  warnings: string[];
  retryWith: string[];
}

export interface ProjectStatusResult {
  schemaVersion: "1";
  project: string;
  build: BuildSummary | null;
  review: ReviewSummary | null;
  jobs: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cancelled: number;
    unknown: number;
    latest: JobSummary[];
  };
  warnings: string[];
  retryWith: string[];
}

export interface BuildSummary {
  reportPath: string;
  success?: boolean;
  phase?: string;
  selectedStage?: string;
  outputPath?: string;
  updatedAt?: string;
  warnings: unknown[];
}

export interface ReviewSummary {
  reportPath: string;
  kind?: string;
  status?: string;
  score?: number;
  issueCount: number;
  updatedAt?: string;
}

export interface JobSummary {
  id: string;
  jobType: JobType;
  status: JobStatus;
  provider: string;
  providerTaskId: string;
  providerTaskType?: string;
  progress?: number;
  resultUrl?: string;
  outputPath?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  retryWith: string[];
}

export function findProjectRoot(start = process.cwd()): string {
  let dir = resolve(start);
  try {
    if (existsSync(dir) && statSync(dir).isFile()) dir = dirname(dir);
  } catch {
    // Keep the resolved path and walk upward.
  }

  for (;;) {
    if (existsSync(join(dir, "vibe.config.json")) || existsSync(join(dir, "STORYBOARD.md"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

export function jobsDir(projectDir: string): string {
  return join(resolve(projectDir), ".vibeframe", "jobs");
}

export function normalizeJobStatus(status: unknown): JobStatus {
  const value = String(status ?? "").toLowerCase();
  if (value === "completed" || value === "succeeded" || value === "success") return "completed";
  if (value === "failed" || value === "error") return "failed";
  if (value === "cancelled" || value === "canceled") return "cancelled";
  if (value === "queued" || value === "pending") return "queued";
  if (value === "running" || value === "processing" || value === "in_progress" || value === "started") return "running";
  return "unknown";
}

export function createJobRecord(opts: CreateJobRecordOptions): JobRecord {
  const now = opts.now ?? new Date();
  const projectDir = resolve(opts.projectDir ?? findProjectRoot(opts.workingDirectory ?? process.cwd()));
  const workingDirectory = resolve(opts.workingDirectory ?? process.cwd());
  const id = opts.id ?? makeJobId(opts.providerTaskId, now);
  const base: JobRecord = {
    schemaVersion: "1",
    id,
    jobType: opts.jobType,
    status: opts.status ?? "running",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    projectDir,
    workingDirectory,
    command: opts.command,
    provider: opts.provider,
    providerTaskId: opts.providerTaskId,
    providerTaskType: opts.providerTaskType,
    progress: opts.progress,
    resultUrl: opts.resultUrl,
    outputPath: opts.outputPath,
    error: opts.error,
    promptPreview: previewPrompt(opts.prompt),
    retryWith: [],
  };
  base.retryWith = retryWithForJob(base);
  return stripUndefined(base);
}

export async function createAndWriteJobRecord(opts: CreateJobRecordOptions): Promise<JobRecord> {
  const record = createJobRecord(opts);
  await writeJobRecord(record);
  return record;
}

export async function writeJobRecord(record: JobRecord): Promise<void> {
  const dir = jobsDir(record.projectDir);
  await mkdir(dir, { recursive: true });
  await writeFile(jobRecordPath(record.id, record.projectDir), JSON.stringify(stripUndefined(record), null, 2) + "\n", "utf-8");
}

export async function readJobRecord(jobId: string, projectDir?: string): Promise<JobRecord | null> {
  const id = normalizeJobId(jobId);
  const project = resolve(projectDir ?? findProjectRoot());
  const path = jobRecordPath(id, project);
  if (!existsSync(path)) return null;
  return parseJobRecord(await readFile(path, "utf-8"));
}

export async function listJobRecords(projectDir: string): Promise<JobRecord[]> {
  const dir = jobsDir(projectDir);
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const records: JobRecord[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    try {
      const parsed = parseJobRecord(await readFile(join(dir, entry.name), "utf-8"));
      if (parsed) records.push(parsed);
    } catch {
      // Ignore malformed job files; status project should stay useful.
    }
  }
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function refreshJobRecord(record: JobRecord, opts: RefreshJobOptions = {}): Promise<JobStatusResult> {
  const warnings: string[] = [];
  const live = liveSupport(record);
  if (!live.supported) {
    warnings.push(`Live status is not supported for ${record.provider} ${record.jobType} jobs yet.`);
    return {
      schemaVersion: "1",
      job: record,
      refreshed: false,
      live,
      warnings,
      retryWith: retryWithForJob(record),
    };
  }

  let updated = record;
  try {
    if (record.jobType === "generate-video") {
      const output = opts.output ? resolve(opts.workingDirectory ?? process.cwd(), opts.output) : undefined;
      const result = await executeVideoStatus({
        taskId: record.providerTaskId,
        provider: record.provider as "runway" | "kling",
        taskType: record.providerTaskType as "text2video" | "image2video" | undefined,
        wait: opts.wait,
        output,
      });
      if (!result.success) throw new Error(result.error ?? "Video status check failed");
      updated = updateRecordFromProvider(record, {
        status: result.status,
        progress: result.progress,
        resultUrl: result.videoUrl,
        outputPath: result.outputPath,
        error: result.error,
      });
    } else if (record.jobType === "generate-music") {
      const result = await refreshMusicStatus(record.providerTaskId, opts.wait);
      if (!result.success) throw new Error(result.error ?? "Music status check failed");
      let outputPath: string | undefined;
      if (opts.output && result.audioUrl) {
        outputPath = await downloadUrl(result.audioUrl, resolve(opts.workingDirectory ?? process.cwd(), opts.output));
      }
      updated = updateRecordFromProvider(record, {
        status: result.status,
        resultUrl: result.audioUrl,
        outputPath,
        error: result.error,
      });
    }
    if (opts.write !== false) await writeJobRecord(updated);
    return {
      schemaVersion: "1",
      job: updated,
      refreshed: true,
      live,
      warnings,
      retryWith: retryWithForJob(updated),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push(message);
    return {
      schemaVersion: "1",
      job: record,
      refreshed: false,
      live: { ...live, error: message },
      warnings,
      retryWith: retryWithForJob(record),
    };
  }
}

export async function inspectProjectStatus(projectDirArg: string, opts: { refresh?: boolean } = {}): Promise<ProjectStatusResult> {
  const project = resolve(projectDirArg);
  const warnings: string[] = [];
  let records = await listJobRecords(project);
  if (opts.refresh) {
    const refreshed: JobRecord[] = [];
    for (const record of records) {
      if (!isActiveStatus(record.status)) {
        refreshed.push(record);
        continue;
      }
      const result = await refreshJobRecord(record, { write: true });
      warnings.push(...result.warnings);
      refreshed.push(result.job);
    }
    records = refreshed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const retryWith = [
    `vibe status project ${project} --json`,
    ...records.filter((record) => isActiveStatus(record.status)).map((record) => `vibe status job ${record.id} --project ${project} --json`),
  ];

  return {
    schemaVersion: "1",
    project,
    build: await readBuildSummary(project),
    review: await readReviewSummary(project),
    jobs: summarizeJobs(records),
    warnings,
    retryWith: unique(retryWith),
  };
}

export function summarizeJob(record: JobRecord): JobSummary {
  return stripUndefined({
    id: record.id,
    jobType: record.jobType,
    status: record.status,
    provider: record.provider,
    providerTaskId: record.providerTaskId,
    providerTaskType: record.providerTaskType,
    progress: record.progress,
    resultUrl: record.resultUrl,
    outputPath: record.outputPath,
    error: record.error,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    retryWith: retryWithForJob(record),
  });
}

export function retryWithForJob(record: JobRecord): string[] {
  return unique([
    `vibe status job ${record.id} --project ${record.projectDir} --json`,
    providerStatusCommand(record),
  ]);
}

function makeJobId(providerTaskId: string, now: Date): string {
  const hash = createHash("sha256")
    .update(`${providerTaskId}:${randomUUID()}`)
    .digest("hex")
    .slice(0, 8);
  return `job_${now.getTime().toString(36)}_${hash}`;
}

function normalizeJobId(jobId: string): string {
  const id = jobId.endsWith(".json") ? parse(jobId).name : jobId;
  if (!/^[A-Za-z0-9_.-]+$/.test(id)) {
    throw new Error(`Invalid job id: ${jobId}`);
  }
  return id;
}

function jobRecordPath(jobId: string, projectDir: string): string {
  return join(jobsDir(projectDir), `${normalizeJobId(jobId)}.json`);
}

function parseJobRecord(raw: string): JobRecord | null {
  const parsed = JSON.parse(raw) as Partial<JobRecord>;
  if (parsed.schemaVersion !== "1" || typeof parsed.id !== "string" || typeof parsed.providerTaskId !== "string") {
    return null;
  }
  return {
    ...parsed,
    status: normalizeJobStatus(parsed.status),
    retryWith: Array.isArray(parsed.retryWith) ? parsed.retryWith : [],
  } as JobRecord;
}

function updateRecordFromProvider(record: JobRecord, result: {
  status?: string;
  progress?: number;
  resultUrl?: string;
  outputPath?: string;
  error?: string;
}): JobRecord {
  const next: JobRecord = {
    ...record,
    status: normalizeJobStatus(result.status ?? record.status),
    providerStatus: result.status ?? record.providerStatus,
    progress: result.progress ?? record.progress,
    resultUrl: result.resultUrl ?? record.resultUrl,
    outputPath: result.outputPath ?? record.outputPath,
    error: result.error ?? record.error,
    updatedAt: new Date().toISOString(),
  };
  next.retryWith = retryWithForJob(next);
  return stripUndefined(next);
}

function liveSupport(record: JobRecord): { supported: boolean; error?: string } {
  if (record.jobType === "generate-video" && (record.provider === "runway" || record.provider === "kling")) {
    return { supported: true };
  }
  if (record.jobType === "generate-music" && record.provider === "replicate") {
    return { supported: true };
  }
  return { supported: false };
}

async function refreshMusicStatus(taskId: string, wait?: boolean): Promise<{
  success: boolean;
  status?: string;
  audioUrl?: string;
  error?: string;
}> {
  let result = await executeMusicStatus({ taskId });
  if (!wait) return result;
  for (let i = 0; i < 120 && result.success && result.status === "processing"; i++) {
    await sleep(5000);
    result = await executeMusicStatus({ taskId });
  }
  return result;
}

async function downloadUrl(url: string, outputPath: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
  return outputPath;
}

async function readBuildSummary(projectDir: string): Promise<BuildSummary | null> {
  const reportPath = join(projectDir, "build-report.json");
  const report = await readJson(reportPath);
  if (!report) return null;
  const info = await statOrNull(reportPath);
  return stripUndefined({
    reportPath,
    success: typeof report.success === "boolean" ? report.success : undefined,
    phase: typeof report.phase === "string" ? report.phase : undefined,
    selectedStage: typeof report.selectedStage === "string" ? report.selectedStage : undefined,
    outputPath: typeof report.outputPath === "string" ? report.outputPath : undefined,
    updatedAt: info?.mtime.toISOString(),
    warnings: Array.isArray(report.warnings) ? report.warnings : [],
  });
}

async function readReviewSummary(projectDir: string): Promise<ReviewSummary | null> {
  const reportPath = join(projectDir, "review-report.json");
  const report = await readJson(reportPath);
  if (!report) return null;
  const info = await statOrNull(reportPath);
  return stripUndefined({
    reportPath,
    kind: typeof report.kind === "string" ? report.kind : undefined,
    status: typeof report.status === "string" ? report.status : undefined,
    score: typeof report.score === "number" ? report.score : undefined,
    issueCount: Array.isArray(report.issues) ? report.issues.length : 0,
    updatedAt: info?.mtime.toISOString(),
  });
}

function summarizeJobs(records: JobRecord[]): ProjectStatusResult["jobs"] {
  return {
    total: records.length,
    active: records.filter((record) => isActiveStatus(record.status)).length,
    completed: records.filter((record) => record.status === "completed").length,
    failed: records.filter((record) => record.status === "failed").length,
    cancelled: records.filter((record) => record.status === "cancelled").length,
    unknown: records.filter((record) => record.status === "unknown").length,
    latest: records.slice(0, 10).map(summarizeJob),
  };
}

function isActiveStatus(status: JobStatus): boolean {
  return status === "queued" || status === "running";
}

function providerStatusCommand(record: JobRecord): string | undefined {
  if (record.jobType === "generate-video") {
    const type = record.provider === "kling" && record.providerTaskType ? ` --type ${record.providerTaskType}` : "";
    return `vibe generate video-status ${record.providerTaskId} -p ${record.provider}${type} --json`;
  }
  if (record.jobType === "generate-music" && record.provider === "replicate") {
    return `vibe generate music-status ${record.providerTaskId} --json`;
  }
  return undefined;
}

function previewPrompt(prompt: string | undefined): string | undefined {
  if (!prompt) return undefined;
  const compact = prompt.replace(/\s+/g, " ").trim();
  if (!compact) return undefined;
  return compact.length > 160 ? `${compact.slice(0, 157)}...` : compact;
}

async function readJson(path: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function statOrNull(path: string): Promise<Awaited<ReturnType<typeof stat>> | null> {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

function stripUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function unique(items: Array<string | undefined>): string[] {
  return [...new Set(items.filter((item): item is string => typeof item === "string" && item.length > 0))];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
