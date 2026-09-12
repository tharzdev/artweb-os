import { env } from 'cloudflare:workers';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { placesCredential, searchPlaces } from '@/lib/prospecting';

export async function GET(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const rows=await env.DB.prepare('SELECT id, category, location, min_rating AS minRating, min_reviews AS minReviews, result_count AS resultCount, created_at AS createdAt FROM prospecting_searches WHERE owner_id = ? ORDER BY created_at DESC LIMIT 8').bind(user.id).all();
  return NextResponse.json({searches:rows.results});
}

export async function POST(request:Request){
  if(!env.DB)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {category?:unknown;location?:unknown;minRating?:unknown;minReviews?:unknown;phoneOnly?:unknown}|null;
  const category=typeof body?.category==='string'?body.category.trim():'';const location=typeof body?.location==='string'?body.location.trim():'';
  const minRating=Math.min(5,Math.max(1,Number(body?.minRating)||4.5));const minReviews=Math.min(10000,Math.max(0,Math.round(Number(body?.minReviews)||20)));const phoneOnly=body?.phoneOnly===true;
  if(category.length<2||category.length>80)return NextResponse.json({error:'Informe uma categoria válida.'},{status:400});
  if(location.length<2||location.length>120)return NextResponse.json({error:'Informe uma cidade ou região válida.'},{status:400});
  const since=new Date(Date.now()-60_000).toISOString();const recent=await env.DB.prepare('SELECT COUNT(*) AS total FROM prospecting_searches WHERE owner_id = ? AND created_at >= ?').bind(user.id,since).first<{total:number}>();
  if((recent?.total||0)>=8)return NextResponse.json({error:'Muitas pesquisas em pouco tempo. Aguarde um minuto.'},{status:429});
  const credential=await placesCredential(user.id);if(!credential)return NextResponse.json({error:'Configure a chave do Google Places antes de pesquisar.'},{status:400});
  try{
    const result=await searchPlaces({apiKey:credential.apiKey,category,location,minRating,minReviews,phoneOnly});const now=new Date().toISOString();
    await env.DB.prepare('INSERT INTO prospecting_searches (id, owner_id, category, location, min_rating, min_reviews, result_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(),user.id,category,location,minRating,minReviews,result.matches.length,now).run();
    return NextResponse.json({...result,query:{category,location,minRating,minReviews,phoneOnly},searchedAt:now});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Não foi possível concluir a pesquisa.'},{status:502})}
}
