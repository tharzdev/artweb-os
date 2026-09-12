import { env } from 'cloudflare:workers';
import { currentUser } from '@/lib/auth';
import { buildWorkspaceContext, credentialFor, streamProvider, type AIMessage } from '@/lib/ai';
import { normalizeData, type Data } from '@/lib/model';

const encoder=new TextEncoder();
function event(type:string,value:unknown){return encoder.encode(`${JSON.stringify({type,...(typeof value==='object'?value:{value})})}\n`)}

export async function POST(request:Request){
  if(!env.DB)return Response.json({error:'Armazenamento indisponível.'},{status:503});
  const user=await currentUser(request);if(!user)return Response.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as {conversationId?:string|null;provider?:string;message?:string}|null;const message=body?.message?.trim()||'';
  if(!body?.provider||!message)return Response.json({error:'Mensagem e provedor são obrigatórios.'},{status:400});
  if(message.length>12000)return Response.json({error:'A mensagem precisa ter no máximo 12.000 caracteres.'},{status:400});
  const oneMinuteAgo=new Date(Date.now()-60_000).toISOString();const recent=await env.DB.prepare("SELECT COUNT(*) AS total FROM ai_messages WHERE owner_id = ? AND role = 'user' AND created_at >= ?").bind(user.id,oneMinuteAgo).first<{total:number}>();
  if((recent?.total||0)>=20)return Response.json({error:'Muitas mensagens em pouco tempo. Aguarde um minuto e tente novamente.'},{status:429});
  const credential=await credentialFor(user.id,body.provider);if(!credential)return Response.json({error:'Configure a chave desse provedor antes de conversar.'},{status:400});
  let conversationId=body.conversationId||'';const conversation=conversationId?await env.DB.prepare('SELECT id FROM ai_conversations WHERE id = ? AND owner_id = ?').bind(conversationId,user.id).first():null;
  const now=new Date().toISOString();if(!conversation){conversationId=crypto.randomUUID();await env.DB.prepare('INSERT INTO ai_conversations (id, owner_id, title, provider, model, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)').bind(conversationId,user.id,message.slice(0,58),credential.provider,credential.model,now,now).run()}
  const lastMessage=await env.DB.prepare('SELECT id, role FROM ai_messages WHERE conversation_id = ? AND owner_id = ? ORDER BY created_at DESC LIMIT 1').bind(conversationId,user.id).first<{id:string;role:string}>();
  if(lastMessage?.role==='user')await env.DB.prepare('DELETE FROM ai_messages WHERE id = ? AND owner_id = ?').bind(lastMessage.id,user.id).run();
  const history=await env.DB.prepare(`SELECT role, content FROM (SELECT role, content, created_at FROM ai_messages WHERE conversation_id = ? AND owner_id = ? ORDER BY created_at DESC LIMIT 16) ORDER BY created_at ASC`).bind(conversationId,user.id).all<AIMessage>();
  const workspace=await env.DB.prepare('SELECT data FROM workspace_state WHERE owner_id = ?').bind(user.id).first<{data:string}>();const data=normalizeData(JSON.parse(workspace?.data||'{}') as Partial<Data>);
  const {sources,context}=buildWorkspaceContext(data,message);const userMessageId=crypto.randomUUID();
  await env.DB.prepare('INSERT INTO ai_messages (id, conversation_id, owner_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(userMessageId,conversationId,user.id,'user',message,'[]',now).run();
  const aborter=new AbortController();request.signal.addEventListener('abort',()=>aborter.abort(),{once:true});
  const stream=new ReadableStream<Uint8Array>({async start(controller){
    let answer='';controller.enqueue(event('meta',{conversationId,userMessageId,sources,provider:credential.provider,model:credential.model}));controller.enqueue(event('status',{label:'Consultando seu workspace'}));
    try{
      const messages=[...history.results,{role:'user' as const,content:message}];
      for await(const delta of streamProvider({provider:credential.provider,apiKey:credential.apiKey,endpoint:credential.endpoint,model:credential.model,messages,context,signal:aborter.signal,onStatus:label=>controller.enqueue(event('status',{label}))})){answer+=delta;controller.enqueue(event('delta',{text:delta}))}
      if(!answer.trim())throw new Error('O provedor não retornou texto.');
      const completedAt=new Date().toISOString();await env.DB.batch([
        env.DB.prepare('INSERT INTO ai_messages (id, conversation_id, owner_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(crypto.randomUUID(),conversationId,user.id,'assistant',answer,JSON.stringify(sources),completedAt),
        env.DB.prepare('UPDATE ai_conversations SET provider = ?, model = ?, updated_at = ? WHERE id = ? AND owner_id = ?').bind(credential.provider,credential.model,completedAt,conversationId,user.id),
      ]);controller.enqueue(event('done',{sources}));
    }catch(error){
      try{await env.DB.batch([
        env.DB.prepare('DELETE FROM ai_messages WHERE id = ? AND owner_id = ?').bind(userMessageId,user.id),
        env.DB.prepare('DELETE FROM ai_conversations WHERE id = ? AND owner_id = ? AND NOT EXISTS (SELECT 1 FROM ai_messages WHERE conversation_id = ?)').bind(conversationId,user.id,conversationId),
      ])}catch{}
      if(!aborter.signal.aborted)controller.enqueue(event('error',{message:error instanceof Error?error.message:'Não foi possível gerar a resposta.'}))
    }
    finally{controller.close()}
  },cancel(){aborter.abort()}});
  return new Response(stream,{headers:{'content-type':'application/x-ndjson; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
}
