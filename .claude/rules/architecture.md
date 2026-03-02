---
description: Package structure, Agent architecture, development workflow
globs:
  - "packages/**"
  - ".claude/skills/**"
---

# Architecture Details

## Skills → CLI → Agent Workflow

```
.claude/skills/           Development-time API reference + Python helpers
       ↓
packages/cli/             CLI implementation (TypeScript/Commander.js)
       ↓
scripts/install.sh        User installation via curl | bash (copied to apps/web/public/ on build)
       ↓
Agent (vibe)              Natural language → LLM tool calling → autonomous execution
```

**Claude Code Skills** (`.claude/skills/`):
- Each skill contains `SKILL.md` (API documentation) and `scripts/` (Python helpers)
- Used during development to understand API capabilities and test integrations
- Python scripts serve as working reference implementations

**CLI** (`packages/cli/`):
- Production commands built in TypeScript using Commander.js
- Calls Python helper scripts or implements providers directly
- Supports `--provider` option for multi-provider commands (image, video, etc.)

**Agent** (`packages/cli/src/agent/`) - **Interactive CLI / Onboarding entry point**:
- `vibe` (no args) starts an interactive natural language session
- Useful when working standalone (no Claude Code or MCP client available)
- In Claude Code or Cursor+MCP environments, prefer running CLI commands directly
- Multi-turn: LLM reasoning → tool call → result → repeat until complete
- 5 LLM providers: OpenAI, Claude, Gemini, Ollama, xAI Grok
- 59 tools across 7 categories (project, timeline, filesystem, media, AI, export, batch)
- `--confirm` flag: prompts before each tool execution
- Example: "create project and add video" → multiple tool calls autonomously

> **Priority note**: CLI commands are the core. MCP is the primary integration path for Claude Desktop/Cursor. Agent mode is best for onboarding and environments without Claude Code or MCP.

**REPL** (deprecated):
- Legacy single-command mode, replaced by Agent mode
- Code kept in `src/repl/` for library usage (marked `@deprecated`)

## Agent Architecture

```
packages/cli/src/agent/
├── index.ts                 # AgentExecutor - main agentic loop
├── types.ts                 # ToolDefinition, ToolCall, AgentMessage, etc.
├── adapters/
│   ├── index.ts             # LLMAdapter interface + factory
│   ├── openai.ts            # OpenAI Function Calling
│   ├── claude.ts            # Claude tool_use
│   ├── gemini.ts            # Gemini Function Calling
│   ├── ollama.ts            # Ollama JSON parsing
│   └── xai.ts               # xAI Grok (OpenAI-compatible)
├── tools/
│   ├── index.ts             # ToolRegistry
│   ├── project.ts           # 5 project tools
│   ├── timeline.ts          # 11 timeline tools
│   ├── filesystem.ts        # 4 filesystem tools
│   ├── media.ts             # 8 media tools
│   ├── ai.ts                # 24 AI generation tools (basic + pipeline)
│   ├── export.ts            # 3 export tools
│   └── batch.ts             # 3 batch tools
├── memory/
│   └── index.ts             # ConversationMemory
└── prompts/
    └── system.ts            # System prompt generation
```

**Usage:**
```bash
vibe agent                     # Start Agent mode (default: OpenAI)
vibe agent -p claude           # Use Claude
vibe agent -p gemini           # Use Gemini
vibe agent -p ollama           # Use local Ollama
vibe agent -p xai              # Use xAI Grok
vibe agent --confirm           # Confirm before each tool execution
vibe agent -i "query" -v       # Non-interactive mode with verbose output
```

## Package Structure

- **.claude/skills/** - Claude Code Skills. Each skill has `SKILL.md` (API docs) + `scripts/` (Python helpers). Providers: openai-api, claude-api, gemini-image, gemini-video, elevenlabs-tts, stability-image, replicate-ai, runway-video, kling-video, remotion-motion.
- **packages/cli** - Main CLI interface. Entry: `src/index.ts`. Commands in `src/commands/`. Agent in `src/agent/`. REPL in `src/repl/` (deprecated). Config schema in `src/config/schema.ts`.
- **packages/core** - Timeline data structures (`src/timeline/`), effects (`src/effects/`), FFmpeg export (`src/export/`). State managed with Zustand + Immer.
- **packages/ai-providers** - Pluggable AI providers. Abstract interface in `src/interface/`. Registry for capability matching. Each provider in its own directory.
- **packages/mcp-server** - MCP server for Claude Desktop/Cursor. Published as `@vibeframe/mcp-server` on npm. Bundled with esbuild (single file, workspace deps inlined). Tools, resources, and prompts in respective directories.
- **packages/ui** - Shared React components (Radix UI + Tailwind).
- **apps/web** - Next.js 14 preview UI.

## Key Conventions

- **Monorepo**: Turborepo + pnpm workspaces. Use `workspace:*` for internal deps.
- **ESM**: All packages use ES modules (`packages/ui` and `apps/web` rely on bundler/framework ESM handling).
- **TypeScript**: Strict mode. Run `pnpm build` to compile.
- **Project files**: `.vibe.json` format stores project state (sources, tracks, clips, effects).
- **Time units**: All times in seconds (floats allowed).
- **IDs**: `source-{id}`, `clip-{id}`, `track-{id}`, `effect-{id}`.
