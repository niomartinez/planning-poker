'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { generateRoomCode, validateRoomCode } from '@/lib/roomCode';
import { useGameStore } from '@/store/useGameStore';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const createRoom = useGameStore((state) => state.createRoom);

  const handleCreateRoom = () => {
    const newRoomCode = generateRoomCode();
    createRoom(newRoomCode);
    router.push(`/room/${newRoomCode}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.toUpperCase().trim();

    if (!code) {
      setError('Please enter a room code');
      return;
    }

    if (!validateRoomCode(code)) {
      setError('Invalid room code format. Must be 6 characters (A-Z, 0-9)');
      return;
    }

    router.push(`/room/${code}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
            Planning Poker
          </h1>
          <p className="text-muted-foreground text-lg">
            Agile Estimation Made Simple
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Room
              </CardTitle>
              <CardDescription>
                Start a new planning poker session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleCreateRoom}
                className="w-full"
                size="lg"
              >
                Create New Room
              </Button>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Join Room
              </CardTitle>
              <CardDescription>
                Enter a room code to join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <Input
                  placeholder="Enter room code (e.g., ABC123)"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="text-center text-lg font-mono tracking-wider"
                  maxLength={6}
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  Join Room
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Create a room and share the code with your team to start voting</p>
        </div>
      </div>
    </main>
  );
}
