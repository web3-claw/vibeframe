/**
 * Context command - Output CONTEXT.md for agent runtime discovery.
 * Allows AI agents to read CLI guidelines without needing CLAUDE.md or CONTEXT.md on disk.
 */

import { Command } from "commander";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const contextCommand = new Command("context")
  .description("Print CLI context/guidelines for AI agent integration")
  .action(async (_options, cmd) => {
    const options = { json: cmd.parent?.opts()?.json || cmd.opts()?.json };
    // CONTEXT.md lives at packages/cli/CONTEXT.md (one level up from dist/).
    // Pre-v0.79.3 this resolved to `../../CONTEXT.md` which silently
    // missed the file and fell through to the inline fallback every
    // time — `vibe context` only ever printed 8 lines.
    const contextPath = resolve(__dirname, "../CONTEXT.md");

    try {
      const content = await readFile(contextPath, "utf-8");

      if (options.json) {
        // Parse sections from markdown
        const sections: Record<string, string> = {};
        let currentSection = "overview";
        const lines = content.split("\n");

        for (const line of lines) {
          const headerMatch = line.match(/^##\s+(.+)/);
          if (headerMatch) {
            currentSection = headerMatch[1]
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_|_$/g, "");
            sections[currentSection] = "";
          } else {
            sections[currentSection] = (sections[currentSection] || "") + line + "\n";
          }
        }

        // Trim all section values
        for (const key of Object.keys(sections)) {
          sections[key] = sections[key].trim();
        }

        console.log(JSON.stringify({ tool: "vibeframe", version: process.env.npm_package_version || "unknown", sections }, null, 2));
      } else {
        console.log(content);
      }
    } catch {
      // Fallback: inline minimal context if file not found (e.g., bundled/npx usage)
      const fallback = `# VibeFrame CLI Agent Context

Use 'vibe schema --list --json' to discover all commands.
Use 'vibe schema <command> --json' to get parameter schemas.
Use 'vibe doctor --json' to check configured API keys.
Use '--dry-run --json' before any mutating/costly operation.

Cost tiers: Free (detect, edit silence-cut/fade/noise-reduce, project, timeline) | Low (inspect, audio transcribe, generate image) | High (generate video, edit image) | Very High (remix highlights/auto-shorts/regenerate-scene, vibe build)

Group → MCP tool name: '<group>_<leaf>' (snake_case). Bare top-level (init/build/render/run) maps to bare MCP names.

Full reference: docs/cli-reference.md
`;
      if (options.json) {
        console.log(JSON.stringify({ tool: "vibeframe", fallback: true, context: fallback }));
      } else {
        console.log(fallback);
      }
    }
  });
