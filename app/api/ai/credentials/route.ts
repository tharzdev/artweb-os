import { db } from '@/lib/database';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { credentialFor, encryptApiKey, listCredentials, normalizedEndpoint, providerDefaults, testProvider, type AIProvider } from '@/lib/ai';

function isProvider(value:unknown):value is AIProvider{return typeof value==='string'&&value in providerDefaults}

export async function GET(request:Request){
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  return NextResponse.json({credentials:await listCredentials(user.id),providers:Object.entries(providerDefaults).map(([id,value])=>({id,...value}))});
}

export async function POST(request:Request){
  if(!db.available)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {provider?:unknown;apiKey?:unknown;model?:unknown;endpoint?:unknown}|null;
  if(!isProvider(body?.provider))return NextResponse.json({error:'Selecione um provedor válido.'},{status:400});
  const provider=body.provider;const model=String(body?.model||providerDefaults[provider].model).trim();const endpoint=normalizedEndpoint(provider,String(body?.endpoint||''));
  if(!model)return NextResponse.json({error:'Informe o modelo.'},{status:400});
  const supplied=String(body?.apiKey||'').trim();const existing=supplied?null:await credentialFor(user.id,provider);const apiKey=supplied||existing?.apiKey||'';
  if(!apiKey)return NextResponse.json({error:'Informe a chave de API.'},{status:400});
  try{await testProvider(provider,apiKey,endpoint)}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Não foi possível validar a conexão.'},{status:400})}
  const encrypted=supplied?await encryptApiKey(apiKey,user.id,provider):{ciphertext:existing!.ciphertext,iv:existing!.iv};const now=new Date().toISOString();
  await db.prepare(`INSERT INTO ai_credentials (owner_id, provider, ciphertext, iv, last_four, model, endpoint, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_id, provider) DO UPDATE SET ciphertext=excluded.ciphertext, iv=excluded.iv, last_four=excluded.last_four, model=excluded.model, endpoint=excluded.endpoint, updated_at=excluded.updated_at`)
    .bind(user.id,provider,encrypted.ciphertext,encrypted.iv,apiKey.slice(-4),model,endpoint,now,now).run();
  return NextResponse.json({ok:true,credential:{provider,model,endpoint,lastFour:apiKey.slice(-4),updatedAt:now}});
}

export async function DELETE(request:Request){
  if(!db.available)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {provider?:unknown}|null;if(!isProvider(body?.provider))return NextResponse.json({error:'Provedor inválido.'},{status:400});
  await db.prepare('DELETE FROM ai_credentials WHERE owner_id = ? AND provider = ?').bind(user.id,body.provider).run();
  return NextResponse.json({ok:true});
}
