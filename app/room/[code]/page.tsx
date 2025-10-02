'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { usePartyRoom } from '@/hooks/usePartyRoom';
import { VoteValue, NumericVoteValue } from '@/types';
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
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState<string | null>(null);
  const [currentPlayerEmoji, setCurrentPlayerEmoji] = useState<string | null>(null);

  const { roomState, sendMessage } = usePartyRoom(roomCode);

  const currentPlayer = roomState?.players.find((p) => p.id === currentPlayerId);
  const allVoted = roomState && roomState.players.length > 0 && roomState.players.every((p) => p.hasVoted);

  // Calculate results
  const getResults = () => {
    if (!roomState?.isRevealed) {
      return { average: null, majority: null, distribution: {} };
    }

    const votes = roomState.players.map((p) => p.vote).filter((v): v is VoteValue => v !== null);
    const numericVotes = votes.filter((v): v is NumericVoteValue => typeof v === 'number');

    const distribution = votes.reduce((acc, vote) => {
      const key = String(vote);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const average = numericVotes.length > 0
      ? numericVotes.reduce((sum, v) => sum + v, 0) / numericVotes.length
      : null;

    const majorityEntry = Object.entries(distribution).sort(([, a], [, b]) => b - a)[0];
    const majority = majorityEntry ? majorityEntry[0] : null;

    return { average, majority, distribution };
  };

  const results = getResults();

  useEffect(() => {
    // Load player info from localStorage
    const savedPlayerId = localStorage.getItem(`player_${roomCode}_id`);
    const savedPlayerName = localStorage.getItem(`player_${roomCode}_name`);
    const savedPlayerEmoji = localStorage.getItem(`player_${roomCode}_emoji`);

    if (savedPlayerId && savedPlayerName && savedPlayerEmoji) {
      setCurrentPlayerId(savedPlayerId);
      setCurrentPlayerName(savedPlayerName);
      setCurrentPlayerEmoji(savedPlayerEmoji);
    } else {
      setShowNameDialog(true);
    }
  }, [roomCode]);

  useEffect(() => {
    // Auto-join room when player info is available but not in room
    if (currentPlayerId && currentPlayerName && currentPlayerEmoji && roomState) {
      const playerInRoom = roomState.players.find((p) => p.id === currentPlayerId);
      if (!playerInRoom) {
        sendMessage({
          type: 'join',
          player: {
            id: currentPlayerId,
            name: currentPlayerName,
            emoji: currentPlayerEmoji,
            vote: null,
            hasVoted: false,
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerId, currentPlayerName, currentPlayerEmoji, roomState]);

  useEffect(() => {
    // Show name dialog if player hasn't set their info
    if (!currentPlayerId && roomState) {
      setShowNameDialog(true);
    }
  }, [currentPlayerId, roomState]);

  const handleNameSubmit = (name: string, emoji: string) => {
    if (!currentPlayer) {
      // New player joining
      const playerId = crypto.randomUUID();

      // Save to localStorage
      localStorage.setItem(`player_${roomCode}_id`, playerId);
      localStorage.setItem(`player_${roomCode}_name`, name);
      localStorage.setItem(`player_${roomCode}_emoji`, emoji);

      setCurrentPlayerId(playerId);
      setCurrentPlayerName(name);
      setCurrentPlayerEmoji(emoji);

      // Send join message to server
      sendMessage({
        type: 'join',
        player: {
          id: playerId,
          name,
          emoji,
          vote: null,
          hasVoted: false,
        },
      });
    } else {
      // Existing player updating name
      localStorage.setItem(`player_${roomCode}_name`, name);
      localStorage.setItem(`player_${roomCode}_emoji`, emoji);

      setCurrentPlayerName(name);
      setCurrentPlayerEmoji(emoji);

      sendMessage({
        type: 'updateName',
        playerId: currentPlayerId,
        name,
        emoji,
      });
    }
    setShowNameDialog(false);
    setEditingName(false);
  };

  const handleEmote = (emote: string) => {
    if (currentPlayerId) {
      sendMessage({
        type: 'emote',
        playerId: currentPlayerId,
        emote,
      });
    }
  };

  const handleVote = (vote: VoteValue) => {
    if (currentPlayerId && roomState && !roomState.isRevealed) {
      sendMessage({
        type: 'vote',
        playerId: currentPlayerId,
        vote,
      });
    }
  };

  const handleReveal = () => {
    if (allVoted) {
      sendMessage({ type: 'reveal' });
    }
  };

  const handleReset = () => {
    sendMessage({ type: 'reset' });
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
    if (currentPlayerId) {
      sendMessage({
        type: 'leave',
        playerId: currentPlayerId,
      });
    }
    router.push('/');
  };

  if (!roomState) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-xl font-semibold">Connecting to room...</p>
        </Card>
      </main>
    );
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
