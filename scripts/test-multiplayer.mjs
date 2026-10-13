import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import PartySocket from 'partysocket';

// Start `npm run party` first. An optional argument (or PARTY_SERVER_TEST_URL)
// selects another local Wrangler port; production hosts are always rejected.
const TIMEOUT_MS = 10_000;
const clients = new Set();

function localEndpoint() {
  assert.ok(Number(process.versions.node.split('.')[0]) >= 22,
    'This test requires Node.js 22 or newer.');
  assert.equal(typeof globalThis.WebSocket, 'function',
    'This test requires the native Node.js WebSocket implementation.');
  const url = new URL(process.argv[2] || process.env.PARTY_SERVER_TEST_URL ||
    'http://localhost:1999');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
    'Refusing to test a non-loopback host. Run this only against local Wrangler.');
  assert.equal(url.protocol, 'http:', 'Use a local http:// Wrangler URL.');
  assert.ok(!url.username && !url.password && url.pathname === '/' &&
    !url.search && !url.hash, 'Provide only the local origin, without credentials or a path.');
  return url;
}

class Client {
  sequence = 0;
  state = null;
  waiters = new Set();
  closing = false;
  failure = null;

  constructor(label, room, endpoint) {
    this.label = label;
    this.socket = new PartySocket({
      host: endpoint.host,
      protocol: 'ws',
      party: 'main',
      room,
      WebSocket: globalThis.WebSocket,
      maxRetries: 0,
      connectionTimeout: TIMEOUT_MS,
    });
    clients.add(this);
    this.socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        assert.equal(message.type, 'sync', `${label}: unexpected server message`);
        assert.ok(message.state && Array.isArray(message.state.players),
          `${label}: invalid room state`);
        this.state = message.state;
        this.sequence += 1;
        for (const waiter of [...this.waiters]) {
          if (this.sequence > waiter.after && waiter.predicate(this.state)) {
            waiter.resolve(this.state);
          }
        }
      } catch (error) {
        this.fail(error);
      }
    });
    this.socket.addEventListener('error', () => {
      if (!this.closing) this.fail(new Error(`${label}: WebSocket connection failed`));
    });
    this.socket.addEventListener('close', () => {
      if (!this.closing) this.fail(new Error(`${label}: WebSocket closed unexpectedly`));
    });
  }

  fail(error) {
    this.failure ||= error;
    for (const waiter of [...this.waiters]) waiter.reject(error);
  }

  waitFor(predicate, description, after = this.sequence) {
    if (this.failure) return Promise.reject(this.failure);
    if (this.sequence > after && predicate(this.state)) return Promise.resolve(this.state);
    return new Promise((resolve, reject) => {
      const settle = (callback, value) => {
        clearTimeout(timer);
        this.waiters.delete(waiter);
        callback(value);
      };
      const waiter = {
        predicate,
        after,
        resolve: (state) => settle(resolve, state),
        reject: (error) => settle(reject, error),
      };
      const timer = setTimeout(() => waiter.reject(new Error(
        `${this.label}: timed out waiting for ${description}; last state: ${JSON.stringify(this.state)}`
      )), TIMEOUT_MS);
      this.waiters.add(waiter);
    });
  }

  send(message) {
    if (this.failure) throw this.failure;
    assert.equal(this.socket.readyState, WebSocket.OPEN, `${this.label}: socket is not open`);
    this.socket.send(typeof message === 'string' || message instanceof ArrayBuffer
      ? message : JSON.stringify(message));
  }

  async close() {
    if (this.closing) return;
    this.closing = true;
    this.fail(new Error(`${this.label}: test client closed`));
    if (this.socket.readyState === WebSocket.CLOSED) {
      this.socket.close();
      return;
    }
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 1_000);
      this.socket.addEventListener('close', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      this.socket.close();
    });
  }
}

async function connect(label, room, endpoint) {
  const client = new Client(label, room, endpoint);
  await client.waitFor(() => true, 'initial room sync', 0);
  return client;
}

function player(state, id) {
  const result = state.players.find((candidate) => candidate.id === id);
  assert.ok(result, `Missing player ${id}`);
  return result;
}

function newPlayer(name, emoji) {
  return { id: randomUUID(), name, emoji, vote: null, hasVoted: false };
}

async function broadcast(sender, message, observers, predicate, description) {
  // Register every listener before sending, and require a newer sync so an old
  // state cannot satisfy duplicate joins, rejected updates, or reset checks.
  const pending = Promise.all(observers.map((client) => client.waitFor(predicate, description)));
  try {
    sender.send(message);
  } catch (error) {
    for (const client of observers) client.fail(error);
    await pending.catch(() => {});
    throw error;
  }
  const states = await pending;
  for (const state of states) assert.deepEqual(state, states[0], description);
  return states[0];
}

