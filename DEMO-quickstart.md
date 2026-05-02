# VibeFrame Quickstart Demo

This is the copy-paste demo for a first-time user or an AI coding agent
driving `vibe` from a project directory.

The goal is clarity:

```text
your prompt -> the vibe command that should run -> the file you should see
```

The demo covers the main Vibe CLI surfaces without trying every provider:

| Flow                   | Intent                                       | Primary output                           |
| ---------------------- | -------------------------------------------- | ---------------------------------------- |
| Text to image          | `vibe generate image`                        | `assets/peak.png`                        |
| Image to video         | `vibe generate video`                        | `assets/peak-seedance.mp4`               |
| Video understanding    | `vibe inspect media`                         | JSON/text analysis                       |
| Motion overlay         | `vibe edit motion-overlay`                   | `renders/peak-titled.mp4`                |
| Storyboard composition | `vibe init` -> `vibe build` -> `vibe render` | `apex-story/renders/storyboard-demo.mp4` |
| Video as YAML          | `vibe run pipeline.yaml`                     | `pipeline-renders/titled.mp4`            |

For a longer contributor dogfood run, see [DEMO-dogfood.md](DEMO-dogfood.md).

---

## 0. Setup

Install:

```bash
curl -fsSL https://vibeframe.ai/install.sh | bash
```

Create a clean demo directory:

```bash
mkdir -p ~/dev/vibeframe-demo
cd ~/dev/vibeframe-demo
```

Configure only the providers this demo uses:

```bash
vibe setup --scope project
vibe doctor --test-keys
```

Recommended keys for this quickstart:

| Key                                 | Used for                                                       |
| ----------------------------------- | -------------------------------------------------------------- |
| `OPENAI_API_KEY`                    | text-to-image                                                  |
| `FAL_API_KEY`                       | Seedance image-to-video                                        |
| `GOOGLE_API_KEY`                    | video/image understanding and Gemini-backed overlay generation |
| `IMGBB_API_KEY` or S3 upload config | temporary image URL for Seedance image-to-video                |

If you use S3 instead of ImgBB, set it during setup or in `.env`:

```bash
VIBE_UPLOAD_PROVIDER=s3
VIBE_UPLOAD_S3_BUCKET=your-bucket
VIBE_UPLOAD_S3_PREFIX=vibeframe/tmp
VIBE_UPLOAD_TTL_SECONDS=3600
AWS_REGION=us-east-1
```

Create output folders:

```bash
mkdir -p assets renders
```

Sanity check the command surface:

```bash
vibe guide
vibe guide motion
vibe schema generate.video
```

---

## 1. Text To Image

### User prompt

Paste this to Claude Code, Codex, Cursor, or any agent running in the
demo directory:

```text
Create a cinematic 16:9 image of a misty mountain peak at sunrise.
Golden light should hit the ridges, fog should drift through the
valleys, and the frame should feel like an Arri Alexa aerial shot.
Save it to assets/peak.png using OpenAI image generation.
```

### Command the agent should run

```bash
vibe generate image \
  "aerial view of a misty mountain peak at sunrise, golden hour light hitting the ridges, layered fog drifting through the valleys, soft volumetric god rays, cinematic 16:9, shot on Arri Alexa" \
  -p openai \
  -m 2 \
  --size 1536x1024 \
  --quality hd \
  --style natural \
  -o assets/peak.png
```

Preview before spending:

```bash
vibe generate image \
  "aerial view of a misty mountain peak at sunrise, golden hour light hitting the ridges, layered fog drifting through the valleys, soft volumetric god rays, cinematic 16:9, shot on Arri Alexa" \
  -p openai \
  -m 2 \
  --size 1536x1024 \
  --quality hd \
  --style natural \
  -o assets/peak.png \
  --dry-run
```

### Expected result

```text
assets/peak.png
```

You should see a still image with:

- wide mountain/ridge composition
- sunrise/golden-hour lighting
- fog layers in the valleys
- cinematic 16:9-ish framing

---

## 2. Image To Video

### User prompt

```text
Use assets/peak.png as the source image and make a 6 second cinematic
video. The camera should drift forward over the peak, fog should move
gently with the wind, and the sunlight should strengthen as the sun
climbs. Save it to assets/peak-seedance.mp4 using Seedance.
```

### Command the agent should run

```bash
vibe generate video \
  "slow cinematic camera drift forward over the mountain peak, fog moving gently with the wind, sunrise light strengthening as the sun climbs, smooth aerial motion" \
  -p seedance \
  -i assets/peak.png \
  -d 6 \
  -r 16:9 \
  -o assets/peak-seedance.mp4
```

Preview before spending:

```bash
vibe generate video \
  "slow cinematic camera drift forward over the mountain peak, fog moving gently with the wind, sunrise light strengthening as the sun climbs, smooth aerial motion" \
  -p seedance \
  -i assets/peak.png \
  -d 6 \
  -r 16:9 \
  -o assets/peak-seedance.mp4 \
  --dry-run
```

### Expected result

```text
assets/peak-seedance.mp4
```

You should see a short video clip where the still image is animated.
For local image-to-video, VibeFrame uploads `assets/peak.png` through the
configured temporary upload provider:

