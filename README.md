# Planning Poker

A modern, clean Planning Poker app built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

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

1. Enter your name to join the room
2. Select your vote from the Fibonacci cards
3. Wait for all players to vote
4. Click "Reveal Votes" to see everyone's votes
5. Review the average and majority results
6. Click "New Round" to reset and vote again
7. Click "Change Name" to update your name anytime