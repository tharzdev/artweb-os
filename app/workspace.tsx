'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight, CalendarDays, CheckSquare, ChevronDown, ChevronRight,
  CircleCheck, CircleDashed, CircleHelp, CircleX, Clock3, Command,
  FileText, Folder, LayoutDashboard, MessageCircle, Plus, Search,
  Send, Settings, TriangleAlert, User,
} from 'lucide-react';
import {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { seed, statusLabels, statuses, type Data, type Note, type Project, type Task } from '@/lib/model';

const asset = '/assets/';
const nav = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'Tarefas', icon: CheckSquare },
  { label: 'Projetos', icon: Folder },
  { label: 'Calendário', icon: CalendarDays },
  { label: 'Arquivos', icon: FileText },
];

export function Status({ value }: { value: string }) {
  const Icon = ({ Pending: TriangleAlert, 'In progress': CircleDashed, 'In review': MessageCircle, Success: CircleCheck, Submitted: Send, Failed: CircleX, Expired: Clock3 } as Record<string, typeof Clock3>)[value] || CircleDashed;
  return <span className={'status status-' + value.replace(' ', '-').toLowerCase()}><Icon size={13} />{statusLabels[value] || value}</span>;
}

function todayLabel() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toUpperCase();
}

export default function Workspace() {
  const [view, setView] = useState('Visão geral');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<Data>(seed);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('Carregando…');
  const [taskDialog, setTaskDialog] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedNote, setSelectedNote] = useState('n1');
  const [noteDraft, setNoteDraft] = useState('');
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    fetch('/api/workspace').then(r => r.json()).then(async result => {
      const initial = result.data || seed;
      setData(initial);
      setNoteDraft(initial.notes[0]?.content || '');
      setReady(true);
      setSaveState('Tudo salvo');
      if (!result.data) await fetch('/api/workspace', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(seed) });
    }).catch(() => { setReady(true); setSaveState('Modo local'); setNoteDraft(seed.notes[0].content); });
  }, []);

  useEffect(() => {
    if (!ready) return;
    type ModelContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown }, options?: { signal: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'list_workspace_tasks',
      title: 'Listar tarefas',
      description: 'Lista as tarefas visíveis do workspace artweb.so.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ tasks: dataRef.current.tasks.map(({ id, title, status, priority, due }) => ({ id, title, status, priority, due })) }),
    }, { signal: controller.signal })).catch(() => undefined);
    void Promise.resolve(context.registerTool({
      name: 'create_workspace_task',
      title: 'Criar tarefa',
      description: 'Cria uma tarefa no workspace artweb.so e atualiza a interface.',
      inputSchema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, priority: { type: 'string', enum: ['Baixa', 'Média', 'Alta'] }, due: { type: 'string', description: 'Data em YYYY-MM-DD' } }, required: ['title'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async input => {
        const value = input as { title?: string; description?: string; priority?: string; due?: string };
        if (!value.title?.trim()) throw new Error('title é obrigatório');
        const current = dataRef.current;
        const task: Task = { id: crypto.randomUUID(), title: value.title.trim(), description: value.description?.trim() || '', project: current.projects[0].id, status: 'Pending', priority: value.priority || 'Média', due: value.due || new Date().toISOString().slice(0, 10), created: new Date().toISOString().slice(0, 10) };
        const next = { ...current, tasks: [task, ...current.tasks] };
        dataRef.current = next; setData(next); setSaveState('Salvando…');
        const response = await fetch('/api/workspace', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) });
        setSaveState(response.ok ? 'Tudo salvo' : 'Não foi possível salvar');
        if (!response.ok) throw new Error('Não foi possível salvar a tarefa');
        return { task };
      },
    }, { signal: controller.signal })).catch(() => undefined);
    return () => controller.abort();
  }, [ready]);

  async function commit(next: Data) {
    setData(next); setSaveState('Salvando…');
    try {
      const response = await fetch('/api/workspace', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) });
      setSaveState(response.ok ? 'Tudo salvo' : 'Não foi possível salvar');
    } catch { setSaveState('Não foi possível salvar'); }
  }

  const filtered = useMemo(() => data.tasks.filter(t => {
    const p = data.projects.find(item => item.id === t.project)?.name || '';
    return `${t.title} ${t.description} ${p}`.toLowerCase().includes(query.toLowerCase());
  }), [data, query]);
  const project = (id: string) => data.projects.find(p => p.id === id) || data.projects[0];
  const done = data.tasks.filter(t => t.status === 'Success').length;
  const openCount = data.tasks.length - done;

  function navigate(label: string) { setView(label); }
  function openTask(task?: Task) { setEditingTask(task || null); setTaskDialog(true); }
  function saveTask(form: FormData) {
    const task: Task = {
      id: editingTask?.id || crypto.randomUUID(),
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || '').trim(),
      project: String(form.get('project') || data.projects[0]?.id),
      status: String(form.get('status') || 'Pending'),
      priority: String(form.get('priority') || 'Média'),
      due: String(form.get('due') || '2026-09-10'),
      created: editingTask?.created || new Date().toISOString().slice(0, 10),
    };
    if (!task.title) return;
    const tasks = editingTask ? data.tasks.map(t => t.id === task.id ? task : t) : [task, ...data.tasks];
    void commit({ ...data, tasks }); setTaskDialog(false); setEditingTask(null);
  }
  function saveProject(form: FormData) {
    const name = String(form.get('name') || '').trim(); if (!name) return;
    const next: Project = { id: crypto.randomUUID(), name, description: String(form.get('description') || ''), color: String(form.get('color') || '#6550f4') };
    void commit({ ...data, projects: [...data.projects, next] }); setProjectDialog(false);
  }
  function completeTask(task: Task) { void commit({ ...data, tasks: data.tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'Success' ? 'Pending' : 'Success' } : t) }); }
  function saveNote() {
    const notes = data.notes.map(n => n.id === selectedNote ? { ...n, content: noteDraft, updated: new Date().toISOString().slice(0, 10) } : n);
    void commit({ ...data, notes });
  }
  function chooseNote(note: Note) { setSelectedNote(note.id); setNoteDraft(note.content); }

  return <SidebarProvider style={{ '--sidebar-width': '258px' } as React.CSSProperties}>
    <Sidebar className="app-sidebar">
      <SidebarHeader>
        <div className="brand"><span className="brand-mark">a</span><strong>artweb<span>.so</span></strong><SidebarTrigger className="collapse-button" /></div>
        <div className="workspace-switch"><span className="workspace-icon">A</span><span>Meu workspace<small>Workspace pessoal</small></span><ChevronDown size={15} /></div>
        <label className="side-search"><Search size={17} /><input aria-label="Buscar no workspace" placeholder="Buscar..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>⌘ K</kbd></label>
      </SidebarHeader>
      <SidebarContent>
        <div className="nav-label">WORKSPACE</div>
        <SidebarMenu>{nav.map(n => <SidebarMenuItem key={n.label}><SidebarMenuButton className="nav-item" isActive={view === n.label} onClick={() => navigate(n.label)}><n.icon /><span>{n.label}</span>{n.label === 'Tarefas' && <small className="nav-count">{openCount}</small>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
        <div className="sidebar-divider" />
        <div className="nav-label">SEUS PROJETOS <button aria-label="Novo projeto" onClick={() => setProjectDialog(true)}><Plus size={13} /></button></div>
        <div className="project-nav">{data.projects.map(p => <button key={p.id} onClick={() => navigate('Projetos')}><span className="project-dot" style={{ background: p.color }} />{p.name}<ChevronRight size={13} /></button>)}</div>
      </SidebarContent>
      <SidebarFooter>
        <div className="focus-card"><img src={asset + 'A2-cubo.png'} alt="" /><h3>Espaço para grandes ideias.</h3><p>Um passo de cada vez.<br />Seu próximo projeto começa aqui.</p><button className="violet-button" onClick={() => navigate('Projetos')}>Explorar projetos<ArrowUpRight size={15} /></button></div>
        <button className="bottom-nav" onClick={() => navigate('Ajuda')}><CircleHelp size={17} />Ajuda e atalhos</button>
        <DropdownMenu><DropdownMenuTrigger className="account"><img src={asset + 'A5-avatar-paisagem.png'} alt="" /><span>Meu perfil<small>Workspace pessoal</small></span><ChevronDown size={16} /></DropdownMenuTrigger><DropdownMenuContent side="top" align="start" className="account-menu"><DropdownMenuItem onClick={() => navigate('Configurações')}><User />Perfil</DropdownMenuItem><DropdownMenuItem onClick={() => navigate('Configurações')}><Settings />Configurações</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => navigate('Ajuda')}><Command />Atalhos de teclado</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </SidebarFooter>
    </Sidebar>

    <main className="main-surface">
      <header className="topbar"><div><SidebarTrigger className="mobile-trigger" /><LayoutDashboard size={16} /><span>Workspace</span><ChevronRight size={13} /><strong>{view}</strong></div><div><span className="save-state">{ready ? saveState : 'Carregando…'}</span><span className="topbar-divider" /><img className="avatar" src={asset + 'A4-avatar-rosa.png'} alt="Seu perfil" /></div></header>
      {view === 'Visão geral' && <Dashboard data={data} filtered={filtered} done={done} openCount={openCount} project={project} onNavigate={navigate} onNewTask={() => openTask()} onOpenTask={openTask} onComplete={completeTask} onNewProject={() => setProjectDialog(true)} />}
      {view === 'Tarefas' && <TasksView data={data} filtered={filtered} project={project} onNew={() => openTask()} onOpen={openTask} onComplete={completeTask} />}
      {view === 'Projetos' && <ProjectsView data={data} onNew={() => setProjectDialog(true)} onOpenTask={openTask} />}
      {view === 'Calendário' && <CalendarView tasks={filtered} onOpen={openTask} />}
      {view === 'Arquivos' && <FilesView notes={data.notes} selected={selectedNote} draft={noteDraft} onChoose={chooseNote} onDraft={setNoteDraft} onSave={saveNote} />}
      {view === 'Ajuda' && <SimpleView title="Ajuda e atalhos" text="Use a navegação lateral para alternar entre tarefas, projetos, calendário e arquivos. Pressione ⌘ K para começar uma busca." icon={CircleHelp} />}
      {view === 'Configurações' && <SimpleView title="Configurações" text="Seu workspace é privado e salva as mudanças automaticamente. Novas preferências aparecerão aqui." icon={Settings} />}
    </main>

    <TaskDialog open={taskDialog} task={editingTask} projects={data.projects} onClose={() => setTaskDialog(false)} onSave={saveTask} />
    <ProjectDialog open={projectDialog} onClose={() => setProjectDialog(false)} onSave={saveProject} />
  </SidebarProvider>;
}

function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}<span className="wave">✳</span></h1><p>{detail}</p></div>{action}</div>;
}

