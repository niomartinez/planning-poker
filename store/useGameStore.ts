import { create } from 'zustand';
import { Player, VoteValue, NumericVoteValue, GameState } from '@/types';

interface GameStore extends GameState {
  addPlayer: (name: string) => string;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  setCurrentPlayer: (id: string) => void;
  castVote: (playerId: string, vote: VoteValue) => void;
  revealVotes: () => void;
  resetVotes: () => void;
  getResults: () => {
    average: number | null;
    majority: VoteValue | null;
    distribution: Record<string, number>;
  };
}

const generateId = () => Math.random().toString(36).substring(7);

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  isRevealed: false,
  currentPlayerId: null,

  addPlayer: (name: string) => {
    const id = generateId();
    set((state) => ({
      players: [...state.players, { id, name, vote: null, hasVoted: false }],
    }));
    return id;
  },

  removePlayer: (id: string) =>
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
    })),

  updatePlayerName: (id: string, name: string) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === id ? { ...p, name } : p
      ),
    })),

  setCurrentPlayer: (id: string) =>
    set({ currentPlayerId: id }),

  castVote: (playerId: string, vote: VoteValue) =>
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, vote, hasVoted: true } : p
      ),
    })),

  revealVotes: () => set({ isRevealed: true }),

  resetVotes: () =>
    set((state) => ({
      players: state.players.map((p) => ({ ...p, vote: null, hasVoted: false })),
      isRevealed: false,
    })),

  getResults: () => {
    const { players } = get();
    const votes = players.map((p) => p.vote).filter((v): v is VoteValue => v !== null);
    const numericVotes = votes.filter((v): v is NumericVoteValue => typeof v === 'number');

    const distribution: Record<string, number> = {};
    players.forEach((p) => {
      if (p.vote !== null) {
        const key = String(p.vote);
        distribution[key] = (distribution[key] || 0) + 1;
      }
    });

    const average =
      numericVotes.length > 0
        ? numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
        : null;

    let majority: VoteValue | null = null;
    let maxCount = 0;
    Object.entries(distribution).forEach(([vote, count]) => {
      if (count > maxCount) {
        maxCount = count;
        majority = vote === 'pass' || vote === '?' ? vote : Number(vote) as VoteValue;
      }
    });

    return { average, majority, distribution };
  },
}));
