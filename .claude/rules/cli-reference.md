---
paths:
  - "packages/cli/**"
---

# VibeFrame CLI Reference

> **Note**: This file supplements `vibe --help` and `vibe schema <command>`.
> The CLI is designed to be self-discoverable — run `--help` on any command for examples, API key requirements, and usage.
> This file provides workflow examples and cross-command patterns that go beyond single-command help.

## Command Group Aliases

| Full | Alias | Example |
|------|-------|---------|
| `generate` | `gen` | `vibe gen img "prompt"` |
| `edit` | `ed` | `vibe ed sc video.mp4` |
| `analyze` | `az` | `vibe az media img.png` |
| `audio` | `au` | `vibe au transcribe audio.mp3` |
| `pipeline` | `pipe` | `vibe pipe s2v "script"` |

Subcommand aliases: `image`→`img`, `video`→`vid`, `speech`→`tts`, `caption`→`cap`, `silence-cut`→`sc`, `script-to-video`→`s2v`, `auto-shorts`→`shorts`

## Top-Level Commands

```bash
vibe project create <name> -o project.vibe.json    # Create project
vibe project info <file>                            # Show project info
vibe timeline add-source <project> <media>          # Add media source (returns source ID)
vibe timeline add-clip <project> <source-id>        # Add clip to timeline
vibe timeline list <project>                        # List timeline contents
vibe timeline trim <project> <clip-id> --start 5 --end 30
vibe timeline split <project> <clip-id> --time 10
vibe timeline delete <project> <clip-id>
vibe export <project> -o output.mp4 -y              # Export to video (-y = overwrite)
vibe batch import <project> <directory>              # Import all media from dir
vibe detect scenes <video>                          # Detect scene changes
vibe detect silence <media>                         # Detect silent segments
vibe detect beats <audio>                           # Detect beats
vibe setup --show                                   # Show API key status
vibe agent -p claude                                # Interactive agent mode
vibe schema generate.image                          # Show JSON schema for a command
```

## Command Groups

Commands are organized into 5 semantic groups:

```
vibe generate <action>    # Asset generation (image, video, speech, music, motion)
vibe edit <action>        # Post-production editing (silence-cut, caption, grade, reframe...)
vibe analyze <action>     # Analysis & review (media, video, review, suggest)
vibe audio <action>       # Audio tools (transcribe, voices, isolate, clone, dub, duck)
vibe pipeline <action>    # Multi-step workflows (script-to-video, highlights, shorts...)
```

## Generate — Asset Generation

```bash
# Generate image (default: Gemini Nano Banana)
vibe generate image "<prompt>" -o out.png
vibe generate image "<prompt>" -o out.png -m latest        # Gemini latest (Nano Banana 2)
vibe generate image "<prompt>" -o out.png -m pro           # Gemini Pro (4K)
vibe generate image "<prompt>" -o out.png -p openai        # Use GPT Image
vibe generate image "<prompt>" -o out.png -p grok          # Use Grok Imagine
vibe generate image "<prompt>" -o out.png -r 16:9          # Aspect ratio

# Text-to-video (default: Grok Imagine — native audio)
vibe generate video "<prompt>" -o out.mp4 -d 5             # Grok Imagine (default)
vibe generate video "<prompt>" -o out.mp4 -p kling         # Kling
vibe generate video "<prompt>" -o out.mp4 -p runway        # Runway Gen-4.5
vibe generate video "<prompt>" -o out.mp4 -p veo           # Google Veo

# Runway text-to-video (gen4.5 default — no image needed)
vibe generate video "<prompt>" -p runway -o out.mp4

# Image-to-video (all providers support I2V)
vibe generate video "<prompt>" -i image.png -o out.mp4                  # Grok (default)
vibe generate video "<prompt>" -i image.png -o out.mp4 -p runway        # Runway gen4.5
vibe generate video "<prompt>" -i image.png -o out.mp4 -p runway --runway-model gen4_turbo
vibe generate video "<prompt>" -i image.png -o out.mp4 -p kling         # Kling (needs IMGBB_API_KEY)
vibe generate video "<prompt>" -i image.png -o out.mp4 -p veo           # Veo (first frame)

# Veo options
vibe generate video "<prompt>" -p veo --resolution 1080p -o out.mp4
vibe generate video "<prompt>" -p veo --veo-model 3.1 --last-frame end.png -o out.mp4
vibe generate video "<prompt>" -p veo --ref-images ref1.png ref2.png -o out.mp4

# Video management
vibe generate video-status <task-id>                       # Check generation status
vibe generate video-cancel <task-id>                       # Cancel generation
vibe generate video-extend <video-id>                      # Extend video

# Text-to-speech (ElevenLabs)
vibe generate speech "<text>" -o out.mp3
vibe generate speech "<text>" -o out.mp3 -v <voice-id>     # Custom voice

# Sound effects
vibe generate sound-effect "<description>" -o out.mp3 -d 5

# Music generation (default: ElevenLabs, up to 10min)
vibe generate music "<description>" -o out.mp3 -d 30                # ElevenLabs (default)
vibe generate music "<description>" -o out.mp3 -d 30 -p replicate   # Replicate MusicGen
vibe generate music "<description>" -o out.mp3 --instrumental       # No vocals (ElevenLabs)
vibe generate music-status <prediction-id>                          # Check status (Replicate only)

# Storyboard generation
vibe generate storyboard "<content>" -o storyboard.json -d 30

# Thumbnail
vibe generate thumbnail <video> -o thumb.png

# Background generation
vibe generate background "<prompt>" -o bg.png

# Motion graphics (Claude + Remotion)
vibe generate motion "<description>" -o motion.mp4 --render -s cinematic
vibe generate motion "<description>" --image bg.png --video base.mp4
```

