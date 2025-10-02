// Simple cross-tab synchronization using BroadcastChannel
export class RoomSync {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(data: any) => void> = new Set();

  constructor(roomCode: string) {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(`poker-room-${roomCode}`);
      this.channel.onmessage = (event) => {
        this.listeners.forEach(listener => listener(event.data));
      };
    }
  }

  broadcast(action: string, data: any) {
    if (this.channel) {
      this.channel.postMessage({ action, data, timestamp: Date.now() });
    }
  }

  subscribe(listener: (data: any) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  close() {
    if (this.channel) {
      this.channel.close();
    }
  }
}
