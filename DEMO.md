# VibeFrame CLI Demo

Step-by-step demonstration of VibeFrame CLI features.

## 0. Setup

```bash
# Create test media (5s color bars with tone)
ffmpeg -y -f lavfi -i "testsrc2=duration=5:size=1280x720:rate=30" \
  -f lavfi -i "sine=frequency=440:duration=5" \
  -c:v libx264 -c:a aac -shortest demo/input.mp4

# Create a silent + speech simulation (3s silence + 2s tone + 3s silence)
ffmpeg -y -f lavfi -i "anullsrc=r=44100:cl=mono" -t 3 \
  -f lavfi -i "sine=frequency=440:duration=2" \
  -f lavfi -i "anullsrc=r=44100:cl=mono" -t 3 \
  -filter_complex "[0][1][2]concat=n=3:v=0:a=1" \
  -c:a aac demo/silence-test.mp4
```

## 1. CLI Help & Aliases

```bash
vibe --help                    # Top-level help with aliases
vibe gen --help                # generate alias
vibe ed --help                 # edit alias
vibe pipe --help               # pipeline alias
```

## 2. System Health (Doctor)

```bash
vibe doctor                    # System health + available commands
vibe doctor --json             # Machine-readable output
```

## 3. Schema Introspection

```bash
vibe schema generate.image     # JSON Schema for generate image
vibe schema edit.caption       # JSON Schema for edit caption
```

## 4. Project Workflow

```bash
vibe project create demo-project -o demo/project.vibe.json
vibe timeline add-source demo/project.vibe.json demo/input.mp4
vibe timeline list demo/project.vibe.json
```

## 5. Local Edit Commands (No API Key)

```bash
vibe ed silence-cut demo/silence-test.mp4 -o demo/no-silence.mp4
vibe ed fade demo/input.mp4 -o demo/faded.mp4 --fade-in 1 --fade-out 1
vibe ed noise-reduce demo/input.mp4 -o demo/clean.mp4 -s medium
vibe ed text-overlay demo/input.mp4 -t "VibeFrame Demo" -s center-bold -o demo/titled.mp4
```

## 6. Detection Commands (No API Key)

```bash
vibe detect scenes demo/input.mp4
vibe detect silence demo/silence-test.mp4
```

## 7. Output Modes

```bash
vibe doctor --json                          # JSON output
vibe doctor --json --fields "readyCount,totalCount"  # Field filtering
vibe detect silence demo/silence-test.mp4 --json     # JSON detection
```

## 8. AI Generation (Requires API Keys)

```bash
# Text-to-image
vibe gen img "a sunset over mountains" -o demo/sunset.png

# Image editing (edit existing image with instruction)
vibe ed image demo/sunset.png "add a bird flying in the sky" -o demo/sunset-bird.png

# Text-to-video
vibe gen vid "ocean waves crashing" -o demo/waves.mp4 -d 5

# Text-to-speech
vibe gen tts "Welcome to VibeFrame" -o demo/welcome.mp3

# Media analysis
vibe az media demo/sunset.png "describe this image"
vibe az media demo/input.mp4 "describe this video"
```

## 9. Export

```bash
vibe export demo/project.vibe.json -o demo/final.mp4 -y
```

## Cleanup

```bash
rm -rf demo/
```
