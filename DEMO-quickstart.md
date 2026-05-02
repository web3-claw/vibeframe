# VibeFrame Demo v2 — Mountain Sunrise (Apex Ridge)

A 5-step cinematic short. We start with a verb-less prompt, end with a
narrated, lower-third-titled, grain-and-vignette-graded MP4. Every step
chains explicit filenames so you can resume mid-flow. Designed to be
driven by a coding agent (Claude Code, Codex, Cursor) running inside
the project directory, but every command is also runnable by hand.

| | |
|---|---|
| **Single-scene final** (Step 5) | `renders/apex-ridge-narrated.mp4` (1920×1080, 30fps, ~6s, ~16MB) |
| **Multi-scene final** (Step 9) | `renders/apex-ridge-full.mp4` (1920×1080, 30fps, ~19s, ~50MB) — hook → proof → close arc |
| **Wall-clock** | Steps 1-5: ~5-7 min. Steps 6-9: +5-10 min depending on Path A vs Path B in 7-8 |
| **API cost** | Steps 1-5: ~$0.30-0.50. Steps 6-9 with Path A (still backdrops): +~$0.15. Path B (cinematic per scene): +~$0.80 |
| **Required keys** | `OPENAI_API_KEY`, `FAL_API_KEY`, `ANTHROPIC_API_KEY`. `ELEVENLABS_API_KEY` optional (Kokoro local fallback) |

---

## Pre-flight: install, configure, scaffold

### A. Install vibeframe

```bash
curl -fsSL https://vibeframe.ai/install.sh | bash
```

### B. Configure API keys (project-scoped)

Run setup with `--scope project` so keys land in `./.vibeframe/config.yaml`
(gitignored, this project only) instead of the user-wide
`~/.vibeframe/config.yaml`.

```bash
mkdir -p ~/dev/vibeframe-lab && cd ~/dev/vibeframe-lab
vibe setup --scope project
```

Pick: AI features → Images, Videos, AI editing + motion. Paste keys as
prompted. The wizard will write them to `.vibeframe/config.yaml`.

### C. Scaffold the project

```bash
vibe init . --profile agent --ratio 16:9
```

This drops in:

```text
AGENTS.md            # cross-tool agent guidance + ASSET/BUILD/REMIX routing
CLAUDE.md            # project-local Claude Code routing (imports AGENTS.md)
DESIGN.md            # visual identity gate — empty skeleton (BUILD flow only)
STORYBOARD.md        # beat structure for vibe build (optional, multi-scene)
SKILL.md             # local skill bundle entry
vibe.project.yaml    # project metadata (see below)
.vibeframe/          # project-scoped config — your API keys
.gitignore           # excludes assets/, renders/, .vibeframe/, ...
references/  compositions/  assets/  renders/
```

### Two config files — what's the difference?

| File | Created by | Holds | Read by |
|---|---|---|---|
| `.vibeframe/config.yaml` | `vibe setup` | API keys, LLM provider, scope | every `vibe ...` command |
| `vibe.project.yaml` | `vibe init` | project name, aspect, default quality, optional provider preferences and budget cap | `vibe scene render` (output naming), `vibe build` (defaults + budget) |

Open `vibe.project.yaml` once — uncomment the `providers:` block if you
want to lock per-primitive provider choices for this project (e.g.
`image: openai`), or set a `budget.maxUsd` to cap a `vibe build` run.
For this demo the defaults are fine.

---

## Step 1. Establishing image (ASSET → `assets/peak.png`)

Paste the visual brief into your agent. It should route this as ASSET
(single image) and call `vibe generate image` directly — no DESIGN.md,
no skill auto-load.

**Prompt (verb-less paste — the agent recognises this as ASSET intent):**

```
aerial view of a misty mountain peak at sunrise, golden hour light hitting the ridges, layered fog drifting through the valleys, soft volumetric god rays, cinematic 16:9, shot on Arri Alexa
```

