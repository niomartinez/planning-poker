import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player, VoteValue, NumericVoteValue, GameState, RoomState } from '@/types';

interface GameStore extends GameState {
  currentPlayerEmoji: string | null;
  createRoom: (roomCode: string) => void;
  joinRoom: (roomCode: string, playerName: string, emoji: string) => string;
  leaveRoom: (roomCode: string, playerId: string) => void;
  updatePlayerName: (roomCode: string, playerId: string, name: string, emoji: string) => void;
  setCurrentPlayer: (id: string, name: string, emoji: string) => void;
  castVote: (roomCode: string, playerId: string, vote: VoteValue) => void;
  sendEmote: (roomCode: string, playerId: string, emote: string) => void;
  revealVotes: (roomCode: string) => void;
  resetVotes: (roomCode: string) => void;
  getResults: (roomCode: string) => {
    average: number | null;
    majority: VoteValue | null;
    distribution: Record<string, number>;
  };
  getRoomState: (roomCode: string) => RoomState | null;
}

const generateId = () => Math.random().toString(36).substring(7);

// Broadcast changes to other tabs
const broadcastChange = (roomCode: string) => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel('planning-poker-sync');
      channel.postMessage({ type: 'room-update', roomCode });
      channel.close();
    } catch (e) {
      // BroadcastChannel not supported
    }
  }
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      rooms: {},
      currentPlayerId: null,
      currentPlayerName: null,
      currentPlayerEmoji: null,

      createRoom: (roomCode: string) => {
        set((state) => ({
          rooms: {
            ...state.rooms,
            [roomCode]: {
              players: [],
              isRevealed: false,
            },
          },
        }));
      },

      joinRoom: (roomCode: string, playerName: string, emoji: string) => {
        const id = generateId();
        set((state) => {
          const room = state.rooms[roomCode];
          if (!room) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomCode]: {
                ...room,
                players: [...room.players, { id, name: playerName, vote: null, hasVoted: false, emoji, currentEmote: null }],
              },
            },
          };
        });
        return id;
      },

      leaveRoom: (roomCode: string, playerId: string) =>
        set((state) => {
          const room = state.rooms[roomCode];
          if (!room) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomCode]: {
                ...room,
                players: room.players.filter((p) => p.id !== playerId),
              },
            },
          };
        }),

      updatePlayerName: (roomCode: string, playerId: string, name: string, emoji: string) =>
        set((state) => {
          const room = state.rooms[roomCode];
          if (!room) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomCode]: {
                ...room,
                players: room.players.map((p) =>
                  p.id === playerId ? { ...p, name, emoji } : p
                ),
              },
            },
          };
        }),

      setCurrentPlayer: (id: string, name: string, emoji: string) =>
        set({ currentPlayerId: id, currentPlayerName: name, currentPlayerEmoji: emoji }),

      sendEmote: (roomCode: string, playerId: string, emote: string) => {
        set((state) => {
          const room = state.rooms[roomCode];
          if (!room) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomCode]: {
                ...room,
                players: room.players.map((p) =>
                  p.id === playerId ? { ...p, currentEmote: emote } : p
                ),
              },
            },
          };
        });

        // Clear emote after 3 seconds
        setTimeout(() => {
          set((state) => {
            const room = state.rooms[roomCode];
            if (!room) return state;

            return {
              rooms: {
                ...state.rooms,
                [roomCode]: {
                  ...room,
                  players: room.players.map((p) =>
                    p.id === playerId ? { ...p, currentEmote: null } : p
                  ),
                },
              },
            };
          });
        }, 3000);
      },

      castVote: (roomCode: string, playerId: string, vote: VoteValue) =>
        set((state) => {
          const room = state.rooms[roomCode];
          if (!room) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomCode]: {
                ...room,
                players: room.players.map((p) =>
                  p.id === playerId ? { ...p, vote, hasVoted: true } : p
                ),
              },
            },
          };
        }),

      revealVotes: (roomCode: string) =>
        set((state) => {
          const room = state.rooms[roomCode];
          if (!room) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomCode]: {
                ...room,
                isRevealed: true,
              },
            },
          };
        }),

      resetVotes: (roomCode: string) =>
        set((state) => {
          const room = state.rooms[roomCode];
          if (!room) return state;

          return {
            rooms: {
              ...state.rooms,
              [roomCode]: {
                ...room,
                players: room.players.map((p) => ({ ...p, vote: null, hasVoted: false })),
                isRevealed: false,
              },
            },
          };
        }),

      getResults: (roomCode: string) => {
        const room = get().rooms[roomCode];
        if (!room) {
          return { average: null, majority: null, distribution: {} };
        }

        const votes = room.players.map((p) => p.vote).filter((v): v is VoteValue => v !== null);
        const numericVotes = votes.filter((v): v is NumericVoteValue => typeof v === 'number');

        const distribution: Record<string, number> = {};
        room.players.forEach((p) => {
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

      getRoomState: (roomCode: string) => {
        return get().rooms[roomCode] || null;
      },
    }),
    {
      name: 'planning-poker-storage',
    }
  )
);
