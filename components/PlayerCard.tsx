'use client';

import { Player } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, Coffee, HelpCircle } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isRevealed: boolean;
  isCurrentPlayer: boolean;
}

export function PlayerCard({ player, isRevealed, isCurrentPlayer }: PlayerCardProps) {
  const renderVote = () => {
    if (!player.hasVoted) {
      return (
        <div className="w-14 h-20 rounded-lg bg-secondary/50 border-2 border-dashed border-muted flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (!isRevealed) {
      return (
        <div className="w-14 h-20 poker-card rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300">
          <span className="text-3xl">🂠</span>
        </div>
      );
    }

    if (player.vote === 'pass') {
      return (
        <div className="w-14 h-20 poker-card rounded-lg flex items-center justify-center">
          <Coffee className="w-7 h-7 text-amber-700" />
        </div>
      );
    }

    if (player.vote === '?') {
      return (
        <div className="w-14 h-20 poker-card rounded-lg flex items-center justify-center">
          <HelpCircle className="w-7 h-7 text-blue-600" />
        </div>
      );
    }

    return (
      <div className="w-14 h-20 poker-card rounded-lg flex items-center justify-center relative">
        <div className="absolute top-1 left-1 text-xs font-bold text-gray-600">{player.vote}</div>
        <span className="text-2xl font-bold text-gray-800">{player.vote}</span>
        <div className="absolute bottom-1 right-1 text-xs font-bold text-gray-600 rotate-180">{player.vote}</div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
        'bg-card/80 backdrop-blur-sm border-2',
        isCurrentPlayer ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/50'
      )}
    >
      {/* Emote display */}
      {player.currentEmote && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl animate-bounce z-10">
          {player.currentEmote}
        </div>
      )}

      {/* Avatar */}
      <div className="relative w-16 h-16 text-5xl flex items-center justify-center">
        {player.emoji}
        {isCurrentPlayer && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-card" />
        )}
      </div>

      {/* Name */}
      <div className="text-sm font-semibold text-center truncate max-w-full px-2">
        {player.name}
      </div>

      {/* Vote */}
      {renderVote()}
    </div>
  );
}
