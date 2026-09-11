'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight, CalendarDays, CheckSquare, ChevronDown, ChevronRight,
  CircleCheck, CircleDashed, CircleHelp, CircleX, Clock3, Command,
  FileText, Folder, LayoutDashboard, MessageCircle, Plus, Search,
  Send, Settings, TriangleAlert, User, LogOut, ContactRound, Building2, Brain,
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
import { emptyData, normalizeData, statusLabels, statuses, type Activity, type Client, type Data, type Note, type Project, type Task } from '@/lib/model';
import type { AuthUser } from '@/lib/auth';
import { ClientsView, CommandPalette, CRMView, KnowledgeView, OperationsStrip, SearchView } from '@/components/os/business-modules';
import { ProfileView, SettingsView } from '@/components/os/settings-modules';

const asset = '/assets/';
const nav = [
  { label: 'Visão geral', icon: LayoutDashboard },
  { label: 'CRM', icon: ContactRound },
  { label: 'Clientes', icon: Building2 },
  { label: 'Tarefas', icon: CheckSquare },
  { label: 'Projetos', icon: Folder },
  { label: 'Calendário', icon: CalendarDays },
  { label: 'Arquivos', icon: FileText },
  { label: 'Conhecimento', icon: Brain },
];

export function Status({ value }: { value: string }) {
  const Icon = ({ Pending: TriangleAlert, 'In progress': CircleDashed, 'In review': MessageCircle, Success: CircleCheck, Submitted: Send, Failed: CircleX, Expired: Clock3 } as Record<string, typeof Clock3>)[value] || CircleDashed;
  return <span className={'status status-' + value.replace(' ', '-').toLowerCase()}><Icon size={13} />{statusLabels[value] || value}</span>;
}

function todayLabel() {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date()).toUpperCase();
}

