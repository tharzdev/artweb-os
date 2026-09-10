import { NextResponse } from 'next/server';
import { clearSessionCookie, deleteSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
  const header = request.headers.get('cookie') || '';
  const token = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) || null;
  await deleteSession(token);
  const response = NextResponse.json({ ok: true });
  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
