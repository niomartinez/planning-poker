# Planning Poker

A modern, clean Planning Poker app built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

### Room Management
- **Create Room**: Generate a unique 6-character room code
- **Join Room**: Enter a room code to join an existing session
- **Share Room**: Copy room code or full link to invite team members
- **Persistent State**: Rooms are saved locally (localStorage)

### Voting Features
- **Name Entry**: Players enter their name before joining the room
- **Fibonacci Voting**: Vote using the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)
- **Special Options**:
  - ☕ **Pass** (Coffee cup): For taking a break
  - ❓ **Question**: For voters needing clarification
- **Real-time Status**: Shows loader icon for players who haven't voted yet
- **Hidden Votes**: Cards are hidden until revealed (shows 🃏 for voted players)
- **Reveal Votes**: Anyone can reveal votes once all players have voted
- **Results**:
  - **Average**: Calculated from numeric votes only (excludes Pass)
  - **Majority**: Most voted option with vote count
- **Reset**: Start a new voting round
- **Name Editing**: Players can easily change their name anytime
- **Modern UI**: Clean, poker-themed design with smooth animations

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in terminal).

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** components
- **Zustand** for state management
- **Lucide React** for icons

## Usage

### Creating a Session
1. Click "Create New Room" on the home page
2. Share the room code (e.g., `ABC123`) or copy the full link
3. Team members can join by entering the code or clicking the link

### Joining a Session
1. Click "Join Room" on the home page
2. Enter the 6-character room code
3. Enter your name to join

### Voting
1. Select your vote from the Fibonacci cards (or Pass/?)
2. Wait for all players to vote
3. Click "Reveal Votes" to see everyone's votes
4. Review the average and majority results
5. Click "New Round" to reset and vote again
6. Click "Change Name" to update your name anytime

## How Sessions Work

- **Separate Rooms**: Each room code creates an isolated session
- **Local Storage**: Room data persists in your browser's localStorage
- **No Backend**: Everything runs client-side (for now)
- **Privacy**: Each browser maintains its own state independently