export default function Workspace({ user }: { user: AuthUser }) {
  const [view, setView] = useState('Visão geral');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<Data>(() => ({ ...emptyData, tasks: [], projects: [], notes: [] }));
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('Carregando…');
  const [taskDialog, setTaskDialog] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);
  const [projectClient, setProjectClient] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedNote, setSelectedNote] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const dataRef = useRef(data);

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const apply = () => {
      const theme = data.preferences.theme === 'system' ? (media.matches ? 'light' : 'dark') : data.preferences.theme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.density = data.preferences.density;
      document.documentElement.style.setProperty('--user-accent', data.preferences.accent);
    };
    apply();
    if (data.preferences.theme === 'system') media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [data.preferences.theme, data.preferences.accent, data.preferences.density]);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    fetch('/api/workspace').then(async r => {
      if (r.status === 401) { window.location.reload(); throw new Error('Sessão encerrada'); }
      if (!r.ok) throw new Error('Falha ao carregar');
      return r.json();
    }).then(result => {
      const initial = normalizeData(result.data);
      setData(initial);
      setSelectedNote(initial.notes[0]?.id || '');
      setNoteDraft(initial.notes[0]?.content || '');
      setView(initial.preferences.startView || 'Visão geral');
      setReady(true);
      setSaveState('Tudo salvo');
    }).catch(() => { setReady(true); setSaveState('Não foi possível carregar'); });
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
        if (!current.projects.length) throw new Error('Crie um projeto antes da primeira tarefa.');
        const task: Task = { id: crypto.randomUUID(), title: value.title.trim(), description: value.description?.trim() || '', project: current.projects[0].id, status: 'Pending', priority: value.priority || 'Média', due: value.due || new Date().toISOString().slice(0, 10), created: new Date().toISOString().slice(0, 10) };
        const log: Activity = { id: crypto.randomUUID(), type: 'task.created', entityType: 'task', entityId: task.id, description: `Tarefa “${task.title}” criada.`, created: new Date().toISOString() };
        const next = { ...current, tasks: [task, ...current.tasks], activities: [log, ...current.activities] };
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
  const project = (id: string) => data.projects.find(p => p.id === id) || data.projects[0] || { id: '', name: 'Sem projeto', color: '#77777d', description: '' };
  const done = data.tasks.filter(t => t.status === 'Success').length;
  const openCount = data.tasks.length - done;
  const profileName = data.profile.displayName || user.name;
  const profileAvatar = data.profile.avatarDataUrl || asset + 'A5-avatar-paisagem.png';

  function navigate(label: string) { setView(label); }
  function openProject(clientId = '') { setProjectClient(clientId); setProjectDialog(true); }
  function openTask(task?: Task) {
    if (!task && !data.projects.length) { setProjectDialog(true); return; }
    setEditingTask(task || null); setTaskDialog(true);
  }
  function saveTask(form: FormData) {
    const task: Task = {
      id: editingTask?.id || crypto.randomUUID(),
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || '').trim(),
      project: String(form.get('project') || data.projects[0]?.id),
      clientId: data.projects.find(p => p.id === String(form.get('project')))?.clientId,
      status: String(form.get('status') || 'Pending'),
      priority: String(form.get('priority') || 'Média'),
      due: String(form.get('due') || '2026-09-10'),
      created: editingTask?.created || new Date().toISOString().slice(0, 10),
    };
    if (!task.title) return;
    const tasks = editingTask ? data.tasks.map(t => t.id === task.id ? task : t) : [task, ...data.tasks];
    const log: Activity = { id: crypto.randomUUID(), type: editingTask ? 'task.updated' : 'task.created', entityType: 'task', entityId: task.id, description: `Tarefa “${task.title}” ${editingTask ? 'atualizada' : 'criada'}.`, created: new Date().toISOString() };
    void commit({ ...data, tasks, activities: [log, ...data.activities] }); setTaskDialog(false); setEditingTask(null);
  }
  function saveProject(form: FormData) {
    const name = String(form.get('name') || '').trim(); if (!name) return;
    const next: Project = { id: crypto.randomUUID(), name, description: String(form.get('description') || ''), color: String(form.get('color') || '#6550f4'), clientId: String(form.get('clientId') || '') || undefined, status: String(form.get('status') || 'Planejamento'), priority: String(form.get('priority') || 'Média'), due: String(form.get('due') || ''), technologies: String(form.get('technologies') || '').split(',').map(v => v.trim()).filter(Boolean), tags: String(form.get('tags') || '').split(',').map(v => v.trim()).filter(Boolean) };
    const log: Activity = { id: crypto.randomUUID(), type: 'project.created', entityType: 'project', entityId: next.id, description: `Projeto “${name}” criado.`, created: new Date().toISOString() };
    void commit({ ...data, projects: [...data.projects, next], activities: [log, ...data.activities] }); setProjectDialog(false); setProjectClient('');
  }
  function completeTask(task: Task) { const completed=task.status!=='Success'; const log:Activity={id:crypto.randomUUID(),type:completed?'task.completed':'task.reopened',entityType:'task',entityId:task.id,description:`Tarefa “${task.title}” ${completed?'concluída':'reaberta'}.`,created:new Date().toISOString()}; void commit({ ...data, tasks: data.tasks.map(t => t.id === task.id ? { ...t, status: completed ? 'Success' : 'Pending' } : t), activities:[log,...data.activities] }); }
  function saveNote() {
    const notes = data.notes.map(n => n.id === selectedNote ? { ...n, content: noteDraft, updated: new Date().toISOString().slice(0, 10) } : n);
    void commit({ ...data, notes });
  }
  function chooseNote(note: Note) { setSelectedNote(note.id); setNoteDraft(note.content); }
  function newNote() {
    const note: Note = { id: crypto.randomUUID(), name: `arquivo-${data.notes.length + 1}.md`, content: '', updated: new Date().toISOString().slice(0, 10) };
    const log:Activity={id:crypto.randomUUID(),type:'note.created',entityType:'note',entityId:note.id,description:`Arquivo “${note.name}” criado.`,created:new Date().toISOString()};
    setSelectedNote(note.id); setNoteDraft(''); void commit({ ...data, notes: [...data.notes, note], activities:[log,...data.activities] });
  }
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  }

  return <SidebarProvider style={{ '--sidebar-width': '258px' } as React.CSSProperties}>
    <Sidebar className="app-sidebar">
      <SidebarHeader>
        <div className="brand"><span className="brand-logo brand-logo-sidebar"><img src="/assets/artweb-logo.png" alt="ArtWeb OS" /></span><SidebarTrigger className="collapse-button" /></div>
        <div className="workspace-switch"><span className="workspace-icon">A</span><span>Meu workspace<small>Workspace pessoal</small></span><ChevronDown size={15} /></div>
        <label className="side-search"><Search size={17} /><input aria-label="Buscar no workspace" placeholder="Buscar..." value={query} onFocus={()=>setView('Busca')} onChange={e => { setQuery(e.target.value); setView('Busca'); }} /><kbd>⌘ K</kbd></label>
      </SidebarHeader>
      <SidebarContent>
        <div className="nav-label">WORKSPACE</div>
        <SidebarMenu>{nav.map(n => <SidebarMenuItem key={n.label}><SidebarMenuButton className="nav-item" isActive={view === n.label} onClick={() => navigate(n.label)}><n.icon /><span>{n.label}</span>{n.label === 'Tarefas' && <small className="nav-count">{openCount}</small>}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
        <div className="sidebar-divider" />
        <div className="nav-label">SEUS PROJETOS <button aria-label="Novo projeto" onClick={() => openProject()}><Plus size={13} /></button></div>
        <div className="project-nav">{data.projects.map(p => <button key={p.id} onClick={() => navigate('Projetos')}><span className="project-dot" style={{ background: p.color }} />{p.name}<ChevronRight size={13} /></button>)}</div>
      </SidebarContent>
      <SidebarFooter>
        <div className="focus-card"><img src={asset + 'A2-cubo.png'} alt="" /><h3>Espaço para grandes ideias.</h3><p>Um passo de cada vez.<br />Seu próximo projeto começa aqui.</p><button className="violet-button" onClick={() => navigate('Projetos')}>Explorar projetos<ArrowUpRight size={15} /></button></div>
        <button className="bottom-nav" onClick={() => navigate('Ajuda')}><CircleHelp size={17} />Ajuda e atalhos</button>
        <DropdownMenu><DropdownMenuTrigger className="account"><img src={profileAvatar} alt="" /><span>{profileName}<small>{data.profile.title || user.email}</small></span><ChevronDown size={16} /></DropdownMenuTrigger><DropdownMenuContent side="top" align="start" className="account-menu"><DropdownMenuItem onClick={() => navigate('Perfil')}><User />Perfil</DropdownMenuItem><DropdownMenuItem onClick={() => navigate('Configurações')}><Settings />Configurações</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onClick={() => navigate('Ajuda')}><Command />Atalhos de teclado</DropdownMenuItem><DropdownMenuItem onClick={logout}><LogOut />Sair da conta</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </SidebarFooter>
    </Sidebar>

    <main className="main-surface">
      <header className="topbar"><div><SidebarTrigger className="mobile-trigger" /><LayoutDashboard size={16} /><span>Workspace</span><ChevronRight size={13} /><strong>{view}</strong></div><div><span className="save-state">{ready ? saveState : 'Carregando…'}</span><span className="topbar-divider" /><button onClick={() => navigate('Perfil')} aria-label="Abrir perfil"><img className="avatar" src={profileAvatar} alt="Seu perfil" /></button></div></header>
      {view === 'Visão geral' && <Dashboard data={data} filtered={filtered} done={done} openCount={openCount} project={project} onNavigate={navigate} onNewTask={() => openTask()} onOpenTask={openTask} onComplete={completeTask} onNewProject={() => openProject()} />}
      {view === 'CRM' && <CRMView data={data} onCommit={commit} />}
      {view === 'Clientes' && <ClientsView data={data} onCommit={commit} onNewProject={openProject} />}
      {view === 'Tarefas' && <TasksView filtered={filtered} project={project} onNew={() => openTask()} onOpen={openTask} onComplete={completeTask} />}
      {view === 'Projetos' && <ProjectsView data={data} onNew={() => openProject()} onOpenTask={openTask} />}
      {view === 'Calendário' && <CalendarView tasks={filtered} onOpen={openTask} />}
      {view === 'Arquivos' && <FilesView notes={data.notes} selected={selectedNote} draft={noteDraft} onChoose={chooseNote} onDraft={setNoteDraft} onSave={saveNote} onNew={newNote} />}
      {view === 'Conhecimento' && <KnowledgeView data={data} onCommit={commit} />}
      {view === 'Busca' && <SearchView data={data} query={query} setQuery={setQuery} onNavigate={navigate} />}
      {view === 'Ajuda' && <SimpleView title="Ajuda e atalhos" text="Use a navegação lateral para alternar entre tarefas, projetos, calendário e arquivos. Pressione ⌘ K para começar uma busca." icon={CircleHelp} />}
      {view === 'Perfil' && <ProfileView data={data} user={user} onCommit={commit} />}
      {view === 'Configurações' && <SettingsView data={data} onCommit={commit} />}
    </main>

    <TaskDialog open={taskDialog} task={editingTask} projects={data.projects} onClose={() => setTaskDialog(false)} onSave={saveTask} />
    <ProjectDialog open={projectDialog} clients={data.clients} initialClient={projectClient} onClose={() => { setProjectDialog(false); setProjectClient(''); }} onSave={saveProject} />
    <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} data={data} onNavigate={navigate} onQuick={kind => { if (kind === 'task') openTask(); else if (kind === 'project') openProject(); else navigate(kind === 'lead' ? 'CRM' : kind === 'client' ? 'Clientes' : 'Conhecimento'); }} />
  </SidebarProvider>;
}

