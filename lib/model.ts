export type Task={id:string;title:string;description:string;project:string;status:string;priority:string;due:string;created:string};
export type Project={id:string;name:string;color:string;description:string};
export type Note={id:string;name:string;content:string;updated:string};
export type Data={tasks:Task[];projects:Project[];notes:Note[]};
export const statuses=['Pending','In progress','In review','Success','Submitted','Failed','Expired'];
export const statusLabels:Record<string,string>={Pending:'Pendente','In progress':'Em andamento','In review':'Em revisão',Success:'Concluída',Submitted:'Enviada',Failed:'Falhou',Expired:'Expirada'};
export const emptyData:Data={projects:[],tasks:[],notes:[]};
