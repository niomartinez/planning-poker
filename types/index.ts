export type VoteValue = 1 | 2 | 3 | 5 | 8 | 13 | 21 | 'pass' | '?';

export interface Player {
  id: string;
  name: string;
  vote: VoteValue | null;
  hasVoted: boolean;
}

export interface GameState {
  players: Player[];
  isRevealed: boolean;
  currentPlayerId: string | null;
}
