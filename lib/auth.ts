import { env } from 'cloudflare:workers';

export const SESSION_COOKIE = 'artweb_session';
const SESSION_DAYS = 30;

function toBase64(bytes: Uint8Array) {
  let value = '';
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function randomToken(size = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return toBase64(bytes).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function derivePassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256' }, key, 256);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt);
  return { hash: toBase64(hash), salt: toBase64(salt) };
}

export async function verifyPassword(password: string, storedHash: string, storedSalt: string) {
  const actual = await derivePassword(password, fromBase64(storedSalt));
  const expected = fromBase64(storedHash);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index++) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return toBase64(new Uint8Array(digest));
}

export async function createSession(userId: string) {
  const token = randomToken();
  const id = await tokenHash(token);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_DAYS * 86400_000);
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(createdAt.toISOString()).run();
  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
    .bind(id, userId, expiresAt.toISOString(), createdAt.toISOString()).run();
  return { token, maxAge: SESSION_DAYS * 86400 };
}

export async function deleteSession(token: string | null) {
  if (!token || !env.DB) return;
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(await tokenHash(token)).run();
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

export type AuthUser = { id: string; name: string; email: string };

export async function currentUser(request: Request): Promise<AuthUser | null> {
  if (!env.DB) return null;
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const id = await tokenHash(token);
  const now = new Date().toISOString();
  return env.DB.prepare(`SELECT users.id, users.name, users.email
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.id = ? AND sessions.expires_at > ?`).bind(id, now).first<AuthUser>();
}

export function sessionCookie(token: string, maxAge: number) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
