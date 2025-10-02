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
      return <Coffee className={compact ? "w-4 h-4 md:w-5 md:h-5 text-amber-700" : "w-8 h-8 text-amber-700"} />;
    }
    if (value === '?') {
      return <HelpCircle className={compact ? "w-4 h-4 md:w-5 md:h-5 text-blue-600" : "w-8 h-8 text-blue-600"} />;
    }
    return <span className={compact ? "text-xl md:text-2xl font-bold text-gray-800" : "text-4xl font-bold text-gray-800"}>{value}</span>;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative rounded-lg md:rounded-xl transition-all duration-200',
        'flex flex-col items-center justify-center',
        'poker-card',
        'hover:scale-105 active:scale-95',
        compact ? 'w-12 h-16 md:w-14 md:h-20 hover:-translate-y-1' : 'w-24 h-36 hover:-translate-y-2',
        selected && (compact ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-105 -translate-y-1' : 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105 -translate-y-2'),
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0'
      )}
    >
      {!compact && (
        <>
          <div className="absolute top-2 left-2 text-xs font-bold text-gray-600">
            {value === 'pass' ? '☕' : value === '?' ? '?' : value}
          </div>
          <div className="absolute bottom-2 right-2 text-xs font-bold text-gray-600 rotate-180">
            {value === 'pass' ? '☕' : value === '?' ? '?' : value}
          </div>
        </>
      )}
      {renderValue()}
      {selected && (
        <div className={cn(
          "absolute rounded-full flex items-center justify-center border-yellow-600 poker-chip",
          compact ? "-top-1.5 -right-1.5 w-5 h-5 border-2" : "-top-3 -right-3 w-8 h-8 border-4"
        )}>
          <span className={cn("text-primary-foreground font-bold", compact ? "text-xs" : "text-sm")}>✓</span>
        </div>
      )}
    </button>
  );
}
