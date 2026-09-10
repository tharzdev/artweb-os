import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Data } from '@/lib/model';

async function ownerId() {
  const h = await headers();
  return h.get('oai-authenticated-user-id') ?? 'local-owner';
}

export async function GET() {
  if (!env.DB) return NextResponse.json({ data: null });
  const owner = await ownerId();
  const row = await env.DB.prepare('SELECT data FROM workspace_state WHERE owner_id = ?').bind(owner).first<{ data: string }>();
  return NextResponse.json({ data: row ? JSON.parse(row.data) : null });
}

export async function PUT(request: Request) {
  if (!env.DB) return NextResponse.json({ error: 'Armazenamento indisponível.' }, { status: 503 });
  const data = await request.json() as Data;
  if (!Array.isArray(data.tasks) || !Array.isArray(data.projects) || !Array.isArray(data.notes)) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }
  const owner = await ownerId();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO workspace_state (owner_id, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(owner_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`)
    .bind(owner, JSON.stringify(data), now).run();
  return NextResponse.json({ ok: true, updatedAt: now });
}
