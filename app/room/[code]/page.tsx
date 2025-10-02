'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { useGameStore } from '@/store/useGameStore';
import { VoteValue } from '@/types';
import { NameDialog } from '@/components/NameDialog';
import { VotingCard } from '@/components/VotingCard';
import { PokerTable } from '@/components/PokerTable';
import { EmotePicker } from '@/components/EmotePicker';
import { Results } from '@/components/Results';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, RotateCcw, Edit2, Copy, Check, ArrowLeft, Share2 } from 'lucide-react';

const VOTE_OPTIONS: VoteValue[] = [1, 2, 3, 5, 8, 13, 21, 'pass', '?'];

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.code as string).toUpperCase();

  const [showNameDialog, setShowNameDialog] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    currentPlayerId,
    currentPlayerName,
    currentPlayerEmoji,
    createRoom,
    joinRoom,
    setCurrentPlayer,
    castVote,
    sendEmote,
    revealVotes,
    resetVotes,
    getResults,
    getRoomState,
    updatePlayerName,
  } = useGameStore();

  const roomState = getRoomState(roomCode);
  const currentPlayer = roomState?.players.find((p) => p.id === currentPlayerId);
  const allVoted = roomState && roomState.players.length > 0 && roomState.players.every((p) => p.hasVoted);
  const results = roomState?.isRevealed ? getResults(roomCode) : { average: null, majority: null, distribution: {} };

  useEffect(() => {
    // Create room if it doesn't exist
    if (!roomState) {
      createRoom(roomCode);
    }

    // Show name dialog if player hasn't joined yet
    if (!currentPlayerId || !currentPlayer) {
      setShowNameDialog(true);
    }
  }, [roomState, currentPlayerId, currentPlayer, roomCode, createRoom]);

  const handleNameSubmit = (name: string, emoji: string) => {
    if (!currentPlayer) {
      // New player joining
      const playerId = joinRoom(roomCode, name, emoji);
      setCurrentPlayer(playerId, name, emoji);
    } else {
      // Existing player updating name
      updatePlayerName(roomCode, currentPlayerId!, name, emoji);
      setCurrentPlayer(currentPlayerId!, name, emoji);
    }
    setShowNameDialog(false);
    setEditingName(false);
  };

  const handleEmote = (emote: string) => {
    if (currentPlayerId) {
      sendEmote(roomCode, currentPlayerId, emote);
    }
  };

  const handleVote = (vote: VoteValue) => {
    if (currentPlayerId && roomState && !roomState.isRevealed) {
      castVote(roomCode, currentPlayerId, vote);
    }
  };

  const handleReveal = () => {
    if (allVoted) {
      revealVotes(roomCode);
    }
  };

  const handleReset = () => {
    resetVotes(roomCode);
  };

  const handleEditName = () => {
    setEditingName(true);
    setShowNameDialog(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    router.push('/');
  };

  if (!roomState) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Room Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Leave Room
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold text-primary drop-shadow-lg">
              Planning Poker
            </h1>
          </div>

          <Card className="p-4 bg-card/80 backdrop-blur border-2 border-primary/20 shadow-xl">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Room Code</p>
              <div className="flex gap-2">
                <code className="text-2xl font-bold font-mono tracking-wider bg-primary/20 text-primary px-4 py-2 rounded border-2 border-primary/40">
                  {roomCode}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                  className="shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Current Player Info */}
        {currentPlayer && (
          <Card className="p-4 bg-card/80 backdrop-blur border-2 border-primary/20 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 text-4xl flex items-center justify-center">
                  {currentPlayer.emoji}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Playing as</p>
                  <p className="text-xl font-semibold">{currentPlayer.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <EmotePicker onEmote={handleEmote} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditName}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Change
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Voting Cards */}
        {currentPlayer && !roomState.isRevealed && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-primary drop-shadow">Choose your card 👇</h2>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
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

        {/* Poker Table */}
        {roomState.players.length > 0 && (
          <div className="space-y-6">
            <PokerTable
              players={roomState.players}
              currentPlayerId={currentPlayerId}
              isRevealed={roomState.isRevealed}
              centerContent={
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-foreground/80">
                    {roomState.players.length} {roomState.players.length === 1 ? 'Player' : 'Players'}
                  </h3>
                  {!roomState.isRevealed && (
                    <p className="text-sm text-muted-foreground">
                      {allVoted ? 'All votes are in!' : 'Waiting for votes...'}
                    </p>
                  )}
                </div>
              }
            />
          </div>
        )}

        {/* Results */}
        {roomState.isRevealed && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center text-primary drop-shadow">🎯 Results</h2>
            <Results
              average={results.average}
              majority={results.majority}
              distribution={results.distribution}
            />
          </div>
        )}

        {/* Action Buttons */}
        {roomState.players.length > 0 && (
          <div className="flex justify-center gap-4">
            {!roomState.isRevealed ? (
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

        {/* Empty State */}
        {roomState.players.length === 0 && (
          <Card className="p-12 text-center bg-card/80 backdrop-blur border-2 border-dashed border-primary/40">
            <p className="text-xl font-semibold text-foreground mb-2">
              🎲 Table is empty
            </p>
            <p className="text-lg text-muted-foreground">
              Waiting for players to join...
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Share the room code or link with your team
            </p>
          </Card>
        )}
      </div>

      {/* Name Dialog */}
      <NameDialog
        open={showNameDialog}
        onSubmit={handleNameSubmit}
        currentName={editingName ? currentPlayer?.name : ''}
        currentEmoji={editingName ? currentPlayer?.emoji : undefined}
      />
    </main>
  );
}
