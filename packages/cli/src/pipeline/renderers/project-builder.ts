import { mkdtemp, mkdir, copyFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import type { TimelineState } from "@vibeframe/core";
import { generateCompositionHtml } from "./html-template.js";

export interface TempProject {
  dir: string;
  cleanup: () => Promise<void>;
}

export async function buildTempProject(
  state: TimelineState,
  projectFileDir?: string
): Promise<TempProject> {
  const dir = await mkdtemp(path.join(tmpdir(), "vibeframe-hf-"));
  const assetsDir = path.join(dir, "assets");
  await mkdir(assetsDir, { recursive: true });

  const copied = new Map<string, string>();
  for (const source of state.sources) {
    if (copied.has(source.id)) continue;
    const resolved = resolveSourceUrl(source.url, projectFileDir);
    if (!existsSync(resolved)) {
      throw new Error(`Source file not found: ${resolved} (from source id=${source.id})`);
    }
    const dest = path.join(assetsDir, path.basename(resolved));
    await copyFile(resolved, dest);
    copied.set(source.id, dest);
  }

  const html = generateCompositionHtml(state);
  await writeFile(path.join(dir, "index.html"), html, "utf-8");

  return {
    dir,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}

export function resolveSourceUrl(url: string, baseDir?: string): string {
  if (url.startsWith("file://")) return url.slice(7);
  if (path.isAbsolute(url)) return url;
  if (baseDir) return path.resolve(baseDir, url);
  return path.resolve(process.cwd(), url);
}
