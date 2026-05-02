# VibeFrame Demo

This is the copy-paste demo path for VibeFrame as a general video CLI.

It covers:

1. Check local setup
2. Generate image and video assets
3. Process existing media with free/local commands
4. Build a storyboard-based video project
5. Run the same idea as YAML
6. Validate the produced files and command surface

Commands below use `pnpm vibe` because this repo is checked out locally. For an
installed CLI, replace `pnpm vibe` with `vibe`.

---

## 0. Check Setup

Run these first:

```bash
pnpm vibe --help
pnpm vibe setup --show
pnpm vibe doctor
pnpm vibe doctor --test-keys   # optional: live-validate stored keys
```

Every command help screen and `vibe schema --list` show a colored cost
badge — `[FREE]`, `[LOW]`, `[HIGH]`, `[VERY-HIGH]` — so you can plan
spend before running anything paid.

For the full demo, these keys should be available:

```text
OPENAI_API_KEY    text-to-image and batch HTML composition
FAL_API_KEY           Seedance text/image-to-video through fal.ai
IMGBB_API_KEY     local image upload host for image-to-video
```

The storyboard project demo below uses `--tts kokoro`, so it does not require a
paid TTS key.

Useful guide command:

```bash
pnpm vibe guide
pnpm vibe guide motion
pnpm vibe guide scene
pnpm vibe guide pipeline
pnpm vibe guide architecture
```

`guide` explains the workflow. It does not create files.

---

## 1. Quick Media Smoke

These commands create standalone media assets in `demo-output/`.

```bash
mkdir -p demo-output
```

### 1.1 Text to Image

```bash
pnpm vibe generate image \
  "A polished VibeFrame CLI demo hero frame: a modern terminal window producing cinematic video assets, subtle timeline elements, crisp product-documentation style, 16:9 composition, high contrast, no readable brand logos" \
  -p openai \
  -m 2 \
  --size 1536x1024 \
  --quality hd \
  -o demo-output/vibe-cli-generated-image.png
```

Expected file:

```text
demo-output/vibe-cli-generated-image.png
```

### 1.2 Text to Video

```bash
pnpm vibe generate video \
  "A modern VibeFrame CLI product demo in motion: terminal commands trigger generated frames, a cinematic timeline assembles, clean UI panels animate smoothly, polished developer-tool promo, no readable text, 16:9" \
  -p seedance \
  -d 5 \
  -r 16:9 \
  -o demo-output/vibe-cli-generated-video.mp4
```

Expected file:

```text
demo-output/vibe-cli-generated-video.mp4
```

Notes:

- `-p seedance` means ByteDance Seedance 2.0 through fal.ai.
- `-d 5` is used to keep demo cost and queue time low.
- Seedance supports longer clips too, for example `-d 10` or `-d 15`.
- `-p fal` is a deprecated v0.x alias for `-p seedance` and will be removed
  at the 1.0 cut. New scripts should use `-p seedance`.

### 1.3 Image to Video

Use the image from step 1.1:

```bash
pnpm vibe generate video \
  "The terminal UI comes alive: timeline tracks slide into place, rendered frames glow, a clean cinematic product-demo motion, smooth camera push-in, professional documentation demo style, no extra text" \
  -p seedance \
  -i demo-output/vibe-cli-generated-image.png \
  -d 5 \
  -r 16:9 \
  -o demo-output/vibe-cli-generated-i2v-video.mp4
```

Expected file:

```text
demo-output/vibe-cli-generated-i2v-video.mp4
```

Seedance image-to-video needs an HTTPS image URL. The CLI uploads local images
through ImgBB first, so `IMGBB_API_KEY` must be valid when using `-i` with
Seedance or Kling.

### 1.4 Existing Media Checks

Use the generated video as input for local/free and dry-run workflows:

```bash
pnpm vibe media info demo-output/vibe-cli-generated-video.mp4

pnpm vibe detect scenes \
  demo-output/vibe-cli-generated-video.mp4 \
  -o demo-output/scenes.json

pnpm vibe edit text-overlay \
  demo-output/vibe-cli-generated-video.mp4 \
  --text "VibeFrame" \
  --style lower-third \
  -o demo-output/vibe-cli-text-overlay.mp4

pnpm vibe edit silence-cut \
  demo-output/vibe-cli-generated-video.mp4 \
  -o demo-output/vibe-cli-silence-cut.mp4 \
  --dry-run

pnpm vibe remix animated-caption \
  demo-output/vibe-cli-generated-video.mp4 \
  --style highlight \
  -o demo-output/vibe-cli-animated-caption.mp4 \
  --dry-run
```

