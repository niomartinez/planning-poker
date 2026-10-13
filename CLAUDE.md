# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Planning Poker is a real-time multiplayer estimation tool built with Next.js 15 and PartyServer WebSockets on Cloudflare Workers and Durable Objects. Players join rooms using 6-character codes, vote on story points using Fibonacci numbers, and see results in real-time across all connected clients.

## Development Commands

```bash
# Install dependencies
npm ci

# Run Next.js dev server only
npm run dev

# Run PartyServer locally with Wrangler (port 1999)
npm run party

# Run Next.js and the local Worker concurrently (recommended for development)
npm run dev:all

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint

# Check frontend and Worker types
npm run typecheck

# Bundle the Worker without deploying
npm run build:party

# Check multiplayer protocol against the running local Worker
npm run test:multiplayer
```

**Important**: For local development with real-time multiplayer features, always use `npm run dev:all` to run both the Next.js app and local Worker simultaneously. Use Node.js 22.13+ within 22.x, or Node.js 24+.

## Architecture

### Real-time Multiplayer with PartyServer

The app uses **PartyServer** for real-time WebSocket communication:

- **Server**: `party/server.ts` - exported `Main extends Server<Env>` class handling room state and broadcasting updates, plus the Worker fetch handler
- **Client Hook**: `hooks/usePartyRoom.ts` - React hook connecting with the existing PartySocket client
- **Configuration**: `wrangler.jsonc` - Worker entry, `Main` Durable Object binding, and initial SQLite class migration
- **Worker Types**: `tsconfig.worker.json` - checks the server against Cloudflare Worker types separately from Next.js

**State Flow**:
1. Client connects via `usePartyRoom(roomCode)` hook
2. Server sends initial state on connection (`sync` message)
3. Client sends actions (join, vote, reveal, reset, emote, updateName, leave, updateTicket)
4. Server updates state and broadcasts to all connected clients
5. All clients receive `sync` messages with updated state

**Key Implementation Details**:
- Each room is an isolated Durable Object identified by the 6-character code. The `Main` binding preserves the default `main` party route at `/parties/main/:room`.
- Server maintains in-memory state (players array, isRevealed flag, currentTicket). It does not write application state to Durable Object storage, and hibernation is disabled to preserve that lifecycle.
- `NEXT_PUBLIC_PARTYSERVER_HOST` configures the WebSocket host. `NEXT_PUBLIC_PARTYKIT_HOST` remains a fallback; both default to `localhost:1999` when absent. Public host values are embedded in the frontend build.
- Emotes auto-clear after 3 seconds server-side

### Next.js App Router Structure

- **`app/page.tsx`**: Home page with Create/Join room options
- **`app/room/[code]/page.tsx`**: Main room page - handles all voting UI and WebSocket integration
- **`app/layout.tsx`**: Root layout with global styles

### Type System

All shared types defined in `types/index.ts`:
- `Player`: Player state including id, name, emoji, vote, hasVoted, currentEmote
- `RoomState`: Room state with players array and isRevealed flag
- `VoteValue`: Union type for Fibonacci values (1-21), 'pass', and '?'
- `NumericVoteValue`: Numeric subset for calculations

### Component Organization

**UI Components** (`components/ui/`): shadcn/ui components (button, card, dialog, input)

**Feature Components**:
- `PokerTable`: Circular player arrangement with emote support
- `PlayerCard`: Individual player display showing vote state (loading/voted/revealed)
- `VotingCard`: Individual vote option button
- `Results`: Results display with average and majority
- `NameDialog`: Player name/emoji selection modal
- `EmotePicker`: Emote selection UI
- `FloatingEmote`: Animated emote overlay

### Utilities

- `lib/roomCode.ts`: Room code generation (6-char alphanumeric)
- `lib/emojis.ts`: Emoji constants and utilities
- `lib/sync.ts`: BroadcastChannel for cross-tab sync (currently unused, replaced by the WebSocket backend)
- `lib/utils.ts`: Tailwind class merging utility

### Player Identity Management

Players are identified by:
- Unique UUID stored in `localStorage` as `player_{roomCode}_id`
- Name stored as `player_{roomCode}_name`
- Emoji stored as `player_{roomCode}_emoji`

On page load, the app checks localStorage and either auto-joins or prompts for name/emoji. The room page handles auto-joining when player info exists; `usePartyRoom` manages the socket and received state.

### Styling

- **Tailwind CSS** with custom theme colors in `tailwind.config.ts`
- **CSS variables** for theming in `app/globals.css`
- Single-screen layout (h-screen) with no scrolling required
- Responsive design with mobile-first approach

## Environment Variables

Copy `.env.example` to `.env.local` for local development if needed:

```bash
# Hostname only, without scheme or path
NEXT_PUBLIC_PARTYSERVER_HOST=localhost:1999
```

Production uses the approved Cloudflare Worker hostname. `NEXT_PUBLIC_PARTYSERVER_HOST` takes precedence over the legacy `NEXT_PUBLIC_PARTYKIT_HOST`, so a rollback must update or remove the new variable before rebuilding the frontend.

## Deployment Notes

- **Next.js app**: Keep the frontend on Vercel or its approved Next.js host.
- **PartyServer backend**: Deploy separately with Wrangler after the Cloudflare account and environment are selected and deployment is authorized.
- **Room links**: Keep the existing frontend origin and room-code paths; the Worker supplies only the WebSocket backend.
- **Data preservation**: The prior backend is memory-only. Before any production change, verify preservation of all required known-room state or obtain explicit owner confirmation that none is needed. No historical room enumeration or automatic import is implemented.
- **Handoff**: Read `docs/handoffs/2026-10-13-partyserver-migration.md` for shutdown deadlines, validation status, and rollout/rollback steps.

Identify required active rooms from participants' current room URLs/codes, saved `player_<ROOM_CODE>_*` localStorage keys in the app browser, or existing app logs if known. Connect with the snapshot tool without joining or redeploying the old server. Known room snapshot commands:

```bash
npm run backup:rooms -- --host planning-poker.niomartinez.partykit.dev --room <KNOWN_ROOM_CODE>
node scripts/verify-room-backup.mjs .backups/<snapshot-directory>
```

Snapshots contain potentially sensitive player names, votes, and ticket text. Keep them in ignored `.backups/` and do not log or commit their contents. Retain the printed manifest SHA-256 separately and compare it when verifying a copied backup. The script observes initial synchronization messages and sends no application actions. This establishes current observed state only, and an empty response does not prove a historical room was absent.

## Code Quality and Deployment Workflow

Before an approved release:

1. Run `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run build:party`.
2. Run `npm run party` and `npm run test:multiplayer` in separate terminals.
3. Run `npm run dev:all` and test the browser flow with multiple windows, including reconnect behavior.
4. Review the diff and the migration handoff. Commit, push, deploy, or change production environment/routing only when explicitly authorized for that action.

Do not redeploy the old backend to add an export endpoint before preserving live state: redeployment can discard its in-memory rooms. SQLite Durable Object configuration does not itself persist this application's state. State restoration would require separate controlled tooling or a deliberate manual session restart; do not assume the backup script imports data.
