import type * as Party from "partykit/server";

export default class PokerRoomServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  // Room state
  state: any = {
    players: [],
    isRevealed: false,
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
          this.state.players.push(data.player);
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
          p.id === data.playerId ? { ...p, currentEmote: data.emote } : p
        );
        // Broadcast immediately with emote set
        this.room.broadcast(JSON.stringify({
          type: 'sync',
          state: this.state,
        }));
        // Clear emote after delay (don't broadcast again)
        setTimeout(() => {
          this.state.players = this.state.players.map((p: any) =>
            p.id === data.playerId ? { ...p, currentEmote: null } : p
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
        this.state.players = this.state.players.filter((p: any) => p.id !== data.playerId);
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