Expected files from the commands that execute:

```text
demo-output/scenes.json
demo-output/vibe-cli-text-overlay.mp4
```

The `silence-cut` and `animated-caption` examples use `--dry-run` so this
section demonstrates the route without spending on transcription.

---

## 2. Storyboard to Composed Video

This is the main project flow:

```text
vibe init -> edit STORYBOARD.md / DESIGN.md -> vibe build -> vibe render
```

A local-narration sample exists at:

```text
my-video/
```

Final rendered file:

```text
my-video/renders/my-video-final.mp4
```

### 2.1 Create a New Video Project

This command is idempotent. If `my-video` already exists, it keeps
the existing authored files and merges only missing support files.

```bash
pnpm vibe init my-video \
  --profile agent \
  --visual-style "Swiss Pulse" \
  -r 16:9 \
  -d 18
```

Open these two files first:

```text
my-video/STORYBOARD.md
my-video/DESIGN.md
```

`vibe init` creates a few support files because this is both a VibeFrame
project and a render project.

| Profile | Command             | What it creates                                                                                          |
| ------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| Minimal | `--profile minimal` | `STORYBOARD.md`, `DESIGN.md`, `vibe.project.yaml`, `.gitignore`                                          |
| Agent   | `--profile agent`   | Minimal files plus `SKILL.md`, `references/`, `CLAUDE.md`                                                |
| Full    | `--profile full`    | Agent files plus render scaffold: `index.html`, `compositions/`, `assets/`, `renders/`, backend metadata |

Recommended default: `--profile agent`.

The default `agent` profile does not create `hyperframes.json` up front. That
file is backend metadata for the current HTML renderer and appears only when
you choose `--profile full` or when `vibe build` needs to add the render
scaffold.

### 2.2 Author the Sample Files

For a reproducible dogfood run, replace the starter files with this compact
four-beat project:

````bash
cat > my-video/DESIGN.md <<'MD'
# Design

## Style

Precise developer-tool product demo. Dark interface, blue graph lines,
high-contrast panels, clean editorial motion, no mascot or cartoon styling.

## Palette

- `#070A12` — background
- `#1B66FF` — primary blue
- `#F4F7FB` — text
- `#6EE7B7` — success accent

## Typography

Inter or system sans-serif. Short labels, strong hierarchy, generous spacing.

## Motion

Smooth panel slides, timeline wipes, restrained parallax, no bounce.
MD

cat > my-video/STORYBOARD.md <<'MD'
# VibeFrame Dogfood

## Beat setup — CLI setup

```yaml
narration: "Start in the terminal. VibeFrame exposes every video workflow as a command."
backdrop: "developer terminal with setup and doctor output, dark UI, blue highlights"
duration: 5
```

Show the command line as the control surface.

## Beat media — AI media

```yaml
narration: "Generate images and motion assets, then keep every file inspectable."
backdrop: "generated product demo frame becoming a short video clip, timeline panels"
duration: 5
```

Show image and video assets as files, not hidden state.

## Beat compose — Storyboard composition

```yaml
narration: "Storyboard beats become editable browser scenes before final render."
backdrop: "storyboard markdown connected to HTML scene cards and a render timeline"
duration: 5
```

Show STORYBOARD.md and DESIGN.md driving scene composition.

## Beat workflow — YAML automation

```yaml
narration: "When the process needs to repeat, capture it as YAML with dry-runs and checkpoints."
backdrop: "YAML pipeline with step references and a budget line, clean terminal UI"
duration: 5
```

End on the repeatable workflow.
MD

````

### 2.3 Preview the Build

Start with dry-run. This prints the plan without creating assets or spending
provider budget:

```bash
pnpm vibe build my-video \
  --dry-run
```

### 2.4 Build the Sample Project

The sample uses local Kokoro narration and skips AI backdrops. It uses OpenAI
only as the batch HTML composer, so the copy-paste path is self-contained and
does not require a host coding agent to write scene files:

```bash
pnpm vibe build my-video \
  --mode batch \
  --composer openai \
  --tts kokoro \
  --skip-backdrop \
  --skip-render
```

