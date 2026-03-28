"use client";

import type { ReactNode } from "react";

export function TerminalBlock({ title = "terminal", children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-secondary via-secondary to-secondary/50 rounded-2xl overflow-hidden shadow-2xl border border-border/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-background/30">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-sm text-muted-foreground">{title}</span>
      </div>
      <pre className="p-4 sm:p-6 text-xs sm:text-sm overflow-x-auto">
        {children}
      </pre>
    </div>
  );
}
