"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function HeroVideo({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 max-w-4xl mx-auto">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full aspect-video"
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 p-2 rounded-full bg-background/70 backdrop-blur-sm border border-border/50 text-foreground hover:bg-background/90 transition-colors"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
