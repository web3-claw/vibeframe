---
name: release
description: Bump version across all packages, verify build/lint/tests, and prepare release commit
argument-hint: "<patch|minor|major>"
disable-model-invocation: true
---

Perform a version bump for VibeFrame. The argument MUST be one of: `patch`, `minor`, `major`.

Steps:
1. **Read current version**: `grep '"version"' package.json | head -1`
2. **Bump root**: `npm version $ARGUMENTS --no-git-tag-version`
3. **Bump all packages**: `pnpm -r exec -- npm version $ARGUMENTS --no-git-tag-version`
4. **Read new version**: `grep '"version"' package.json | head -1`
5. **Verify sync**: `grep '"version"' package.json packages/*/package.json apps/*/package.json | cut -d: -f2 | sort -u` — must show exactly 1 version
6. **Build**: `pnpm build` — must pass
7. **Lint**: `pnpm lint` — must pass (0 errors)
8. **Test**: `pnpm -F @vibeframe/cli exec vitest run` — must pass
9. **Generate CHANGELOG**: `git-cliff --tag vX.Y.Z -o CHANGELOG.md` — auto-generate from conventional commits
10. **Stage**: `git add package.json packages/*/package.json apps/*/package.json CHANGELOG.md`
11. **Commit**: `git commit -m "chore: bump version to X.Y.Z"`
12. **Tag**: `git tag vX.Y.Z`

Report the new version number. Do NOT push — the user will push when ready.
