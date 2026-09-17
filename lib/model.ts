export type Task={id:string;title:string;description:string;project:string;clientId?:string;status:string;priority:string;due:string;created:string;assignee?:string};
export type ProjectCanvasNode={id:string;kind:'overview'|'task'|'idea'|'note'|'milestone'|'image'|'file'|'link'|'shape';title:string;content:string;x:number;y:number;width?:number;height?:number;taskId?:string;assetDataUrl?:string;fileName?:string;mimeType?:string;fileSize?:number;url?:string;shapeType?:'rectangle'|'ellipse'|'diamond'|'triangle';fill?:string;stroke?:string};
export type ProjectCanvasConnection={id:string;from:string;to:string;color?:string};
export type ProjectCanvasStroke={id:string;points:string;color:string;width:number;opacity:number;style:'solid'|'dashed'|'dotted'};
export type Project={id:string;name:string;color:string;description:string;clientId?:string;status?:string;priority?:string;due?:string;technologies?:string[];tags?:string[];canvas?:ProjectCanvasNode[];canvasConnections?:ProjectCanvasConnection[];canvasStrokes?:ProjectCanvasStroke[]};
export type Note={id:string;name:string;content:string;updated:string;kind?:'user'|'ai';importance?:Importance;category?:string;projectId?:string;clientId?:string;daily?:boolean;entryType?:'note'|'folder'|'canvas'|'base'|'drawing';parentId?:string;icon?:string;iconColor?:string;bookmarked?:boolean};
export type Importance='Baixa'|'Média'|'Alta'|'Crítica';
export type LeadStatus='Encontrado'|'Analisado'|'Contatado'|'Respondeu'|'Reunião'|'Proposta'|'Negociação'|'Cliente';
export type Lead={id:string;company:string;contact:string;email:string;phone:string;whatsapp:string;instagram:string;site:string;segment:string;city:string;source:string;notes:string;potential:Importance;status:LeadStatus;nextAction:string;created:string;updated:string;externalId?:string;rating?:number;reviewCount?:number;mapsUrl?:string};
export type Client={id:string;name:string;company:string;email:string;phone:string;domain:string;hosting:string;services:string;monthlyFee:number;entryDate:string;owner:string;status:'Ativo'|'Pausado'|'Encerrado';leadId?:string};
export type Memory={id:string;title:string;content:string;importance:Importance;source:'user'|'ai';projectId?:string;clientId?:string;tags:string[];created:string;updated:string};
export type Activity={id:string;type:string;entityType:string;entityId:string;description:string;created:string};
export type Profile={displayName:string;title:string;bio:string;avatarDataUrl:string};
export type Preferences={theme:'dark'|'light'|'system';accent:string;density:'comfortable'|'compact';startView:string;weekStartsOn:'sunday'|'monday';emailNotifications:boolean;deadlineNotifications:boolean;commercialNotifications:boolean;memorySuggestions:boolean;contextBudget:'minimal'|'balanced'|'extended'};
export type Data={version:number;tasks:Task[];projects:Project[];notes:Note[];leads:Lead[];clients:Client[];memories:Memory[];activities:Activity[];profile:Profile;preferences:Preferences};
export const statuses=['Pending','In progress','In review','Success','Submitted','Failed','Expired'];
export const statusLabels:Record<string,string>={Pending:'Pendente','In progress':'Em andamento','In review':'Em revisão',Success:'Concluída',Submitted:'Enviada',Failed:'Falhou',Expired:'Expirada'};
export const leadStatuses:LeadStatus[]=['Encontrado','Analisado','Contatado','Respondeu','Reunião','Proposta','Negociação','Cliente'];
export const defaultProfile:Profile={displayName:'',title:'',bio:'',avatarDataUrl:''};
export const monochromeAccents=['#F4F4F4','#BDBDBD','#858585'] as const;
export const defaultPreferences:Preferences={theme:'dark',accent:monochromeAccents[0],density:'comfortable',startView:'Visão geral',weekStartsOn:'sunday',emailNotifications:true,deadlineNotifications:true,commercialNotifications:true,memorySuggestions:true,contextBudget:'balanced'};
export const emptyData:Data={version:2,projects:[],tasks:[],notes:[],leads:[],clients:[],memories:[],activities:[],profile:defaultProfile,preferences:defaultPreferences};

function normalizeAccent(value?:string){
  const normalized=value?.toUpperCase();
  return monochromeAccents.includes(normalized as typeof monochromeAccents[number])?normalized:defaultPreferences.accent;
}

function normalizeProjectColor(value?:string){
  if(!value)return '#D8D8D8';
  const match=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if(!match)return value;
  const red=Number.parseInt(match[1],16);const green=Number.parseInt(match[2],16);const blue=Number.parseInt(match[3],16);
  return blue>green*1.15&&red>green*1.08?'#D8D8D8':value;
}

export function normalizeData(value:Partial<Data>|null|undefined):Data{
  return {version:2,projects:(value?.projects||[]).map(project=>({...project,color:normalizeProjectColor(project.color)})),tasks:value?.tasks||[],notes:value?.notes||[],leads:value?.leads||[],clients:value?.clients||[],memories:value?.memories||[],activities:value?.activities||[],profile:{...defaultProfile,...value?.profile},preferences:{...defaultPreferences,...value?.preferences,accent:normalizeAccent(value?.preferences?.accent)}};
}
