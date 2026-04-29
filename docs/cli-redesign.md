# CLI redesign — v0.74 → v0.75

VibeFrame's top-level CLI surface was reshaped in v0.74.0 around three
principles drawn from established CLI design guides. **v0.75.0 dropped all
the deprecation aliases** that v0.74 carried for one cycle — the
canonical names below are now the only way to invoke each command.

The principles:

- **Implicit area pattern** — the project is the implicit subject; commands
  that don't carry an area act on the current/implicit project.
  ([Microsoft `System.CommandLine` design guidance][ms])
- **Verb leaves, noun groups** — group commands are nouns; their action
  leaves are verbs. ([Microsoft][ms], [clig.dev][clig])
- **Avoid catch-all subcommand** — top-level commands that duplicate
  legacy `<group> <action>` flows (e.g. `scene build`) get hidden from
  help once the canonical entry point is at the top level.
  ([clig.dev][clig])

v0.74 kept every legacy name as a Commander alias (with a one-line
deprecation warning to stderr). v0.75 removed those aliases — invoking an
old name now produces a Commander `unknown command` error. Pre-v0.74
scripts must migrate to the canonical names below.

## Top-level renames (v0.74)

| Before | After | Aliases status |
|---|---|---|
| `vibe pipeline` | `vibe remix` | removed in v0.75 |
| `vibe analyze` | `vibe inspect` | removed in v0.75 |

The canonical name is what shows up in the JSON envelope's `command:`
field, in `vibe schema --list`, and in `--describe` output.

## Audio leaf renames (verb-first; v0.74)

| Before | After | Aliases status |
|---|---|---|
| `vibe audio voices` | `vibe audio list-voices` | removed in v0.75 |
| `vibe audio voice-clone` | `vibe audio clone-voice` | removed in v0.75 |

## Removed entirely (v0.75)

The following commands existed as hidden Commander entries in v0.74 and
were deleted from `packages/cli/src/commands/scene.ts` in v0.75. The
underlying execute functions remain in `_shared/` and back the canonical
top-level commands plus the manifest MCP tools.

- `vibe scene init` → use `vibe init`
- `vibe scene build` → use `vibe build`
- `vibe scene render` → use `vibe render`
- `vibe export` → use `vibe render`

## Help reorganization

Top-level `--help` is now grouped into four tiers:

```
Get started        — init / build / render / doctor / setup / demo
One-shot tools     — generate / edit / inspect / remix / audio
Advanced authoring — project / scene / timeline
Automation         — run / agent / batch + schema / context / walkthrough
```

## MCP tool name alignment (v0.75)

v0.74 deliberately kept the MCP tool names (`pipeline_*`, `analyze_*`,
`scene_init/build/render`, `audio_voice_clone`) under their old labels
so that `@vibeframe/mcp-server` clients wouldn't break during the CLI
rename window. v0.75 finishes the alignment — every MCP tool now matches
its CLI counterpart's group/leaf naming:

| Before (v0.74) | After (v0.75) |
|---|---|
| `pipeline_highlights` | `remix_highlights` |
| `pipeline_auto_shorts` | `remix_auto_shorts` |
| `pipeline_regenerate_scene` | `remix_regenerate_scene` |
| `pipeline_run` | `run` (groupless — matches `vibe run`) |
| `analyze_media` / `_video` / `_review` / `_suggest` | `inspect_media` / `_video` / `_review` / `_suggest` |
| `audio_voice_clone` | `audio_clone_voice` |
| `scene_init` / `_build` / `_render` | `init` / `build` / `render` (project-flow tools, top-level) |

This is a hard break for MCP hosts: the previous tool names no longer
appear in `tools/list` after upgrading to v0.75. Pin to v0.74 if you
have hardcoded the old names and can't migrate yet.

## What did not change

- **`vibe schema <path>`, `vibe context`, `vibe walkthrough <topic>`**
  remain top-level commands. We considered consolidating them under
  `vibe agent`, but the cost (parent-chain refactor + deprecation noise
  on widely-used `vibe schema X` invocations) outweighed the visual win
  from Phase 1's help reorg.
- **Walkthrough topic name `pipeline`** still routes to the same content
  (topic-name rename deferred — low value, breaks any saved bookmarks).
- **Provider flag `-p`** — Microsoft guidance reserves `-p` for
  `--property`, but the VibeFrame domain meaning of "provider" is well
  established; we keep it.
- **`emitDeprecationWarning` helper** stays in `output.ts` even though
  v0.75 has no callers — it's the canonical place to wire future
  deprecations and the unit tests pin its semantics.

## What we deliberately did not do (and why)

- **Reclaim `-i` / `-v` short flags** — Microsoft guidance reserves these
  for `--interactive` / `--verbosity`. Many existing per-command uses
  conflict (e.g. `-i` for image input on several commands). Reclaiming
  would break too many invocation patterns. Long-form `--input` /
  `--verbose` already work everywhere; the short-flag normalization is
  deferred indefinitely.
- **Add new short aliases** like `vw` (view), `rmx` (remix). clig.dev
  warns against arbitrary abbreviations because they lock out future
  command names. Existing established aliases (`gen`, `ed`, `au`, `az`)
  stay.

## Migration checklist for external scripts

These are hard breaks — no aliases. Pin to v0.73 or earlier if you can't
migrate yet.

### CLI scripts

1. Replace `vibe pipeline X` with `vibe remix X`.
2. Replace `vibe analyze X` with `vibe inspect X`.
3. Replace `vibe audio voices` / `voice-clone` with `audio list-voices` /
   `clone-voice`.
4. Replace `vibe scene {init,build,render}` and `vibe export` with the
   top-level equivalents.
5. If you parse the JSON envelope's `command:` field, update string
   matchers — the field reflects the canonical name now.

### MCP hosts (`@vibeframe/mcp-server`)

6. Rename calls per the v0.75 MCP table above. Hosts that hardcode tool
   names (e.g. Claude Desktop config snippets, agent prompt allowlists)
   need to swap `pipeline_*`, `analyze_*`, `audio_voice_clone`, and
   `scene_init/build/render` for the new names.

[clig]: https://clig.dev/
[ms]: https://learn.microsoft.com/en-us/dotnet/standard/commandline/design-guidance
