# quickstart-claude-code.tape - Claude Code follows DEMO-quickstart.md
#
# Output: assets/demos/quickstart-claude-code.mp4
#
# Records a first-user quickstart: init from brief, plan/dry-run,
# build, project/render inspection, deterministic repair, and final MP4.
# The recording uses the local repo build of `vibe`, imports project-scope
# keys, and never prints raw secrets.

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
Type "Read DEMO-quickstart.md, then run the storyboard-first quickstart flow in this directory using VibeFrame CLI."
Enter
Type "Use vibe, not pnpm. Do not print API keys or config files."
Enter
Type "Create a video project named apex-story using the low-cost path: Kokoro narration, batch composition, skipped generated backdrop/video/music, and a $5 cap."
Enter
Type "Run these concrete steps:"
Enter
Type "1. vibe setup --show; vibe doctor; vibe context; vibe schema --list --surface public --json"
Enter
Type '2. vibe init apex-story --from "24-second calm mountain sunrise launch video for Apex Ridge" --profile agent --visual-style "Swiss Pulse" -r 16:9 -d 24 --json'
Enter
Type "3. Review or rewrite apex-story/STORYBOARD.md and apex-story/DESIGN.md so they contain four concrete beats with narration, backdrop, motion, voice, and duration cues."
Enter
Type "4. vibe storyboard validate apex-story --json; vibe storyboard list apex-story --json; vibe inspect project apex-story --json"
Enter
Type "5. vibe plan apex-story --mode batch --composer openai --tts kokoro --skip-backdrop --skip-video --skip-music --max-cost 5 --json"
Enter
Type "6. vibe build apex-story --dry-run --mode batch --composer openai --tts kokoro --skip-backdrop --skip-video --skip-music --max-cost 5 --json"
Enter
Type "7. vibe build apex-story --mode batch --composer openai --tts kokoro --skip-backdrop --skip-video --skip-music --skip-render --max-cost 5 --json"
Enter
Type "8. vibe status project apex-story --refresh --json; vibe inspect project apex-story --json; vibe scene repair apex-story --json"
Enter
Type "9. vibe render apex-story -o renders/storyboard-demo.mp4 --quality standard --fps 30 --json"
Enter
Type "10. vibe inspect render apex-story --video renders/storyboard-demo.mp4 --cheap --json"
Enter
Type "11. Print a compact summary of apex-story/build-report.json and apex-story/review-report.json without dumping large files, then ffprobe renders/storyboard-demo.mp4 and list generated files."
Enter
Type "PROMPT"
Enter

Type 'claude -p --permission-mode bypassPermissions --verbose --output-format stream-json "$(cat prompt.txt)" | node /Users/kiyeonjeon/dev/vericontext/vibeframe/scripts/claude-stream-pretty.mjs'
Enter
Sleep 720s

Type "find apex-story/assets apex-story/compositions apex-story/renders -maxdepth 1 -type f | sort"
Enter
Sleep 3s

Type 'node -e "const b=require(\"./apex-story/build-report.json\"); const r=require(\"./apex-story/review-report.json\"); console.log(JSON.stringify({beats:b.beats?.map(({id,startSec,endSec,sceneDurationSec})=>({id,startSec,endSec,sceneDurationSec})), review:{status:r.status, summary:r.summary, retryWith:r.retryWith}}, null, 2))"'
Enter
Sleep 3s

Type "ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate -show_entries format=duration -of default=nw=1 apex-story/renders/storyboard-demo.mp4"
Enter
Sleep 4s
