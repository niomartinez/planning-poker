import { useEffect, useState } from 'react';
import PartySocket from 'partysocket';
import { RoomState } from '@/types';

export function usePartyRoom(roomCode: string) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [socket, setSocket] = useState<PartySocket | null>(null);

  useEffect(() => {
    // Connect to Partykit server
    const partySocket = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999',
      room: roomCode,
    });

    partySocket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sync') {
        setRoomState(data.state);
      }
    });

    setSocket(partySocket);

    return () => {
      partySocket.close();
    };
  }, [roomCode]);

  const sendMessage = (data: any) => {
    if (socket) {
      socket.send(JSON.stringify(data));
    }
  };

  return { roomState, sendMessage };
}
