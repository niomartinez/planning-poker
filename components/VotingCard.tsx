'use client';

import { VoteValue } from '@/types';
import { cn } from '@/lib/utils';
import { Coffee, HelpCircle } from 'lucide-react';

interface VotingCardProps {
  value: VoteValue;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export function VotingCard({ value, selected, onClick, disabled, compact }: VotingCardProps) {
  const renderValue = () => {
    if (value === 'pass') {
      return <Coffee className={compact ? "w-4 h-4 md:w-5 md:h-5" : "w-8 h-8"} style={{ color: '#161427' }} />;
    }
    if (value === '?') {
      return <HelpCircle className={compact ? "w-4 h-4 md:w-5 md:h-5" : "w-8 h-8"} style={{ color: '#161427' }} />;
    }
    return <span className={compact ? "text-xl md:text-2xl font-bold" : "text-4xl font-bold"} style={{ color: '#161427' }}>{value}</span>;
  };

  const getCardStyle = () => {
    if (value === 'pass') {
      return { background: 'linear-gradient(145deg, #FFB800 0%, #e6a600 100%)' };
    }
    if (value === '?') {
      return { background: 'linear-gradient(145deg, #33D4FF 0%, #1ab4e6 100%)' };
    }
    return {};
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={getCardStyle()}
      className={cn(
        'relative rounded-lg md:rounded-xl transition-all duration-200',
        'flex flex-col items-center justify-center',
        'poker-card',
        'hover:scale-105 active:scale-95',
        compact ? 'w-12 h-16 md:w-14 md:h-20 hover:-translate-y-1' : 'w-24 h-36 hover:-translate-y-2',
        selected && (compact ? 'scale-105 -translate-y-1' : 'scale-105 -translate-y-2'),
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0'
      )}
    >
      {selected && (
        <div className={cn(
          "absolute rounded-full ring-2 flex items-center justify-center",
          compact ? "-top-1.5 -right-1.5 w-5 h-5" : "-top-3 -right-3 w-8 h-8 ring-4"
        )}
        style={{
          background: 'linear-gradient(145deg, #1EE8A5 0%, #19c78d 100%)',
          ringColor: '#1EE8A5'
        }}>
          <span className={cn("font-bold", compact ? "text-xs" : "text-sm")} style={{ color: '#161427' }}>✓</span>
        </div>
      )}
      {!compact && (
        <>
          <div className="absolute top-2 left-2 text-xs font-bold" style={{ color: value === 'pass' || value === '?' ? '#161427' : '#625F82' }}>
            {value === 'pass' ? '☕' : value === '?' ? '?' : value}
          </div>
          <div className="absolute bottom-2 right-2 text-xs font-bold rotate-180" style={{ color: value === 'pass' || value === '?' ? '#161427' : '#625F82' }}>
            {value === 'pass' ? '☕' : value === '?' ? '?' : value}
          </div>
        </>
      )}
      {renderValue()}
    </button>
  );
}
