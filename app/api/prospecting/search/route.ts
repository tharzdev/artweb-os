import { db } from '@/lib/database';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { placesCredential, searchPlacesPage, type BusinessSize, type ProspectingCursor, type ProspectingResult, type WebsitePresence } from '@/lib/prospecting';

type SearchBody={categories?:unknown;locations?:unknown;category?:unknown;location?:unknown;minRating?:unknown;minReviews?:unknown;phoneOnly?:unknown;websitePresence?:unknown;businessSize?:unknown;operationalOnly?:unknown;cursor?:unknown;searchId?:unknown};
const websiteValues=new Set<WebsitePresence>(['any','with','without']);
const sizeValues=new Set<BusinessSize>(['any','local','small','medium','large']);

function list(value:unknown,fallback:unknown,max:number){
  const source=Array.isArray(value)?value:typeof value==='string'?value.split(/[\n;]+/):typeof fallback==='string'?[fallback]:[];
  return [...new Set(source.filter((item):item is string=>typeof item==='string').map(item=>item.trim()).filter(item=>item.length>=2&&item.length<=120))].slice(0,max);
}

function cursorFrom(value:unknown,total:number):ProspectingCursor{
  if(!value||typeof value!=='object')return {queryIndex:0};
  const raw=value as {queryIndex?:unknown;pageToken?:unknown};
  const queryIndex=Math.min(total,Math.max(0,Math.floor(Number(raw.queryIndex)||0)));
  const pageToken=typeof raw.pageToken==='string'&&raw.pageToken.length<=4096?raw.pageToken:'';
  return {queryIndex,...(pageToken?{pageToken}: {})};
}

export async function GET(request:Request){
  if(!db.available)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const rows=await db.prepare('SELECT id, category, location, min_rating AS "minRating", min_reviews AS "minReviews", result_count AS "resultCount", created_at AS "createdAt" FROM prospecting_searches WHERE owner_id = ? ORDER BY created_at DESC LIMIT 8').bind(user.id).all();
  return NextResponse.json({searches:rows.results});
}

export async function POST(request:Request){
  if(!db.available)return NextResponse.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as SearchBody|null;
  const categories=list(body?.categories,body?.category,25);const locations=list(body?.locations,body?.location,25);
  if(!categories.length)return NextResponse.json({error:'Informe ao menos uma categoria válida.'},{status:400});
  if(!locations.length)return NextResponse.json({error:'Informe ao menos uma cidade ou região válida.'},{status:400});
  const minRating=Math.min(5,Math.max(0,Number(body?.minRating)||0));const minReviews=Math.min(100000,Math.max(0,Math.round(Number(body?.minReviews)||0)));const phoneOnly=body?.phoneOnly===true;const operationalOnly=body?.operationalOnly!==false;
  const websitePresence=websiteValues.has(body?.websitePresence as WebsitePresence)?body?.websitePresence as WebsitePresence:'without';
  const businessSize=sizeValues.has(body?.businessSize as BusinessSize)?body?.businessSize as BusinessSize:'any';
  const combinations=categories.flatMap(category=>locations.map(location=>({category,location})));
  let searchId=typeof body?.searchId==='string'&&body.searchId.length<=80?body.searchId:'';
  if(searchId){
    const owned=await db.prepare('SELECT id FROM prospecting_searches WHERE id = ? AND owner_id = ?').bind(searchId,user.id).first();
    if(!owned)return NextResponse.json({error:'Esta sessão de busca não é válida.'},{status:400});
  }else{
    const since=new Date(Date.now()-60_000).toISOString();const recent=await db.prepare('SELECT COUNT(*) AS total FROM prospecting_searches WHERE owner_id = ? AND created_at >= ?').bind(user.id,since).first<{total:number}>();
    if((recent?.total||0)>=4)return NextResponse.json({error:'Muitas buscas novas em pouco tempo. Aguarde um minuto ou continue uma busca em andamento.'},{status:429});
    searchId=crypto.randomUUID();const now=new Date().toISOString();
    await db.prepare('INSERT INTO prospecting_searches (id, owner_id, category, location, min_rating, min_reviews, result_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(searchId,user.id,categories.join(' · '),locations.join(' · '),minRating,minReviews,0,now).run();
  }
  const credential=await placesCredential(user.id);if(!credential)return NextResponse.json({error:'Configure a chave do Google Places antes de pesquisar.'},{status:400});
  let cursor=cursorFrom(body?.cursor,combinations.length);let analyzed=0;const matches:ProspectingResult[]=[];
  try{
    for(let requestIndex=0;requestIndex<3&&cursor.queryIndex<combinations.length;requestIndex++){
      const query=combinations[cursor.queryIndex];
      const page=await searchPlacesPage({apiKey:credential.apiKey,...query,minRating,minReviews,phoneOnly,websitePresence,businessSize,operationalOnly,pageToken:cursor.pageToken});
      analyzed+=page.analyzed;matches.push(...page.matches);
      cursor=page.nextPageToken?{queryIndex:cursor.queryIndex,pageToken:page.nextPageToken}:{queryIndex:cursor.queryIndex+1};
    }
    const unique=[...new Map(matches.map(item=>[item.id,item])).values()];
    await db.prepare('UPDATE prospecting_searches SET result_count = result_count + ? WHERE id = ? AND owner_id = ?').bind(unique.length,searchId,user.id).run();
    const exhausted=cursor.queryIndex>=combinations.length;
    return NextResponse.json({matches:unique,analyzed,searchId,nextCursor:exhausted?null:cursor,exhausted,queryProgress:{current:Math.min(cursor.queryIndex+1,combinations.length),total:combinations.length},filters:{categories,locations,minRating,minReviews,phoneOnly,websitePresence,businessSize,operationalOnly}});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Não foi possível concluir este lote da busca.',searchId},{status:502})}
}
