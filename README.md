# Planning Poker

A real-time multiplayer Planning Poker app for agile story point estimation. Built with Next.js 15, TypeScript, PartyKit WebSockets, Tailwind CSS, and shadcn/ui.

## What is Planning Poker?

Planning Poker is a collaborative estimation technique used by agile teams to size user stories. Team members vote on story points using Fibonacci numbers, discuss differences, and reach consensus. This app provides a real-time digital version that syncs instantly across all connected players.

## Features

### Real-time Multiplayer
- **WebSocket Synchronization**: Powered by PartyKit for instant updates across all players
- **Multi-device Support**: Join the same room from different browsers/devices and see real-time updates
- **Emote Reactions**: Send floating emote reactions that appear for all players

### Room Management
- **Create Room**: Generate a unique 6-character room code
- **Join Room**: Enter a room code to join an existing session
- **Share Room**: Copy room code or full link to invite team members
- **Isolated Sessions**: Each room is completely separate with its own state

### Voting Features
- **Name Entry**: Players choose a name and emoji before joining
- **Fibonacci Voting**: Vote using the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21)
- **Special Options**:
  - ☕ **Pass** (Coffee cup): Skip this vote
  - ❓ **Question**: Need clarification before voting
- **Real-time Status**: See which players have voted (loader icon for pending)
- **Hidden Votes**: Cards stay hidden until revealed (shows 🃏 for voted players)
- **Reveal Votes**: Anyone can reveal all votes simultaneously
- **Results**:
  - **Average**: Calculated from numeric votes only (excludes Pass/?)
  - **Majority**: Most voted option with count
- **Reset**: Start a new voting round
- **Name Editing**: Update your name/emoji anytime
- **Modern UI**: Clean, compact single-screen design

## Getting Started

### Prerequisites
- Node.js 20+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/planning-poker.git
cd planning-poker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional for local dev):
```bash
# Create .env.local (optional - defaults work for local development)
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

### Running Locally

**Option 1: Run everything together (recommended)**
```bash
npm run dev:all
```
This runs both the Next.js app (port 3000) and PartyKit WebSocket server (port 1999) concurrently.

**Option 2: Run separately**
```bash
# Terminal 1: Run Next.js
npm run dev

# Terminal 2: Run PartyKit server
npm run party
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing Multiplayer Locally

1. Start the dev servers with `npm run dev:all`
2. Open [http://localhost:3000](http://localhost:3000) in two different browser windows
3. Create a room in one window
4. Copy the room code and join from the second window
5. Vote and see real-time synchronization!

## Tech Stack

- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **PartyKit** - Real-time WebSocket server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

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

## How It Works

### Architecture
- **Next.js Frontend**: React app with App Router serving the UI
- **PartyKit Backend**: WebSocket server handling real-time state synchronization
- **Room Isolation**: Each 6-character room code creates a separate PartyKit room instance
- **Player Identity**: Players are identified by UUID stored in localStorage per room
- **Real-time Sync**: All actions (voting, revealing, resetting) broadcast immediately to all connected players

### State Management
- **Server State**: PartyKit server maintains authoritative room state (players, votes, reveal status)
- **Client State**: React components subscribe to WebSocket updates via `usePartyRoom` hook
- **Local Storage**: Player identity (ID, name, emoji) persists locally per room
- **Auto-reconnect**: Players automatically rejoin when returning to a room

## Deployment

### Deploy Next.js App
Deploy to Vercel, Netlify, or any Next.js-compatible host:
```bash
npm run build
npm start
```

### Deploy PartyKit Server
```bash
npx partykit deploy
```

After deployment, update your environment variable:
```bash
NEXT_PUBLIC_PARTYKIT_HOST=your-project.username.partykit.dev
```

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── page.tsx         # Home page (create/join)
│   ├── room/[code]/     # Room page (voting UI)
│   └── layout.tsx       # Root layout
├── party/
│   └── server.ts        # PartyKit WebSocket server
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   └── *.tsx            # Feature components
├── hooks/
│   └── usePartyRoom.ts  # WebSocket connection hook
├── lib/                 # Utilities
├── types/               # TypeScript types
└── partykit.json        # PartyKit configuration
```

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT