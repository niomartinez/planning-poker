import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOM_PATTERN = /^[A-Z0-9]{6}$/;
export const MAX_BYTES = 16 * 1024 * 1024;
const FORMAT = 'planning-poker-room-snapshot';
const votes = new Set([1, 2, 3, 5, 8, 13, 21, 'pass', '?']);
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isOptional = (value, predicate) => value === undefined || predicate(value);
const isTimestamp = (value) => typeof value === 'string' &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

export function parseHost(input) {
  if (typeof input !== 'string' || !input || /[\s\\]/.test(input)) {
    throw new Error('Host must be a hostname or an HTTP(S)/WS(S) origin.');
  }
  let url;
  try {
    url = new URL(input.includes('://') ? input : `https://${input}`);
  } catch {
    throw new Error('Invalid host.');
  }
  if (!['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) || !url.hostname ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      /[?#@]/.test(input)) {
    throw new Error('Host must not include credentials, a path, query, or fragment.');
  }
  // Reject URL parser normalization of dot paths and backslashes.
  const authority = input.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  if (authority.includes('/') && !authority.endsWith('/') ||
      authority.slice(0, -1).includes('/')) {
    throw new Error('Host must not include a path.');
  }
  const secure = url.protocol === 'https:' || url.protocol === 'wss:';
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!secure && !loopback) throw new Error('Use a secure origin for a remote host.');
  return {
    origin: `${secure ? 'https:' : 'http:'}//${url.host}`,
    websocketOrigin: `${secure ? 'wss:' : 'ws:'}//${url.host}`,
  };
}

function assertPlainJson(value, depth = 0) {
  if (depth > 64) throw new Error('Room state exceeds the supported nesting depth.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    for (const item of value) assertPlainJson(item, depth + 1);
    return;
  }
  if (isRecord(value) && Object.getPrototypeOf(value) === Object.prototype) {
    for (const item of Object.values(value)) assertPlainJson(item, depth + 1);
    return;
  }
  throw new Error('Room state must contain only plain JSON values.');
}

export function validateRoomState(state) {
  assertPlainJson(state);
  if (!isRecord(state) || !Array.isArray(state.players) ||
      typeof state.isRevealed !== 'boolean' ||
      !isOptional(state.currentTicket, (value) => typeof value === 'string')) {
    throw new Error('Initial sync has an invalid RoomState.');
  }
  for (const player of state.players) {
    if (!isRecord(player) || typeof player.id !== 'string' || typeof player.name !== 'string' ||
        typeof player.emoji !== 'string' || !(player.vote === null || votes.has(player.vote)) ||
        typeof player.hasVoted !== 'boolean' ||
        !isOptional(player.currentEmote, (value) => value === null || typeof value === 'string') ||
        !isOptional(player.emoteTimestamp, (value) => value === null ||
          typeof value === 'number' && Number.isFinite(value)) ||
        !isOptional(player.isAdmin, (value) => typeof value === 'boolean')) {
      throw new Error('Initial sync has an invalid player.');
    }
  }
  // Unknown JSON fields are deliberately retained in the saved state.
  return state;
}

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function readPrivateFile(filename, limit = MAX_BYTES) {
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || (stat.mode & 0o777) !== 0o600 || stat.size > limit) {
      throw new Error('Backup files must be regular files with mode 0600 and within the size limit.');
    }
    const bytes = await handle.readFile();
    if (bytes.length > limit) throw new Error('Backup file exceeds the size limit.');
    return bytes;
  } finally {
    await handle.close();
  }
}

export async function verifyBackupDirectory(directory) {
  const root = path.resolve(directory);
  const stat = await lstat(root);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o777) !== 0o700) {
    throw new Error('Backup directory must be a real directory with mode 0700.');
  }
  const manifestBytes = await readPrivateFile(path.join(root, 'manifest.json'), 1024 * 1024);
  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch {
    throw new Error('Backup manifest is not valid JSON.');
  }
  if (!isRecord(manifest) || manifest.format !== FORMAT || manifest.version !== 1 ||
      manifest.party !== 'main' || !isRecord(manifest.source) ||
      manifest.source.capture !== 'initial-websocket-sync' ||
      !isTimestamp(manifest.startedAt) || !isTimestamp(manifest.completedAt) ||
      manifest.startedAt > manifest.completedAt ||
      !Array.isArray(manifest.requestedRooms) || manifest.requestedRooms.length === 0 ||
      !manifest.requestedRooms.every((room) => typeof room === 'string' && ROOM_PATTERN.test(room)) ||
      new Set(manifest.requestedRooms).size !== manifest.requestedRooms.length ||
      !Array.isArray(manifest.rooms) || !Array.isArray(manifest.failures)) {
    throw new Error('Backup manifest has an invalid schema.');
  }
  if (parseHost(manifest.source.host).origin !== manifest.source.host) {
    throw new Error('Backup source host is not a canonical origin.');
  }
  if (manifest.complete !== true || manifest.failures.length !== 0 ||
      manifest.rooms.length !== manifest.requestedRooms.length) {
    throw new Error('Backup is incomplete; at least one requested room was not captured.');
  }
  const expected = new Set(['manifest.json']);
  const seen = new Set();
  for (const room of manifest.rooms) {
    if (!isRecord(room) || typeof room.roomId !== 'string' || !ROOM_PATTERN.test(room.roomId) ||
        !manifest.requestedRooms.includes(room.roomId) || seen.has(room.roomId) ||
        room.file !== `${room.roomId}.json` || !isTimestamp(room.capturedAt) ||
        room.capturedAt < manifest.startedAt || room.capturedAt > manifest.completedAt ||
        !Number.isSafeInteger(room.bytes) || room.bytes <= 0 || room.bytes > MAX_BYTES ||
        typeof room.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(room.sha256)) {
      throw new Error('Backup room metadata has an invalid schema or unsafe path.');
    }
    seen.add(room.roomId);
    expected.add(room.file);
    const bytes = await readPrivateFile(path.join(root, room.file));
    if (bytes.length !== room.bytes || sha256(bytes) !== room.sha256) {
      throw new Error('Snapshot bytes or SHA-256 do not match the manifest.');
    }
    let state;
    try {
      state = JSON.parse(bytes.toString('utf8'));
    } catch {
      throw new Error('A room snapshot is not valid JSON.');
    }
    validateRoomState(state);
  }
  const files = await readdir(root);
  if (files.length !== expected.size || files.some((file) => !expected.has(file))) {
    throw new Error('Backup directory contains unexpected or missing files.');
  }
  return { count: seen.size, manifestSha256: sha256(manifestBytes) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (process.argv.length === 3 && process.argv[2] === '--help') {
    console.log('Usage: node scripts/verify-room-backup.mjs BACKUP_DIRECTORY');
  } else if (process.argv.length !== 3) {
    console.error('Usage: node scripts/verify-room-backup.mjs BACKUP_DIRECTORY');
    process.exitCode = 1;
  } else {
    try {
      const result = await verifyBackupDirectory(process.argv[2]);
      console.log(`Verified ${result.count} known-room snapshot(s). Manifest SHA-256: ${result.manifestSha256}`);
      console.log('Checksums establish integrity against this manifest, not complete room coverage or historical existence.');
    } catch (error) {
      console.error(`Backup verification failed: ${error.code || error.message}`);
      process.exitCode = 1;
    }
  }
}
