# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Planning Poker is a real-time multiplayer estimation tool built with Next.js 15 and PartyKit WebSockets. Players join rooms using 6-character codes, vote on story points using Fibonacci numbers, and see results in real-time across all connected clients.

## Development Commands

```bash
# Install dependencies
npm install

# Run Next.js dev server only
npm run dev

# Run PartyKit WebSocket server only
npm run party

# Run both Next.js and PartyKit concurrently (recommended for development)
npm run dev:all

# Build for production
npm run build

# Run production server
npm start

# Lint code
npm run lint
```

**Important**: For local development with real-time multiplayer features, always use `npm run dev:all` to run both the Next.js app and PartyKit server simultaneously.

## Architecture

### Real-time Multiplayer with PartyKit

The app uses **PartyKit** for real-time WebSocket communication:

- **Server**: `party/server.ts` - PartyKit server handling room state and broadcasting updates
- **Client Hook**: `hooks/usePartyRoom.ts` - React hook connecting to PartyKit WebSocket
- **Configuration**: `partykit.json` - PartyKit config pointing to server entry

**State Flow**:
1. Client connects via `usePartyRoom(roomCode)` hook
2. Server sends initial state on connection (`sync` message)
3. Client sends actions (join, vote, reveal, reset, emote, updateName, leave)
4. Server updates state and broadcasts to all connected clients
5. All clients receive `sync` messages with updated state

**Key Implementation Details**:
- Each room is an isolated PartyKit "room" identified by the 6-character code
- Server maintains in-memory state (players array, isRevealed flag)
- Environment variable `NEXT_PUBLIC_PARTYKIT_HOST` configures WebSocket host (defaults to `localhost:1999`)
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
- `lib/sync.ts`: BroadcastChannel for cross-tab sync (currently unused, replaced by PartyKit)
- `lib/utils.ts`: Tailwind class merging utility

### Player Identity Management

Players are identified by:
- Unique UUID stored in `localStorage` as `player_{roomCode}_id`
- Name stored as `player_{roomCode}_name`
- Emoji stored as `player_{roomCode}_emoji`

On page load, the app checks localStorage and either auto-joins or prompts for name/emoji. The `usePartyRoom` hook handles auto-joining when player info exists.

### Styling

- **Tailwind CSS** with custom theme colors in `tailwind.config.ts`
- **CSS variables** for theming in `app/globals.css`
- Single-screen layout (h-screen) with no scrolling required
- Responsive design with mobile-first approach

## Environment Variables

Create `.env.local` for local development:

```bash
# PartyKit host for WebSocket connections
# For local dev: localhost:1999
# For production: your-project.username.partykit.dev
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999
```

## Deployment Notes

- **Next.js app**: Deploy to Vercel or any Next.js host
- **PartyKit server**: Deploy separately using `npx partykit deploy`
- Set `NEXT_PUBLIC_PARTYKIT_HOST` to your deployed PartyKit URL in production

## Code Quality and Deployment Workflow

When completing work on features or fixes, always follow this workflow before pushing to main:

1. **Run lint check**: `npm run lint` - Ensure code meets linting standards
2. **Run build check**: `npm run build` - Verify production build succeeds with no errors
3. **Manual testing**: Run `npm run dev:all` and test the functionality in browser
4. **Commit and push**: After all checks pass, commit changes and push to main branch

This ensures all code pushed to main is production-ready and has been validated.
