import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { chmod, mkdir, open } from 'node:fs/promises';
import path from 'node:path';
import { MAX_BYTES, ROOM_PATTERN, parseHost, sha256, validateRoomState,
  verifyBackupDirectory } from './verify-room-backup.mjs';

const USAGE = 'Usage: node scripts/backup-rooms.mjs --host HOST --room ABC123 [--room DEF456] [--out-dir DIRECTORY] [--timeout-ms 10000]';

function parseArgs(args) {
  const options = { rooms: [], timeout: 10000 };
  const seen = new Set();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!['--host', '--room', '--out-dir', '--timeout-ms'].includes(flag) ||
        !value || value.startsWith('--') || (flag !== '--room' && seen.has(flag))) {
      throw new Error(USAGE);
    }
    seen.add(flag);
    if (flag === '--room') options.rooms.push(value);
    if (flag === '--host') options.host = parseHost(value);
    if (flag === '--out-dir') options.directory = value;
    if (flag === '--timeout-ms') {
      if (!/^\d+$/.test(value) || Number(value) < 100 || Number(value) > 60000) {
        throw new Error('Timeout must be an integer between 100 and 60000 milliseconds.');
      }
      options.timeout = Number(value);
    }
  }
  if (!options.host || options.rooms.length === 0 ||
      options.rooms.some((room) => !ROOM_PATTERN.test(room)) ||
      new Set(options.rooms).size !== options.rooms.length) {
    throw new Error('Specify a host and unique known six-character uppercase alphanumeric room codes.');
  }
  if (options.directory && (options.directory.includes('\0') ||
      options.directory.split(/[\\/]/).includes('..'))) {
    throw new Error('Output directory must not contain a parent-directory traversal.');
  }
  options.directory = path.resolve(options.directory || path.join('.backups',
    `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`));
  return options;
}

async function writePrivateFile(filename, bytes) {
  const handle = await open(filename,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try {
    await handle.chmod(0o600);
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function captureInitialSync(host, room, timeout) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/parties/main/${room}`, host.websocketOrigin);
    // A unique observer connection ID avoids colliding with a player's PartySocket.
    url.searchParams.set('_pk', randomUUID());
    const socket = new WebSocket(url);
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Send a valid close code so PartyServer can reciprocate the handshake.
      socket.close(1000, 'Snapshot observer finished');
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => finish(new Error('Timed out waiting for initial sync.')), timeout);
    socket.addEventListener('error', () => finish(new Error('WebSocket connection failed.')));
    socket.addEventListener('close', () => finish(new Error('Connection closed before initial sync.')));
    socket.addEventListener('message', (event) => {
      if (settled) return;
      try {
        if (typeof event.data !== 'string' || Buffer.byteLength(event.data) > MAX_BYTES) {
          throw new Error('Initial sync must be a bounded JSON text message.');
        }
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          throw new Error('Initial sync is not valid JSON.');
        }
        if (message === null || typeof message !== 'object' || message.type !== 'sync') {
          throw new Error('Expected initial sync message.');
        }
        finish(null, { state: validateRoomState(message.state), capturedAt: new Date().toISOString() });
      } catch (error) {
        finish(error);
      }
    });
    // Intentionally never send a join, leave, vote, reveal, or other application action.
  });
}

async function main() {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log(USAGE);
    return;
  }
  if (typeof WebSocket !== 'function') throw new Error('Use Node.js 22 or newer with native WebSocket support.');
  const options = parseArgs(process.argv.slice(2));
  await mkdir(path.dirname(options.directory), { recursive: true, mode: 0o700 });
  // The backup directory must be new. Never reuse or overwrite any existing backup.
  await mkdir(options.directory, { mode: 0o700 });
  await chmod(options.directory, 0o700);
  const manifest = {
    format: 'planning-poker-room-snapshot', version: 1, party: 'main',
    source: { host: options.host.origin, capture: 'initial-websocket-sync' },
    startedAt: new Date().toISOString(), completedAt: null, complete: false,
    requestedRooms: options.rooms, rooms: [], failures: [],
    coverage: 'Only explicitly requested known room IDs; no stored-room export, enumeration, history, or prior-existence proof. Snapshots are per-room observations, not an atomic project snapshot. An empty observed state may be newly initialized.',
  };
  for (const roomId of options.rooms) {
    try {
      const { state, capturedAt } = await captureInitialSync(options.host, roomId, options.timeout);
      const bytes = Buffer.from(`${JSON.stringify(state, null, 2)}\n`);
      if (bytes.length > MAX_BYTES) throw new Error('Serialized snapshot exceeds the size limit.');
      const file = `${roomId}.json`;
      await writePrivateFile(path.join(options.directory, file), bytes);
      manifest.rooms.push({ roomId, file, capturedAt, bytes: bytes.length, sha256: sha256(bytes) });
    } catch (error) {
      manifest.failures.push({ roomId, error: error.code || error.message });
    }
  }
  manifest.completedAt = new Date().toISOString();
  manifest.complete = manifest.failures.length === 0;
  await writePrivateFile(path.join(options.directory, 'manifest.json'),
    Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  if (!manifest.complete) {
    throw new Error(`Incomplete backup: ${manifest.failures.length} requested room(s) failed. Retained available snapshots and manifest in ${options.directory}`);
  }
  // Re-read every file and validate bytes, hashes, permissions, and schema before success.
  const verified = await verifyBackupDirectory(options.directory);
  console.log(`Saved and verified ${verified.count} known-room snapshot(s) in ${options.directory}`);
  console.log(`Manifest SHA-256: ${verified.manifestSha256}`);
  console.log('This captures currently observed state only. Keep the manifest hash separately; restoration requires a separate procedure.');
}

try {
  await main();
} catch (error) {
  console.error(`Room backup failed: ${error.code || error.message}`);
  process.exitCode = 1;
}
