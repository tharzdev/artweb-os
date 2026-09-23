import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { credentialFor, listCredentials, streamProvider, type AIProvider } from '@/lib/ai';

type LeadBrief={company:string;contact?:string;phone?:string;site?:string;segment?:string;city?:string;notes?:string;rating?:number;reviewCount?:number;mapsUrl?:string};
type RequestBody={provider?:string;lead?:LeadBrief;channel?:string;tone?:string;goal?:string};

const channels:Record<string,string>={whatsapp:'WhatsApp',email:'e-mail',instagram:'Instagram'};
const tones:Record<string,string>={consultivo:'consultivo e profissional',direto:'direto e objetivo',amigavel:'amigável e próximo'};
const goals:Record<string,string>={landing:'oferecer uma landing page ou site que ajude a empresa a captar mais clientes',conversa:'iniciar uma conversa e entender as necessidades da empresa',proposta:'apresentar uma oportunidade de parceria comercial'};

function clean(value:unknown,limit=1200){return String(value||'').replace(/[\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().slice(0,limit)}
function cleanMultiline(value:unknown,limit=2400){return String(value||'').replace(/\\n/g,'\n').replace(/\r/g,'').replace(/[\t\f\v]+/g,' ').replace(/\n{3,}/g,'\n\n').trim().slice(0,limit)}
function fallback(lead:LeadBrief,channel:string,tone:string,goal:string){
  const reputation=lead.rating?`A empresa tem nota ${lead.rating.toFixed(1)}${lead.reviewCount?` em ${lead.reviewCount.toLocaleString('pt-BR')} avaliações`:''}, o que indica boa validação pública.`:'Ainda não há nota suficiente para medir a reputação pública.';
  const digital=lead.site?'Já existe um site identificado; a abordagem deve destacar conversão, clareza e desempenho, sem presumir que ele esteja ruim.':'Nenhum site foi identificado, criando uma oportunidade clara para apresentar uma presença digital focada em conversão.';
  const analysis=`${reputation} ${digital} O primeiro contato deve ser curto, específico para ${lead.segment||'o segmento'} e terminar com uma pergunta simples para facilitar a resposta.`;
  const greeting=lead.contact?`Olá, ${lead.contact}!`:`Olá, pessoal da ${lead.company}!`;
  const proof=lead.rating?`Vi que a ${lead.company} tem uma ótima presença no Google, com nota ${lead.rating.toFixed(1)}${lead.reviewCount?` e ${lead.reviewCount.toLocaleString('pt-BR')} avaliações`:''}.`: `Conheci o trabalho da ${lead.company} e achei a proposta de vocês muito interessante.`;
  const opportunity=lead.site?'Percebi uma oportunidade de tornar a presença digital mais clara e direcionada para novos contatos.':'Também notei que não encontrei um site próprio, e isso pode estar deixando oportunidades de contato pelo caminho.';
  const message=`${greeting}\n\n${proof} ${opportunity}\n\nTrabalho com projetos digitais para ${lead.segment||'empresas locais'} e posso preparar algumas ideias específicas para vocês, sem compromisso. Faz sentido conversarmos por alguns minutos esta semana?`;
  return {analysis,message,mode:'local' as const,provider:'',model:'',notice:`Rascunho local criado para ${channels[channel]||channel}, com tom ${tones[tone]||tone} e objetivo de ${goals[goal]||goal}. Conecte uma IA para uma análise mais profunda.`};
}

function parseAnswer(value:string){
  const object=value.match(/\{[\s\S]*\}/)?.[0];if(!object)throw new Error('A IA não retornou a análise no formato esperado.');
  const parsed=JSON.parse(object) as {analysis?:unknown;message?:unknown};const analysis=cleanMultiline(parsed.analysis);const message=cleanMultiline(parsed.message);
  if(!analysis||!message)throw new Error('A IA retornou uma análise incompleta.');return{analysis,message};
}

export async function POST(request:Request){
  const user=await currentUser(request);if(!user)return NextResponse.json({error:'Sessão necessária.'},{status:401});
  const body=await request.json().catch(()=>null) as RequestBody|null;const lead=body?.lead;
  if(!lead?.company)return NextResponse.json({error:'Selecione um lead válido.'},{status:400});
  const safeLead:LeadBrief={company:clean(lead.company,140),contact:clean(lead.contact,120),phone:clean(lead.phone,80),site:clean(lead.site,300),segment:clean(lead.segment,140),city:clean(lead.city,140),notes:clean(lead.notes,1400),rating:Number(lead.rating)||undefined,reviewCount:Number(lead.reviewCount)||undefined,mapsUrl:clean(lead.mapsUrl,400)};
  const channel=body?.channel&&body.channel in channels?body.channel:'whatsapp';const tone=body?.tone&&body.tone in tones?body.tone:'consultivo';const goal=body?.goal&&body.goal in goals?body.goal:'landing';
  const credentials=await listCredentials(user.id);const selected=(body?.provider&&credentials.find(item=>item.provider===body.provider))||credentials[0];
  if(!selected)return NextResponse.json(fallback(safeLead,channel,tone,goal));
  const credential=await credentialFor(user.id,selected.provider);if(!credential)return NextResponse.json(fallback(safeLead,channel,tone,goal));
  const facts=[`Empresa: ${safeLead.company}`,`Contato: ${safeLead.contact||'não informado'}`,`Segmento: ${safeLead.segment||'não informado'}`,`Localização: ${safeLead.city||'não informada'}`,`Nota: ${safeLead.rating||'não informada'}`,`Avaliações: ${safeLead.reviewCount||'não informadas'}`,`Site: ${safeLead.site||'não identificado'}`,`Telefone: ${safeLead.phone||'não informado'}`,`Observações: ${safeLead.notes||'nenhuma'}`].join('\n');
  const prompt=`Analise este lead comercial e crie uma primeira mensagem de contato. Use somente os fatos abaixo; não invente problemas, resultados, nomes ou informações. A análise deve explicar sinais positivos, oportunidade digital, risco da abordagem e recomendação de próximo passo. A mensagem deve ser natural, personalizada, sem exageros, sem citar análise, fontes ou IA, sem prometer resultados e terminar com uma pergunta fácil de responder. Canal: ${channels[channel]}. Tom: ${tones[tone]}. Objetivo: ${goals[goal]}. ${channel==='whatsapp'?'Mantenha a mensagem entre 70 e 130 palavras.':channel==='instagram'?'Mantenha a mensagem entre 45 e 90 palavras.':'Inclua uma linha de assunto dentro do campo message e mantenha o corpo entre 100 e 180 palavras.'}\n\nDADOS DO LEAD\n${facts}\n\nRetorne apenas JSON válido neste formato: {"analysis":"texto em português","message":"texto em português com \\n para parágrafos"}`;
  const aborter=new AbortController();request.signal.addEventListener('abort',()=>aborter.abort(),{once:true});let answer='';
  try{
    for await(const delta of streamProvider({provider:credential.provider as AIProvider,apiKey:credential.apiKey,endpoint:credential.endpoint,model:credential.model,messages:[{role:'user',content:prompt}],context:'',signal:aborter.signal})){answer+=delta}
    const result=parseAnswer(answer);return NextResponse.json({...result,mode:'ai',provider:credential.provider,model:credential.model,notice:''});
  }catch(error){const draft=fallback(safeLead,channel,tone,goal);return NextResponse.json({...draft,notice:`A IA não respondeu agora. ${error instanceof Error?error.message:'Foi usado um rascunho local seguro.'}`});}
}
