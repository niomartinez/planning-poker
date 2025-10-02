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
      return <Coffee className="w-8 h-8 text-amber-700" />;
    }
    if (value === '?') {
      return <HelpCircle className="w-8 h-8 text-blue-600" />;
    }
    return <span className="text-4xl font-bold text-gray-800">{value}</span>;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative w-24 h-36 rounded-xl transition-all duration-200',
        'flex flex-col items-center justify-center',
        'poker-card',
        'hover:scale-105 hover:-translate-y-2 active:scale-95',
        selected && 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105 -translate-y-2',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 hover:translate-y-0'
      )}
    >
      <div className="absolute top-2 left-2 text-xs font-bold text-gray-600">
        {value === 'pass' ? '☕' : value === '?' ? '?' : value}
      </div>
      <div className="absolute bottom-2 right-2 text-xs font-bold text-gray-600 rotate-180">
        {value === 'pass' ? '☕' : value === '?' ? '?' : value}
      </div>
      {renderValue()}
      {selected && (
        <div className="absolute -top-3 -right-3 w-8 h-8 poker-chip rounded-full flex items-center justify-center border-4 border-yellow-600">
          <span className="text-primary-foreground text-sm font-bold">✓</span>
        </div>
      )}
    </button>
  );
}
