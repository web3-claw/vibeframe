"use client";

const steps = [
  {
    title: "Generate source images",
    command: 'vibe gen img "futuristic terminal in space" -o scene1.png -r 16:9',
    result: "3 images generated with Gemini Nano Banana (< 10 sec each)",
  },
  {
    title: "Animate with Image-to-Video",
    command: 'vibe gen vid "camera slowly pushes in" -i scene1.png -o scene1.mp4 -d 5',
    result: "3 scene videos generated with Grok Imagine Video (native audio, $0.07/sec)",
  },
  {
    title: "Analyze with Video Understanding",
    command: 'vibe az media scene1.mp4 "Describe this video and suggest narration"',
    result: "AI analyzed mood, camera movement, and suggested narration text",
  },
  {
    title: "Generate narration & music",
    command: 'vibe gen tts "VibeFrame. AI-native video editing." -o narration.mp3',
    result: "3 narrations (ElevenLabs TTS) + 20s cinematic BGM (ElevenLabs Music)",
  },
  {
    title: "Compose final video",
    command: "ffmpeg concat + audio mix → vibeframe-demo.mp4",
    result: "19.5s demo video with synced narration, BGM, and 3 animated scenes",
  },
];

export function StepTimeline() {
  return (
    <div className="relative max-w-3xl mx-auto">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-purple-500 to-pink-500" />

      <div className="space-y-10">
        {steps.map((step, i) => (
          <div key={i} className="relative pl-14">
            {/* Step number */}
            <div className="absolute left-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25">
              {i + 1}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{step.title}</h3>

              <div className="bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 font-mono text-xs sm:text-sm overflow-x-auto">
                <span className="text-green-400">$ </span>
                <span className="text-foreground">{step.command}</span>
              </div>

              <p className="text-muted-foreground text-sm">{step.result}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
