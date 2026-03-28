"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowDown } from "lucide-react";
import { TerminalBlock } from "./TerminalBlock";

interface SceneCardProps {
  title: string;
  description: string;
  imageSrc: string;
  videoSrc: string;
  command: string;
}

export function SceneCard({ title, description, imageSrc, videoSrc, command }: SceneCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isVisible]);

  return (
    <div ref={containerRef} className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        {/* Source image */}
        <div className="rounded-xl overflow-hidden border border-border/50">
          <img src={imageSrc} alt={`${title} source`} className="w-full aspect-video object-cover" loading="lazy" />
          <div className="px-3 py-2 bg-secondary/50 text-xs text-muted-foreground">Source image</div>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex items-center justify-center">
          <ArrowRight className="w-6 h-6 text-primary" />
        </div>
        <div className="flex md:hidden items-center justify-center">
          <ArrowDown className="w-6 h-6 text-primary" />
        </div>

        {/* Generated video */}
        <div className="rounded-xl overflow-hidden border border-border/50">
          {isVisible ? (
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              loop
              playsInline
              className="w-full aspect-video object-cover"
            />
          ) : (
            <img src={imageSrc} alt={`${title} preview`} className="w-full aspect-video object-cover opacity-50" />
          )}
          <div className="px-3 py-2 bg-secondary/50 text-xs text-muted-foreground">Generated video</div>
        </div>
      </div>

      {/* Command used */}
      <TerminalBlock title="command">
        <code className="text-green-400">$ </code>
        <code className="text-foreground">{command}</code>
      </TerminalBlock>
    </div>
  );
}
