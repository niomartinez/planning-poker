export type NumericVoteValue = 1 | 2 | 3 | 5 | 8 | 13 | 21;
export type VoteValue = NumericVoteValue | 'pass' | '?';

export interface Player {
  id: string;
  name: string;
  vote: VoteValue | null;
  hasVoted: boolean;
  emoji: string;
  currentEmote?: string | null;
  emoteTimestamp?: number | null;
}

export interface RoomState {
  players: Player[];
  isRevealed: boolean;
}

export interface GameState {
  rooms: Record<string, RoomState>;
  currentPlayerId: string | null;
  currentPlayerName: string | null;
}