With `--skip-render`, this prepares narration/assets and authors scene HTML
without exporting the final MP4. Run `vibe render` after lint passes.

When a host coding agent is driving VibeFrame and should own the HTML, use
agent mode instead:

```bash
pnpm vibe build my-video \
  --mode batch \
  --composer openai \
  --tts kokoro \
  --skip-backdrop \
  --skip-render

pnpm vibe scene compose-prompts my-video --json
```

If agent mode returns a `needs-author` plan, the host agent should author the
listed `compositions/scene-*.html` files and then rerun `vibe build`.

To exercise the full paid AI image asset path, remove `--skip-backdrop` and
choose the image provider you want.

### 2.5 Lint the Project

```bash
pnpm vibe scene lint index.html \
  --project my-video \
  --fix
```

Expected result:

```text
No fatal lint errors.
```

Info-level messages about CDN scripts are okay for this demo.

### 2.6 Render the Final MP4

```bash
pnpm vibe render my-video \
  -o renders/my-video-final.mp4 \
  --quality standard
```

Expected file:

```text
my-video/renders/my-video-final.mp4
```

Expected shape:

```text
H.264 + AAC MP4
1920x1080
30fps
about 20 seconds, or longer if narration timing stretches a beat
```

The final duration may be longer than the storyboard minimums because
generated narration extends each beat so speech is not cut off.

The sample includes four beats. The media flow from section 1 demonstrates the
asset side of the system:

```text
generate image -> generate video -> inspect/process media -> build/render storyboard project
```

---

## 3. Video as YAML

VibeFrame has two YAML surfaces. Use the one that matches the job.

### 3.1 STORYBOARD.md

Use this for a composed video project.

Example beat:

````markdown
## Beat hook — Storyboard becomes a render plan

```yaml
narration: "Start with a storyboard. VibeFrame turns each beat into a render plan an agent can execute."
backdrop: "A precise developer terminal beside structured storyboard cues, dark interface, blue grid lines"
duration: 5
```
````

Run:

```bash
pnpm vibe build my-video \
  --mode agent \
  --tts kokoro \
  --skip-backdrop \
  --skip-render
```

### 3.2 Pipeline YAML

Use this for a reproducible multi-step workflow.

The local-narration sample file is:

```text
my-video/video-as-yaml.yaml
```

Create it:

```bash
cat > my-video/video-as-yaml.yaml <<'YAML'
name: my-video-yaml
budget:
  costUsd: 2
  maxToolErrors: 1
steps:
  - id: build
    action: scene-build
    project: my-video
    mode: batch
    composer: openai
    tts: kokoro
    skipBackdrop: true
    skipRender: true

  - id: render
    action: scene-render
    project: my-video
    output: renders/my-video-yaml-final.mp4
    quality: standard
    fps: 30
    format: mp4
YAML
```

Preview cost and steps:

```bash
pnpm vibe run my-video/video-as-yaml.yaml \
  -o . \
  --dry-run
```

Execute:

```bash
pnpm vibe run my-video/video-as-yaml.yaml \
  -o .
```

The pipeline does:

```text
scene-build -> scene-render
```

Expected file:

```text
my-video/renders/my-video-yaml-final.mp4
```

`-o .` makes `project: my-video` resolve to
`my-video`.

For paid text-to-image -> image-to-video YAML, see
`my-video/ai-media.yaml`.

### 3.3 AI Media Layer

This optional path demonstrates the part that goes beyond Hyperframes-style
HTML composition: VibeFrame can orchestrate AI image/video providers and keep
those assets next to the composed project.

Create the pipeline:

```bash
cat > my-video/ai-media.yaml <<'YAML'
name: my-video-ai-media
budget:
  costUsd: 6
  maxToolErrors: 2
steps:
  - id: hero
    action: generate-image
    provider: openai
    model: "2"
    size: 1536x1024
    quality: hd
    prompt: "A polished VibeFrame CLI product demo frame, dark terminal UI, blue timeline accents, cinematic developer-tool composition"
    output: my-video-ai-hero.png

  - id: motion
    action: generate-video
    provider: seedance
    image: $hero.output
    prompt: "A clean camera push through a terminal-driven video timeline, panels animating into place, polished product demo motion"
    duration: 5
    ratio: "16:9"
    output: my-video-ai-motion.mp4
YAML
```

Preview:

```bash
pnpm vibe run my-video/ai-media.yaml \
  -o my-video/assets \
  --dry-run
```