- `imgbb` by default when `IMGBB_API_KEY` is configured
- `s3` when `VIBE_UPLOAD_PROVIDER=s3`

If this step fails with an upload error, run:

```bash
vibe setup --scope project
vibe doctor --test-keys
```

and check that either ImgBB or S3 upload settings are configured.

---

## 3. Video Understanding

This step verifies that Vibe can inspect the video that was just
generated. It is useful before asking for motion graphics that need to
fit the actual footage.

### User prompt

```text
Inspect assets/peak-seedance.mp4 and tell me the visual mood, dominant
motion, and where a lower-third title would be safest.
```

### Command the agent should run

```bash
vibe inspect media \
  assets/peak-seedance.mp4 \
  "Describe the visual mood, dominant motion, and the safest region for a lower-third title. Keep the answer concise." \
  --fps 1 \
  --low-res
```

### Expected result

The response should mention the mountain/fog/sunrise scene and identify
a safe lower-third region, usually bottom-left or bottom-right depending
on where the peak silhouette sits.

No new media file is produced in this step. It is a read-only
understanding check.

---

## 4. Motion Overlay On The Existing Video

Use this when you already have a clip and want designed motion graphics
on top of it. This is different from `vibe generate motion`, which
creates a standalone motion asset.

### User prompt

```text
Add a minimal lower-third title to assets/peak-seedance.mp4.
Text: "Day One — Apex Ridge".
Place it bottom-left, use clean white sans-serif type, fade in from
1.0s to 1.6s, hold, then fade out near the end. Add subtle film grain
and a soft warm vignette. Use video understanding so the title avoids
the mountain silhouette. Save to renders/peak-titled.mp4.
```

### Command the agent should run

Preview before spending:

```bash
vibe edit motion-overlay \
  assets/peak-seedance.mp4 \
  "minimal lower-third title 'Day One — Apex Ridge' bottom-left, clean white sans-serif, fade in from 1.0s to 1.6s, hold, fade out near the end, subtle film grain, soft warm vignette, avoid covering the mountain silhouette" \
  --understand auto \
  -m gemini \
  --duration 6 \
  --style cinematic \
  -o renders/peak-titled.mp4 \
  --dry-run
```

Then run it:

```bash
vibe edit motion-overlay \
  assets/peak-seedance.mp4 \
  "minimal lower-third title 'Day One — Apex Ridge' bottom-left, clean white sans-serif, fade in from 1.0s to 1.6s, hold, fade out near the end, subtle film grain, soft warm vignette, avoid covering the mountain silhouette" \
  --understand auto \
  -m gemini \
  --duration 6 \
  --style cinematic \
  -o renders/peak-titled.mp4
```

### Expected result

```text
renders/peak-titled.mp4
```

You should see the Seedance clip with:

- lower-third title
- subtle grain/vignette
- title positioned away from the main subject
- same duration as the source clip unless you set `--duration`

Use `vibe guide motion` when deciding between:

| Need                                   | Command                                |
| -------------------------------------- | -------------------------------------- |
| Simple static text                     | `vibe edit text-overlay`               |
| Designed animated overlay on a clip    | `vibe edit motion-overlay`             |
| Standalone motion graphics asset       | `vibe generate motion`                 |
| Existing `.json` / `.lottie` animation | `vibe edit motion-overlay --asset ...` |

---

## 5. Storyboard To Composed Video

This flow is for multi-scene videos. It uses a VibeFrame project:

```text
vibe init -> edit STORYBOARD.md / DESIGN.md -> vibe build -> vibe render
```

### User prompt

```text
Create a 12 second composed video called apex-story.
Use the same mountain sunrise identity.
Make two beats:
1. Hook: "The first light finds the ridge before the world wakes."
2. Close: "Apex Ridge — day one begins here."
Use Kokoro narration, OpenAI image backdrops, and 16:9.
```

### Commands the agent should run

Scaffold the project:

```bash
vibe init apex-story --profile agent --ratio 16:9
```

Write `apex-story/DESIGN.md` with the visual identity:

```markdown
# Design

## Style

Calm cinematic mountain documentary. Golden sunrise, layered fog, soft
contrast, restrained editorial typography.

## Palette

- `#0E1622` — ridge shadow
- `#E8B36A` — golden light
- `#F5EEE2` — warm title text

## Typography

Inter, medium weight, generous spacing.

## Motion

Slow camera drift, soft fades, no bounce or elastic movement.
```

Write `apex-story/STORYBOARD.md`:

````markdown
# Apex Story

## Beat hook — First light

```yaml
narration: "The first light finds the ridge before the world wakes."
backdrop: "misty mountain ridge at sunrise, golden light, fog layers, cinematic aerial frame"
duration: 6
```

Show the mountain identity immediately. Keep text minimal.

## Beat close — Day one

```yaml
narration: "Apex Ridge — day one begins here."
backdrop: "wide mountain ridge at peak golden hour, valley filled with warm light, cinematic 16:9"
duration: 6
```

End with a quiet lower-third title and a clean fade.
````

Build and render. In the recommended host-agent path, `vibe build
--mode agent` prepares the plan and primitives; the calling agent writes
the scene HTML, then `vibe render` captures the final MP4.

```bash
vibe build apex-story \
  --dry-run

