# vibe CLI architecture — orchestrating entrypoints

There are three commands that *coordinate* the rest of the CLI rather than perform a single primitive: `vibe agent`, `vibe build`, and `vibe run`. New users routinely ask which one they want. This document is the audit-driven answer.

Important positioning: if you already use Claude Code, Codex, Cursor, Aider,
Gemini CLI, OpenCode, or another bash-capable coding agent, that external
agent should usually drive `vibe` directly through shell commands, `AGENTS.md`,
`CLAUDE.md`, `vibe schema`, and `vibe guide`. `vibe agent` is an optional
built-in fallback for users who do not already have an agent host.

> Companion to [docs/cli-mental-model.md](cli-mental-model.md) (which covers the six primitive verbs: `generate` / `edit` / `remix` / `inspect` / `audio` / `detect`).

## TL;DR

| | `vibe agent` | `vibe build` | `vibe run` |
|---|---|---|---|
| **Driving input** | natural-language prompt | `STORYBOARD.md` | YAML pipeline file |
| **Interactivity** | REPL or one-shot | one-shot | one-shot |
| **Reproducibility** | none — LLM decides each turn | high — same storyboard → same render | highest — explicit DAG + checkpoints |
| **Budget caps** | per-session max-turns only | none | `--budget-usd`, `--budget-tokens`, `--max-errors` |
| **Resume after crash** | no | re-invoke (idempotent) | `--resume` loads `.pipeline-state.yaml` |
| **Best for** | optional built-in exploration when no external agent is driving the CLI | a finished script you trust | repeatable workflows, batch jobs |

## When to pick which

- **"I am already in Claude Code/Codex/Cursor/etc."** → use normal `vibe` shell commands plus `vibe guide` / `vibe schema`; do not start a second agent loop unless you explicitly want it.
- **"I want to play and I do not have an external coding agent"** → `vibe agent`. You don't yet know the steps; let the built-in fallback agent figure them out.
- **"I have a finished script and a visual identity"** → `vibe build`. STORYBOARD.md → MP4 in one command.
- **"I want this to run again next month with a different input"** → `vibe run`. Capture the steps as YAML; share / version it.

If two seem to fit, pick the rightmost one in that list — more reproducible, less surprise.

## Each command in depth

### `vibe agent` — interactive AI agent

**Entrypoint**: `packages/cli/src/commands/agent.ts:60` (`startAgent`).
**Engine**: `AgentExecutor` (`packages/cli/src/agent/index.ts:57-179`) — agentic loop (reason → tool call → result → reason). Tool registry loaded from `tools/manifest/`.

**Inputs**: stdin (REPL) or `--input <query>` (one-shot). Optional `--project <path>` adds project state as context. `--provider` picks the LLM (claude / openai / gemini / xai / openrouter / ollama). `--max-turns` caps reasoning steps per request (default 10). `--confirm` requires explicit Y/N before each tool runs (good for high-cost ops).

**Outputs**: console messages per turn in REPL mode; structured `{ response, turns, tools }` JSON in `--input` mode.

**State**: optional `--project` directory; conversation memory in-process (cleared by `reset` REPL command).

**Cost profile**: unbounded per session — the LLM decides when it's done. Each turn ≈ one LLM call + zero or more tool invocations. `--confirm` is the only built-in safety against runaway cost.

**Resume**: none. Ctrl+C exits; the conversation can't be replayed.

### `vibe build` — STORYBOARD-driven scene build

**Entrypoint**: `packages/cli/src/commands/build.ts:16`.
**Engine**: `executeSceneBuild()` (`_shared/scene-build.ts:182-300`). Three phases: (1) parallel primitives — TTS per beat + image per beat, (2) composition dispatch — agent mode or batch LLM, (3) render Hyperframes HTML to MP4.

**Inputs**: project directory containing `STORYBOARD.md`, `DESIGN.md`, `index.html`. Mode `--mode agent|batch|auto` (default auto). Provider opts: `--composer claude|openai|gemini`, `--tts <provider>`, `--voice <id>`, `--image-provider <id>`. Skip flags for partial runs: `--skip-narration`, `--skip-backdrop`, `--skip-render`.

**Outputs**: MP4 file path on success; structured "needs-author" plan when agent mode hits a missing composition (lists per-beat HTML prompts for the host agent to fill).

**State**: required project dir with the three core files. Composer auto-resolution prefers `ANTHROPIC_API_KEY` → `GOOGLE_API_KEY` → `OPENAI_API_KEY`. Auto mode probes `detectedAgentHosts()` to decide between agent and batch.

