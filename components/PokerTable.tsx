'use client';

import { Player } from '@/types';
import { PlayerCard } from './PlayerCard';
import { ReactNode } from 'react';

interface PokerTableProps {
  players: Player[];
  currentPlayerId: string | null;
  isRevealed: boolean;
  centerContent?: ReactNode;
  onEmote?: (emote: string) => void;
}

export function PokerTable({ players, currentPlayerId, isRevealed, centerContent, onEmote }: PokerTableProps) {
  const total = players.length;

  // Calculate dynamic table dimensions
  // Width expands as players 1-20 are added
  // Height expands as players 21-40 are added
  const getTableDimensions = () => {
    if (total <= 1) {
      return { width: '300px', height: '300px' };
    } else if (total <= 20) {
      const widthProgress = Math.min(total / 20, 1);
      const width = 300 + widthProgress * 700; // 300px to 1000px
      return { width: `${width}px`, height: '300px' };
    } else {
      const heightProgress = Math.min((total - 20) / 20, 1);
      const height = 300 + heightProgress * 300; // 300px to 600px
      return { width: '1000px', height: `${height}px` };
    }
  };

  // Calculate position for each player on the rectangular table
  const getPlayerPosition = (index: number, total: number) => {
    // Strategy: Fill top and bottom first (up to 20 players, 10 each)
    // Then use left and right sides for players 21-40

    const maxHorizontal = 10; // Max players per horizontal side
    let side, sideIndex, sideTotal;

    if (total <= 20) {
      // Only use top and bottom
      if (index < Math.ceil(total / 2)) {
        // Top side
        side = 0;
        sideIndex = index;
        sideTotal = Math.ceil(total / 2);
      } else {
        // Bottom side
        side = 2;
        sideIndex = index - Math.ceil(total / 2);
        sideTotal = total - Math.ceil(total / 2);
      }
    } else {
      // Use all 4 sides
      const topCount = maxHorizontal;
      const bottomCount = maxHorizontal;
      const sidePlayersCount = total - 20;
      const rightCount = Math.ceil(sidePlayersCount / 2);
      const leftCount = sidePlayersCount - rightCount;

      if (index < topCount) {
        side = 0; // top
        sideIndex = index;
        sideTotal = topCount;
      } else if (index < topCount + bottomCount) {
        side = 2; // bottom
        sideIndex = index - topCount;
        sideTotal = bottomCount;
      } else if (index < topCount + bottomCount + rightCount) {
        side = 1; // right
        sideIndex = index - topCount - bottomCount;
        sideTotal = rightCount;
      } else {
        side = 3; // left
        sideIndex = index - topCount - bottomCount - rightCount;
        sideTotal = leftCount;
      }
    }

    // Safe zone to avoid corners
    const horizontalSafeStart = 15;
    const horizontalSafeEnd = 85;
    const verticalSafeStart = 10;
    const verticalSafeEnd = 90;

    let x, y;

    if (side === 0) {
      // Top side
      const spacing = (horizontalSafeEnd - horizontalSafeStart) / Math.max(sideTotal - 1, 1);
      x = horizontalSafeStart + sideIndex * spacing;
      y = 5;
    } else if (side === 1) {
      // Right side - zigzag pattern pushing OUTWARD
      const spacing = (verticalSafeEnd - verticalSafeStart) / Math.max(sideTotal - 1, 1);
      const zigzagOffset = (sideIndex % 2) * 8; // Increased offset for outer column
      x = 95 + zigzagOffset; // + pushes to the right (outward)
      y = verticalSafeStart + sideIndex * spacing;
    } else if (side === 2) {
      // Bottom side
      const spacing = (horizontalSafeEnd - horizontalSafeStart) / Math.max(sideTotal - 1, 1);
      x = horizontalSafeStart + sideIndex * spacing;
      y = 95;
    } else {
      // Left side - zigzag pattern pushing OUTWARD
      const spacing = (verticalSafeEnd - verticalSafeStart) / Math.max(sideTotal - 1, 1);
      const zigzagOffset = (sideIndex % 2) * 8; // Increased offset for outer column
      x = 5 - zigzagOffset; // - pushes to the left (outward)
      y = verticalSafeStart + sideIndex * spacing;
    }

    return { x, y };
  };

  const tableDimensions = getTableDimensions();

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div
        className="relative transition-all duration-500 ease-in-out"
        style={{
          width: tableDimensions.width,
          height: tableDimensions.height,
          maxWidth: '100%'
        }}
      >
        {/* Poker Table */}
        <div className="poker-table w-full h-full">
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
                  onEmote={player.id === currentPlayerId ? onEmote : undefined}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
