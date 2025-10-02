'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { usePartyRoom } from '@/hooks/usePartyRoom';
import { VoteValue, NumericVoteValue } from '@/types';
import { NameDialog } from '@/components/NameDialog';
import { VotingCard } from '@/components/VotingCard';
import { PokerTable } from '@/components/PokerTable';
import { Results } from '@/components/Results';
import { FloatingEmote } from '@/components/FloatingEmote';
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
  const [floatingEmotes, setFloatingEmotes] = useState<Array<{ id: string; emote: string; playerName: string }>>([]);

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

  // Watch for emotes from all players
  useEffect(() => {
    if (!roomState) return;

    roomState.players.forEach((player) => {
      if (player.currentEmote) {
        // Check if we already have this emote displayed
        const emoteId = `${player.id}-${player.currentEmote}-${Date.now()}`;
        const exists = floatingEmotes.some((e) => e.playerName === player.name && e.emote === player.currentEmote);

        if (!exists) {
          setFloatingEmotes((prev) => [
            ...prev,
            { id: emoteId, emote: player.currentEmote!, playerName: player.name },
          ]);
        }
      }
    });
  }, [roomState, floatingEmotes]);

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
    sendMessage({ type: 'reveal' });
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
    <main className="h-screen bg-background overflow-hidden flex flex-col p-2 md:p-3">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex justify-between items-center gap-2 shrink-0 relative z-30 mb-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveRoom}
              className="h-8 px-2"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
              <span className="hidden md:inline text-xs">Leave</span>
            </Button>
            <h1 className="text-lg md:text-2xl font-bold text-primary">Planning Poker</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Current Player Info - Inline */}
            {currentPlayer && (
              <div className="flex items-center gap-2 bg-card/80 border border-primary/20 rounded-lg px-2 py-1">
                <div className="text-xl md:text-2xl">{currentPlayer.emoji}</div>
                <span className="text-xs md:text-sm font-semibold hidden sm:inline">{currentPlayer.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditName}
                  className="h-7 w-7 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            )}

            {/* Room Code */}
            <div className="flex items-center gap-1 bg-card/80 border border-primary/20 rounded-lg px-2 py-1">
              <code className="text-sm md:text-lg font-bold font-mono text-primary">
                {roomCode}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-7 w-7 p-0"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="h-7 w-7 p-0"
              >
                <Share2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col justify-center items-center min-h-0">

          {/* Poker Table */}
          {roomState.players.length > 0 ? (
            <div className="w-full flex-1 flex items-center justify-center">
              <div className="w-full max-w-4xl" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                <PokerTable
                  players={roomState.players}
                  currentPlayerId={currentPlayerId}
                  isRevealed={roomState.isRevealed}
                  onEmote={handleEmote}
                  centerContent={
                    <div className="text-center">
                      {roomState.isRevealed ? (
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground mb-1">Results</div>
                          {results.average !== null && (
                            <div className="text-2xl md:text-3xl font-bold text-primary">
                              Avg: {results.average.toFixed(1)}
                            </div>
                          )}
                          {results.majority && (
                            <div className="text-lg md:text-xl text-foreground/80">
                              Most: {results.majority}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-lg md:text-xl font-bold text-foreground/80">
                            {roomState.players.length} {roomState.players.length === 1 ? 'Player' : 'Players'}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {allVoted ? 'Ready!' : 'Waiting...'}
                          </p>
                        </div>
                      )}
                    </div>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-semibold text-foreground mb-1">🎲 Waiting for players</p>
                <p className="text-xs text-muted-foreground">Share the room code</p>
              </div>
            </div>
          )}

          {/* Voting Cards + Action Button */}
          <div className="shrink-0 space-y-2 mt-4">
            {currentPlayer && !roomState.isRevealed && (
              <div className="flex flex-wrap justify-center gap-1.5 md:gap-2">
                {VOTE_OPTIONS.map((value) => (
                  <VotingCard
                    key={value}
                    value={value}
                    selected={currentPlayer.vote === value}
                    onClick={() => handleVote(value)}
                    compact
                  />
                ))}
              </div>
            )}

            {/* Action Button */}
            {roomState.players.length > 0 && (
              <div className="flex justify-center relative z-50">
                {!roomState.isRevealed ? (
                  <Button
                    onClick={handleReveal}
                    size="sm"
                    className="gap-1.5 h-8 pointer-events-auto cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Reveal {!allVoted && '(Some pending)'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleReset}
                    size="sm"
                    className="gap-1.5 h-8 pointer-events-auto cursor-pointer"
                    variant="secondary"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    New Round
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name Dialog */}
      <NameDialog
        open={showNameDialog}
        onSubmit={handleNameSubmit}
        onCancel={() => {
          setShowNameDialog(false);
          setEditingName(false);
        }}
        currentName={editingName ? currentPlayer?.name : ''}
        currentEmoji={editingName ? currentPlayer?.emoji : undefined}
      />

      {/* Floating Emotes */}
      {floatingEmotes.map((emote) => (
        <FloatingEmote
          key={emote.id}
          emote={emote.emote}
          playerName={emote.playerName}
          onComplete={() => {
            setFloatingEmotes((prev) => prev.filter((e) => e.id !== emote.id));
          }}
        />
      ))}
    </main>
  );
}
