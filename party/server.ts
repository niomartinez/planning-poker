import { routePartykitRequest, Server } from "partyserver";
import type { Connection, WSMessage } from "partyserver";
import type { Player, RoomState, VoteValue } from "../types";

export interface Env {
  Main: DurableObjectNamespace<Main>;
}

type ClientMessage =
  | { type: 'join'; player: Player }
  | { type: 'vote'; playerId: string; vote: VoteValue }
  | { type: 'reveal' }
  | { type: 'reset' }
  | { type: 'emote'; playerId: string; emote: string }
  | { type: 'updateName'; playerId: string; name: string; emoji: string }
  | { type: 'leave'; playerId: string }
  | { type: 'updateTicket'; playerId: string; ticket: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isVoteValue(value: unknown): value is VoteValue {
  return value === 1 || value === 2 || value === 3 || value === 5 ||
    value === 8 || value === 13 || value === 21 || value === 'pass' || value === '?';
}

function isPlayer(value: unknown): value is Player {
  return isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.emoji === 'string' &&
    (value.vote === null || isVoteValue(value.vote)) &&
    typeof value.hasVoted === 'boolean' &&
    (value.currentEmote === undefined || value.currentEmote === null ||
      typeof value.currentEmote === 'string') &&
    (value.emoteTimestamp === undefined || value.emoteTimestamp === null ||
      (typeof value.emoteTimestamp === 'number' && Number.isFinite(value.emoteTimestamp))) &&
    (value.isAdmin === undefined || typeof value.isAdmin === 'boolean');
}

function isClientMessage(value: unknown): value is ClientMessage {
  if (!isRecord(value)) return false;

  switch (value.type) {
    case 'join':
      return isPlayer(value.player);
    case 'vote':
      return typeof value.playerId === 'string' && isVoteValue(value.vote);
    case 'reveal':
    case 'reset':
      return true;
    case 'emote':
      return typeof value.playerId === 'string' && typeof value.emote === 'string';
    case 'updateName':
      return typeof value.playerId === 'string' && typeof value.name === 'string' &&
        typeof value.emoji === 'string';
    case 'leave':
      return typeof value.playerId === 'string';
    case 'updateTicket':
      return typeof value.playerId === 'string' && typeof value.ticket === 'string';
    default:
      return false;
  }
}

export class Main extends Server<Env> {
  // Keep the original in-memory room lifecycle; hibernation requires persistence.
  static options = { hibernate: false };

  state: RoomState = {
    players: [],
    isRevealed: false,
    currentTicket: '',
  };

  onConnect(conn: Connection) {
    // Send current state to new connection
    conn.send(JSON.stringify({
      type: 'sync',
      state: this.state,
    }));
  }

  onMessage(_connection: Connection, message: WSMessage) {
    // This app's protocol uses JSON text messages only.
    if (typeof message !== 'string') return;

    let data: unknown;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }
    if (!isClientMessage(data)) return;

    // Update state based on action
    switch (data.type) {
      case 'join': {
        // Only add player if they don't already exist
        const existingPlayer = this.state.players.find((p) => p.id === data.player.id);
        if (!existingPlayer) {
          // First player becomes admin
          const isFirstPlayer = this.state.players.length === 0;
          this.state.players.push({ ...data.player, isAdmin: isFirstPlayer });
        }
        break;
      }
      case 'vote':
        this.state.players = this.state.players.map((p) =>
          p.id === data.playerId ? { ...p, vote: data.vote, hasVoted: true } : p
        );
        break;
      case 'reveal':
        this.state.isRevealed = true;
        break;
      case 'reset':
        this.state.players = this.state.players.map((p) => ({
          ...p,
          vote: null,
          hasVoted: false,
        }));
        this.state.isRevealed = false;
        break;
      case 'emote':
        this.state.players = this.state.players.map((p) =>
          p.id === data.playerId ? { ...p, currentEmote: data.emote, emoteTimestamp: Date.now() } : p
        );
        // Broadcast immediately with emote set
        this.broadcast(JSON.stringify({
          type: 'sync',
          state: this.state,
        }));
        // Clear emote after delay (don't broadcast again)
        setTimeout(() => {
          this.state.players = this.state.players.map((p) =>
            p.id === data.playerId ? { ...p, currentEmote: null, emoteTimestamp: null } : p
          );
        }, 3000);
        // Skip the broadcast at the end for emotes
        return;
      case 'updateName':
        this.state.players = this.state.players.map((p) =>
          p.id === data.playerId ? { ...p, name: data.name, emoji: data.emoji } : p
        );
        break;
      case 'leave': {
        const leavingPlayer = this.state.players.find((p) => p.id === data.playerId);
        this.state.players = this.state.players.filter((p) => p.id !== data.playerId);
        // If admin left, promote next player
        if (leavingPlayer?.isAdmin && this.state.players.length > 0) {
          this.state.players[0].isAdmin = true;
        }
        break;
      }
      case 'updateTicket': {
        // Only allow admin to update ticket
        const updatingPlayer = this.state.players.find((p) => p.id === data.playerId);
        if (updatingPlayer?.isAdmin) {
          this.state.currentTicket = data.ticket;
        }
        break;
      }
    }

    // Broadcast updated state to all connections
    this.broadcast(JSON.stringify({
      type: 'sync',
      state: this.state,
    }));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (await routePartykitRequest(request, env)) ||
      new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
