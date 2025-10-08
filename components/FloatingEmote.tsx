'use client';

import { useEffect, useMemo } from 'react';

interface FloatingEmoteProps {
  emote: string;
  playerName: string;
  onComplete: () => void;
}

export function FloatingEmote({ emote, playerName, onComplete }: FloatingEmoteProps) {
  // Calculate position once on mount
  const style = useMemo<React.CSSProperties>(() => {
    const randomX = Math.random() * 80 + 10;
    return {
      left: `${randomX}%`,
      bottom: '10%',
    };
  }, []);

  useEffect(() => {
    // Auto-remove after animation completes
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div
      className="fixed z-50 animate-float-up pointer-events-none"
      style={style}
    >
      <div className="flex flex-col items-center gap-1 bg-card/90 backdrop-blur-sm border-2 border-primary/40 rounded-lg px-3 py-2 shadow-xl">
        <div className="text-4xl">{emote}</div>
        <div className="text-xs font-semibold text-foreground whitespace-nowrap">
          {playerName}
        </div>
      </div>
    </div>
  );
}
