'use client';

import { useRef, useState } from 'react';
import {
  ArrowLeft, CalendarDays, CheckCircle2, Circle, Clock3, FileText, Flag,
  Folder, GripVertical, LayoutDashboard, ListTodo, Maximize2, Minus, Move,
  Plus, RotateCcw, StickyNote, Target, Trash2, UserRound, ZoomIn,
} from 'lucide-react';
import { statusLabels, type Data, type Project, type ProjectCanvasNode, type Task } from '@/lib/model';

type DetailProps = {
  data: Data;
  project: Project;
  onBack: () => void;
  onCommit: (next: Data) => void;
  onOpenTask: (task: Task) => void;
  onNewTask: () => void;
};

export function ProjectDetailView({ data, project, onBack, onCommit, onOpenTask, onNewTask }: DetailProps) {
  const [mode, setMode] = useState<'dashboard' | 'canvas'>('dashboard');
  const tasks = data.tasks.filter(task => task.project === project.id);
  const completed = tasks.filter(task => task.status === 'Success').length;
  const inProgress = tasks.filter(task => task.status === 'In progress' || task.status === 'In review').length;
  const progress = Math.round(completed / Math.max(tasks.length, 1) * 100);
  const client = data.clients.find(item => item.id === project.clientId);
  const notes = data.notes.filter(note => note.projectId === project.id);
  const due = project.due ? new Date(project.due + 'T12:00:00') : null;

  function saveCanvas(canvas: ProjectCanvasNode[]) {
    onCommit({ ...data, projects: data.projects.map(item => item.id === project.id ? { ...item, canvas } : item) });
  }

  return <div className="project-workspace-page">
    <header className="project-workspace-header">
      <button className="project-back" onClick={onBack}><ArrowLeft />Projetos</button>
      <div className="project-workspace-identity">
        <span className="project-workspace-icon"><Folder /></span>
        <div><span>ESPAÇO DO PROJETO</span><h1>{project.name}</h1><p>{project.description || 'Organize o plano, acompanhe o trabalho e desenvolva suas ideias.'}</p></div>
      </div>
      <div className="project-workspace-actions">
        <button className="project-new-task" onClick={onNewTask}><Plus />Nova tarefa</button>
        <div className="project-view-switch" aria-label="Visualização do projeto">
          <button className={mode === 'dashboard' ? 'active' : ''} onClick={() => setMode('dashboard')}><LayoutDashboard />Dashboard</button>
          <button className={mode === 'canvas' ? 'active' : ''} onClick={() => setMode('canvas')}><Maximize2 />Canvas</button>
        </div>
      </div>
    </header>

    {mode === 'dashboard' ? <div className="project-dashboard">
      <section className="project-overview-card">
        <div className="project-progress-ring" style={{ '--project-progress': `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong><span>concluído</span></div>
        <div className="project-overview-copy"><span className="project-status-badge">{project.status || 'Planejamento'}</span><h2>Visão do projeto</h2><p>{tasks.length ? `${completed} de ${tasks.length} tarefas concluídas. ${inProgress} estão em movimento agora.` : 'Comece criando a primeira tarefa e transforme o plano em etapas claras.'}</p><div className="project-meta-line"><span><Flag />{project.priority || 'Média'}</span><span><CalendarDays />{due ? due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sem prazo'}</span><span><Clock3 />{tasks.length ? `${tasks.length - completed} etapas restantes` : 'Planejamento inicial'}</span></div></div>
      </section>

      <div className="project-metric-grid">
        <div><ListTodo /><span>Tarefas</span><strong>{String(tasks.length).padStart(2, '0')}</strong></div>
        <div><Move /><span>Em movimento</span><strong>{String(inProgress).padStart(2, '0')}</strong></div>
        <div><CheckCircle2 /><span>Concluídas</span><strong>{String(completed).padStart(2, '0')}</strong></div>
        <div><FileText /><span>Materiais</span><strong>{String(notes.length).padStart(2, '0')}</strong></div>
      </div>

      <div className="project-dashboard-columns">
        <section className="project-task-list">
          <header><div><span>PLANO DE EXECUÇÃO</span><h2>Próximas tarefas</h2></div><button onClick={onNewTask}><Plus />Adicionar</button></header>
          {tasks.length ? tasks.map(task => <button className="project-task-row" key={task.id} onClick={() => onOpenTask(task)}><span className={task.status === 'Success' ? 'project-task-check done' : 'project-task-check'}>{task.status === 'Success' ? <CheckCircle2 /> : <Circle />}</span><span className="project-task-copy"><strong>{task.title}</strong><small>{task.description || 'Sem descrição'}</small></span><span className="project-task-status">{statusLabels[task.status] || task.status}</span><time>{new Date(task.due + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</time></button>) : <div className="project-empty-state"><ListTodo /><h3>Nenhuma tarefa ainda</h3><p>Divida o projeto em pequenas entregas para começar.</p><button onClick={onNewTask}><Plus />Criar primeira tarefa</button></div>}
        </section>

        <aside className="project-context-panel">
          <header><span>CONTEXTO</span><h2>Detalhes do projeto</h2></header>
          <div className="project-context-row"><UserRound /><div><span>Cliente</span><strong>{client?.company || 'Projeto interno'}</strong></div></div>
          <div className="project-context-row"><Target /><div><span>Objetivo</span><strong>{project.description || 'Definir objetivo do projeto'}</strong></div></div>
          <div className="project-context-block"><span>Tecnologias</span><div>{project.technologies?.length ? project.technologies.map(item => <small key={item}>{item}</small>) : <em>Nenhuma tecnologia definida</em>}</div></div>
          <div className="project-context-block"><span>Tags</span><div>{project.tags?.length ? project.tags.map(item => <small key={item}>#{item}</small>) : <em>Nenhuma tag definida</em>}</div></div>
          <button className="open-canvas-callout" onClick={() => setMode('canvas')}><Maximize2 /><span><strong>Abrir canvas do projeto</strong><small>Planeje livremente em um espaço visual</small></span></button>
        </aside>
      </div>
    </div> : <ProjectCanvas key={project.id} project={project} tasks={tasks} onSave={saveCanvas} />}
  </div>;
}

function initialCanvasNodes(project: Project, tasks: Task[]): ProjectCanvasNode[] {
  if (project.canvas?.length) return project.canvas;
  return [
    { id: `canvas-overview-${project.id}`, kind: 'overview', title: project.name, content: project.description || 'Visão geral e objetivo principal do projeto.', x: 120, y: 110 },
    ...tasks.slice(0, 6).map((task, index) => ({ id: `canvas-task-${task.id}`, kind: 'task' as const, title: task.title, content: statusLabels[task.status] || task.status, x: 470 + (index % 2) * 310, y: 95 + Math.floor(index / 2) * 210, taskId: task.id })),
  ];
}

function ProjectCanvas({ project, tasks, onSave }: { project: Project; tasks: Task[]; onSave: (nodes: ProjectCanvasNode[]) => void }) {
  const [nodes, setNodes] = useState<ProjectCanvasNode[]>(() => initialCanvasNodes(project, tasks));
  const [pan, setPan] = useState({ x: 50, y: 45 });
  const [zoom, setZoom] = useState(1);
  const nodesRef = useRef(nodes);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);

  function updateNodes(next: ProjectCanvasNode[]) { nodesRef.current = next; setNodes(next); }
  function persist() { onSave(nodesRef.current); }
  function editNode(id: string, patch: Partial<ProjectCanvasNode>, save = false) {
    updateNodes(nodesRef.current.map(node => node.id === id ? { ...node, ...patch } : node));
    if (save) window.setTimeout(persist, 0);
  }
  function addNode(kind: ProjectCanvasNode['kind']) {
    const viewport = viewportRef.current;
    const x = ((viewport?.clientWidth || 900) / 2 - pan.x) / zoom - 130;
    const y = ((viewport?.clientHeight || 600) / 2 - pan.y) / zoom - 80;
    const labels = { idea: ['Nova ideia', 'Descreva uma possibilidade para explorar.'], note: ['Nova nota', 'Registre contexto, decisões ou referências.'], milestone: ['Novo marco', 'Defina uma entrega importante do projeto.'], overview: ['Visão geral', ''], task: ['Nova tarefa', ''] };
    const [title, content] = labels[kind];
    updateNodes([...nodesRef.current, { id: crypto.randomUUID(), kind, title, content, x, y }]);
    window.setTimeout(persist, 0);
  }
  function removeNode(id: string) { updateNodes(nodesRef.current.filter(node => node.id !== id)); window.setTimeout(persist, 0); }

  function startNodeDrag(event: React.PointerEvent<HTMLElement>, node: ProjectCanvasNode) {
    if ((event.target as HTMLElement).closest('button,input,textarea')) return;
    event.stopPropagation();
    dragRef.current = { id: node.id, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveNode(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    editNode(drag.id, { x: drag.x + (event.clientX - drag.startX) / zoom, y: drag.y + (event.clientY - drag.startY) / zoom });
  }
  function endNodeDrag(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    persist();
  }
  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.project-canvas-node')) return;
    panRef.current = { startX: event.clientX, startY: event.clientY, x: pan.x, y: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    const value = panRef.current;
    if (value) setPan({ x: value.x + event.clientX - value.startX, y: value.y + event.clientY - value.startY });
  }
  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    if (!panRef.current) return;
    panRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) setZoom(value => Math.min(1.65, Math.max(.55, value - event.deltaY * .0015)));
    else setPan(value => ({ x: value.x - event.deltaX, y: value.y - event.deltaY }));
  }
  function resetView() { setPan({ x: 50, y: 45 }); setZoom(1); }

  return <section className="project-canvas-shell">
    <div className="project-canvas-toolbar">
      <div><button onClick={() => addNode('idea')}><Target />Ideia</button><button onClick={() => addNode('note')}><StickyNote />Nota</button><button onClick={() => addNode('milestone')}><Flag />Marco</button></div>
      <span>Arraste os cartões e o fundo para organizar o projeto</span>
      <div><button aria-label="Diminuir zoom" onClick={() => setZoom(value => Math.max(.55, value - .1))}><Minus /></button><strong>{Math.round(zoom * 100)}%</strong><button aria-label="Aumentar zoom" onClick={() => setZoom(value => Math.min(1.65, value + .1))}><ZoomIn /></button><button aria-label="Centralizar canvas" onClick={resetView}><RotateCcw /></button></div>
    </div>
    <div ref={viewportRef} className="project-canvas-viewport" style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${24 * zoom}px ${24 * zoom}px` }} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onWheel={handleWheel}>
      <div className="project-canvas-stage" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
        {nodes.map(node => <article className={`project-canvas-node node-${node.kind}`} style={{ transform: `translate(${node.x}px,${node.y}px)` }} key={node.id}>
          <header onPointerDown={event => startNodeDrag(event, node)} onPointerMove={moveNode} onPointerUp={endNodeDrag} onPointerCancel={endNodeDrag}><GripVertical /><span>{node.kind === 'overview' ? 'VISÃO' : node.kind === 'task' ? 'TAREFA' : node.kind === 'idea' ? 'IDEIA' : node.kind === 'note' ? 'NOTA' : 'MARCO'}</span><button aria-label="Remover cartão" onClick={() => removeNode(node.id)}><Trash2 /></button></header>
          <input aria-label="Título do cartão" value={node.title} onChange={event => editNode(node.id, { title: event.target.value })} onBlur={persist} />
          <textarea aria-label="Conteúdo do cartão" value={node.content} onChange={event => editNode(node.id, { content: event.target.value })} onBlur={persist} rows={3} />
        </article>)}
      </div>
      <div className="project-canvas-hint"><Move />Arraste o fundo para navegar · Ctrl + rolagem para ampliar</div>
    </div>
  </section>;
}
