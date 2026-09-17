'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import {
  ArrowLeft, Brush, CalendarDays, CheckCircle2, Circle, CircleHelp, Clock3,
  Diamond, Download, ExternalLink, FileText, Flag, Folder, GripVertical,
  ImagePlus, LayoutDashboard, Link2, ListTodo, Maximize2, Minus, Move,
  MousePointer2, Network, Paperclip, Plus, Redo2, RotateCcw,
  Settings2, Shapes, Square, StickyNote, Target, Trash2, Triangle, Undo2,
  UserRound, X, ZoomIn,
} from 'lucide-react';
import { statusLabels, type Data, type Project, type ProjectCanvasConnection, type ProjectCanvasNode, type ProjectCanvasStroke, type Task } from '@/lib/model';

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

  function saveCanvas(canvas: ProjectCanvasNode[], canvasConnections: ProjectCanvasConnection[], canvasStrokes: ProjectCanvasStroke[]) {
    onCommit({ ...data, projects: data.projects.map(item => item.id === project.id ? { ...item, canvas, canvasConnections, canvasStrokes } : item) });
  }

  return <div className={`project-workspace-page ${mode === 'canvas' ? 'canvas-mode' : ''}`}>
    {mode === 'dashboard' && <header className="project-workspace-header">
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
    </header>}

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
    </div> : <ProjectCanvas key={project.id} project={project} tasks={tasks} onSave={saveCanvas} onBack={onBack} onDashboard={() => setMode('dashboard')} />}
  </div>;
}

function initialCanvasNodes(project: Project, tasks: Task[]): ProjectCanvasNode[] {
  if (project.canvas?.length) return project.canvas;
  return [
    { id: `canvas-overview-${project.id}`, kind: 'overview', title: project.name, content: project.description || 'Visão geral e objetivo principal do projeto.', x: 120, y: 110 },
    ...tasks.slice(0, 6).map((task, index) => ({ id: `canvas-task-${task.id}`, kind: 'task' as const, title: task.title, content: statusLabels[task.status] || task.status, x: 470 + (index % 2) * 310, y: 95 + Math.floor(index / 2) * 210, taskId: task.id })),
  ];
}

type CanvasTool = 'select' | 'connect' | 'brush';
type CanvasPanel = 'add' | 'shape' | 'brush' | 'settings' | 'help' | null;
type CanvasSnapshot = { nodes: ProjectCanvasNode[]; connections: ProjectCanvasConnection[]; strokes: ProjectCanvasStroke[] };

