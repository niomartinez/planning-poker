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
        <div className="w-8 h-12 md:w-10 md:h-14 rounded-md bg-muted/40 border border-dashed border-muted-foreground/30 flex items-center justify-center">
          <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin text-muted-foreground/70" />
        </div>
      );
    }

    if (!isRevealed) {
      return (
        <div className="w-8 h-12 md:w-10 md:h-14 poker-card rounded-md flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/20 border border-primary/40">
          <span className="text-lg md:text-xl">🂠</span>
        </div>
      );
    }

    if (player.vote === 'pass') {
      return (
        <div className="w-8 h-12 md:w-10 md:h-14 poker-card rounded-md flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100">
          <Coffee className="w-4 h-4 md:w-5 md:h-5 text-amber-700" />
        </div>
      );
    }

    if (player.vote === '?') {
      return (
        <div className="w-8 h-12 md:w-10 md:h-14 poker-card rounded-md flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
          <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
        </div>
      );
    }

    return (
      <div className="w-8 h-12 md:w-10 md:h-14 poker-card rounded-md flex items-center justify-center">
        <span className="text-sm md:text-lg font-bold text-gray-800">{player.vote}</span>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1 p-1.5 md:p-2 rounded-lg transition-all',
        'bg-card/80 backdrop-blur-sm border',
        isCurrentPlayer ? 'border-primary shadow-md shadow-primary/20' : 'border-border/50'
      )}
    >
      {/* Emote display */}
      {player.currentEmote && (
        <div className="absolute -top-5 md:-top-6 left-1/2 -translate-x-1/2 text-2xl md:text-3xl animate-bounce z-10">
          {player.currentEmote}
        </div>
      )}

      {/* Avatar */}
      <div className="relative w-8 h-8 md:w-10 md:h-10 text-2xl md:text-3xl flex items-center justify-center">
        {player.emoji}
        {isCurrentPlayer && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full border border-card" />
        )}
      </div>

      {/* Name */}
      <div className="text-[10px] md:text-xs font-semibold text-center truncate max-w-full px-1">
        {player.name}
      </div>

      {/* Vote */}
      {renderVote()}
    </div>
  );
}
