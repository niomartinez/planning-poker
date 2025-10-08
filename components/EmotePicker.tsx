'use client';

import { useState, useRef } from 'react';
import { REACTION_EMOJIS } from '@/lib/emojis';
import { Button } from './ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmotePickerProps {
  onEmote: (emote: string) => void;
}

const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_EMOTES_PER_WINDOW = 5;

export function EmotePicker({ onEmote }: EmotePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const emoteCounts = useRef<number[]>([]);

  const handleEmote = (emote: string) => {
    const now = Date.now();

    // Clean up old timestamps outside the window
    emoteCounts.current = emoteCounts.current.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW
    );

    // Check if rate limited
    if (emoteCounts.current.length >= MAX_EMOTES_PER_WINDOW) {
      if (!isRateLimited) {
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), 10000); // 10 second cooldown
      }
      return;
    }

    // Add current timestamp and send emote
    emoteCounts.current.push(now);
    onEmote(emote);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-6 w-6 md:h-7 md:w-7"
      >
        <Smile className="w-3 h-3 md:w-4 md:h-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 z-20 bg-card border-2 border-border rounded-lg shadow-xl p-3">
            {isRateLimited && (
              <div className="text-xs text-destructive font-semibold mb-2 text-center">
                Cooldown active (10s)
              </div>
            )}
            <div className="grid grid-cols-4 gap-2">
              {REACTION_EMOJIS.map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleEmote(emote)}
                  disabled={isRateLimited}
                  className={cn(
                    "text-3xl p-2 rounded transition-colors w-12 h-12 flex items-center justify-center",
                    isRateLimited
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary/20"
                  )}
                >
                  {emote}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
