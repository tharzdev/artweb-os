import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { emptyData } from '@/lib/model';

export async function POST(request: Request) {
  if (!env.DB) return NextResponse.json({ error: 'Cadastro temporariamente indisponível.' }, { status: 503 });
  const body = await request.json().catch(() => null) as { name?: string; email?: string; password?: string } | null;
  const name = body?.name?.trim() || '';
  const email = body?.email?.trim().toLowerCase() || '';
  const password = body?.password || '';
  if (name.length < 2) return NextResponse.json({ error: 'Informe seu nome.' }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'A senha precisa ter pelo menos 8 caracteres.' }, { status: 400 });
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return NextResponse.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 409 });
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const credentials = await hashPassword(password);
  await env.DB.batch([
    env.DB.prepare('INSERT INTO users (id, name, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, name, email, credentials.hash, credentials.salt, now),
    env.DB.prepare('INSERT INTO workspace_state (owner_id, data, updated_at) VALUES (?, ?, ?)')
      .bind(id, JSON.stringify(emptyData), now),
  ]);
  return NextResponse.json({ ok: true, email }, { status: 201 });
}
