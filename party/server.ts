import type * as Party from "partykit/server";

export default class PokerRoomServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Room state
  state: any = {
    players: [],
    isRevealed: false,
    currentTicket: '',
  };

  onConnect(conn: Party.Connection) {
    // Send current state to new connection
    conn.send(JSON.stringify({
      type: 'sync',
      state: this.state,
    }));
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);

    // Update state based on action
    switch (data.type) {
      case 'join':
        // Only add player if they don't already exist
        const existingPlayer = this.state.players.find((p: any) => p.id === data.player.id);
        if (!existingPlayer) {
          // First player becomes admin
          const isFirstPlayer = this.state.players.length === 0;
          this.state.players.push({ ...data.player, isAdmin: isFirstPlayer });
        }
        break;
      case 'vote':
        this.state.players = this.state.players.map((p: any) =>
          p.id === data.playerId ? { ...p, vote: data.vote, hasVoted: true } : p
        );
        break;
      case 'reveal':
        this.state.isRevealed = true;
        break;
      case 'reset':
        this.state.players = this.state.players.map((p: any) => ({
          ...p,
          vote: null,
          hasVoted: false,
        }));
        this.state.isRevealed = false;
        break;
      case 'emote':
        this.state.players = this.state.players.map((p: any) =>
          p.id === data.playerId ? { ...p, currentEmote: data.emote, emoteTimestamp: Date.now() } : p
        );
        // Broadcast immediately with emote set
        this.room.broadcast(JSON.stringify({
          type: 'sync',
          state: this.state,
        }));
        // Clear emote after delay (don't broadcast again)
        setTimeout(() => {
          this.state.players = this.state.players.map((p: any) =>
            p.id === data.playerId ? { ...p, currentEmote: null, emoteTimestamp: null } : p
          );
        }, 3000);
        // Skip the broadcast at the end for emotes
        return;
      case 'updateName':
        this.state.players = this.state.players.map((p: any) =>
          p.id === data.playerId ? { ...p, name: data.name, emoji: data.emoji } : p
        );
        break;
      case 'leave':
        const leavingPlayer = this.state.players.find((p: any) => p.id === data.playerId);
        this.state.players = this.state.players.filter((p: any) => p.id !== data.playerId);
        // If admin left, promote next player
        if (leavingPlayer?.isAdmin && this.state.players.length > 0) {
          this.state.players[0].isAdmin = true;
        }
        break;
      case 'updateTicket':
        // Only allow admin to update ticket
        const updatingPlayer = this.state.players.find((p: any) => p.id === data.playerId);
        if (updatingPlayer?.isAdmin) {
          this.state.currentTicket = data.ticket;
        }
        break;
    }

    // Broadcast updated state to all connections
    this.room.broadcast(JSON.stringify({
      type: 'sync',
      state: this.state,
    }));
  }
}

PokerRoomServer satisfies Party.Worker;
