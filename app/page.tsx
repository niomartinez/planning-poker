'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { VoteValue } from '@/types';
import { NameDialog } from '@/components/NameDialog';
import { VotingCard } from '@/components/VotingCard';
import { PlayerCard } from '@/components/PlayerCard';
import { Results } from '@/components/Results';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, RotateCcw, Edit2 } from 'lucide-react';

const VOTE_OPTIONS: VoteValue[] = [1, 2, 3, 5, 8, 13, 21, 'pass', '?'];

export default function Home() {
  const [showNameDialog, setShowNameDialog] = useState(true);
  const [editingName, setEditingName] = useState(false);

  const {
    players,
    isRevealed,
    currentPlayerId,
    addPlayer,
    setCurrentPlayer,
    castVote,
    revealVotes,
    resetVotes,
    getResults,
    updatePlayerName,
  } = useGameStore();

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const allVoted = players.length > 0 && players.every((p) => p.hasVoted);
  const results = isRevealed ? getResults() : { average: null, majority: null, distribution: {} };

  const handleNameSubmit = (name: string) => {
    if (!currentPlayerId) {
      const id = addPlayer(name);
      setCurrentPlayer(id);
    } else {
      updatePlayerName(currentPlayerId, name);
    }
    setShowNameDialog(false);
    setEditingName(false);
  };

  const handleVote = (vote: VoteValue) => {
    if (currentPlayerId && !isRevealed) {
      castVote(currentPlayerId, vote);
    }
  };

  const handleReveal = () => {
    if (allVoted) {
      revealVotes();
    }
  };

  const handleReset = () => {
    resetVotes();
  };

  const handleEditName = () => {
    setEditingName(true);
    setShowNameDialog(true);
  };

  useEffect(() => {
    if (!currentPlayerId && players.length === 0) {
      setShowNameDialog(true);
    }
  }, [currentPlayerId, players.length]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
            Planning Poker
          </h1>
          <p className="text-muted-foreground text-lg">
            Agile Estimation Made Simple
          </p>
        </div>

        {/* Current Player Info */}
        {currentPlayer && (
          <Card className="p-4 bg-card/50 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Playing as</p>
                <p className="text-xl font-semibold">{currentPlayer.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditName}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Change Name
              </Button>
            </div>
          </Card>
        )}

        {/* Voting Cards */}
        {currentPlayer && !isRevealed && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center">Cast Your Vote</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {VOTE_OPTIONS.map((value) => (
                <VotingCard
                  key={value}
                  value={value}
                  selected={currentPlayer.vote === value}
                  onClick={() => handleVote(value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Players Grid */}
        {players.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center">
              Players ({players.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {players.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isRevealed={isRevealed}
                  isCurrentPlayer={player.id === currentPlayerId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isRevealed && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center">Results</h2>
            <Results
              average={results.average}
              majority={results.majority}
              distribution={results.distribution}
            />
          </div>
        )}

        {/* Action Buttons */}
        {players.length > 0 && (
          <div className="flex justify-center gap-4">
            {!isRevealed ? (
              <Button
                onClick={handleReveal}
                disabled={!allVoted}
                size="lg"
                className="gap-2"
              >
                <Eye className="w-5 h-5" />
                Reveal Votes
              </Button>
            ) : (
              <Button
                onClick={handleReset}
                size="lg"
                className="gap-2"
                variant="secondary"
              >
                <RotateCcw className="w-5 h-5" />
                New Round
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Name Dialog */}
      <NameDialog
        open={showNameDialog}
        onSubmit={handleNameSubmit}
        currentName={editingName ? currentPlayer?.name : ''}
      />
    </main>
  );
}
