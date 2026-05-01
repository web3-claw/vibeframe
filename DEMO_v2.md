# VibeFrame Demo v2 — Mountain Sunrise (Apex Ridge)

A 5-step cinematic short. We start with a verb-less prompt, end with a
narrated, lower-third-titled, grain-and-vignette-graded MP4. Every step
chains explicit filenames so you can resume mid-flow. Designed to be
driven by a coding agent (Claude Code, Codex, Cursor) running inside
the project directory, but every command is also runnable by hand.

| | |
|---|---|
| **Final output** | `renders/apex-ridge-narrated.mp4` (1920×1080, 30fps, ~6s, ~16MB) |
| **Wall-clock** | ~5-7 minutes (Seedance video gen is the long pole at ~90-150s; render ~50s) |
| **API cost** | ~$0.30-0.50 with default providers; ~$0.27 if you swap ElevenLabs for free local Kokoro |
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
- **Path B:** uses the one-shot Remotion baker `vibe generate motion`.
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
vibe generate motion \
  "minimal lower-third title 'Day One — Apex Ridge' bottom-left, white sans-serif, fade in 1s hold 3s fade out 5s, 35mm grain, warm vignette" \
  --video assets/peak.mp4 \
  --duration 6 \
  --style cinematic \
  --render \
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

**Narration text (~5-6s read time):**

```
The mountain wakes before we do. Up here, the first golden light writes the day. Apex Ridge — day one.
```

**ElevenLabs path:**

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
Step 3. The agent should:

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

## Filename chain (so you can resume mid-flow)

| Step | Created | Consumed by |
|---|---|---|
| Pre-flight C | `vibe.project.yaml`, `DESIGN.md` (skeleton), `STORYBOARD.md` (skeleton), `AGENTS.md`, `CLAUDE.md`, `.vibeframe/config.yaml` | every step |
| 1 | `assets/peak.png` | Step 2 (`--image`) |
| 2 | `assets/peak.mp4` | Step 3 (backdrop video in `index.html`) |
| 3 | `DESIGN.md` (filled), `index.html`, `renders/apex-ridge.mp4` | Step 5 (re-render) |
| 4 | `assets/narration.wav` | Step 5 (audio track) |
| 5 | `transcript-narration.json`, `renders/apex-ridge-narrated.mp4` | **final** |

Resuming after a crash: every output is on disk, so re-running a step
just regenerates that one file. Step 3's `index.html` is the only
authored artefact — keep it under version control.

---

## Variants — same 5 steps, different theme

The agent doesn't need new instructions; just paste a different visual
brief in Step 1 and it cascades.

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
