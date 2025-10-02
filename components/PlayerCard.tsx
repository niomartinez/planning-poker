'use client';

import { Player } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, Coffee, HelpCircle } from 'lucide-react';
import { EmotePicker } from './EmotePicker';

interface PlayerCardProps {
  player: Player;
  isRevealed: boolean;
  isCurrentPlayer: boolean;
  onEmote?: (emote: string) => void;
}

export function PlayerCard({ player, isRevealed, isCurrentPlayer, onEmote }: PlayerCardProps) {
  const renderVote = () => {
    if (!player.hasVoted) {
      return (
        <div className="w-8 h-12 md:w-10 md:h-14 rounded-md border border-dashed flex items-center justify-center" style={{ backgroundColor: '#322F54', borderColor: '#625F82' }}>
          <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" style={{ color: '#A8A6C2' }} />
        </div>
      );
    }

    if (!isRevealed) {
      return (
        <div className="w-8 h-12 md:w-10 md:h-14 poker-card rounded-md flex items-center justify-center border" style={{
          background: 'linear-gradient(145deg, rgba(51, 212, 255, 0.25) 0%, rgba(51, 212, 255, 0.15) 100%)',
          borderColor: 'rgba(51, 212, 255, 0.4)'
        }}>
          <span className="text-lg md:text-xl font-bold" style={{ color: '#33D4FF' }}>?</span>
        </div>
      );
    }

    if (player.vote === 'pass') {
      return (
        <div className="w-8 h-12 md:w-10 md:h-14 poker-card rounded-md flex items-center justify-center" style={{
          background: 'linear-gradient(145deg, #FFB800 0%, #e6a600 100%)'
        }}>
          <Coffee className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#161427' }} />
        </div>
      );
    }

    if (player.vote === '?') {
      return (
        <div className="w-8 h-12 md:w-10 md:h-14 poker-card rounded-md flex items-center justify-center" style={{
          background: 'linear-gradient(145deg, #33D4FF 0%, #1ab4e6 100%)'
        }}>
          <HelpCircle className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#161427' }} />
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
      {/* Emote Picker - only for current player */}
      {isCurrentPlayer && onEmote && (
        <div className="absolute -top-2 -right-2 z-20">
          <EmotePicker onEmote={onEmote} />
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
