# quickstart-claude-code.tape - Claude Code follows DEMO-quickstart.md
#
# Output: assets/demos/quickstart-claude-code.mp4
#
# Records a first-user quickstart: image generation, image-to-video,
# video understanding, and motion overlay. The recording uses the local
# repo build of `vibe`, imports project-scope keys, and never prints raw
# secrets.

Output assets/demos/quickstart-claude-code.mp4

Require claude
Require vibe
Require ffprobe

Set FontSize 12
Set Width 1400
Set Height 900
Set Padding 20
Set TypingSpeed 20ms
Set Theme "Catppuccin Mocha"
Set Shell "bash"
Set PlaybackSpeed 1.75

Hide
Type "export PATH=/tmp/vibeframe-local-bin:$PATH"
Enter
Type "set -a; source /Users/kiyeonjeon/dev/vericontext/vibeframe/.env 2>/dev/null; set +a"
Enter
Show

Type "cd ~/dev/personal/lab/vibeframe-lab && rm -rf demo-quickstart-vhs && mkdir -p demo-quickstart-vhs && cd demo-quickstart-vhs && pwd"
Enter
Sleep 1s

Type "cp /Users/kiyeonjeon/dev/vericontext/vibeframe/DEMO-quickstart.md ."
Enter
Sleep 1s

Type "vibe setup --scope project --yes --import-env --provider claude"
Enter
Sleep 3s

Type "cat > prompt.txt <<'PROMPT'"
Enter
Type "Read DEMO-quickstart.md, then run the standalone quickstart flow in this directory using VibeFrame CLI."
Enter
Type "Use vibe, not pnpm. Do not print API keys or config files."
Enter
Type "For this recording, use OpenAI for image generation and Grok for image-to-video because this environment's fal.ai Seedance access is currently unavailable. Keep the same VibeFrame flow and mention the provider substitution in the summary."
Enter
Type "Run these concrete steps:"
Enter
Type "1. mkdir -p assets renders"
Enter
Type '2. vibe generate image "aerial view of a misty mountain peak at sunrise, golden hour light hitting the ridges, layered fog drifting through the valleys, soft volumetric god rays, cinematic 16:9, shot on Arri Alexa" -p openai -m 2 --size 1536x1024 --quality hd --style natural -o assets/peak.png'
Enter
Type '3. vibe generate video "slow cinematic camera drift forward over the mountain peak, fog moving gently with the wind, sunrise light strengthening as the sun climbs, smooth aerial motion" -p grok -i assets/peak.png -d 5 -r 16:9 -o assets/peak-video.mp4'
Enter
Type '4. vibe inspect media assets/peak-video.mp4 "Describe the visual mood, dominant motion, and safest lower-third region for a title overlay. Keep it concise." --fps 1 --low-res'
Enter
Type '5. vibe edit motion-overlay assets/peak-video.mp4 "minimal lower-third title Day One - Apex Ridge, bottom-left, clean white sans-serif, subtle film grain, soft warm vignette, avoid covering the mountain silhouette" --understand auto -m gemini --duration 5 --style cinematic -o renders/peak-titled.mp4'
Enter
Type "6. ffprobe renders/peak-titled.mp4 for width, height, frame rate, and duration."
Enter
Type "7. List the generated files and give a short summary mapping prompt -> vibe command -> output file."
Enter
Type "PROMPT"
Enter

Type 'claude -p --permission-mode bypassPermissions --verbose --output-format stream-json "$(cat prompt.txt)" | node /Users/kiyeonjeon/dev/vericontext/vibeframe/scripts/claude-stream-pretty.mjs'
Enter
Sleep 540s

Type "find assets renders -maxdepth 2 -type f | sort"
Enter
Sleep 3s

Type "ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate -show_entries format=duration -of default=nw=1 renders/peak-titled.mp4"
Enter
Sleep 4s
