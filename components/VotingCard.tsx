'use client';

import { VoteValue } from '@/types';
import { cn } from '@/lib/utils';
import { Coffee, HelpCircle } from 'lucide-react';

interface VotingCardProps {
  value: VoteValue;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VotingCard({ value, selected, onClick, disabled }: VotingCardProps) {
  const renderValue = () => {
    if (value === 'pass') {
      return <Coffee className="w-8 h-8" />;
    }
    if (value === '?') {
      return <HelpCircle className="w-8 h-8" />;
    }
    return <span className="text-3xl font-bold">{value}</span>;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-20 h-28 rounded-xl border-2 transition-all duration-200',
        'flex items-center justify-center',
        'hover:scale-105 hover:shadow-lg active:scale-95',
        selected
          ? 'bg-primary border-primary text-primary-foreground shadow-xl scale-105'
          : 'bg-card border-border hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
    >
      {renderValue()}
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground text-xs">✓</span>
        </div>
      )}
    </button>
  );
}