**What the agent runs:**

```bash
vibe generate image \
  "aerial view of a misty mountain peak at sunrise, golden hour light hitting the ridges, layered fog drifting through the valleys, soft volumetric god rays, cinematic 16:9, shot on Arri Alexa" \
  -o assets/peak.png \
  --quality hd
```

**Output:** `assets/peak.png` — 1920×1080 still, ~$0.05 (gpt-image-2),
~60s wall-clock.

---

## Step 2. Animate the image (ASSET → `assets/peak.mp4`)

Reference the file from Step 1 explicitly with `@assets/peak.png` (Claude
Code reads that as a file mention). Ask for **6 seconds** so the
narration we generate later (5-6s) fits without padding the composition.

**Prompt:**

```
the camera slowly drifts forward over the peak, fog moves gently with the wind, sunlight strengthens as the sun climbs higher. 6 seconds, smooth cinematic motion. use @assets/peak.png as the source frame
```

**What the agent runs:**

```bash
vibe generate video \
  "the camera slowly drifts forward over the peak, fog moves gently with the wind, sunlight strengthens as the sun climbs higher, smooth cinematic motion" \
  --image assets/peak.png \
  --duration 6 \
  -o assets/peak.mp4
```

**Output:** `assets/peak.mp4` — 6s clip, 16:9, 1080p, ~$0.25-0.45 on
Seedance via fal.ai, ~90-150s wall-clock. The image-to-video URL hosting
goes through `VIBE_UPLOAD_PROVIDER` (imgbb default, or your S3 bucket).

---

## Step 3. Cinematic composition (BUILD → `renders/apex-ridge.mp4`)

Now ask for the motion-design treatment. This is the **first BUILD-flow
step**: the agent recognises composition language ("lower-third title",
"film grain", "vignette", "fade in/out") and either:

- **Path A (default for Claude Code):** loads the **`hyperframes` skill**,
  fills in `DESIGN.md` with the cinematic identity, authors `index.html`
  composing the video + overlays + title, lints, and renders. The HTML
  stays editable forever.
- **Path B:** uses the one-shot overlay command `vibe edit motion-overlay`.
  Faster, but the result is a flat MP4 with no editable layers.

The demo uses **Path A**. Path B is at the bottom of this section.

**Prompt:**

```
add a minimal lower-third title 'Day One — Apex Ridge' bottom-left in clean white sans-serif so it never crosses the peak silhouette. fade in at 1s as the sun strengthens (16px y-offset, opacity 0→1, 0.8s ease-out), hold 3s, fade out by 5s as the camera settles. add subtle 35mm film grain and a soft warm vignette tuned to the cinematic Arri Alexa look. base footage is @assets/peak.mp4
```

**What the agent does (Path A):**

1. Loads the `hyperframes` skill — the framework rules for HTML-as-video.
2. **Fills `DESIGN.md`** with the cinematic identity it inferred from the
   prompt (warm off-white type, never pure white; deep umber vignette;
   Inter 500 at 56px for the lower-third; 96px left/bottom padding so
   type clears the peak silhouette; `power2.out`/`power2.in` GSAP
   easings; anti-patterns like saturated brand colors).
3. **Writes `index.html`** with five tracks:
   - `track 0` — `<video src="assets/peak.mp4">` as full-frame backdrop, muted
   - `track 1` — radial vignette, multiply-blended (warm, not pure black)
   - `track 2` — warm-cast highlight where the sun strikes
   - `track 3` — 35mm film grain (SVG turbulence, mulberry32-seeded, 12fps jitter)
   - `track 4` — lower-third title, GSAP timeline-driven fade-in/out
4. **Validates** the composition:
   ```bash
   vibe scene lint --json
   npx hyperframes validate    # WCAG AA + console errors check
   npx hyperframes inspect     # 9-sample layout check (title clears the peak)
   ```