## Edit — Post-Production

```bash
# Remove silence
vibe edit silence-cut <video> -o out.mp4
vibe edit silence-cut <video> -o out.mp4 --use-gemini      # Smart detection

# Remove filler words (um, uh, like...)
vibe edit jump-cut <video> -o out.mp4

# Add captions (Whisper + FFmpeg)
vibe edit caption <video> -o out.mp4 -s bold               # bold, minimal, outline, karaoke
vibe edit caption <video> -o out.mp4 --position top

# Noise reduction (no API key)
vibe edit noise-reduce <input> -o out.mp4 -s high          # low, medium, high

# Fade effects (no API key)
vibe edit fade <video> -o out.mp4 --fade-in 1 --fade-out 1

# Color grading (Claude + FFmpeg)
vibe edit grade <video> -o out.mp4 --preset cinematic-warm
vibe edit grade <video> -o out.mp4 -s "film noir look"     # custom style

# Text overlay (FFmpeg)
vibe edit text-overlay <video> -t "Title" -s center-bold -o out.mp4
vibe edit text-overlay <video> -t "Line 1" -t "Line 2" --start 0 --end 5 -o out.mp4

# Speed ramping (Whisper + Claude + FFmpeg)
vibe edit speed-ramp <video> -o out.mp4 -s dramatic

# Reframe aspect ratio (Claude Vision + FFmpeg)
vibe edit reframe <video> -o out.mp4 -a 9:16               # Landscape → vertical

# Image editing (default: Gemini)
vibe edit image <image> "<instruction>" -o out.png                    # Gemini Flash (default)
vibe edit image <img1> <img2> "<instruction>" -o out.png -m pro       # Gemini Pro (14 images)
vibe edit image <image> "<instruction>" -o out.png -p openai          # OpenAI GPT Image 1.5
vibe edit image <image> "<instruction>" -o out.png -p grok            # Grok Imagine

# Video tools
vibe edit upscale-video <video> -o out.mp4
vibe edit interpolate <video> -o out.mp4
vibe edit fill-gaps <project> -o out/

# Translate subtitles
vibe edit translate-srt <file.srt> -t ko -o out.srt
```

## Analyze — Analysis & Review

```bash
# Analyze any media (image, video, YouTube URL)
vibe analyze media <source> "<prompt>"
vibe analyze media image.png "Describe this image"
vibe analyze media video.mp4 "Summarize this video"
vibe analyze media "https://youtube.com/watch?v=..." "Key takeaways"

# Video-specific analysis (Gemini)
vibe analyze video <video> "<prompt>"
vibe analyze video <video> "<prompt>" --low-res            # For longer videos

# AI video review + auto-fix
vibe analyze review <video> --auto-apply -o fixed.mp4

# Suggest edits
vibe analyze suggest <video>
```

## Audio — Audio Tools

