# Planning Poker

A real-time multiplayer Planning Poker app for agile story point estimation. Built with Next.js 15, TypeScript, PartyServer on Cloudflare Workers and Durable Objects, Tailwind CSS, and shadcn/ui.

## What is Planning Poker?

Planning Poker is a collaborative estimation technique used by agile teams to size user stories. Team members vote on story points using Fibonacci numbers, discuss differences, and reach consensus. This app provides a real-time digital version that syncs instantly across all connected players.

## Features

### Real-time Multiplayer
- **WebSocket Synchronization**: Powered by PartyServer and PartySocket for instant updates across all players
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
- Node.js 22.13+ within 22.x, or Node.js 24+ installed (required by the Cloudflare development tooling)
- npm 10.9+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/niomartinez/planning-poker.git
cd planning-poker
```

2. Install dependencies:
```bash
npm ci
```

3. Set up environment variables (optional for local dev):
```bash
# Create .env.local (optional - defaults work for local development)
cp .env.example .env.local
# NEXT_PUBLIC_PARTYSERVER_HOST=localhost:1999
```

### Running Locally

**Option 1: Run everything together (recommended)**
```bash
npm run dev:all
```
This runs both the Next.js app (port 3000) and the local Cloudflare Worker WebSocket server (port 1999) concurrently.

**Option 2: Run separately**
```bash
# Terminal 1: Run Next.js
npm run dev

# Terminal 2: Run PartyServer with Wrangler
npm run party
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing Multiplayer Locally

1. Start the dev servers with `npm run dev:all`
2. Open [http://localhost:3000](http://localhost:3000) in two different browser windows
3. Create a room in one window
4. Copy the room code and join from the second window
5. Vote and see real-time synchronization!

### Local Validation

Run the checks with Node.js 22.13+ within 22.x, or Node.js 24+:

```bash
npm run lint
npm run typecheck
npm run build
npm run build:party
```

`build:party` bundles the Worker with Wrangler's dry run; it does not deploy it. With `npm run party` running in another terminal, run `npm run test:multiplayer` to check the WebSocket protocol locally. Also test the browser flow above before a release.

## Tech Stack

- **Next.js 15** (App Router) - React framework
- **TypeScript** - Type safety
- **PartyServer / Cloudflare Workers** - Real-time WebSocket server with Durable Object room isolation
- **PartySocket** - WebSocket client and reconnect support
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
- **PartyServer Backend**: Cloudflare Worker handling WebSocket routing and real-time state synchronization
- **Room Isolation**: Each 6-character room code addresses a separate `Main` Durable Object through `/parties/main/:room`
- **Player Identity**: Players are identified by UUID stored in localStorage per room
- **Real-time Sync**: All actions (voting, revealing, resetting) broadcast immediately to all connected players

### State Management
- **Server State**: The PartyServer class maintains authoritative room state in memory (players, votes, reveal status, current ticket). As before, this is transient state and is not persisted to storage.
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

### Deploy PartyServer Backend

The Next.js frontend and the Cloudflare Worker are separate deployments. The existing frontend can stay on Vercel. Before deploying, choose and approve the Cloudflare account and target environment, preserve any required live room state, and follow the [migration handoff](docs/handoffs/2026-10-13-partyserver-migration.md).

Once deployment is authorized and Wrangler is authenticated to that account:

```bash
npx wrangler deploy
```

Set the frontend's public environment variable to the approved Worker hostname, without a URL scheme or path:

```bash
NEXT_PUBLIC_PARTYSERVER_HOST=planning-poker.<your-subdomain>.workers.dev
```

This public value is embedded at build time, so rebuild and redeploy the frontend after an approved environment change. The hook also accepts `NEXT_PUBLIC_PARTYKIT_HOST` for existing environments; `NEXT_PUBLIC_PARTYSERVER_HOST` takes precedence. Room links and the frontend origin stay the same.

### Preserving Existing Room State

The old hosted backend is `planning-poker.niomartinez.partykit.dev`. Its checked-in implementation keeps room state in memory and has no room registry or storage export endpoint. Known rooms can be observed over their existing WebSocket protocol:

```bash
npm run backup:rooms -- --host planning-poker.niomartinez.partykit.dev --room <KNOWN_ROOM_CODE>
node scripts/verify-room-backup.mjs .backups/<snapshot-directory>
```

Identify needed active rooms from participants' existing room URLs/codes, saved `player_<ROOM_CODE>_*` localStorage keys in their app browser, or existing app logs if available. Use actual known room codes, repeating `--room` for each room. The tool sends no application actions and saves validated current state plus a manifest with capture times and SHA-256 checksums. Snapshots in `.backups/` are private and ignored by Git. Keep the printed manifest SHA-256 separately and compare it when verifying a copied backup. They do not enumerate rooms, recover historical state, or restore state automatically. An empty snapshot does not establish that the room never existed. Before any production change, either verify preservation of all required known-room state or obtain explicit confirmation that none is needed.

The [hosted shutdown notice](https://blog.partykit.io/posts/hosted-platform-shutdown/) sets October 16, 2026 as the export/help and redeployment deadline, and October 23 as the deletion date. No precise cutoff timezone is published. Preserve needed live state before any old-server redeploy, which can reset in-memory rooms. See the [official migration guide](https://docs.partykit.io/guides/migrate-to-partyserver/) and the handoff for remaining decisions.

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── page.tsx         # Home page (create/join)
│   ├── room/[code]/     # Room page (voting UI)
│   └── layout.tsx       # Root layout
├── party/
│   └── server.ts        # PartyServer class and Cloudflare Worker entry
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   └── *.tsx            # Feature components
├── hooks/
│   └── usePartyRoom.ts  # WebSocket connection hook
├── lib/                 # Utilities
├── types/               # TypeScript types
├── scripts/             # Multiplayer checks and private room snapshot tools
├── tsconfig.worker.json  # Separate Cloudflare Worker type check
└── wrangler.jsonc        # Worker and Durable Object configuration
```

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT