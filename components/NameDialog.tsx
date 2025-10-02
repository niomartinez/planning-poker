'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AVATAR_EMOJIS } from '@/lib/emojis';
import { cn } from '@/lib/utils';

interface NameDialogProps {
  open: boolean;
  onSubmit: (name: string, emoji: string) => void;
  onCancel?: () => void;
  currentName?: string;
  currentEmoji?: string;
}

export function NameDialog({ open, onSubmit, onCancel, currentName = '', currentEmoji = '😀' }: NameDialogProps) {
  const [name, setName] = useState(currentName);
  const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      let finalName = name.trim();
      // Easter egg: Ben -> Benjamin
      if (finalName.toLowerCase() === 'ben') {
        finalName = 'Benjamin';
      }
      onSubmit(finalName, selectedEmoji);
      setName('');
      setSelectedEmoji('😀');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Join Planning Poker</DialogTitle>
          <DialogDescription>
            Choose your avatar and enter your name
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose your avatar</label>
            <div className="grid grid-cols-8 gap-2 p-4 bg-secondary/30 rounded-lg max-h-48 overflow-y-auto">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={cn(
                    'text-3xl p-2 rounded-lg hover:bg-primary/20 transition-colors',
                    selectedEmoji === emoji && 'bg-primary/40 ring-2 ring-primary'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your name</label>
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="text-lg"
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={!name.trim()}>
            <span className="text-2xl mr-2">{selectedEmoji}</span>
            Enter Room
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