function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}<span className="wave">✳</span></h1><p>{detail}</p></div>{action}</div>;
}

function Dashboard({ data, filtered, done, openCount, project, onNavigate, onNewTask, onOpenTask, onComplete, onNewProject }: { data: Data; filtered: Task[]; done: number; openCount: number; project: (id: string) => Project; onNavigate: (v: string) => void; onNewTask: () => void; onOpenTask: (t: Task) => void; onComplete: (t: Task) => void; onNewProject: () => void }) {
  return <div className="page-content"><PageHeading eyebrow={todayLabel()} title="Bom trabalho começa aqui" detail={`${openCount} tarefas em aberto · ${data.projects.length} projetos em movimento`} action={<button className="violet-button" onClick={onNewTask}><Plus size={17} />Nova tarefa</button>} />
    <div className="quick-actions"><span>CRIAR</span><button onClick={()=>onNavigate('CRM')}><Plus/>Lead</button><button onClick={()=>onNavigate('Clientes')}><Plus/>Cliente</button><button onClick={onNewProject}><Plus/>Projeto</button><button onClick={onNewTask}><Plus/>Tarefa</button><button onClick={()=>onNavigate('Conhecimento')}><Plus/>Nota</button><button onClick={()=>onNavigate('Conhecimento')}><Plus/>Ideia</button></div>
    <OperationsStrip data={data} onNavigate={onNavigate} />
    <div className="stats-grid">{[
      { label: 'Total de projetos', value: data.projects.length, img: 'A3-kpi-1.png', sub: 'Todas as suas ideias, organizadas' },
      { label: 'Tarefas em aberto', value: openCount, img: 'A3-kpi-2.png', sub: 'Um próximo passo para cada projeto' },
      { label: 'Em revisão', value: data.tasks.filter(t => t.status === 'In review').length, img: 'A3-kpi-3.png', sub: 'Prontas para um novo olhar' },
      { label: 'Concluídas', value: done, img: 'A3-kpi-2.png', sub: 'Progresso que faz a diferença' },
    ].map(s => <section className="stat-card" key={s.label}><p>{s.label}</p><strong>{String(s.value).padStart(2, '0')}</strong><img src={asset + s.img} alt="" /><small>{s.sub}</small></section>)}</div>
    <div className="overview-grid"><section className="panel tasks-panel"><div className="panel-heading"><h2>Suas próximas tarefas <span>{openCount}</span></h2><button className="text-action" onClick={() => onNavigate('Tarefas')}>Ver todas<ArrowUpRight size={14} /></button></div><TaskTable tasks={filtered.filter(t => t.status !== 'Success').slice(0, 5)} project={project} onOpen={onOpenTask} onComplete={onComplete} /></section><Performance data={data} /></div>
    <div className="dashboard-bottom"><section className="panel projects-panel"><div className="panel-heading"><h2>Seus projetos</h2><button className="subtle-button" onClick={onNewProject}><Plus size={14} />Novo projeto</button></div><ProjectsTable data={data} /></section><section className="panel activity-panel"><div className="panel-heading"><h2>Atividade recente</h2><span>{data.activities.length}</span></div>{data.activities.length?<div className="activity-list">{data.activities.slice(0,6).map(item=><div key={item.id}><i/><p>{item.description}<time>{new Date(item.created).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</time></p></div>)}</div>:<div className="empty-table">As ações importantes aparecerão aqui.</div>}</section></div>
    <footer className="page-footer"><span>Um pouco de foco. Muito espaço para criar.</span><span>artweb.so</span></footer>
  </div>;
}

function TaskTable({ tasks, project, onOpen, onComplete }: { tasks: Task[]; project: (id: string) => Project; onOpen: (t: Task) => void; onComplete: (t: Task) => void }) {
  return <Table><TableHeader><TableRow><TableHead>Tarefa</TableHead><TableHead>Projeto</TableHead><TableHead>Status</TableHead><TableHead>Prazo</TableHead></TableRow></TableHeader><TableBody>{tasks.length === 0 ? <TableRow><TableCell colSpan={4}><div className="empty-table">Nenhuma tarefa ainda. Crie um projeto para começar.</div></TableCell></TableRow> : tasks.map(t => <TableRow key={t.id} onDoubleClick={() => onOpen(t)}><TableCell><div className="task-name"><button className={'empty-check ' + (t.status === 'Success' ? 'checked' : '')} aria-label="Alternar conclusão" onClick={() => onComplete(t)} />{t.title}</div></TableCell><TableCell><span className="project-name"><Folder size={16} fill={project(t.project).color} color={project(t.project).color} />{project(t.project).name}</span></TableCell><TableCell><Status value={t.status} /></TableCell><TableCell><button className="date-cell" onClick={() => onOpen(t)}>{new Date(t.due + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</button></TableCell></TableRow>)}</TableBody></Table>;
}

function Performance({ data }: { data: Data }) {
  const done = data.tasks.filter(t => t.status === 'Success').length;
  return <section className="panel performance"><div className="panel-heading"><h2>Progresso dos projetos</h2><ArrowUpRight size={16} /></div><div className="performance-value">{Math.round(done / Math.max(data.tasks.length, 1) * 100)}<span>%</span><small>das tarefas concluídas</small></div><div className="bar-chart">{data.projects.slice(0, 5).map(p => { const ts = data.tasks.filter(t => t.project === p.id); const count = ts.filter(t => t.status === 'Success').length; return <div className="bar-group" key={p.id}><div className="bar-track"><div style={{ height: `${count / Math.max(ts.length, 1) * 100}%` }} /><span>{count}/{ts.length}</span></div><small>{p.name.split(' ')[0]}</small></div>; })}</div></section>;
}

function ProjectsTable({ data }: { data: Data }) {
  return <Table><TableHeader><TableRow><TableHead>Nome do projeto</TableHead><TableHead>Status</TableHead><TableHead>Progresso</TableHead><TableHead>Tarefas</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader><TableBody>{data.projects.length === 0 ? <TableRow><TableCell colSpan={5}><div className="empty-table">Seu workspace está vazio. Crie o primeiro projeto.</div></TableCell></TableRow> : data.projects.map(p => { const ts = data.tasks.filter(t => t.project === p.id); const completed = ts.filter(t => t.status === 'Success').length; const pct = Math.round(completed / Math.max(ts.length, 1) * 100); return <TableRow key={p.id}><TableCell><span className="project-name"><Folder size={19} fill={p.color} color={p.color} />{p.name}</span></TableCell><TableCell><Status value={pct === 100 && ts.length > 0 ? 'Success' : 'In progress'} /></TableCell><TableCell><div className="progress-cell"><div className="segmented"><i style={{ width: pct + '%', background: p.color }} /></div>{pct}%</div></TableCell><TableCell>{completed}<span className="muted"> / {ts.length}</span></TableCell><TableCell><span className="owner"><img src={asset + 'A4-avatar-rosa.png'} alt="" />Você</span></TableCell></TableRow>; })}</TableBody></Table>;
}

function TasksView({ filtered, project, onNew, onOpen, onComplete }: { filtered: Task[]; project: (id: string) => Project; onNew: () => void; onOpen: (t: Task) => void; onComplete: (t: Task) => void }) {
  const [filter,setFilter]=useState('Todas');
  const [dateRange]=useState(()=>{const start=new Date();const end=new Date(start);end.setDate(end.getDate()+7);return {current:start.toISOString().slice(0,10),nextWeek:end.toISOString().slice(0,10)}});
  const columns = ['Pending', 'In progress', 'In review', 'Success'];
  const {current,nextWeek}=dateRange;
  const visible=filtered.filter(task=>filter==='Todas'||(filter==='Hoje'&&task.due===current)||(filter==='Próximas'&&task.due>current&&task.due<=nextWeek)||(filter==='Atrasadas'&&task.status!=='Success'&&task.due<current)||(filter==='Concluídas'&&task.status==='Success'));
  return <div className="page-content"><PageHeading eyebrow="TRABALHO EM MOVIMENTO" title="Tarefas" detail={`${visible.length} tarefas nesta visualização`} action={<button className="violet-button" onClick={onNew}><Plus size={17} />Nova tarefa</button>} /><div className="task-filters">{['Todas','Hoje','Próximas','Atrasadas','Concluídas'].map(item=><button className={filter===item?'active':''} onClick={()=>setFilter(item)} key={item}>{item}<span>{item==='Todas'?filtered.length:item==='Hoje'?filtered.filter(t=>t.due===current).length:item==='Próximas'?filtered.filter(t=>t.due>current&&t.due<=nextWeek).length:item==='Atrasadas'?filtered.filter(t=>t.status!=='Success'&&t.due<current).length:filtered.filter(t=>t.status==='Success').length}</span></button>)}</div><div className="kanban">{columns.map(status => <section className="kanban-column" key={status}><div className="kanban-title"><Status value={status} /><span>{visible.filter(t => t.status === status).length}</span></div><div className="kanban-cards">{visible.filter(t => t.status === status).map(t => <article className="task-card" key={t.id} onClick={() => onOpen(t)}><div className="task-card-head"><span className={'priority priority-' + t.priority.toLowerCase()}>{t.priority}</span><button onClick={e => { e.stopPropagation(); onComplete(t); }} aria-label="Concluir tarefa"><CircleCheck size={17} /></button></div><h3>{t.title}</h3><p>{t.description}</p><div className="task-card-foot"><span><Folder size={13} color={project(t.project).color} />{project(t.project).name}</span><span><CalendarDays size={13} />{new Date(t.due + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></div></article>)}</div></section>)}</div></div>;
}

function ProjectsView({ data, onNew, onOpenTask }: { data: Data; onNew: () => void; onOpenTask: (t: Task) => void }) {
  return <div className="page-content"><PageHeading eyebrow="TODAS AS FRENTES" title="Projetos" detail={`${data.projects.length} espaços ativos`} action={<button className="violet-button" onClick={onNew}><Plus size={17} />Novo projeto</button>} /><div className="project-grid">{data.projects.length === 0 ? <section className="empty-collection"><Folder size={28} /><h2>Crie seu primeiro projeto</h2><p>Projetos reúnem suas tarefas e ajudam você a acompanhar cada objetivo.</p><button className="violet-button" onClick={onNew}><Plus size={16} />Novo projeto</button></section> : data.projects.map(p => { const tasks = data.tasks.filter(t => t.project === p.id); const done = tasks.filter(t => t.status === 'Success').length; const pct = Math.round(done / Math.max(tasks.length, 1) * 100); return <section className="project-card" key={p.id}><div className="project-card-icon" style={{ background: p.color + '22', color: p.color }}><Folder /></div><span className="project-percent">{pct}%</span><h2>{p.name}</h2><p>{p.description}</p><div className="project-progress"><i style={{ width: pct + '%', background: p.color }} /></div><div className="project-summary"><span>{done} concluídas</span><span>{tasks.length} tarefas</span></div><div className="project-recent">{tasks.slice(0, 3).map(t => <button key={t.id} onClick={() => onOpenTask(t)}><span className={t.status === 'Success' ? 'mini-check done' : 'mini-check'} />{t.title}</button>)}</div></section>; })}</div></div>;
}

function CalendarView({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  const days = Array.from({ length: 35 }, (_, i) => i - 1);
  return <div className="page-content"><PageHeading eyebrow="SETEMBRO DE 2026" title="Calendário" detail="Prazos e entregas do seu workspace" /><section className="calendar panel"><div className="weekdays">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <span key={d}>{d}</span>)}</div><div className="calendar-grid">{days.map((day, i) => <div className={'calendar-day ' + (day < 1 || day > 30 ? 'outside' : '')} key={i}><strong>{day > 0 && day <= 30 ? day : day < 1 ? 31 : day - 30}</strong>{tasks.filter(t => Number(t.due.slice(8)) === day).map(t => <button key={t.id} onClick={() => onOpen(t)}><span className={'calendar-dot status-dot-' + t.status.replace(' ', '-').toLowerCase()} />{t.title}</button>)}</div>)}</div></section></div>;
}

function FilesView({ notes, selected, draft, onChoose, onDraft, onSave, onNew }: { notes: Note[]; selected: string; draft: string; onChoose: (n: Note) => void; onDraft: (v: string) => void; onSave: () => void; onNew: () => void }) {
  return <div className="files-layout"><aside className="file-tree"><div className="file-tree-head"><strong>Arquivos</strong><button aria-label="Novo arquivo" onClick={onNew}><Plus size={16} /></button></div>{notes.map(n => <button className={selected === n.id ? 'active' : ''} key={n.id} onClick={() => onChoose(n)}><FileText size={15} />{n.name}</button>)}</aside><section className="editor"><div className="editor-top"><div><strong>{notes.find(n => n.id === selected)?.name || 'Nenhum arquivo'}</strong><span>Markdown</span></div><button className="violet-button" onClick={notes.length ? onSave : onNew}>{notes.length ? 'Salvar arquivo' : 'Criar arquivo'}</button></div><textarea aria-label="Conteúdo do arquivo" value={draft} onChange={e => onDraft(e.target.value)} spellCheck={false} disabled={!notes.length} placeholder={notes.length ? 'Comece a escrever…' : 'Crie seu primeiro arquivo para começar.'} /></section><aside className="editor-preview"><div className="preview-label">PRÉVIA</div>{draft.split('\n').map((line, i) => line.startsWith('# ') ? <h1 key={i}>{line.slice(2)}</h1> : line.startsWith('## ') ? <h2 key={i}>{line.slice(3)}</h2> : line ? <p key={i}>{line}</p> : <br key={i} />)}</aside></div>;
}

function SimpleView({ title, text, icon: Icon }: { title: string; text: string; icon: typeof Settings }) {
  return <div className="page-content simple-wrap"><section className="panel simple-view"><Icon size={30} /><h1>{title}</h1><p>{text}</p></section></div>;
}

function TaskDialog({ open, task, projects, onClose, onSave }: { open: boolean; task: Task | null; projects: Project[]; onClose: () => void; onSave: (f: FormData) => void }) {
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent className="app-dialog"><DialogHeader><DialogTitle>{task ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle><DialogDescription>Organize o próximo passo e mantenha o trabalho em movimento.</DialogDescription></DialogHeader><form action={onSave} className="form-grid"><label>Título<input name="title" defaultValue={task?.title} required autoFocus /></label><label>Descrição<textarea name="description" defaultValue={task?.description} rows={3} /></label><div className="form-row"><label>Projeto<select name="project" defaultValue={task?.project}>{projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>Status<select name="status" defaultValue={task?.status || 'Pending'}>{statuses.map(s => <option value={s} key={s}>{statusLabels[s]}</option>)}</select></label></div><div className="form-row"><label>Prioridade<select name="priority" defaultValue={task?.priority || 'Média'}><option>Baixa</option><option>Média</option><option>Alta</option></select></label><label>Prazo<input name="due" type="date" defaultValue={task?.due || '2026-09-10'} /></label></div><DialogFooter><button type="button" className="subtle-button dialog-button" onClick={onClose}>Cancelar</button><button className="violet-button" type="submit">{task ? 'Salvar alterações' : 'Criar tarefa'}</button></DialogFooter></form></DialogContent></Dialog>;
}

function ProjectDialog({ open, clients, initialClient, onClose, onSave }: { open: boolean; clients: Client[]; initialClient: string; onClose: () => void; onSave: (f: FormData) => void }) {
  return <Dialog open={open} onOpenChange={v => !v && onClose()}><DialogContent className="app-dialog wide-dialog"><DialogHeader><DialogTitle>Novo projeto</DialogTitle><DialogDescription>Crie um workspace conectado a cliente, prazo e contexto técnico.</DialogDescription></DialogHeader><form action={onSave} className="form-grid"><div className="form-row"><label>Nome<input name="name" required autoFocus /></label><label>Cliente<select name="clientId" defaultValue={initialClient}><option value="">Sem cliente</option>{clients.map(client=><option value={client.id} key={client.id}>{client.company}</option>)}</select></label></div><label>Descrição<textarea name="description" rows={3} /></label><div className="form-row"><label>Status<select name="status"><option>Planejamento</option><option>Ativo</option><option>Em espera</option><option>Concluído</option></select></label><label>Prioridade<select name="priority"><option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option></select></label></div><div className="form-row"><label>Prazo<input name="due" type="date" /></label><label>Cor<input name="color" type="color" defaultValue="#6550f4" className="color-input" /></label></div><div className="form-row"><label>Tecnologias<input name="technologies" placeholder="Next.js, WordPress" /></label><label>Tags<input name="tags" placeholder="site, redesign" /></label></div><DialogFooter><button type="button" className="subtle-button dialog-button" onClick={onClose}>Cancelar</button><button className="violet-button" type="submit">Criar projeto</button></DialogFooter></form></DialogContent></Dialog>;
}
