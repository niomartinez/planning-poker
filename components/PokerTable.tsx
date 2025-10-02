'use client';

import { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import { ReactNode } from 'react';

interface PokerTableProps {
  players: Player[];
  currentPlayerId: string | null;
  isRevealed: boolean;
  centerContent?: ReactNode;
}

export function PokerTable({ players, currentPlayerId, isRevealed, centerContent }: PokerTableProps) {
  // Calculate position for each player around the ellipse
  const getPlayerPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radiusX = 45; // Horizontal radius percentage
    const radiusY = 35; // Vertical radius percentage

    const x = 50 + radiusX * Math.cos(angle);
    const y = 50 + radiusY * Math.sin(angle);

    return { x, y };
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto" style={{ aspectRatio: '16 / 10' }}>
      {/* Poker Table */}
      <div className="poker-table">
        {/* Center content area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 flex items-center justify-center">
          {centerContent}
        </div>

        {/* Players positioned around the table */}
        {players.map((player, index) => {
          const { x, y } = getPlayerPosition(index, players.length);

          return (
            <div
              key={player.id}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <PlayerCard
                player={player}
                isRevealed={isRevealed}
                isCurrentPlayer={player.id === currentPlayerId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
