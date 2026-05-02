# dogfood-claude-code.tape - Claude Code follows DEMO-dogfood.md
#
# Output: assets/demos/dogfood-claude-code.mp4
#
# Records the internal dogfood path: setup check, project init,
# storyboard build/render, and YAML-driven render. Uses the installed
# `vibe` command from the local repo build so the demo workspace stays
# outside the git checkout.

Output assets/demos/dogfood-claude-code.mp4

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

Type "cd ~/dev/personal/lab/vibeframe-lab && rm -rf demo-dogfood-vhs && mkdir -p demo-dogfood-vhs && cd demo-dogfood-vhs && pwd"
Enter
Sleep 1s

Type "cp /Users/kiyeonjeon/dev/vericontext/vibeframe/DEMO-dogfood.md ."
Enter
Sleep 1s

Type "vibe setup --scope project --yes --import-env --provider claude"
Enter
Sleep 3s

Type "cat > prompt.txt <<'PROMPT'"
Enter
Type "Read DEMO-dogfood.md, then run a compact dogfood pass in this directory using VibeFrame CLI."
Enter
Type "Use vibe, not pnpm, because this is an installed-CLI workspace outside the repo. Do not print API keys or config files."
Enter
Type "Create a video project named my-video. Author DESIGN.md and STORYBOARD.md with four short beats about VibeFrame as an AI-first video CLI. Use local Kokoro narration and hand-authored/agent-authored scene composition where possible."
Enter
Type "Run these concrete steps:"
Enter
Type "1. vibe --help; vibe setup --show; vibe doctor"
Enter
Type '2. vibe init my-video --profile agent --visual-style "Swiss Pulse" -r 16:9 -d 18'
Enter
Type "3. Write my-video/DESIGN.md and my-video/STORYBOARD.md for four beats: CLI setup, image/video generation, storyboard composition, YAML workflow."
Enter
Type "4. vibe build my-video --mode batch --composer gemini --tts kokoro --skip-backdrop --quality standard"
Enter
Type "5. vibe render my-video -o renders/my-video-final.mp4 --quality standard --fps 30"
Enter
Type "6. Create my-video/video-as-yaml.yaml with scene-build and scene-render steps, then run vibe run my-video/video-as-yaml.yaml -o . --dry-run and vibe run my-video/video-as-yaml.yaml -o ."
Enter
Type "7. ffprobe my-video/renders/my-video-final.mp4 and my-video/renders/my-video-yaml-final.mp4, list key project files, and summarize what was validated."
Enter
Type "PROMPT"
Enter

Type 'claude -p --permission-mode bypassPermissions --verbose --output-format stream-json "$(cat prompt.txt)" | node /Users/kiyeonjeon/dev/vericontext/vibeframe/scripts/claude-stream-pretty.mjs'
Enter
Sleep 720s

Type "find my-video/assets my-video/compositions my-video/renders -maxdepth 1 -type f | sort"
Enter
Sleep 3s

Type "ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate -show_entries format=duration -of default=nw=1 my-video/renders/my-video-final.mp4"
Enter
Sleep 4s
