import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { clearSessionCookie, currentUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: 'Sessão necessária.' }, { status: 401 });
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