function ProjectCanvas({ project, tasks, onSave, onBack, onDashboard }: { project: Project; tasks: Task[]; onSave: (nodes: ProjectCanvasNode[], connections: ProjectCanvasConnection[], strokes: ProjectCanvasStroke[]) => void; onBack: () => void; onDashboard: () => void }) {
  const [nodes, setNodes] = useState<ProjectCanvasNode[]>(() => initialCanvasNodes(project, tasks));
  const [connections, setConnections] = useState<ProjectCanvasConnection[]>(() => project.canvasConnections || []);
  const [strokes, setStrokes] = useState<ProjectCanvasStroke[]>(() => project.canvasStrokes || []);
  const [pan, setPan] = useState({ x: 50, y: 45 });
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<CanvasTool>('select');
  const [panel, setPanel] = useState<CanvasPanel>(null);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [brush, setBrush] = useState({ color: '#F4F4F4', width: 5, opacity: .85, style: 'solid' as ProjectCanvasStroke['style'] });
  const [shapeStyle, setShapeStyle] = useState({ fill: '#29292B', stroke: '#E0E0E0' });
  const nodesRef = useRef(nodes);
  const connectionsRef = useRef(connections);
  const strokesRef = useRef(strokes);
  const viewportRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const strokeRef = useRef<{ id: string } | null>(null);
  const historyRef = useRef<CanvasSnapshot[]>([]);
  const futureRef = useRef<CanvasSnapshot[]>([]);

  function updateNodes(next: ProjectCanvasNode[]) { nodesRef.current = next; setNodes(next); }
  function updateConnections(next: ProjectCanvasConnection[]) { connectionsRef.current = next; setConnections(next); }
  function updateStrokes(next: ProjectCanvasStroke[]) { strokesRef.current = next; setStrokes(next); }
  function snapshot(): CanvasSnapshot { return { nodes: nodesRef.current.map(node => ({ ...node })), connections: connectionsRef.current.map(connection => ({ ...connection })), strokes: strokesRef.current.map(stroke => ({ ...stroke })) }; }
  function remember() { historyRef.current = [...historyRef.current.slice(-49), snapshot()]; futureRef.current = []; }
  function persist() { onSave(nodesRef.current, connectionsRef.current, strokesRef.current); }
  function restore(value: CanvasSnapshot) { updateNodes(value.nodes); updateConnections(value.connections); updateStrokes(value.strokes); onSave(value.nodes, value.connections, value.strokes); }
  function undo() { const previous = historyRef.current.at(-1); if (!previous) return; futureRef.current = [snapshot(), ...futureRef.current].slice(0, 50); historyRef.current = historyRef.current.slice(0, -1); restore(previous); }
  function redo() { const next = futureRef.current[0]; if (!next) return; historyRef.current = [...historyRef.current, snapshot()].slice(-50); futureRef.current = futureRef.current.slice(1); restore(next); }
  function editNode(id: string, patch: Partial<ProjectCanvasNode>, save = false) {
    updateNodes(nodesRef.current.map(node => node.id === id ? { ...node, ...patch } : node));
    if (save) window.setTimeout(persist, 0);
  }
  function centerPosition(offset = 0) {
    const viewport = viewportRef.current;
    return { x: ((viewport?.clientWidth || 900) / 2 - pan.x) / zoom - 135 + offset, y: ((viewport?.clientHeight || 600) / 2 - pan.y) / zoom - 80 + offset };
  }
  function addCard(kind: 'idea' | 'note' | 'milestone') {
    const labels = { idea: ['Nova ideia', 'Descreva uma possibilidade para explorar.'], note: ['Nova nota', 'Registre contexto, decisões ou referências.'], milestone: ['Novo marco', 'Defina uma entrega importante do projeto.'] };
    const [title, content] = labels[kind];
    remember(); updateNodes([...nodesRef.current, { id: crypto.randomUUID(), kind, title, content, ...centerPosition() }]);
    window.setTimeout(persist, 0);
    setPanel(null); setTool('select');
  }
  function addShape(shapeType: NonNullable<ProjectCanvasNode['shapeType']>) {
    remember(); updateNodes([...nodesRef.current, { id: crypto.randomUUID(), kind: 'shape', title: '', content: '', shapeType, fill: shapeStyle.fill, stroke: shapeStyle.stroke, ...centerPosition() }]);
    window.setTimeout(persist, 0); setPanel(null); setTool('select');
  }
  function addLink() {
    const value = window.prompt('Cole o endereço do link')?.trim(); if (!value) return;
    const url = normalizeLink(value); if (!url) { window.alert('Use um link http, https ou mailto válido.'); return; }
    remember(); updateNodes([...nodesRef.current, { id: crypto.randomUUID(), kind: 'link', title: new URL(url).hostname || 'Link', content: value, url, ...centerPosition() }]);
    window.setTimeout(persist, 0); setPanel(null); setTool('select');
  }
  async function uploadFiles(event: ChangeEvent<HTMLInputElement>, kind: 'image' | 'file') {
    const selected = Array.from(event.target.files || []); event.target.value = ''; if (!selected.length) return;
    const accepted = selected.filter(file => file.size <= 5 * 1024 * 1024);
    if (accepted.length !== selected.length) window.alert('Arquivos maiores que 5 MB não foram adicionados.');
    const entries = await Promise.all(accepted.map(async (file, index): Promise<ProjectCanvasNode> => ({ id: crypto.randomUUID(), kind, title: file.name, content: kind === 'image' ? 'Imagem adicionada ao projeto' : `${formatBytes(file.size)} · ${file.type || 'Arquivo'}`, assetDataUrl: await fileToDataUrl(file), fileName: file.name, mimeType: file.type, fileSize: file.size, ...centerPosition(index * 24) })));
    if (!entries.length) return;
    remember(); updateNodes([...nodesRef.current, ...entries]); window.setTimeout(persist, 0); setPanel(null); setTool('select');
  }
  function removeNode(id: string) {
    remember(); updateNodes(nodesRef.current.filter(node => node.id !== id)); updateConnections(connectionsRef.current.filter(connection => connection.from !== id && connection.to !== id)); window.setTimeout(persist, 0);
  }
  function clearCanvas() {
    if (!window.confirm('Remover todos os itens, conexões e desenhos deste canvas?')) return;
    remember(); updateNodes([]); updateConnections([]); updateStrokes([]); window.setTimeout(persist, 0); setPanel(null);
  }

  function startNodeDrag(event: React.PointerEvent<HTMLElement>, node: ProjectCanvasNode) {
    if (tool !== 'select' || (event.target as HTMLElement).closest('button,input,textarea,a')) return;
    event.stopPropagation();
    remember();
    dragRef.current = { id: node.id, startX: event.clientX, startY: event.clientY, x: node.x, y: node.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveNode(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const nextX = drag.x + (event.clientX - drag.startX) / zoom;
    const nextY = drag.y + (event.clientY - drag.startY) / zoom;
    editNode(drag.id, { x: snapToGrid ? Math.round(nextX / 24) * 24 : nextX, y: snapToGrid ? Math.round(nextY / 24) * 24 : nextY });
  }
  function endNodeDrag(event: React.PointerEvent<HTMLElement>) {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    persist();
  }
  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.project-canvas-node')) return;
    if (tool === 'brush') {
      const point = canvasPoint(event.clientX, event.clientY);
      const stroke: ProjectCanvasStroke = { id: crypto.randomUUID(), points: `${point.x},${point.y}`, ...brush };
      remember(); strokeRef.current = { id: stroke.id }; updateStrokes([...strokesRef.current, stroke]); event.currentTarget.setPointerCapture(event.pointerId); return;
    }
    panRef.current = { startX: event.clientX, startY: event.clientY, x: pan.x, y: pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePan(event: React.PointerEvent<HTMLDivElement>) {
    if (strokeRef.current) {
      const point = canvasPoint(event.clientX, event.clientY);
      updateStrokes(strokesRef.current.map(stroke => stroke.id === strokeRef.current?.id ? { ...stroke, points: `${stroke.points} ${point.x},${point.y}` } : stroke)); return;
    }
    const value = panRef.current;
    if (value) setPan({ x: value.x + event.clientX - value.startX, y: value.y + event.clientY - value.startY });
  }
  function endPan(event: React.PointerEvent<HTMLDivElement>) {
    if (strokeRef.current) { strokeRef.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); persist(); return; }
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
  function canvasPoint(clientX: number, clientY: number) { const rect = viewportRef.current?.getBoundingClientRect(); return { x: Math.round((clientX - (rect?.left || 0) - pan.x) / zoom), y: Math.round((clientY - (rect?.top || 0) - pan.y) / zoom) }; }
  function connectNode(node: ProjectCanvasNode) {
    if (tool !== 'connect') return;
    if (!connectionStart) { setConnectionStart(node.id); return; }
    if (connectionStart === node.id) { setConnectionStart(null); return; }
    if (!connectionsRef.current.some(connection => (connection.from === connectionStart && connection.to === node.id) || (connection.from === node.id && connection.to === connectionStart))) {
      remember(); updateConnections([...connectionsRef.current, { id: crypto.randomUUID(), from: connectionStart, to: node.id }]); window.setTimeout(persist, 0);
    }
    setConnectionStart(null);
  }
  function activateTool(next: CanvasTool, nextPanel: CanvasPanel = null) { setTool(next); setPanel(nextPanel); if (next !== 'connect') setConnectionStart(null); }
  async function toggleFullscreen() { if (!document.fullscreenElement) await shellRef.current?.requestFullscreen(); else await document.exitFullscreen(); }

  return <section ref={shellRef} className={`project-canvas-shell is-fullpage tool-${tool}`}>
    <input ref={imageInputRef} className="canvas-hidden-input" type="file" accept="image/*" multiple onChange={event => void uploadFiles(event, 'image')} />
    <input ref={fileInputRef} className="canvas-hidden-input" type="file" multiple onChange={event => void uploadFiles(event, 'file')} />
    <div className="canvas-project-controls">
      <button onClick={onBack}><ArrowLeft />Projetos</button><span>{project.name}</span><button onClick={onDashboard}><LayoutDashboard />Dashboard</button>
    </div>
    <aside className="canvas-floating-toolbar" aria-label="Ferramentas do canvas">
      <button className={panel === 'settings' ? 'active' : ''} aria-label="Configurações do canvas" title="Configurações" onClick={() => setPanel(panel === 'settings' ? null : 'settings')}><Settings2 /></button>
      <div>
        <button className={panel === 'add' ? 'active' : ''} aria-label="Adicionar ao canvas" title="Adicionar" onClick={() => setPanel(panel === 'add' ? null : 'add')}><Plus /></button>
        <button aria-label="Centralizar canvas" title="Centralizar" onClick={resetView}><RotateCcw /></button>
        <button aria-label="Tela cheia" title="Tela cheia" onClick={() => void toggleFullscreen()}><Maximize2 /></button>
        <button aria-label="Diminuir zoom" title="Diminuir zoom" onClick={() => setZoom(value => Math.max(.35, value - .1))}><Minus /></button>
        <button aria-label="Aumentar zoom" title="Aumentar zoom" onClick={() => setZoom(value => Math.min(2.4, value + .1))}><ZoomIn /></button>
      </div>
      <span>{Math.round(zoom * 100)}%</span>
      <div><button aria-label="Desfazer" title="Desfazer" onClick={undo}><Undo2 /></button><button aria-label="Refazer" title="Refazer" onClick={redo}><Redo2 /></button></div>
      <button className={panel === 'help' ? 'active' : ''} aria-label="Ajuda do canvas" title="Ajuda" onClick={() => setPanel(panel === 'help' ? null : 'help')}><CircleHelp /></button>
    </aside>

    {panel && <div className={`canvas-tool-panel panel-${panel}`}>
      <header><strong>{panel === 'add' ? 'Adicionar ao canvas' : panel === 'shape' ? 'Forma geométrica' : panel === 'brush' ? 'Personalizar pincel' : panel === 'settings' ? 'Configurações' : 'Como usar'}</strong><button aria-label="Fechar painel" onClick={() => setPanel(null)}><X /></button></header>
      {panel === 'add' && <div className="canvas-add-grid">
        <button onClick={() => activateTool('select')}><MousePointer2 /><span>Selecionar<small>Mover e editar itens</small></span></button>
        <button onClick={() => addCard('note')}><StickyNote /><span>Nota<small>Texto e decisões</small></span></button>
        <button onClick={() => imageInputRef.current?.click()}><ImagePlus /><span>Imagem<small>PNG, JPG, GIF ou WebP</small></span></button>
        <button onClick={() => fileInputRef.current?.click()}><Paperclip /><span>Arquivo<small>Anexar e baixar</small></span></button>
        <button onClick={addLink}><Link2 /><span>Link<small>Endereço externo</small></span></button>
        <button onClick={() => setPanel('shape')}><Shapes /><span>Forma<small>Quatro formatos</small></span></button>
        <button onClick={() => activateTool('connect')}><Network /><span>Conectar<small>Una dois elementos</small></span></button>
        <button onClick={() => activateTool('brush', 'brush')}><Brush /><span>Pincel<small>Desenho livre</small></span></button>
        <button onClick={() => addCard('idea')}><Target /><span>Ideia<small>Possibilidade visual</small></span></button>
        <button onClick={() => addCard('milestone')}><Flag /><span>Marco<small>Entrega importante</small></span></button>
      </div>}
      {panel === 'shape' && <><div className="canvas-shape-grid"><button onClick={() => addShape('rectangle')}><Square />Retângulo</button><button onClick={() => addShape('ellipse')}><Circle />Círculo</button><button onClick={() => addShape('diamond')}><Diamond />Losango</button><button onClick={() => addShape('triangle')}><Triangle />Triângulo</button></div><div className="canvas-color-row"><label>Preenchimento<input type="color" value={shapeStyle.fill} onChange={event => setShapeStyle(value => ({ ...value, fill: event.target.value }))} /></label><label>Contorno<input type="color" value={shapeStyle.stroke} onChange={event => setShapeStyle(value => ({ ...value, stroke: event.target.value }))} /></label></div></>}
      {panel === 'brush' && <div className="canvas-brush-settings"><label><span>Cor</span><input type="color" value={brush.color} onChange={event => setBrush(value => ({ ...value, color: event.target.value }))} /></label><label><span>Estilo</span><select value={brush.style} onChange={event => setBrush(value => ({ ...value, style: event.target.value as ProjectCanvasStroke['style'] }))}><option value="solid">Contínuo</option><option value="dashed">Tracejado</option><option value="dotted">Pontilhado</option></select></label><label><span>Grossura <b>{brush.width}px</b></span><input type="range" min="1" max="32" value={brush.width} onChange={event => setBrush(value => ({ ...value, width: Number(event.target.value) }))} /></label><label><span>Opacidade <b>{Math.round(brush.opacity * 100)}%</b></span><input type="range" min="5" max="100" value={brush.opacity * 100} onChange={event => setBrush(value => ({ ...value, opacity: Number(event.target.value) / 100 }))} /></label><button className="canvas-tool-primary" onClick={() => { setTool('brush'); setPanel(null); }}><Brush />Começar a desenhar</button></div>}
      {panel === 'settings' && <div className="canvas-settings-list"><label><span><strong>Grade de pontos</strong><small>Exibir referências no fundo</small></span><input type="checkbox" checked={gridVisible} onChange={event => setGridVisible(event.target.checked)} /></label><label><span><strong>Alinhar à grade</strong><small>Organizar cartões em intervalos</small></span><input type="checkbox" checked={snapToGrid} onChange={event => setSnapToGrid(event.target.checked)} /></label><button onClick={resetView}><RotateCcw />Restaurar visualização</button><button className="danger" onClick={clearCanvas}><Trash2 />Limpar canvas</button></div>}
      {panel === 'help' && <div className="canvas-help"><p><b>Mover:</b> arraste uma área vazia.</p><p><b>Zoom:</b> use os botões ou Ctrl + rolagem.</p><p><b>Conectar:</b> escolha Conectar e clique em dois cartões, imagens ou arquivos.</p><p><b>Desenhar:</b> personalize o pincel e arraste no canvas.</p><p><b>Excluir conexão:</b> dê dois cliques na linha.</p></div>}
    </div>}

    {tool !== 'select' && <div className="canvas-mode-indicator"><span>{tool === 'connect' ? (connectionStart ? 'Agora escolha o segundo elemento' : 'Clique no primeiro elemento') : 'Pincel ativo: arraste para desenhar'}</span><button onClick={() => activateTool('select')}><X />Sair</button></div>}

    <div ref={viewportRef} className={`project-canvas-viewport ${gridVisible ? '' : 'grid-hidden'}`} style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${24 * zoom}px ${24 * zoom}px` }} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onWheel={handleWheel}>
      <div className="project-canvas-stage" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
        <svg className="project-canvas-vectors" width="12000" height="12000" viewBox="0 0 12000 12000">
          <g className="canvas-connections">{connections.map(connection => { const from = nodes.find(node => node.id === connection.from); const to = nodes.find(node => node.id === connection.to); if (!from || !to) return null; const a = nodeCenter(from); const b = nodeCenter(to); return <line key={connection.id} className="canvas-connection" x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={connection.color || '#8A8A90'} onDoubleClick={() => { remember(); updateConnections(connectionsRef.current.filter(item => item.id !== connection.id)); window.setTimeout(persist, 0); }} />; })}</g>
          <g className="canvas-strokes">{strokes.map(stroke => <polyline key={stroke.id} points={stroke.points} fill="none" stroke={stroke.color} strokeWidth={stroke.width} strokeOpacity={stroke.opacity} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={stroke.style === 'dashed' ? `${stroke.width * 4} ${stroke.width * 2}` : stroke.style === 'dotted' ? `1 ${stroke.width * 2.2}` : undefined} />)}</g>
        </svg>
        {nodes.map(node => <article className={`project-canvas-node node-${node.kind} ${connectionStart === node.id ? 'connection-source' : ''}`} style={{ transform: `translate(${node.x}px,${node.y}px)` }} key={node.id} onClick={() => connectNode(node)}>
          <header onPointerDown={event => startNodeDrag(event, node)} onPointerMove={moveNode} onPointerUp={endNodeDrag} onPointerCancel={endNodeDrag}><GripVertical /><span>{nodeLabel(node)}</span><button aria-label="Remover item" onClick={event => { event.stopPropagation(); removeNode(node.id); }}><Trash2 /></button></header>
          {node.kind === 'image' && node.assetDataUrl ? <div className="canvas-image-content"><img src={node.assetDataUrl} alt={node.title} /><input aria-label="Nome da imagem" value={node.title} onFocus={remember} onChange={event => editNode(node.id, { title: event.target.value })} onBlur={persist} /></div> : node.kind === 'file' ? <div className="canvas-file-content"><Paperclip /><div><input aria-label="Nome do arquivo" value={node.title} onFocus={remember} onChange={event => editNode(node.id, { title: event.target.value })} onBlur={persist} /><small>{node.content}</small></div>{node.assetDataUrl && <a href={node.assetDataUrl} download={node.fileName || node.title} aria-label="Baixar arquivo" onClick={event => event.stopPropagation()}><Download /></a>}</div> : node.kind === 'link' ? <div className="canvas-link-content"><Link2 /><div><input aria-label="Título do link" value={node.title} onFocus={remember} onChange={event => editNode(node.id, { title: event.target.value })} onBlur={persist} /><small>{node.content}</small></div><a href={node.url} target="_blank" rel="noreferrer" aria-label="Abrir link" onClick={event => event.stopPropagation()}><ExternalLink /></a></div> : node.kind === 'shape' ? <div className={`canvas-shape shape-${node.shapeType || 'rectangle'}`} style={{ '--shape-fill': node.fill || '#29292b', '--shape-stroke': node.stroke || '#e0e0e0' } as React.CSSProperties} /> : <><input aria-label="Título do cartão" value={node.title} onFocus={remember} onChange={event => editNode(node.id, { title: event.target.value })} onBlur={persist} /><textarea aria-label="Conteúdo do cartão" value={node.content} onFocus={remember} onChange={event => editNode(node.id, { content: event.target.value })} onBlur={persist} rows={3} /></>}
        </article>)}
      </div>
      <div className="project-canvas-hint"><Move />Arraste para navegar · Ctrl + rolagem para ampliar</div>
    </div>
  </section>;
}

function nodeLabel(node: ProjectCanvasNode) {
  return ({ overview: 'VISÃO', task: 'TAREFA', idea: 'IDEIA', note: 'NOTA', milestone: 'MARCO', image: 'IMAGEM', file: 'ARQUIVO', link: 'LINK', shape: 'FORMA' } as Record<ProjectCanvasNode['kind'], string>)[node.kind];
}

function nodeCenter(node: ProjectCanvasNode) {
  const width = node.kind === 'overview' ? 310 : node.kind === 'shape' ? 220 : 270;
  const height = node.kind === 'image' ? 230 : node.kind === 'shape' ? 210 : 155;
  return { x: node.x + width / 2, y: node.y + height / 2 };
}

function normalizeLink(value: string) {
  try { const url = new URL(/^[a-z]+:/i.test(value) ? value : `https://${value}`); return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : null; } catch { return null; }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
