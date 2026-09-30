'use client';

import { useEffect, useState } from 'react';
import { Bot, Check, Clipboard, LoaderCircle, MessageSquareText, Sparkles, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Lead } from '@/lib/model';

type Credential={provider:string;model:string};
type Result={analysis:string;message:string;mode:'ai'|'local';provider:string;model:string;notice?:string};

export function LeadOutreachDialog({open,lead,onClose,onSave}:{open:boolean;lead:Lead|null;onClose:()=>void;onSave:(lead:Lead,values:{analysis:string;message:string;channel:string})=>void}){
  const [channel,setChannel]=useState('whatsapp');const [tone,setTone]=useState('consultivo');const [goal,setGoal]=useState('landing');const [provider,setProvider]=useState('');const [credentials,setCredentials]=useState<Credential[]>([]);
  const [analysis,setAnalysis]=useState(lead?.outreachAnalysis||'');const [message,setMessage]=useState(lead?.outreachMessage||'');const [result,setResult]=useState<Result|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [copied,setCopied]=useState(false);
  useEffect(()=>{if(!open)return;fetch('/api/ai/credentials').then(async response=>response.ok?await response.json():{credentials:[]}).then(value=>{const list=(value.credentials||[]) as Credential[];setCredentials(list);setProvider(current=>current&&list.some(item=>item.provider===current)?current:list[0]?.provider||'')}).catch(()=>setCredentials([]))},[open]);
  if(!lead)return null;
  const selectedLead=lead;
  async function generate(){setBusy(true);setError('');setCopied(false);try{const response=await fetch('/api/ai/lead-message',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:provider||undefined,lead:selectedLead,channel,tone,goal})});const value=await response.json() as Result&{error?:string};if(!response.ok)throw new Error(value.error||'Não foi possível criar a abordagem.');setResult(value);setAnalysis(value.analysis);setMessage(value.message)}catch(reason){setError(reason instanceof Error?reason.message:'Não foi possível criar a abordagem.')}finally{setBusy(false)}}
  async function copy(){if(!message)return;await navigator.clipboard.writeText(message);setCopied(true);window.setTimeout(()=>setCopied(false),1800)}
  function save(){if(!analysis.trim()||!message.trim())return;onSave(selectedLead,{analysis:analysis.trim(),message:message.trim(),channel});onClose()}
  return <Dialog open={open} onOpenChange={value=>!value&&onClose()}><DialogContent className="app-dialog lead-outreach-dialog"><DialogHeader><DialogTitle>Analisar e criar abordagem</DialogTitle><DialogDescription>Use os dados do lead para preparar uma primeira mensagem personalizada.</DialogDescription></DialogHeader>
    <div className="lead-outreach-summary"><span>{lead.company.slice(0,1).toUpperCase()}</span><div><strong>{lead.company}</strong><small>{lead.segment||'Segmento não informado'}{lead.city?` · ${lead.city}`:''}</small></div><em><Star/>{lead.rating?lead.rating.toFixed(1):'—'}{lead.reviewCount?` · ${lead.reviewCount.toLocaleString('pt-BR')} avaliações`:''}</em></div>
    <div className="lead-outreach-controls"><label>Canal<select value={channel} onChange={event=>setChannel(event.target.value)}><option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="instagram">Instagram</option></select></label><label>Tom<select value={tone} onChange={event=>setTone(event.target.value)}><option value="consultivo">Consultivo</option><option value="direto">Direto</option><option value="amigavel">Amigável</option></select></label><label>Objetivo<select value={goal} onChange={event=>setGoal(event.target.value)}><option value="landing">Oferecer landing page</option><option value="conversa">Iniciar conversa</option><option value="proposta">Apresentar parceria</option></select></label><label>Inteligência<select value={provider} onChange={event=>setProvider(event.target.value)}><option value="">Automático</option>{credentials.map(item=><option value={item.provider} key={item.provider}>{item.provider} · {item.model}</option>)}</select></label></div>
    <button className="lead-outreach-generate" onClick={()=>void generate()} disabled={busy}>{busy?<LoaderCircle className="spin"/>:<Sparkles/>}{busy?'Analisando o lead…':analysis?'Gerar nova versão':'Criar análise e mensagem'}</button>
    {error&&<div className="lead-outreach-error">{error}</div>}
    {result?.notice&&<div className="lead-outreach-notice"><Bot/><span>{result.notice}</span></div>}
    {(analysis||message)&&<div className="lead-outreach-results"><label><span><Sparkles/>Análise da oportunidade</span><textarea value={analysis} onChange={event=>setAnalysis(event.target.value)} rows={7}/></label><label><span><MessageSquareText/>Mensagem sugerida</span><textarea value={message} onChange={event=>setMessage(event.target.value)} rows={9}/><button type="button" className="lead-copy-button" onClick={()=>void copy()}>{copied?<Check/>:<Clipboard/>}{copied?'Copiada':'Copiar mensagem'}</button></label></div>}
    <DialogFooter><button type="button" className="subtle-button dialog-button" onClick={onClose}>Fechar</button><button className="violet-button" onClick={save} disabled={!analysis.trim()||!message.trim()}><Check/>Salvar no lead</button></DialogFooter>
  </DialogContent></Dialog>;
}
