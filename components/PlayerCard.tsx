'use client';

import { Player } from '@/types';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, Coffee, HelpCircle, User } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isRevealed: boolean;
  isCurrentPlayer: boolean;
}

export function PlayerCard({ player, isRevealed, isCurrentPlayer }: PlayerCardProps) {
  const renderVote = () => {
    if (!player.hasVoted) {
      return <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />;
    }

    if (!isRevealed) {
      return (
        <div className="w-12 h-16 bg-primary/20 border-2 border-primary rounded-lg flex items-center justify-center">
          <span className="text-2xl">🃏</span>
        </div>
      );
    }

    if (player.vote === 'pass') {
      return (
        <div className="w-12 h-16 bg-card border-2 border-border rounded-lg flex items-center justify-center">
          <Coffee className="w-6 h-6" />
        </div>
      );
    }

    if (player.vote === '?') {
      return (
        <div className="w-12 h-16 bg-card border-2 border-border rounded-lg flex items-center justify-center">
          <HelpCircle className="w-6 h-6" />
        </div>
      );
    }

    return (
      <div className="w-12 h-16 bg-primary border-2 border-primary rounded-lg flex items-center justify-center">
        <span className="text-xl font-bold text-primary-foreground">{player.vote}</span>
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'p-4 flex flex-col items-center gap-3 transition-all',
        isCurrentPlayer && 'ring-2 ring-primary'
      )}
    >
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <User className="w-5 h-5" />
      </div>
      <div className="text-sm font-medium text-center truncate max-w-full">
        {player.name}
      </div>
      {renderVote()}
    </Card>
  );
}