function Dashboard({ data, filtered, done, openCount, project, onNavigate, onNewTask, onOpenTask, onComplete, onNewProject }: { data: Data; filtered: Task[]; done: number; openCount: number; project: (id: string) => Project; onNavigate: (v: string) => void; onNewTask: () => void; onOpenTask: (t: Task) => void; onComplete: (t: Task) => void; onNewProject: () => void }) {
  return <div className="page-content"><PageHeading eyebrow={todayLabel()} title="Bom trabalho começa aqui" detail={`${openCount} tarefas em aberto · ${data.projects.length} projetos em movimento`} action={<button className="violet-button" onClick={onNewTask}><Plus size={17} />Nova tarefa</button>} />
    <div className="stats-grid">{[
      { label: 'Total de projetos', value: data.projects.length, img: 'A3-kpi-1.png', sub: 'Todas as suas ideias, organizadas' },
      { label: 'Tarefas em aberto', value: openCount, img: 'A3-kpi-2.png', sub: 'Um próximo passo para cada projeto' },
      { label: 'Em revisão', value: data.tasks.filter(t => t.status === 'In review').length, img: 'A3-kpi-3.png', sub: 'Prontas para um novo olhar' },
      { label: 'Concluídas', value: done, img: 'A3-kpi-2.png', sub: 'Progresso que faz a diferença' },
    ].map(s => <section className="stat-card" key={s.label}><p>{s.label}</p><strong>{String(s.value).padStart(2, '0')}</strong><img src={asset + s.img} alt="" /><small>{s.sub}</small></section>)}</div>
    <div className="overview-grid"><section className="panel tasks-panel"><div className="panel-heading"><h2>Suas próximas tarefas <span>{openCount}</span></h2><button className="text-action" onClick={() => onNavigate('Tarefas')}>Ver todas<ArrowUpRight size={14} /></button></div><TaskTable tasks={filtered.filter(t => t.status !== 'Success').slice(0, 5)} project={project} onOpen={onOpenTask} onComplete={onComplete} /></section><Performance data={data} /></div>
    <section className="panel projects-panel"><div className="panel-heading"><h2>Seus projetos</h2><button className="subtle-button" onClick={onNewProject}><Plus size={14} />Novo projeto</button></div><ProjectsTable data={data} /></section>
    <footer className="page-footer"><span>Um pouco de foco. Muito espaço para criar.</span><span>artweb.so</span></footer>
  </div>;
}