5. **Renders** the composition:
   ```bash
   mkdir -p renders
   vibe render . -o renders/apex-ridge.mp4 --quality high --fps 30
   ```

**Output:** `renders/apex-ridge.mp4` — 1920×1080 @ 30fps, 6s, ~15MB,
~$0.02 (Claude Sonnet for DESIGN.md + composition authoring), ~50s render.

### Path B — one-shot Remotion bake (alternative)

If you want a flat baked MP4 instead of an editable HTML composition:

```bash
vibe edit motion-overlay assets/peak.mp4 \
  "minimal lower-third title 'Day One — Apex Ridge' bottom-left, white sans-serif, fade in 1s hold 3s fade out 5s, 35mm grain, warm vignette" \
  --understand auto \
  --duration 6 \
  --style cinematic \
  -o renders/apex-ridge-baked.mp4
```

This generates a Remotion TSX, renders it via Remotion + FFmpeg, and
overlays the result onto `peak.mp4` in one pass. Faster (~60s vs Path
A's authoring + render time), but `renders/apex-ridge-baked.mp4` is the
final word — to change the title or palette, you re-run the whole step.
For a one-off demo this is fine; for an iterating identity, take Path A.

---

## Step 4. Narration audio (ASSET → `assets/narration.wav`)

Generate the voice track separately. Two backends:

- **ElevenLabs** (`vibe generate speech`) — premium quality, paid (~$0.02 for this line).
- **Kokoro local** (`hyperframes tts`) — free, offline, runs on your CPU, ~5s wall-clock.

The narration text is timed to land on the title's spoken word — "Apex"
should arrive around the 4.2-4.5s mark so the on-screen lower-third can
fade in just before that beat in Step 5.

**Prompt (verb-less paste of the narration line itself — the agent reads it as ASSET intent and calls `vibe generate speech`):**

```
generate narration: "The mountain wakes before we do. Up here, the first golden light writes the day. Apex Ridge — day one." save to assets/narration.wav
```

**Narration text (~5-6s read time):**

```
The mountain wakes before we do. Up here, the first golden light writes the day. Apex Ridge — day one.
```

**What the agent runs (ElevenLabs path):**

```bash
vibe generate speech \
  "The mountain wakes before we do. Up here, the first golden light writes the day. Apex Ridge — day one." \
  -o assets/narration.wav
```

**Kokoro fallback (free, no API key — works when ELEVENLABS_API_KEY isn't set):**

```bash
npx --no-install hyperframes tts \
  "The mountain wakes before we do. Up here, the first golden light writes the day. Apex Ridge — day one." \
  -o assets/narration.wav
```

**Output:** `assets/narration.wav` — ~5.9s, voice `bf_emma` (Kokoro
British documentary cadence) or your default ElevenLabs voice.

---

## Step 5. Integrate narration + sync title to spoken word (BUILD → `renders/apex-ridge-narrated.mp4`)

Take `assets/narration.wav` and wire it into the composition from
Step 3.

**Prompt:**

```
integrate the narration from @assets/narration.wav into the apex-ridge composition. transcribe word-level timings and re-time the lower-third title to land on the spoken word "Apex" instead of the placeholder fade-in at 1s. all overlays (vignette, warm-cast, grain, title) should stay through the full 6 seconds. re-render to renders/apex-ridge-narrated.mp4
```

The agent should:

1. **Transcribe with word-level timings** so the title fades in *on the
   spoken word*, not on guessed timing:
   ```bash
   npx --no-install hyperframes transcribe assets/narration.wav --json
   # writes transcript-narration.json — Whisper word timings
   ```
2. **Update `index.html`**:
   - Add an `<audio src="assets/narration.wav">` clip on its own track
     (the framework rule: `<video>` is muted, audio rides on a separate
     track).
   - Re-time the title fade-in to land on the word "Apex" (transcript
     puts it at ~4.49s → fade-in at 4.2s, hold to end, no fade-out).
   - All non-video tracks (vignette, warm-cast, grain, title) stay
     active for the full 6s so the composition doesn't go blank when
     the video clip ends.
3. **Re-validate and render:**
   ```bash
   vibe scene lint --json
   npx hyperframes validate
   vibe render . -o renders/apex-ridge-narrated.mp4 --quality high --fps 30
   ```

**Output:** `renders/apex-ridge-narrated.mp4` — 1920×1080 @ 30fps, 6s,
~16MB, audio muxed. Title lands on "Apex" by design.

---

## Step 6. Promote to a multi-scene project (one-time refactor)

After Step 5, `index.html` *is* the hook scene — backdrop video, grain,
vignette, lower-third, audio all live in one composition. That's fine
for a 6-second social post, but to extend the short into a hook → proof
→ close arc you need the multi-scene shape vibeframe expects:

| Role | File |
|---|---|
| **Timeline root** | `index.html` — a thin orchestrator that mounts scene clips end-to-end, with crossfades between them |
| **Per-scene composition** | `compositions/scene-<id>.html` — one self-contained Hyperframes composition per beat |

`vibe scene add` will read `index.html`, find the next free time slot,
and append a `<div class="clip" data-scene-import="compositions/scene-X.html" data-start="..." data-duration="..." data-track-index="...">` clip on
alternating tracks (1 / 2 / 1 / 2 …) so consecutive clips can crossfade.
For that to work, `index.html` has to be a timeline root, not a baked
single-scene composition.

**Prompt:**

```
promote this single-scene composition into a multi-scene project. move the current index.html into compositions/scene-hook.html, then write a new index.html as a thin timeline root (1920×1080, no backdrop, no overlays) that mounts the hook scene on track 1 at data-start="0" data-duration="6". verify the refactored render is visually identical to renders/apex-ridge-narrated.mp4
```

The agent should:

### 6a. Move the current composition into a scene file

```bash
mkdir -p compositions
mv index.html compositions/scene-hook.html
```

### 6b. Update `compositions/scene-hook.html` to be self-contained

Inside the moved file, fix any relative paths that pointed at
`assets/...` from the project root — they still resolve from the project
root because Hyperframes resolves relative to the composition that's
*mounted*, not the file that contains the composition. So
`<video src="assets/peak.mp4">` keeps working. (Re-prompt the agent to
"verify scene-hook.html is self-contained and renders standalone via
`vibe render compositions/scene-hook.html` if you want to be sure.")

### 6c. Write a fresh `index.html` as the timeline root

Re-prompt the agent: *"write a new index.html that is a multi-scene
timeline root — same canvas size (1920×1080), no backdrop, no overlays.
Mount `compositions/scene-hook.html` as the first scene clip on
track 1, `data-start="0" data-duration="6"`. Leave room for additional
scenes."*

The shape the agent should produce:

```html
<div data-composition-id="apex-ridge" data-start="0" data-duration="6"
     data-width="1920" data-height="1080">
  <div class="clip"
       data-scene-import="compositions/scene-hook.html"
       data-start="0" data-duration="6" data-track-index="1"></div>
</div>
```

### 6d. Verify

```bash
vibe scene lint --project . --json
vibe render . -o renders/apex-ridge-refactored.mp4
```

Output should be byte-identical (or visually identical) to
`renders/apex-ridge-narrated.mp4`. If it isn't, the scene file lost a
relative path or a track was dropped — fix and re-render.

This is a **one-time refactor**. Steps 7-9 stay clean.

---

## Step 7. Add the proof beat (image gen + composition)

The proof beat is "what we found" — a tighter, more intimate shot that
backs up the establishing wide of the hook. Two paths, depending on how
cinematic you want each scene:

**Prompt (Path A — let the agent run `vibe scene add` for a still-backdrop scene):**

```
add a proof beat to the project: visuals "tight detail of frost glittering on a wooden ridge cairn at first light, warm rim-light, shallow depth of field, cinematic 16:9, shot on Arri Alexa". narration "By six the wind drops. The cairn carries last night's frost." headline "What we found", kicker "Field log", style explainer.
```

**Prompt (Path B — cinematic per-scene, video backdrop):**

```
add a proof beat with a full cinematic per-scene treatment, same level of production as the hook scene. step 1 image: tight detail of frost glittering on a wooden ridge cairn, warm rim-light, shallow depth, cinematic 16:9. step 2 animate: slow push-in on the cairn, frost catching first light, breath of mist passing across, 6 seconds. step 3 compose compositions/scene-proof.html with backdrop @assets/cairn.mp4, lower-third "What we found / Field log", narration "By six the wind drops. The cairn carries last night's frost.", same DESIGN.md identity as scene-hook. mount it in index.html on track 2 with data-start="5.5" data-duration="6.5" so it crossfades with the hook scene's tail.
```

### Path A — quick: `vibe scene add` (still image backdrop, ~1 minute, ~$0.07)

```bash
vibe scene add proof \
  --project . \
  --style explainer \
  --kicker "Field log" \
  --headline "What we found" \
  --visuals "tight detail of frost glittering on a wooden ridge cairn at first light, warm rim-light, shallow depth of field, cinematic 16:9, shot on Arri Alexa" \
  --narration "By six the wind drops. The cairn carries last night's frost." \
  --image-provider openai \
  --tts auto
```

`vibe scene add` does it all in one call:
- Generates `assets/scene-proof.png` (OpenAI image)
- Generates `assets/narration-proof.mp3` (ElevenLabs or Kokoro)
- Transcribes for word timings → `transcript-proof.json`
- Writes `compositions/scene-proof.html` mirroring the hook's DESIGN.md identity (palette / typography / motion all inherited)
- Updates `index.html` — adds a clip `data-start="5.5" data-duration="6.5"` (overlap with the hook scene's tail by 0.5s for the crossfade) on track 2 so the new scene rides the alternating-track pattern

### Path B — cinematic: repeat Steps 1-3 per scene (~3 minutes, ~$0.40)

If you want each scene to have its own animated video backdrop (not just a still), repeat the demo's first three steps for `proof`:

```bash
# 7B-1. Generate the proof beat's still image
vibe generate image \
  "tight detail of frost glittering on a wooden ridge cairn, warm rim-light, shallow depth, cinematic 16:9" \
  -o assets/cairn.png \
  --quality hd

# 7B-2. Animate it
vibe generate video \
  "slow push-in on the cairn, frost catching first light, breath of mist passing across the frame, cinematic" \
  --image assets/cairn.png \
  --duration 6 \
  -o assets/cairn.mp4

# 7B-3. Author scene-proof.html with the same DESIGN.md identity
# (re-prompt the agent: "compose compositions/scene-proof.html with backdrop assets/cairn.mp4, lower-third 'What we found / Field log', narration via TTS, same DESIGN.md palette/typography/motion as scene-hook")
```

Then have the agent insert the scene clip into `index.html` (same
crossfade-overlap pattern as Path A: track 2, `data-start="5.5"`,
`data-duration="6.5"`).

**Output (either path):** `compositions/scene-proof.html`, scene
mounted in `index.html`, total composition now ~12.5s.

---

## Step 8. Add the closing beat

Same pattern — pick Path A (quick still-image scene) or Path B (full
cinematic). The closing beat lands the arc.

**Prompt:**

```
add a closing beat: visuals "wide shot of the same mountain ridge at peak golden hour, the entire valley filled with warm light, no fog, sharp clarity, cinematic 16:9". narration "And so we begin again. Apex Ridge — we'll be back tomorrow." headline "Begin again", kicker "Day one", style announcement. mount it after the proof scene so it crossfades on track 1.
```

**What the agent runs (Path A):**

```bash
vibe scene add close \
  --project . \
  --style announcement \
  --kicker "Day one" \
  --headline "Begin again" \
  --visuals "wide shot of the same mountain ridge at peak golden hour, the entire valley filled with warm light, no fog, sharp clarity, cinematic 16:9" \
  --narration "And so we begin again. Apex Ridge — we'll be back tomorrow." \
  --image-provider openai \
  --tts auto
```

The agent (or `vibe scene add`) places this clip on track 1, overlapping
the proof scene's tail by 0.5s. Total composition ~19s.

---

## Step 9. Multi-scene render with transitions

**Prompt:**

```
lint and validate all scenes, then render the full multi-scene project to renders/apex-ridge-full.mp4 at 1920×1080, 30fps, --quality high
```

**What the agent runs:**

```bash
# Validate everything
vibe scene lint --project . --json
npx hyperframes validate
npx hyperframes inspect

# Final render
vibe render . -o renders/apex-ridge-full.mp4 --quality high --fps 30
```

`vibe render` walks the timeline root, mounts each scene composition at
its `data-start`, applies the alternating-track crossfade rule (where
two clips overlap on different tracks, Hyperframes blends them), and
emits a single MP4.

**Output:** `renders/apex-ridge-full.mp4` — 1920×1080 @ 30fps, ~19s,
~50MB. Hook → proof → close, narrated, all carrying the same DESIGN.md
identity.

### Iterating from here

- **Tweak one scene's copy or motion?** Edit only that scene's HTML, re-render. Other scenes are untouched, $0 spend.
- **Swap the visual identity globally?** Edit `DESIGN.md` (palette / typography / motion), re-prompt the agent with *"regenerate all scene HTMLs to match the updated DESIGN.md"*. Image/video assets stay; only the HTML overlays update.
- **Add a 4th beat?** `vibe scene add <name> --visuals "..." --narration "..."` — picks up where Step 8 left off, no other changes needed.
- **Per-scene preview while iterating?** `vibe render compositions/scene-proof.html -o /tmp/preview.mp4` to render one scene in isolation, ~10s.

---

## Filename chain (so you can resume mid-flow)

| Step | Created | Consumed by |
|---|---|---|
| Pre-flight C | `vibe.project.yaml`, `DESIGN.md` (skeleton), `STORYBOARD.md` (skeleton), `AGENTS.md`, `CLAUDE.md`, `.vibeframe/config.yaml` | every step |
| 1 | `assets/peak.png` | Step 2 (`--image`) |
| 2 | `assets/peak.mp4` | Step 3 (backdrop video in `index.html`) |
| 3 | `DESIGN.md` (filled), `index.html`, `renders/apex-ridge.mp4` | Step 5 (re-render) |
| 4 | `assets/narration.wav` | Step 5 (audio track) |
| 5 | `transcript-narration.json`, `renders/apex-ridge-narrated.mp4` | **single-scene final** — or input to Step 6 |
| 6 | `compositions/scene-hook.html` (moved), new `index.html` (timeline root), `renders/apex-ridge-refactored.mp4` | Steps 7-9 |
| 7 | `compositions/scene-proof.html` + (Path A) `assets/scene-proof.png`, `assets/narration-proof.mp3`, `transcript-proof.json` | Step 9 |
| 8 | `compositions/scene-close.html` + the same per-scene asset trio | Step 9 |
| 9 | `renders/apex-ridge-full.mp4` | **multi-scene final** |

Resuming after a crash: every output is on disk, so re-running a step
just regenerates that one file. Steps 3 and 6's HTML files are the only
authored artefacts — keep them under version control.

---

## Variants — same 9 steps, different theme

The agent doesn't need new instructions; just paste a different visual
brief in Step 1 and it cascades through 5 (single-scene) or 9 (full
multi-scene short).

| Theme | Step 1 prompt seed |
|---|---|
| Coffee shop morning | `steaming cup of coffee on a wooden table by a window, morning sunlight, shallow depth of field, cinematic` |
| Cyberpunk alley | `neon-lit Tokyo back alley at night, rain-slicked pavement reflecting signs, lone figure with umbrella, cinematic` |
| Underwater | `sunlight beams cutting through clear ocean water, school of small fish drifting near a coral reef, cinematic depth` |
| Tokyo street | `crowded Shibuya crossing at dusk, neon billboards reflecting on wet asphalt, motion blur on pedestrians, cinematic` |

For each theme, Steps 2-5 adapt naturally — describe the camera motion
you want over the still, the lower-third copy and easing, the line of
narration that ties on-screen text to voice. The DESIGN.md the agent
writes in Step 3 will pick up the new theme automatically.

---

## Common gotchas

- **Step 2 length vs Step 4 narration.** Aim for the video to be at
  least as long as your narration. If your line takes 7s to read, ask
  for `--duration 7` in Step 2. Mismatched length forces awkward
  last-frame holds in Step 5.
- **Background music?** Drop in `vibe generate music "..." -d 6 -o assets/music.mp3` before Step 5 and add a third audio track. The hyperframes skill knows about `<audio>` clips with `data-volume` for ducking under narration.
- **Quality knobs.** `vibe render --quality high` (default `standard`) raises CRF; `--fps 60` if you want smoother title motion at the cost of file size. `vibe.project.yaml`'s `defaults.exportQuality` overrides command-line if present.
- **Iterating on the look.** Edit `DESIGN.md` (palette / typography / motion / what-not-to-do), re-prompt the agent with "regenerate the title and grain to match the updated DESIGN.md" — it'll patch `index.html` and you re-render in 50s with $0 spend.

---

## Appendix: Scene Project Flow (`vibe init` / `vibe scene` / `vibe build`)

The 5 steps above are one project's worth of work, each scene authored
against the same `DESIGN.md`. The full project flow is the same loop
scaled to multiple beats via `STORYBOARD.md`.

Important routing rule (recap from `AGENTS.md`):

- Single image / video clip / TTS line → `vibe generate ...` (ASSET)
- Multi-scene / storyboard / composed video → `vibe init` → fill
  `STORYBOARD.md` → `vibe build` (BUILD)
- Transform a media file already on disk → `vibe edit`, `vibe remix`,
  `vibe audio` (REMIX)

### Add another scene

```bash
vibe scene add proof \
  --project . \
  --style explainer \
  --headline "What you see" \
  --kicker "Field log" \
  --visuals "tight detail of frost on a ridge cairn, warm rim-light, shallow depth, cinematic" \
  --narration "By six the wind drops. The cairn carries last night's frost." \
  --image-provider openai \
  --tts auto
```

This generates the scene image, narration audio, and per-scene HTML in
one call. The composition slots into `index.html` after the existing
`hook` scene. Repeat for `vibe scene add close ...` to round out a
hook → proof → close arc, then re-render:

```bash
vibe scene lint --project . --json
vibe render . -o renders/mountain-sunrise-final.mp4
```

### Build from STORYBOARD.md instead

If you'd rather declare the whole video up front, edit
`STORYBOARD.md` with `## Beat ...` blocks and run:

```bash
vibe build . --mode agent --image-provider openai --tts auto --quality hd
```

`vibe build` walks the storyboard, dispatches narration TTS + backdrop
image-gen + scene HTML composition, and renders the whole thing. The
`vibe.project.yaml` budget cap (if set) gets enforced before the run
spends money.

### Agent-friendly inner loop

```bash
vibe scene compose-prompts . --json   # what the agent should write next
# agent edits compositions/scene-*.html
vibe scene lint --project . --json    # validate
vibe render . -o renders/final.mp4    # render
```

This is the loop the agent should sit in once you're past Step 5 of the
demo and into multi-scene work. For one-off image generation, stay with
`vibe generate image`.