vibe build apex-story \
  --mode agent \
  --tts kokoro \
  --image-provider openai \
  --quality hd

vibe render apex-story \
  -o renders/storyboard-demo.mp4 \
  --quality standard \
  --fps 30
```

If you are running by hand without Claude Code, Codex, Cursor, or another
agent writing HTML for you, use batch mode instead:

```bash
vibe build apex-story \
  --mode batch \
  --composer gemini \
  --tts kokoro \
  --image-provider openai \
  --quality hd
```

Batch mode renders once with a timestamped filename under
`apex-story/renders/`. Run the stable render command too if you want the
same predictable file name used in this demo:

```bash
vibe render apex-story \
  -o renders/storyboard-demo.mp4 \
  --quality standard \
  --fps 30
```

### Expected result

```text
apex-story/
  DESIGN.md
  STORYBOARD.md
  vibe.project.yaml
  assets/
  compositions/
  renders/

apex-story/renders/storyboard-demo.mp4
```

You should get a composed video with generated scene backdrops,
narration, HTML scene composition, and a final MP4.

If `vibe build --mode agent` returns a compose plan instead of finished
HTML, that is expected in host-agent mode. The calling agent should read
the plan, write `compositions/scene-*.html`, run `vibe scene lint`, and
then run `vibe render`.

Useful agent loop:

```bash
vibe scene compose-prompts apex-story --json
vibe scene lint --project apex-story --json
vibe render apex-story -o renders/storyboard-demo.mp4
```

---

## 6. Video As YAML

Use `vibe run` when you want the whole workflow to be reproducible in a
single file.

### User prompt

```text
Create a YAML pipeline that generates the mountain image, animates it
with Seedance, then adds the same lower-third motion overlay. Run a dry
run first, then execute it and resume if needed.
```

### Pipeline file

Create `apex-pipeline.yaml`:

```yaml
name: apex-pipeline
budget:
  costUsd: 10
  maxToolErrors: 2
steps:
  - id: image
    action: generate-image
    provider: openai
    model: "2"
    size: 1536x1024
    quality: hd
    style: natural
    prompt: "aerial view of a misty mountain peak at sunrise, golden hour light hitting the ridges, layered fog drifting through the valleys, cinematic"
    output: peak.png

  - id: video
    action: generate-video
    provider: seedance
    image: $image.output
    prompt: "slow cinematic camera drift forward over the mountain peak, fog moving gently with the wind, sunrise light strengthening"
    duration: 6
    ratio: "16:9"
    output: peak.mp4

  - id: titled
    action: edit-motion-overlay
    input: $video.output
    description: "minimal lower-third title 'Day One — Apex Ridge', bottom-left, clean white sans-serif, subtle film grain, soft warm vignette"
    understand: auto
    model: gemini
    duration: 6
    style: cinematic
    output: titled.mp4
```

### Commands the agent should run

```bash
vibe run apex-pipeline.yaml \
  -o pipeline-renders \
  --dry-run

vibe run apex-pipeline.yaml \
  -o pipeline-renders
```

Resume after a provider/network failure:

```bash
vibe run apex-pipeline.yaml \
  -o pipeline-renders \
  --resume
```

### Expected result

```text
pipeline-renders/peak.png
pipeline-renders/peak.mp4
pipeline-renders/titled.mp4
```

The YAML version should produce the same kind of image, video, and
titled MP4 as Steps 1-4, but with checkpoints and resumability.

---

## Which Command Should The Agent Choose?

| User intent                                         | Correct route                                |
| --------------------------------------------------- | -------------------------------------------- |
| "Make an image of..."                               | `vibe generate image`                        |
| "Animate this image..."                             | `vibe generate video -i image.png`           |
| "What is in this image/video?"                      | `vibe inspect media`                         |
| "Add a lower-third / animated graphic to this clip" | `vibe edit motion-overlay`                   |
| "Just burn simple text into the video"              | `vibe edit text-overlay`                     |
| "Make standalone motion graphics"                   | `vibe generate motion`                       |
| "Make a multi-scene video from a storyboard"        | `vibe init` -> `vibe build` -> `vibe render` |
| "Make this repeatable / resumable"                  | `vibe run pipeline.yaml`                     |

When unsure:

```bash
vibe guide
vibe guide motion
vibe schema --list
vibe doctor
```

---

## Expected File Tree After The Demo

```text
.
├── assets/
│   ├── peak.png
│   └── peak-seedance.mp4
├── renders/
│   └── peak-titled.mp4
├── apex-story/
│   ├── DESIGN.md
│   ├── STORYBOARD.md
│   ├── assets/
│   ├── compositions/
│   ├── renders/
│   │   └── storyboard-demo.mp4
│   └── vibe.project.yaml
├── apex-pipeline.yaml
└── pipeline-renders/
    ├── peak.png
    ├── peak.mp4
    └── titled.mp4
```

The exact pixels vary by provider, model, and seed, but the file chain
and command routing should stay the same.