Execute:

```bash
pnpm vibe run my-video/ai-media.yaml \
  -o my-video/assets \
  --budget-usd 6
```

The pipeline does:

```text
generate-image -> generate-video
```

Expected files:

```text
my-video/assets/my-video-ai-hero.png
my-video/assets/my-video-ai-motion.mp4
```

Expected shape after execution:

```text
my-video-ai-hero.png     PNG image
my-video-ai-motion.mp4   H.264 MP4, 1280x720, 24fps, about 5 seconds
```

Required keys:

```text
OPENAI_API_KEY
FAL_API_KEY
IMGBB_API_KEY
```

After these files exist, you can reference them from hand-authored scene HTML or
use them as inputs to edit/remix commands. The key point for this dogfood pass
is that generated media, storyboard composition, and YAML orchestration all
share normal file paths.

---

## 4. Validate Outputs

Inspect the final storyboard video:

```bash
ffprobe -v error \
  -show_entries stream=index,codec_type,codec_name,width,height,r_frame_rate,duration \
  -show_entries format=duration,size \
  -of json \
  my-video/renders/my-video-final.mp4
```

Inspect the YAML-rendered video:

```bash
ffprobe -v error \
  -show_entries stream=index,codec_type,codec_name,width,height,r_frame_rate,duration \
  -show_entries format=duration,size \
  -of json \
  my-video/renders/my-video-yaml-final.mp4
```

Run focused tests:

```bash
pnpm -F @vibeframe/cli test -- \
  src/commands/_shared/scene-build.test.ts \
  src/commands/_shared/scene-audio-mux.test.ts \
  src/commands/_shared/scene-project.test.ts \
  --run
```

---

## 5. Command Map

| Goal                                  | Command                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| Start a video project                 | `pnpm vibe init my-video --profile agent`                  |
| Build storyboard assets/compositions  | `pnpm vibe build my-video --mode batch --composer openai`  |
| Render project to MP4                 | `pnpm vibe render my-video`                                |
| Generate a standalone image           | `pnpm vibe generate image "..."`                           |
| Generate a standalone video           | `pnpm vibe generate video "..." -p seedance`               |
| Inspect a media file                  | `pnpm vibe media info video.mp4`                           |
| Detect scenes or silence              | `pnpm vibe detect scenes video.mp4`                        |
| Add static text to a video            | `pnpm vibe edit text-overlay video.mp4 --text "..."`       |
| Add designed overlay to a video       | `pnpm vibe edit motion-overlay video.mp4 "lower-third..."` |
| Preview caption/remix workflows       | `pnpm vibe remix animated-caption video.mp4 --dry-run`     |
| Transcribe audio or video             | `pnpm vibe audio transcribe clip.mp4 -o transcript.json`   |
| Run a YAML workflow                   | `pnpm vibe run workflow.yaml`                              |
| Run the built-in no-key smoke demo    | `pnpm vibe demo --keep`                                    |
| Print integration context for agents  | `pnpm vibe context`                                        |
| Learn the scene workflow              | `pnpm vibe guide scene`                                    |
| Learn the YAML workflow               | `pnpm vibe guide pipeline`                                 |
| Compare agent / build / run           | `pnpm vibe guide architecture`                             |
| List free-tier commands only          | `pnpm vibe schema --list --filter free`                    |
| Drive an agent with a USD ceiling     | `pnpm vibe agent --budget-usd 5`                           |
| Non-interactive first-run setup       | `pnpm vibe setup --yes --provider openai`                  |
| Project-only setup (no global writes) | `pnpm vibe setup --scope project --yes --import-env`       |
| Install shell completion (zsh)        | `pnpm vibe completion zsh > ~/.zfunc/_vibe`                |
| Low-level timeline scripting          | `pnpm vibe timeline create rough-cut`                      |
| Batch import media                    | `pnpm vibe batch import rough-cut ./clips --recursive`     |

Advanced namespace:

```text
vibe scene ...
```

Use `vibe scene ...` when you need lower-level scene commands such as
`scene lint`, `scene install-skill`, `scene compose-prompts`, or `scene add`.

---

## 6. Terminal Recordings

The VHS terminal recordings live in [`assets/demos/`](assets/demos/). They are
useful for docs and short product clips, but the primary demo path is
CLI-first and artifact-first:

```text
run vibe -> inspect files -> render MP4
```
