import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import type { Data } from '@/lib/model';
import { currentUser } from '@/lib/auth';

export async function GET(request: Request) {
  if (!env.DB) return NextResponse.json({ data: null });
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: 'Sessão necessária.' }, { status: 401 });
  const row = await env.DB.prepare('SELECT data FROM workspace_state WHERE owner_id = ?').bind(user.id).first<{ data: string }>();
  return NextResponse.json({ data: row ? JSON.parse(row.data) : null });
}

export async function PUT(request: Request) {
  if (!env.DB) return NextResponse.json({ error: 'Armazenamento indisponível.' }, { status: 503 });
  const data = await request.json() as Data;
  if (!Array.isArray(data.tasks) || !Array.isArray(data.projects) || !Array.isArray(data.notes) ||
    !Array.isArray(data.leads) || !Array.isArray(data.clients) || !Array.isArray(data.memories) || !Array.isArray(data.activities) ||
    !data.profile || typeof data.profile !== 'object' || !data.preferences || typeof data.preferences !== 'object') {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: 'Sessão necessária.' }, { status: 401 });
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO workspace_state (owner_id, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(owner_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    .bind(user.id, JSON.stringify(data), now).run();
  return NextResponse.json({ ok: true, updatedAt: now });
}
