import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { placesCredential, savePlacesKey, testPlacesKey } from '@/lib/prospecting';

export async function GET(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const credential=await placesCredential(user.id);
  return NextResponse.json({connected:!!credential,lastFour:credential?.lastFour||'',updatedAt:credential?.updatedAt||''});
}

export async function POST(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {apiKey?:unknown}|null;const apiKey=typeof body?.apiKey==='string'?body.apiKey.trim():'';
  if(apiKey.length<20||apiKey.length>300)return NextResponse.json({error:'Informe uma chave válida do Google Places.'},{status:400});
  try{await testPlacesKey(apiKey);await savePlacesKey(user.id,apiKey);return NextResponse.json({connected:true,lastFour:apiKey.slice(-4)})}
  catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Não foi possível validar a chave.'},{status:400})}
}

export async function DELETE(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  await env.DB.prepare('DELETE FROM prospecting_credentials WHERE owner_id = ?').bind(user.id).run();
  return NextResponse.json({connected:false});
}