```bash
# Transcription (Whisper)
vibe audio transcribe <audio> -o out.srt -f srt
vibe audio transcribe <audio> -l ko                        # Specify language

# List available voices
vibe audio voices

# Voice isolation
vibe audio isolate <audio> -o isolated.mp3

# Voice clone
vibe audio voice-clone <sample.mp3>

# Dubbing (transcribe + translate + TTS)
vibe audio dub <media> -l ko -o dubbed.mp4

# Audio ducking (lower music when voice plays)
vibe audio duck <music.mp3> --voice voice.mp3 -o out.mp3
```

## Pipeline — Multi-Step Workflows

```bash
# Script-to-video (full pipeline: storyboard → images → video → TTS → assembly)
vibe pipeline script-to-video "<script>" -o output-dir/ -g runway
vibe pipeline script-to-video "<script>" -o output-dir/ -g kling --images-only
vibe pipeline script-to-video "<script>" -o output-dir/ -a 9:16 --review

# Regenerate specific scene
vibe pipeline regenerate-scene <project-dir> --scene 2

# Extract highlights from long video
vibe pipeline highlights <video> -o highlights.json -d 60 --use-gemini
vibe pipeline highlights <video> --project project.vibe.json

# Auto-generate shorts
vibe pipeline auto-shorts <video> -o shorts/ -n 3 -d 60 --add-captions

# Deprecated commands (still functional, will be removed)
# vibe pipeline viral    → use individual commands instead
# vibe pipeline b-roll   → use individual commands instead
# vibe pipeline narrate  → use individual commands instead
```

## Common Workflows

### Generate image → edit → make video
```bash
vibe generate image "a cat on a rooftop" -o cat.png
vibe edit image cat.png "add a sunset background" -o cat-sunset.png
vibe generate video "the cat watches the sunset" -i cat-sunset.png -o cat.mp4 -p runway
```

### Create video with narration
```bash
vibe generate video "ocean waves at sunset" -o waves.mp4 -d 5
vibe generate speech "The sun sets over the peaceful ocean." -o narration.mp3
vibe project create my-video -o project.vibe.json
vibe timeline add-source project.vibe.json waves.mp4    # → source ID
vibe timeline add-source project.vibe.json narration.mp3 # → source ID
vibe timeline add-clip project.vibe.json <video-source-id>
vibe timeline add-clip project.vibe.json <audio-source-id>
vibe export project.vibe.json -o final.mp4 -y
```

### Edit existing video
```bash
vibe edit silence-cut interview.mp4 -o clean.mp4
vibe edit caption clean.mp4 -o captioned.mp4 -s bold
vibe edit grade captioned.mp4 -o final.mp4 --preset cinematic-warm
```

## API Keys

| Command | Required Key |
|---------|-------------|
| `generate image` (default) | `GOOGLE_API_KEY` |
| `generate image -p openai` | `OPENAI_API_KEY` |
| `edit image` (default) | `GOOGLE_API_KEY` |
| `edit image -p openai` | `OPENAI_API_KEY` |
| `edit image -p grok` | `XAI_API_KEY` |
| `generate video` | `XAI_API_KEY` |
| `generate video -p kling` | `KLING_API_KEY` |
| `generate video -p runway` | `RUNWAY_API_SECRET` |
| `generate video -p veo` | `GOOGLE_API_KEY` |
| `generate speech` / `generate sound-effect` / `generate music` | `ELEVENLABS_API_KEY` |
| `generate music -p replicate` | `REPLICATE_API_TOKEN` |
| `audio transcribe` / `edit caption` / `edit jump-cut` | `OPENAI_API_KEY` |
| `edit grade` / `edit reframe` / `edit speed-ramp` | `ANTHROPIC_API_KEY` |
| `analyze video` / `analyze media` / `analyze review` | `GOOGLE_API_KEY` |
| `edit silence-cut` / `edit noise-reduce` / `edit fade` | None (FFmpeg only) |
| `pipeline script-to-video -g runway` | `ANTHROPIC_API_KEY` + `GOOGLE_API_KEY` + `ELEVENLABS_API_KEY` + `RUNWAY_API_SECRET` |
| `pipeline script-to-video -g veo` | `ANTHROPIC_API_KEY` + `GOOGLE_API_KEY` + `ELEVENLABS_API_KEY` |
| `generate video-extend -p veo` | `GOOGLE_API_KEY` |