function TaskTable({ tasks, project, onOpen, onComplete }: { tasks: Task[]; project: (id: string) => Project; onOpen: (t: Task) => void; onComplete: (t: Task) => void }) {
  return <Table><TableHeader><TableRow><TableHead>Tarefa</TableHead><TableHead>Projeto</TableHead><TableHead>Status</TableHead><TableHead>Prazo</TableHead></TableRow></TableHeader><TableBody>{tasks.map(t => <TableRow key={t.id} onDoubleClick={() => onOpen(t)}><TableCell><div className="task-name"><button className={'empty-check ' + (t.status === 'Success' ? 'checked' : '')} aria-label="Alternar conclusão" onClick={() => onComplete(t)} />{t.title}</div></TableCell><TableCell><span className="project-name"><Folder size={16} fill={project(t.project).color} color={project(t.project).color} />{project(t.project).name}</span></TableCell><TableCell><Status value={t.status} /></TableCell><TableCell><button className="date-cell" onClick={() => onOpen(t)}>{new Date(t.due + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</button></TableCell></TableRow>)}</TableBody></Table>;
}

function Performance({ data }: { data: Data }) {
  const done = data.tasks.filter(t => t.status === 'Success').length;
  return <section className="panel performance"><div className="panel-heading"><h2>Progresso dos projetos</h2><ArrowUpRight size={16} /></div><div className="performance-value">{Math.round(done / Math.max(data.tasks.length, 1) * 100)}<span>%</span><small>das tarefas concluídas</small></div><div className="bar-chart">{data.projects.slice(0, 5).map(p => { const ts = data.tasks.filter(t => t.project === p.id); const count = ts.filter(t => t.status === 'Success').length; return <div className="bar-group" key={p.id}><div className="bar-track"><div style={{ height: `${count / Math.max(ts.length, 1) * 100}%` }} /><span>{count}/{ts.length}</span></div><small>{p.name.split(' ')[0]}</small></div>; })}</div></section>;
}

function ProjectsTable({ data }: { data: Data }) {
  return <Table><TableHeader><TableRow><TableHead>Nome do projeto</TableHead><TableHead>Status</TableHead><TableHead>Progresso</TableHead><TableHead>Tarefas</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader><TableBody>{data.projects.map(p => { const ts = data.tasks.filter(t => t.project === p.id); const completed = ts.filter(t => t.status === 'Success').length; const pct = Math.round(completed / Math.max(ts.length, 1) * 100); return <TableRow key={p.id}><TableCell><span className="project-name"><Folder size={19} fill={p.color} color={p.color} />{p.name}</span></TableCell><TableCell><Status value={pct === 100 ? 'Success' : 'In progress'} /></TableCell><TableCell><div className="progress-cell"><div className="segmented"><i style={{ width: pct + '%', background: p.color }} /></div>{pct}%</div></TableCell><TableCell>{completed}<span className="muted"> / {ts.length}</span></TableCell><TableCell><span className="owner"><img src={asset + 'A4-avatar-rosa.png'} alt="" />Você</span></TableCell></TableRow>; })}</TableBody></Table>;
}

function TasksView({ data, filtered, project, onNew, onOpen, onComplete }: { data: Data; filtered: Task[]; project: (id: string) => Project; onNew: () => void; onOpen: (t: Task) => void; onComplete: (t: Task) => void }) {
  const columns = ['Pending', 'In progress', 'In review', 'Success'];
  return <div className="page-content"><PageHeading eyebrow="TRABALHO EM MOVIMENTO" title="Tarefas" detail={`${filtered.length} tarefas no workspace`} action={<button className="violet-button" onClick={onNew}><Plus size={17} />Nova tarefa</button>} /><div className="kanban">{columns.map(status => <section className="kanban-column" key={status}><div className="kanban-title"><Status value={status} /><span>{filtered.filter(t => t.status === status).length}</span></div><div className="kanban-cards">{filtered.filter(t => t.status === status).map(t => <article className="task-card" key={t.id} onClick={() => onOpen(t)}><div className="task-card-head"><span className={'priority priority-' + t.priority.toLowerCase()}>{t.priority}</span><button onClick={e => { e.stopPropagation(); onComplete(t); }} aria-label="Concluir tarefa"><CircleCheck size={17} /></button></div><h3>{t.title}</h3><p>{t.description}</p><div className="task-card-foot"><span><Folder size={13} color={project(t.project).color} />{project(t.project).name}</span><span><CalendarDays size={13} />{new Date(t.due + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div></article>)}</div></section>)}</div></div>;
}

function ProjectsView({ data, onNew, onOpenTask }: { data: Data; onNew: () => void; onOpenTask: (t: Task) => void }) {
  return <div className="page-content"><PageHeading eyebrow="TODAS AS FRENTES" title="Projetos" detail={`${data.projects.length} espaços ativos`} action={<button className="violet-button" onClick={onNew}><Plus size={17} />Novo projeto</button>} /><div className="project-grid">{data.projects.map(p => { const tasks = data.tasks.filter(t => t.project === p.id); const done = tasks.filter(t => t.status === 'Success').length; const pct = Math.round(done / Math.max(tasks.length, 1) * 100); return <section className="project-card" key={p.id}><div className="project-card-icon" style={{ background: p.color + '22', color: p.color }}><Folder /></div><span className="project-percent">{pct}%</span><h2>{p.name}</h2><p>{p.description}</p><div className="project-progress"><i style={{ width: pct + '%', background: p.color }} /></div><div className="project-summary"><span>{done} concluídas</span><span>{tasks.length} tarefas</span></div><div className="project-recent">{tasks.slice(0, 3).map(t => <button key={t.id} onClick={() => onOpenTask(t)}><span className={t.status === 'Success' ? 'mini-check done' : 'mini-check'} />{t.title}</button>)}</div></section>; })}</div></div>;
}

function CalendarView({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  const days = Array.from({ length: 35 }, (_, i) => i - 1);
  return <div className="page-content"><PageHeading eyebrow="SETEMBRO DE 2026" title="Calendário" detail="Prazos e entregas do seu workspace" /><section className="calendar panel"><div className="weekdays">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{days.map((day, i) => <div className={'calendar-day ' + (day < 1 || day > 30 ? 'outside' : '')} key={i}><strong>{day > 0 && day <= 30 ? day : day < 1 ? 31 : day - 30}</strong>{tasks.filter(t => Number(t.due.slice(8)) === day).map(t => <button key={t.id} onClick={() => onOpen(t)}><span className={'calendar-dot status-dot-' + t.status.replace(' ', '-').toLowerCase()} />{t.title}</button>)}</div>)}</div></section></div>;
}

function FilesView({ notes, selected, draft, onChoose, onDraft, onSave }: { notes: Note[]; selected: string; draft: string; onChoose: (n: Note) => void; onDraft: (v: string) => void; onSave: () => void }) {
  return <div className="files-layout"><aside className="file-tree"><div className="file-tree-head"><strong>Arquivos</strong><button aria-label="Novo arquivo"><Plus size={16} /></button></div>{notes.map(n => <button className={selected === n.id ? 'active' : ''} key={n.id} onClick={() => onChoose(n)}><FileText size={15} />{n.name}</button>)}<div className="folder-row"><ChevronDown size={14} />Referências</div><span className="file-child">design-spec.md</span><span className="file-child">prompts.md</span></aside><section className="editor"><div className="editor-top"><div><strong>{notes.find(n => n.id === selected)?.name}</strong><span>Markdown</span></div><button className="violet-button" onClick={onSave}>Salvar arquivo</button></div><textarea aria-label="Conteúdo do arquivo" value={draft} onChange={e => onDraft(e.target.value)} spellCheck={false} /></section><aside className="editor-preview"><div className="preview-label">PRÉVIA</div>{draft.split('\n').map((line, i) => line.startsWith('# ') ? <h1 key={i}>{line.slice(2)}</h1> : line.startsWith('## ') ? <h2 key={i}>{line.slice(3)}</h2> : line ? <p key={i}>{line}</p> : <br key={i} />)}</aside></div>;
}

function SimpleView({ title, text, icon: Icon }: { title: string; text: string; icon: typeof Settings }) {
  return <div className="page-content simple-wrap"><section className="panel simple-view"><Icon size={30} /><h1>{title}</h1><p>{text}</p></section></div>;
}

function TaskDialog({ open, task, projects, onClose, onSave }: { open: boolean; task: Task | null; projects: Project[]; onClose: () => void; onSave: (f: FormData) => void }) {
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent className="app-dialog"><DialogHeader><DialogTitle>{task ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle><DialogDescription>Organize o próximo passo e mantenha o trabalho em movimento.</DialogDescription></DialogHeader><form action={onSave} className="form-grid"><label>Título<input name="title" defaultValue={task?.title} required autoFocus /></label><label>Descrição<textarea name="description" defaultValue={task?.description} rows={3} /></label><div className="form-row"><label>Projeto<select name="project" defaultValue={task?.project}>{projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>Status<select name="status" defaultValue={task?.status || 'Pending'}>{statuses.map(s => <option value={s} key={s}>{statusLabels[s]}</option>)}</select></label></div><div className="form-row"><label>Prioridade<select name="priority" defaultValue={task?.priority || 'Média'}><option>Baixa</option><option>Média</option><option>Alta</option></select></label><label>Prazo<input name="due" type="date" defaultValue={task?.due || '2026-09-10'} /></label></div><DialogFooter><button type="button" className="subtle-button dialog-button" onClick={onClose}>Cancelar</button><button className="violet-button" type="submit">{task ? 'Salvar alterações' : 'Criar tarefa'}</button></DialogFooter></form></DialogContent></Dialog>;
}

function ProjectDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (f: FormData) => void }) {
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent className="app-dialog"><DialogHeader><DialogTitle>Novo projeto</DialogTitle><DialogDescription>Crie um espaço para reunir tarefas com o mesmo objetivo.</DialogDescription></DialogHeader><form action={onSave} className="form-grid"><label>Nome<input name="name" required autoFocus /></label><label>Descrição<textarea name="description" rows={3} /></label><label>Cor do projeto<input name="color" type="color" defaultValue="#6550f4" className="color-input" /></label><DialogFooter><button type="button" className="subtle-button dialog-button" onClick={onClose}>Cancelar</button><button className="violet-button" type="submit">Criar projeto</button></DialogFooter></form></DialogContent></Dialog>;
}
