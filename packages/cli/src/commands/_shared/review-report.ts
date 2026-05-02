import { writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export type ReviewSeverity = "error" | "warning" | "info";
export type ReviewStatus = "pass" | "warn" | "fail";

export interface ReviewIssue {
  severity: ReviewSeverity;
  code: string;
  message: string;
  file?: string;
  scene?: string;
  suggestedFix?: string;
}

export function statusFromIssues(issues: ReviewIssue[]): ReviewStatus {
  if (issues.some((issue) => issue.severity === "error")) return "fail";
  if (issues.some((issue) => issue.severity === "warning")) return "warn";
  return "pass";
}

export function scoreIssues(issues: ReviewIssue[]): number {
  let score = 100;
  for (const issue of issues) {
    if (issue.severity === "error") score -= 25;
    else if (issue.severity === "warning") score -= 8;
    else score -= 2;
  }
  return Math.max(0, Math.min(100, score));
}

export function uniqueRetryWith(items: Array<string | undefined | null>): string[] {
  return [...new Set(items.filter((item): item is string => typeof item === "string" && item.length > 0))];
}

export function defaultReviewReportPath(projectDir: string): string {
  return join(resolve(projectDir), "review-report.json");
}

export async function writeReviewReport(path: string, report: Record<string, unknown>): Promise<void> {
  await writeFile(path, JSON.stringify(report, null, 2) + "\n", "utf-8");
}

