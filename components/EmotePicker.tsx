'use client';

import { useState, useRef, useEffect } from 'react';
import { REACTION_EMOJIS } from '@/lib/emojis';
import { Button } from './ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmotePickerProps {
  onEmote: (emote: string) => void;
}

const RATE_LIMIT_WINDOW = 1000; // 1 second
const MAX_EMOTES_PER_WINDOW = 5;
const COOLDOWN_DURATION = 10000; // 10 seconds

export function EmotePicker({ onEmote }: EmotePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownProgress, setCooldownProgress] = useState(0);
  const emoteCounts = useRef<number[]>([]);
  const cooldownStartTime = useRef<number>(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Animate cooldown progress
  useEffect(() => {
    if (!isRateLimited) {
      setCooldownProgress(0);
      return;
    }

    cooldownStartTime.current = Date.now();
    setCooldownProgress(0);

    const interval = setInterval(() => {
      const elapsed = Date.now() - cooldownStartTime.current;
      const progress = Math.min((elapsed / COOLDOWN_DURATION) * 100, 100);
      setCooldownProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [isRateLimited]);

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
        setIsOpen(false); // Close picker when cooldown activates
        setTimeout(() => setIsRateLimited(false), COOLDOWN_DURATION);
      }
      return;
    }

    // Add current timestamp and send emote
    emoteCounts.current.push(now);
    onEmote(emote);
  };

  // Calculate SVG circle properties for cooldown animation
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cooldownProgress / 100) * circumference;

  return (
    <div className="relative inline-block">
      <Button
        ref={buttonRef}
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-6 w-6 md:h-7 md:w-7"
      >
        <Smile className="w-3 h-3 md:w-4 md:h-4" />
        {isRateLimited && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-primary"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
        )}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 z-20 bg-card border border-border rounded-md shadow-lg p-2 h-[90px] w-auto min-w-[200px]">
            <div className="flex flex-wrap gap-1">
              {REACTION_EMOJIS.map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleEmote(emote)}
                  disabled={isRateLimited}
                  className={cn(
                    "text-xl p-2 rounded min-w-[36px] min-h-[36px] flex items-center justify-center",
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
