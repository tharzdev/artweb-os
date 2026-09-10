import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { createSession, sessionCookie, verifyPassword } from '@/lib/auth';

type UserRow = { id: string; name: string; email: string; password_hash: string; password_salt: string };

export async function POST(request: Request) {
  if (!env.DB) return NextResponse.json({ error: 'Login temporariamente indisponível.' }, { status: 503 });
  const body = await request.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = body?.email?.trim().toLowerCase() || '';
  const password = body?.password || '';
  const user = await env.DB.prepare('SELECT id, name, email, password_hash, password_salt FROM users WHERE email = ?')
    .bind(email).first<UserRow>();
  if (!user || !(await verifyPassword(password, user.password_hash, user.password_salt))) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }
  const session = await createSession(user.id);
  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  response.headers.set('Set-Cookie', sessionCookie(session.token, session.maxAge));
  return response;
}
