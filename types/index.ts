export type NumericVoteValue = 1 | 2 | 3 | 5 | 8 | 13 | 21;
export type VoteValue = NumericVoteValue | 'pass' | '?';

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