**Cost profile**: deterministic per storyboard. ≈ (1 TTS × beats) + (1 image × beats) + (0 in agent mode | 1 LLM call × beats in batch mode).

**Resume**: no checkpoint, but idempotent — re-invoke after fixing the storyboard or filling in missing compositions; cached primitives are reused.

### `vibe run` — declarative YAML pipeline

**Entrypoint**: `packages/cli/src/commands/run.ts:22`.
**Engine**: `executePipeline()` (`packages/cli/src/pipeline/executor.ts:376-620`). 55+ lazy-registered action handlers cover almost every primitive command (`generate.image`, `edit.silence-cut`, `audio.transcribe`, `detect.scenes`, etc.) plus orchestrators like `compose-scenes-with-skills` and `scene-build`.

**Inputs**: YAML file with `name`, `steps[]`. Each step has `id`, `action`, action-specific params. Variable refs `$step.output`, `${ENV_VAR}`. Flags: `--resume`, `--fail-fast`, `--budget-usd`, `--budget-tokens`, `--max-errors`, `--effort low|medium|high|xhigh`.

**Outputs**: per-step `{ success, output, latency, cost }` summary; total cost vs. budget; full structured JSON in `--json` mode.

**State**: pipeline writes `.pipeline-state.yaml` checkpoint after each step. No project dir requirement. Output directory defaults to `${name}-output/`.

**Cost profile**: bounded by `--budget-usd` / `--budget-tokens` / `--max-errors`. Each ceiling can abort mid-pipeline.

**Resume**: `--resume` loads the checkpoint and skips completed steps. Budget includes already-spent cost from prior runs.

## Use-case overlap

These three intentionally have overlapping capability — the right choice depends on the *constraint*, not the goal.

| Use case | agent | build | run |
|---|:---:|:---:|:---:|
| Turn a script into a short promo | ✓ exploratory | ✓ if STORYBOARD.md ready | ✓ if reproducibility needed |
| Batch-process 50 videos with same recipe | × | × | ✓ |
| One-off "make this look better" | ✓ | × | × |
| CI-driven nightly auto-shorts of a podcast | × | × | ✓ |
| Iterate on a storyboard | × | ✓ | × |
| Add a custom step ("then upload to S3") | possible via tool | × | × (not yet) |

## Cross-command primitives

Not unique to any one command:

- **`generate` / `edit` / `audio` / `inspect` / `detect` / `remix`** — all primitives are callable directly *and* via `vibe run` actions. The agent calls them via the tool manifest. `build` calls a curated subset (TTS, image, compose, render).
- **API key validation** — all three rely on the same `requireApiKey()` / `validateKeyFormat()` chain. `vibe doctor --test-keys` validates ahead of any of them.
- **Cost tier metadata** — primitives carry `cost` in their `--describe` schema (see [cli-mental-model.md](cli-mental-model.md)). Pipelines compute total budget from the same metadata; agent's `--confirm` mode could use it but currently doesn't.

## Known overlap & potential future redesign

These are documented for transparency; no v0.x change is planned.

1. **`vibe build` ≈ `vibe run` with a fixed scene-build action**. The 4-step build flow could be expressed as a 4-step pipeline. Build's value is the opinionated defaults (TTS provider, image provider, beat caching) and STORYBOARD.md as input shape — neither of which `vibe run` provides today.

2. **`vibe agent` could drive `vibe build` or `vibe run` instead of calling primitives directly**. The agent's tool registry already exposes most primitives one at a time; it could expose `vibe.build` or `vibe.run` as higher-level tools, but doing so would conflict with the agent's reasoning loop (per-tool-call confirm doesn't extend to multi-step orchestrators).

3. **`vibe run --resume` has no analog in build/agent**. A storyboard build that crashes mid-render needs a re-invoke; an agent crash loses the conversation. Not a 1:1 fit — build's idempotent re-invoke is arguably *better* than checkpoint resume for its narrow scope, and agent's interactivity makes resume less meaningful.

## When to update this doc

- Any new top-level orchestrating command (e.g. a hypothetical `vibe schedule` for cron) → add a column / section here.
- Major change to `vibe agent`'s tool registry — particularly if a `build` or `run` tool gets added — re-evaluate "Cross-command primitives".
- New checkpoint / resume semantics in `build` or `agent` — update the TL;DR table.
- Budget cap propagation between `agent` and `run` — the table claim "Budget caps: agent → max-turns only" would need updating.

This audit was written against v0.83. File:line references are stable for that version; verify if you're reading this against a much later release.
