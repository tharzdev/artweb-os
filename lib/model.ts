export type Task={id:string;title:string;description:string;project:string;clientId?:string;status:string;priority:string;due:string;created:string;assignee?:string};
export type Project={id:string;name:string;color:string;description:string;clientId?:string;status?:string;priority?:string;due?:string;technologies?:string[];tags?:string[]};
export type Note={id:string;name:string;content:string;updated:string;kind?:'user'|'ai';importance?:Importance;category?:string;projectId?:string;clientId?:string;daily?:boolean};
export type Importance='Baixa'|'Média'|'Alta'|'Crítica';
export type LeadStatus='Encontrado'|'Analisado'|'Contatado'|'Respondeu'|'Reunião'|'Proposta'|'Negociação'|'Cliente';
export type Lead={id:string;company:string;contact:string;email:string;phone:string;whatsapp:string;instagram:string;site:string;segment:string;city:string;source:string;notes:string;potential:Importance;status:LeadStatus;nextAction:string;created:string;updated:string};
export type Client={id:string;name:string;company:string;email:string;phone:string;domain:string;hosting:string;services:string;monthlyFee:number;entryDate:string;owner:string;status:'Ativo'|'Pausado'|'Encerrado';leadId?:string};
export type Memory={id:string;title:string;content:string;importance:Importance;source:'user'|'ai';projectId?:string;clientId?:string;tags:string[];created:string;updated:string};
export type Activity={id:string;type:string;entityType:string;entityId:string;description:string;created:string};
export type Data={version:number;tasks:Task[];projects:Project[];notes:Note[];leads:Lead[];clients:Client[];memories:Memory[];activities:Activity[]};
export const statuses=['Pending','In progress','In review','Success','Submitted','Failed','Expired'];
export const statusLabels:Record<string,string>={Pending:'Pendente','In progress':'Em andamento','In review':'Em revisão',Success:'Concluída',Submitted:'Enviada',Failed:'Falhou',Expired:'Expirada'};
export const leadStatuses:LeadStatus[]=['Encontrado','Analisado','Contatado','Respondeu','Reunião','Proposta','Negociação','Cliente'];
export const emptyData:Data={version:1,projects:[],tasks:[],notes:[],leads:[],clients:[],memories:[],activities:[]};

export function normalizeData(value:Partial<Data>|null|undefined):Data{
  return {version:1,projects:value?.projects||[],tasks:value?.tasks||[],notes:value?.notes||[],leads:value?.leads||[],clients:value?.clients||[],memories:value?.memories||[],activities:value?.activities||[]};
}
