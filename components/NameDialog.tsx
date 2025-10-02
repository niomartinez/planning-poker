'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
  currentName?: string;
}

export function NameDialog({ open, onSubmit, currentName = '' }: NameDialogProps) {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl">Join Planning Poker</DialogTitle>
          <DialogDescription>
            Enter your name to start voting
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="text-lg"
          />
          <Button type="submit" className="w-full" disabled={!name.trim()}>
            Enter Room
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
