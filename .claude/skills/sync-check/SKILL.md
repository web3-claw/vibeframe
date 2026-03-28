---
name: sync-check
description: Quick SSOT consistency check across versions, docs, and landing page.
disable-model-invocation: true
---

# SSOT Sync Check

Run these checks and report results:

## 1. Version Sync

```bash
grep '"version"' package.json packages/*/package.json apps/*/package.json
```

All versions must match. Report any mismatches.

## 2. Landing Page Sync (apps/web/app/page.tsx)

- Version badge matches package.json
- Agent tool count matches actual (`grep -c "registry.register" packages/cli/src/agent/tools/*.ts`)
- MCP tool count matches actual (`grep -c "server.tool" packages/mcp-server/src/tools/*.ts`)

## 3. README.md Sync

- Test count matches (`CI=true pnpm -F @vibeframe/cli exec vitest run 2>&1 | tail -5`)
- Provider count and feature tables are up to date

## 4. MODELS.md Sync

- Model IDs in MODELS.md match those used in `packages/cli/src/commands/` and `packages/ai-providers/src/`

## Output Format

Report as table:

| Check | Status | Details |
|-------|--------|---------|
| Version sync | Pass/Fail | ... |
| Landing page | Pass/Fail | ... |
| README.md | Pass/Fail | ... |
| MODELS.md | Pass/Fail | ... |
