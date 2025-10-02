'use client';

import { useState } from 'react';
import { REACTION_EMOJIS } from '@/lib/emojis';
import { Button } from './ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmotePickerProps {
  onEmote: (emote: string) => void;
}

export function EmotePicker({ onEmote }: EmotePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmote = (emote: string) => {
    onEmote(emote);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Smile className="w-5 h-5" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 z-20 bg-card border-2 border-border rounded-lg shadow-xl p-2">
            <div className="grid grid-cols-6 gap-1">
              {REACTION_EMOJIS.map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleEmote(emote)}
                  className="text-2xl p-2 rounded hover:bg-primary/20 transition-colors"
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