async function step(description, action) {
  await action();
  console.log(`ok - ${description}`);
}

async function run() {
  const endpoint = localEndpoint();
  console.log(`Testing multiplayer on ${endpoint.origin}`);
  const room = `integration-${randomUUID()}`;
  const otherRoom = `integration-${randomUUID()}`;
  const alice = newPlayer('Alice', '🐙');
  const bob = newPlayer('Bob', '🐝');
  const outsider = newPlayer('Isolated', '🌵');
  const a = await connect('Alice', room, endpoint);
  let b = await connect('Bob', room, endpoint);
  let peers = [a, b];
  let state;

  await step('fresh rooms and unknown Worker paths', async () => {
    for (const client of peers) {
      assert.deepEqual(client.state, { players: [], isRevealed: false, currentTicket: '' });
    }
    const response = await fetch(new URL(`/missing-${randomUUID()}`, endpoint), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'error',
    });
    assert.equal(response.status, 404);
    await response.arrayBuffer();
  });

  await step('two players join; only the first is admin; duplicate joins are ignored', async () => {
    state = await broadcast(a, { type: 'join', player: alice }, peers,
      (s) => s.players.length === 1, 'first player join');
    assert.equal(player(state, alice.id).isAdmin, true);
    state = await broadcast(b, { type: 'join', player: bob }, peers,
      (s) => s.players.length === 2, 'second player join');
    assert.equal(player(state, alice.id).isAdmin, true);
    assert.equal(player(state, bob.id).isAdmin, false);
    const before = state;
    state = await broadcast(a, { type: 'join', player: { ...alice, name: 'Duplicate' } },
      peers, () => true, 'duplicate join acknowledgement');
    assert.deepEqual(state, before);
  });

  const isolated = await connect('Isolated', otherRoom, endpoint);
  await step('rooms keep separate players, votes, and tickets', async () => {
    assert.deepEqual(isolated.state, { players: [], isRevealed: false, currentTicket: '' });
    await broadcast(isolated, { type: 'join', player: outsider }, [isolated],
      (s) => s.players.length === 1, 'isolated player join');
    await broadcast(isolated, { type: 'updateTicket', playerId: outsider.id, ticket: 'OTHER-1' },
      [isolated], (s) => s.currentTicket === 'OTHER-1', 'isolated ticket update');
    await broadcast(isolated, { type: 'vote', playerId: outsider.id, vote: 21 }, [isolated],
      (s) => player(s, outsider.id).vote === 21, 'isolated vote');
    assert.equal(state.players.length, 2);
    assert.equal(state.currentTicket, '');
  });
  const isolatedState = isolated.state;
  const isolatedSequence = isolated.sequence;

  await step('admin updates tickets; a normal player cannot replace the ticket', async () => {
    state = await broadcast(a, { type: 'updateTicket', playerId: alice.id, ticket: 'PP-123' },
      peers, (s) => s.currentTicket === 'PP-123', 'admin ticket update');
    state = await broadcast(b, { type: 'updateTicket', playerId: bob.id, ticket: 'REJECTED' },
      peers, () => true, 'normal player ticket attempt');
    assert.equal(state.currentTicket, 'PP-123');
  });

  await step('numeric votes and reveal reach every client', async () => {
    await broadcast(a, { type: 'vote', playerId: alice.id, vote: 8 }, peers,
      (s) => player(s, alice.id).vote === 8, 'Alice numeric vote');
    state = await broadcast(b, { type: 'vote', playerId: bob.id, vote: 13 }, peers,
      (s) => player(s, bob.id).vote === 13, 'Bob numeric vote');
    assert.equal(player(state, alice.id).hasVoted, true);
    assert.equal(player(state, bob.id).hasVoted, true);
    assert.equal(state.isRevealed, false);
    state = await broadcast(b, { type: 'reveal' }, peers,
      (s) => s.isRevealed, 'reveal numeric votes');
    assert.equal(player(state, alice.id).vote, 8);
    assert.equal(player(state, bob.id).vote, 13);
  });

  async function reset(sender) {
    state = await broadcast(sender, { type: 'reset' }, peers,
      (s) => !s.isRevealed && s.players.every((p) => p.vote === null && !p.hasVoted),
      'reset all votes');
    assert.equal(state.players.length, 2);
    assert.equal(state.currentTicket, 'PP-123');
  }
  await step('reset clears votes and reveal while retaining players and ticket', () => reset(a));

  await step('pass and question-mark votes survive reveal', async () => {
    await broadcast(a, { type: 'vote', playerId: alice.id, vote: '?' }, peers,
      (s) => player(s, alice.id).vote === '?', 'question-mark vote');
    await broadcast(b, { type: 'vote', playerId: bob.id, vote: 'pass' }, peers,
      (s) => player(s, bob.id).vote === 'pass', 'pass vote');
    state = await broadcast(a, { type: 'reveal' }, peers,
      (s) => s.isRevealed, 'reveal special votes');
    assert.equal(player(state, alice.id).vote, '?');
    assert.equal(player(state, bob.id).vote, 'pass');
    assert.equal(player(state, alice.id).hasVoted, true);
    assert.equal(player(state, bob.id).hasVoted, true);
    await reset(b);
  });

  const rename = { type: 'updateName', playerId: bob.id, name: 'Bob Updated', emoji: '🦊' };
  await step('name and emoji updates reach every client', async () => {
    state = await broadcast(b, rename, peers,
      (s) => player(s, bob.id).name === rename.name, 'name and emoji update');
    assert.equal(player(state, bob.id).emoji, rename.emoji);
    assert.equal(player(state, alice.id).name, alice.name);
  });

  await step('emotes broadcast immediately and clear on a sync after three seconds', async () => {
    state = await broadcast(a, { type: 'emote', playerId: alice.id, emote: '🎉' }, peers,
      (s) => player(s, alice.id).currentEmote === '🎉', 'immediate emote');
    assert.ok(Number.isFinite(player(state, alice.id).emoteTimestamp));
    await delay(3_300);
    state = await broadcast(b, rename, peers,
      (s) => player(s, alice.id).currentEmote === null, 'cleared emote on subsequent sync');
    assert.equal(player(state, alice.id).emoteTimestamp, null);
  });

  await step('reconnecting with the same player ID does not create a duplicate', async () => {
    const before = state;
    await b.close();
    b = await connect('Bob reconnected', room, endpoint);
    peers = [a, b];
    assert.deepEqual(b.state, before);
    state = await broadcast(b, { type: 'join', player: bob }, peers,
      () => true, 'reconnected player join');
    assert.deepEqual(state, before);
    assert.equal(player(state, bob.id).name, rename.name);
    assert.equal(state.players.filter((p) => p.id === bob.id).length, 1);
  });

  await step('leaving removes the first admin and promotes the remaining player', async () => {
    state = await broadcast(a, { type: 'leave', playerId: alice.id }, peers,
      (s) => s.players.length === 1 && s.players[0].id === bob.id, 'admin leave');
    assert.equal(player(state, bob.id).isAdmin, true);
    state = await broadcast(b, { type: 'updateTicket', playerId: bob.id, ticket: 'PP-456' },
      peers, (s) => s.currentTicket === 'PP-456', 'promoted admin ticket update');
  });

  await step('malformed JSON and messages are ignored; a later valid action still works', async () => {
    const before = state;
    const sequences = peers.map((client) => client.sequence);
    const invalidMessages = [
      '{broken json', 'null', '[]', '{}',
      { type: 'unknown' },
      { type: 'join', player: null },
      { type: 'vote', playerId: bob.id, vote: 999 },
      { type: 'updateName', playerId: bob.id, name: 42, emoji: null },
      { type: 'updateTicket', playerId: bob.id, ticket: null },
      new Uint8Array([1, 2, 3]).buffer,
    ];
    for (const message of invalidMessages) b.send(message);
    const ticket = 'PP-789 after malformed frames';
    state = await broadcast(b, { type: 'updateTicket', playerId: bob.id, ticket }, peers,
      (s) => s.currentTicket === ticket, 'valid action after malformed frames');
    assert.deepEqual(state, { ...before, currentTicket: ticket });
    peers.forEach((client, index) => assert.equal(client.sequence, sequences[index] + 1,
      `${client.label}: malformed frames unexpectedly produced a sync`));
  });

  assert.deepEqual(isolated.state, isolatedState, 'Main-room actions changed the isolated room');
  assert.equal(isolated.sequence, isolatedSequence, 'Main-room actions broadcast to another room');
}

try {
  await run();
  console.log('Multiplayer integration passed.');
} catch (error) {
  console.error('Multiplayer integration failed:', error);
  process.exitCode = 1;
} finally {
  await Promise.allSettled([...clients].map((client) => client.close()));
}
