import { env } from 'cloudflare:workers';
import { decryptScopedSecret, encryptScopedSecret } from '@/lib/ai';

const scope='google_places';
const endpoint='https://places.googleapis.com/v1/places:searchText';
const fieldMask=['places.id','places.displayName','places.formattedAddress','places.nationalPhoneNumber','places.rating','places.userRatingCount','places.websiteUri','places.googleMapsUri','places.primaryTypeDisplayName','places.businessStatus'].join(',');

export type ProspectingResult={id:string;name:string;category:string;address:string;phone:string;rating:number;reviewCount:number;mapsUrl:string;businessStatus:string;score:number};
type GooglePlace={id?:string;displayName?:{text?:string};formattedAddress?:string;nationalPhoneNumber?:string;rating?:number;userRatingCount?:number;websiteUri?:string;googleMapsUri?:string;primaryTypeDisplayName?:{text?:string};businessStatus?:string};

function placesError(status:number,detail:string){
  if(status===400)return 'A pesquisa contém filtros inválidos.';
  if(status===401||status===403)return 'A chave foi recusada. Ative a Places API (New) e confira as restrições da chave.';
  if(status===429)return 'O limite de consultas do Google Places foi atingido.';
  if(status>=500)return 'O Google Places está temporariamente indisponível. Tente novamente.';
  try{const parsed=JSON.parse(detail) as {error?:{message?:string}};if(parsed.error?.message)return parsed.error.message.slice(0,220)}catch{}
  return `O Google Places respondeu com erro ${status}.`;
}

async function placesRequest(apiKey:string,body:Record<string,unknown>,fields=fieldMask){
  const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':apiKey,'x-goog-fieldmask':fields},body:JSON.stringify(body)});
  if(!response.ok){const detail=await response.text().catch(()=> '');throw new Error(placesError(response.status,detail))}
  return response.json() as Promise<{places?:GooglePlace[]}>;
}

export async function testPlacesKey(apiKey:string){
  await placesRequest(apiKey,{textQuery:'cafeteria em São Paulo, SP',pageSize:1,languageCode:'pt-BR'},'places.id');
}

export async function savePlacesKey(ownerId:string,apiKey:string){
  if(!env.DB)throw new Error('Armazenamento indisponível.');
  const encrypted=await encryptScopedSecret(apiKey,ownerId,scope);const now=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO prospecting_credentials (owner_id, ciphertext, iv, last_four, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(owner_id) DO UPDATE SET ciphertext = excluded.ciphertext, iv = excluded.iv, last_four = excluded.last_four, updated_at = excluded.updated_at`).bind(ownerId,encrypted.ciphertext,encrypted.iv,apiKey.slice(-4),now,now).run();
}

export async function placesCredential(ownerId:string){
  if(!env.DB)return null;
  const row=await env.DB.prepare('SELECT ciphertext, iv, last_four AS lastFour, updated_at AS updatedAt FROM prospecting_credentials WHERE owner_id = ?').bind(ownerId).first<{ciphertext:string;iv:string;lastFour:string;updatedAt:string}>();
  if(!row)return null;
  return {...row,apiKey:await decryptScopedSecret(row.ciphertext,row.iv,ownerId,scope)};
}

function opportunityScore(place:GooglePlace){
  let score=35;const rating=place.rating||0;const reviews=place.userRatingCount||0;
  if(rating>=4.7)score+=20;else if(rating>=4.5)score+=14;else score+=8;
  if(reviews>=100)score+=15;else if(reviews>=50)score+=12;else if(reviews>=20)score+=8;
  if(place.nationalPhoneNumber)score+=10;if(place.formattedAddress)score+=8;
  if(!/shopping|store|supermarket|department/i.test(place.primaryTypeDisplayName?.text||''))score+=7;
  return Math.min(score,100);
}

export async function searchPlaces(input:{apiKey:string;category:string;location:string;minRating:number;minReviews:number;phoneOnly:boolean}){
  const result=await placesRequest(input.apiKey,{textQuery:`${input.category} em ${input.location}`,pageSize:20,minRating:input.minRating,languageCode:'pt-BR',includePureServiceAreaBusinesses:true});
  const places=result.places||[];
  const matches=places.filter(place=>!place.websiteUri&&(place.rating||0)>=input.minRating&&(place.userRatingCount||0)>=input.minReviews&&place.businessStatus!=='CLOSED_PERMANENTLY'&&(!input.phoneOnly||!!place.nationalPhoneNumber)).map(place=>({id:place.id||crypto.randomUUID(),name:place.displayName?.text||'Empresa sem nome',category:place.primaryTypeDisplayName?.text||input.category,address:place.formattedAddress||'',phone:place.nationalPhoneNumber||'',rating:place.rating||0,reviewCount:place.userRatingCount||0,mapsUrl:place.googleMapsUri||'',businessStatus:place.businessStatus||'OPERATIONAL',score:opportunityScore(place)} satisfies ProspectingResult)).sort((a,b)=>b.score-a.score||b.reviewCount-a.reviewCount);
  return {analyzed:places.length,matches};
}
