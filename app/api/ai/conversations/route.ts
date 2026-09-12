import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';

export async function GET(request:Request){
  if(!env.DB)return NextResponse.json({conversations:[]});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const id=new URL(request.url).searchParams.get('id');
  if(id){
    const conversation=await env.DB.prepare('SELECT id, title, provider, model, pinned, created_at AS createdAt, updated_at AS updatedAt FROM ai_conversations WHERE id = ? AND owner_id = ?').bind(id,user.id).first();
    if(!conversation)return NextResponse.json({error:'Conversa não encontrada.'},{status:404});
    const messages=await env.DB.prepare('SELECT id, role, content, sources, created_at AS createdAt FROM ai_messages WHERE conversation_id = ? AND owner_id = ? ORDER BY created_at ASC').bind(id,user.id).all<{id:string;role:string;content:string;sources:string;createdAt:string}>();
    return NextResponse.json({conversation,messages:messages.results.map(message=>({...message,sources:JSON.parse(message.sources||'[]')}))});
  }
  const rows=await env.DB.prepare(`SELECT id, title, provider, model, pinned, created_at AS createdAt, updated_at AS updatedAt FROM ai_conversations WHERE owner_id = ? ORDER BY pinned DESC, updated_at DESC LIMIT 50`).bind(user.id).all();
  return NextResponse.json({conversations:rows.results});
}

export async function POST(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {provider?:string;model?:string}|null;if(!body?.provider||!body.model)return NextResponse.json({error:'Provedor e modelo são obrigatórios.'},{status:400});
  const id=crypto.randomUUID();const now=new Date().toISOString();await env.DB.prepare('INSERT INTO ai_conversations (id, owner_id, title, provider, model, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)').bind(id,user.id,'Nova conversa',body.provider,body.model,now,now).run();
  return NextResponse.json({conversation:{id,title:'Nova conversa',provider:body.provider,model:body.model,pinned:0,createdAt:now,updatedAt:now}},{status:201});
}

export async function PATCH(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {id?:string;title?:string;pinned?:boolean}|null;if(!body?.id)return NextResponse.json({error:'Conversa inválida.'},{status:400});
  const current=await env.DB.prepare('SELECT title, pinned FROM ai_conversations WHERE id = ? AND owner_id = ?').bind(body.id,user.id).first<{title:string;pinned:number}>();if(!current)return NextResponse.json({error:'Conversa não encontrada.'},{status:404});
  await env.DB.prepare('UPDATE ai_conversations SET title = ?, pinned = ?, updated_at = ? WHERE id = ? AND owner_id = ?').bind(body.title?.trim().slice(0,80)||current.title,typeof body.pinned==='boolean'?(body.pinned?1:0):current.pinned,new Date().toISOString(),body.id,user.id).run();return NextResponse.json({ok:true});
}

export async function DELETE(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {id?:string}|null;if(!body?.id)return NextResponse.json({error:'Conversa inválida.'},{status:400});
  await env.DB.batch([env.DB.prepare('DELETE FROM ai_messages WHERE conversation_id = ? AND owner_id = ?').bind(body.id,user.id),env.DB.prepare('DELETE FROM ai_conversations WHERE id = ? AND owner_id = ?').bind(body.id,user.id)]);return NextResponse.json({ok:true});
}
