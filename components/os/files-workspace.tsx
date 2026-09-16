'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import {
  ArrowLeft, ArrowUpRight, Bookmark, Box, ChevronRight, Clipboard, Copy,
  Database, FilePlus2, FileSearch, FileText, Folder, FolderInput, FolderOpen,
  FolderPlus, Grid2X2, Hash, Image, Palette, Pencil, Plus,
  Search, Shapes, Sparkles, Trash2, X,
} from 'lucide-react';
import type { Activity, Data, Note } from '@/lib/model';

type EntryType = NonNullable<Note['entryType']>;
type ContextState = { entry: Note; x: number; y: number } | null;
type MenuKey = 'move' | 'path' | 'icon' | 'color' | null;

type Props = {
  data: Data;
  selected: string;
  draft: string;
  onChoose: (note: Note | null) => void;
  onDraft: (value: string) => void;
  onSave: () => void;
  onCommit: (next: Data) => void;
};

const typeDetails: Record<EntryType, { label: string; extension: string; Icon: typeof FileText }> = {
  note: { label: 'Nota', extension: '.md', Icon: FileText },
  folder: { label: 'Pasta', extension: '', Icon: Folder },
  canvas: { label: 'Canvas', extension: '.canvas', Icon: Grid2X2 },
  base: { label: 'Base', extension: '.base', Icon: Database },
  drawing: { label: 'Drawing', extension: '.drawing', Icon: Shapes },
};

const iconOptions = [
  { id: 'file', label: 'Arquivo', Icon: FileText },
  { id: 'folder', label: 'Pasta', Icon: Folder },
  { id: 'sparkles', label: 'Destaque', Icon: Sparkles },
  { id: 'box', label: 'Caixa', Icon: Box },
  { id: 'image', label: 'Imagem', Icon: Image },
  { id: 'hash', label: 'Símbolo', Icon: Hash },
];

const iconColors = ['#F4F4F4', '#BDBDBD', '#858585', '#696969', '#FFFFFF'];

function entryType(note: Note): EntryType {
  return note.entryType || 'note';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uniqueName(notes: Note[], base: string, parentId?: string) {
  const siblings = notes.filter(note => note.parentId === parentId).map(note => note.name.toLocaleLowerCase('pt-BR'));
  if (!siblings.includes(base.toLocaleLowerCase('pt-BR'))) return base;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const extension = dot > 0 ? base.slice(dot) : '';
  let index = 2;
  while (siblings.includes(`${stem} ${index}${extension}`.toLocaleLowerCase('pt-BR'))) index += 1;
  return `${stem} ${index}${extension}`;
}

function EntryIcon({ note, size = 16 }: { note: Note; size?: number }) {
  if (note.icon === 'none') return <span className="file-icon-empty" aria-hidden="true" />;
  const custom = iconOptions.find(option => option.id === note.icon);
  const Icon = custom?.Icon || typeDetails[entryType(note)].Icon;
  return <Icon size={size} style={{ color: note.iconColor || undefined }} />;
}

function activity(entry: Note, description: string): Activity {
  return { id: crypto.randomUUID(), type: 'note.updated', entityType: 'note', entityId: entry.id, description, created: new Date().toISOString() };
}

export function FilesWorkspace({ data, selected, draft, onChoose, onDraft, onSave, onCommit }: Props) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [context, setContext] = useState<ContextState>(null);
  const [submenu, setSubmenu] = useState<MenuKey>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notes = data.notes;
  const currentEntry = notes.find(note => note.id === selected && entryType(note) !== 'folder');
  const activeFolder = notes.find(note => note.id === activeFolderId && entryType(note) === 'folder');

  useEffect(() => {
    function closeMenu(event: globalThis.MouseEvent) {
      if (!(event.target as HTMLElement).closest('.file-context-menu')) setContext(null);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setContext(null); setSearchOpen(false); }
    }
    window.addEventListener('mousedown', closeMenu);
    window.addEventListener('keydown', escape);
    return () => { window.removeEventListener('mousedown', closeMenu); window.removeEventListener('keydown', escape); };
  }, []);

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const children = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    const visible = notes.filter(note => searchOpen && query
      ? isInside(note, activeFolderId, notes) && note.name.toLocaleLowerCase('pt-BR').includes(query)
      : note.parentId === (activeFolderId || undefined));
    return [...visible].sort((a, b) => Number(entryType(b) === 'folder') - Number(entryType(a) === 'folder') || a.name.localeCompare(b.name, 'pt-BR'));
  }, [notes, activeFolderId, search, searchOpen]);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  function persist(nextNotes: Note[], log?: Activity) {
    onCommit({ ...data, notes: nextNotes, activities: log ? [log, ...data.activities] : data.activities });
  }

  function targetParent(entry?: Note) {
    if (!entry) return activeFolderId || undefined;
    return entryType(entry) === 'folder' ? entry.id : entry.parentId;
  }

  function create(type: EntryType, reference?: Note) {
    const parentId = targetParent(reference);
    const detail = typeDetails[type];
    const stem = type === 'note' ? 'Nova nota' : type === 'folder' ? 'Nova pasta' : type === 'canvas' ? 'Novo canvas' : type === 'base' ? 'Nova base' : 'New drawing';
    const name = uniqueName(notes, stem + detail.extension, parentId);
    const entry: Note = { id: crypto.randomUUID(), name, content: '', updated: today(), entryType: type, parentId };
    persist([...notes, entry], activity(entry, `${detail.label} “${name}” criado.`));
    if (type === 'folder') setActiveFolderId(entry.id); else onChoose(entry);
    setContext(null);
    notify(`${detail.label} criado`);
  }

  function patchEntry(entry: Note, patch: Partial<Note>, message: string) {
    const next = { ...entry, ...patch, updated: today() };
    persist(notes.map(note => note.id === entry.id ? next : note), activity(next, message));
    if (selected === entry.id) onChoose(next);
    setContext(null);
    setSubmenu(null);
    notify(message);
  }

  function duplicate(entry: Note) {
    const dot = entry.name.lastIndexOf('.');
    const base = dot > 0 ? `${entry.name.slice(0, dot)} cópia${entry.name.slice(dot)}` : `${entry.name} cópia`;
    const copy: Note = { ...entry, id: crypto.randomUUID(), name: uniqueName(notes, base, entry.parentId), updated: today(), bookmarked: false };
    const copies = [copy];
    if (entryType(entry) === 'folder') {
      const idMap = new Map<string, string>([[entry.id, copy.id]]);
      const pending = notes.filter(note => descendants(entry.id, notes).has(note.id));
      while (pending.length) {
        const index = pending.findIndex(note => note.parentId && idMap.has(note.parentId));
        if (index < 0) break;
        const original = pending.splice(index, 1)[0];
        const childCopy = { ...original, id: crypto.randomUUID(), parentId: idMap.get(original.parentId!), updated: today(), bookmarked: false };
        idMap.set(original.id, childCopy.id);
        copies.push(childCopy);
      }
    }
    persist([...notes, ...copies], activity(copy, `Cópia de “${entry.name}” criada.`));
    if (entryType(copy) !== 'folder') onChoose(copy);
    setContext(null);
    notify('Cópia criada');
  }

  function move(entry: Note, parentId?: string) {
    if (entry.parentId === parentId) { setContext(null); return; }
    if (parentId && (parentId === entry.id || descendants(entry.id, notes).has(parentId))) {
      notify('Não é possível mover uma pasta para dentro dela mesma');
      return;
    }
    patchEntry(entry, { parentId }, `“${entry.name}” movido.`);
  }

  function rename(entry: Note) {
    const requested = window.prompt('Novo nome', entry.name)?.trim();
    if (!requested || requested === entry.name) { setContext(null); return; }
    const name = uniqueName(notes.filter(note => note.id !== entry.id), requested, entry.parentId);
    patchEntry(entry, { name }, `“${entry.name}” renomeado para “${name}”.`);
  }

  function remove(entry: Note) {
    const nested = entryType(entry) === 'folder' ? descendants(entry.id, notes) : new Set<string>();
    const detail = nested.size ? ` e ${nested.size} item(ns) dentro dela` : '';
    if (!window.confirm(`Apagar “${entry.name}”${detail}?`)) return;
    const removed = new Set([entry.id, ...nested]);
    const nextNotes = notes.filter(note => !removed.has(note.id));
    persist(nextNotes, activity(entry, `“${entry.name}” apagado.`));
    if (removed.has(selected)) onChoose(null);
    if (activeFolderId && removed.has(activeFolderId)) setActiveFolderId(entry.parentId || null);
    setContext(null);
    notify('Item apagado');
  }

  function openEntry(entry: Note) {
    if (entryType(entry) === 'folder') {
      setActiveFolderId(entry.id);
      setSearch('');
      setSearchOpen(false);
      return;
    }
    onChoose(entry);
  }

  function showInFolder(entry: Note) {
    setActiveFolderId(entry.parentId || null);
    setSearch('');
    setSearchOpen(false);
    if (entryType(entry) !== 'folder') onChoose(entry);
    setContext(null);
    notify('Item localizado na pasta');
  }

  function searchFolder(entry: Note) {
    setActiveFolderId(entryType(entry) === 'folder' ? entry.id : entry.parentId || null);
    setSearchOpen(true);
    setSearch('');
    setContext(null);
    setTimeout(() => searchRef.current?.focus(), 60);
  }

  async function copyPath(entry: Note) {
    const path = buildPath(entry, notes);
    try {
      await navigator.clipboard.writeText(path);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = path; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
    }
    setContext(null);
    notify(`Caminho copiado: ${path}`);
  }

  function openContext(event: ReactMouseEvent, entry: Note) {
    event.preventDefault();
    event.stopPropagation();
    const menuWidth = 294;
    const menuHeight = Math.min(610, window.innerHeight - 16);
    setContext({ entry, x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)), y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)) });
    setSubmenu(null);
  }

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 60);
  }

  return <div className="files-layout files-workspace">
    <aside className="file-tree">
      <div className="file-tree-head"><strong>Arquivos</strong><div><button aria-label="Pesquisar arquivos" onClick={openSearch}><Search size={15} /></button><button aria-label="Nova nota" onClick={() => create('note')}><Plus size={16} /></button></div></div>
      <div className="file-breadcrumb">
        {activeFolderId && <button aria-label="Voltar uma pasta" onClick={() => setActiveFolderId(activeFolder?.parentId || null)}><ArrowLeft size={14} /></button>}
        <button className="file-current-folder" onClick={() => setActiveFolderId(null)}><FolderOpen size={14} />{activeFolder?.name || 'Todos os arquivos'}</button>
      </div>
      {searchOpen && <div className="file-search"><Search size={14} /><input ref={searchRef} aria-label="Pesquisar nesta pasta" value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar nesta pasta" /><button aria-label="Fechar pesquisa" onClick={() => { setSearchOpen(false); setSearch(''); }}><X size={13} /></button></div>}
      <div className="file-list">
        {children.map(note => <button className={`file-entry ${selected === note.id ? 'active' : ''}`} key={note.id} onClick={() => openEntry(note)} onContextMenu={event => openContext(event, note)} title="Clique com o botão direito para mais opções">
          <EntryIcon note={note} /><span>{note.name}</span>{note.bookmarked && <Bookmark className="file-bookmark" size={12} fill="currentColor" />}{entryType(note) === 'folder' && <ChevronRight className="file-entry-chevron" size={13} />}
        </button>)}
        {!children.length && <div className="file-empty"><Folder size={20} /><span>{search ? 'Nenhum resultado nesta pasta.' : 'Esta pasta está vazia.'}</span><button onClick={() => create('note')}>Criar nota</button></div>}
      </div>
      <p className="file-context-hint">Clique com o botão direito em um item para ver mais ações.</p>
    </aside>
    <section className="editor">
      <div className="editor-top"><div>{currentEntry && <EntryIcon note={currentEntry} size={15} />}<span className="editor-file-title"><strong>{currentEntry?.name || 'Nenhum arquivo selecionado'}</strong><small>{currentEntry ? typeDetails[entryType(currentEntry)].label : 'Selecione ou crie um arquivo'}</small></span></div><button className="violet-button" onClick={currentEntry ? onSave : () => create('note')}>{currentEntry ? 'Salvar arquivo' : 'Criar nota'}</button></div>
      <textarea aria-label="Conteúdo do arquivo" value={draft} onChange={event => onDraft(event.target.value)} spellCheck={false} disabled={!currentEntry} placeholder={currentEntry ? 'Comece a escrever…' : 'Selecione um arquivo na barra lateral.'} />
    </section>
    <aside className="editor-preview"><div className="preview-label">PRÉVIA</div>{currentEntry ? draft.split('\n').map((line, index) => line.startsWith('# ') ? <h1 key={index}>{line.slice(2)}</h1> : line.startsWith('## ') ? <h2 key={index}>{line.slice(3)}</h2> : line ? <p key={index}>{line}</p> : <br key={index} />) : <div className="file-preview-empty"><FileText size={24} /><p>A prévia do arquivo aparecerá aqui.</p></div>}</aside>

    {context && <div className="file-context-menu" role="menu" aria-label={`Ações de ${context.entry.name}`} style={{ left: context.x, top: context.y }} onContextMenu={event => event.preventDefault()}>
      <ContextButton icon={FilePlus2} label="Nova nota" onClick={() => create('note', context.entry)} />
      <ContextButton icon={FolderPlus} label="Nova pasta" onClick={() => create('folder', context.entry)} />
      <ContextButton icon={Grid2X2} label="Novo canvas" onClick={() => create('canvas', context.entry)} />
      <ContextButton icon={Database} label="Nova base" onClick={() => create('base', context.entry)} />
      <ContextButton icon={Shapes} label="New drawing" onClick={() => create('drawing', context.entry)} />
      <MenuSeparator />
      <ContextButton icon={Copy} label="Fazer uma cópia" onClick={() => duplicate(context.entry)} />
      <ContextButton icon={FolderInput} label="Mover pasta para..." arrow active={submenu === 'move'} onClick={() => setSubmenu('move')} onMouseEnter={() => setSubmenu('move')}>
        <div className="file-context-submenu" role="menu">
          <ContextButton icon={FolderOpen} label="Raiz" checked={!context.entry.parentId} onClick={() => move(context.entry)} />
          {notes.filter(note => entryType(note) === 'folder' && note.id !== context.entry.id && !descendants(context.entry.id, notes).has(note.id)).map(folder => <ContextButton key={folder.id} icon={Folder} label={buildPath(folder, notes)} checked={context.entry.parentId === folder.id} onClick={() => move(context.entry, folder.id)} />)}
        </div>
      </ContextButton>
      <ContextButton icon={FileSearch} label="Pesquisa na pasta" onClick={() => searchFolder(context.entry)} />
      <ContextButton icon={Bookmark} label="Marcador..." checked={context.entry.bookmarked} onClick={() => patchEntry(context.entry, { bookmarked: !context.entry.bookmarked }, context.entry.bookmarked ? 'Marcador removido.' : 'Marcador adicionado.')} />
      <MenuSeparator />
      <ContextButton icon={Clipboard} label="Copiar caminho" arrow active={submenu === 'path'} onClick={() => void copyPath(context.entry)} onMouseEnter={() => setSubmenu('path')}>
        <div className="file-context-submenu file-path-submenu" role="menu"><span>Caminho relativo</span><code>{buildPath(context.entry, notes)}</code><button onClick={() => void copyPath(context.entry)}>Copiar</button></div>
      </ContextButton>
      <MenuSeparator />
      <ContextButton icon={ArrowUpRight} label="Mostrar na pasta" onClick={() => showInFolder(context.entry)} />
      <MenuSeparator />
      <ContextButton icon={Hash} label="Change icon" arrow active={submenu === 'icon'} onClick={() => setSubmenu('icon')} onMouseEnter={() => setSubmenu('icon')}>
        <div className="file-context-submenu" role="menu">{iconOptions.map(option => <ContextButton key={option.id} icon={option.Icon} label={option.label} checked={context.entry.icon === option.id} onClick={() => patchEntry(context.entry, { icon: option.id }, 'Ícone alterado.')} />)}</div>
      </ContextButton>
      <ContextButton icon={Palette} label="Change color of icon" arrow active={submenu === 'color'} onClick={() => setSubmenu('color')} onMouseEnter={() => setSubmenu('color')}>
        <div className="file-context-submenu file-color-submenu" role="menu"><span>Cor do ícone</span><div>{iconColors.map(color => <button key={color} aria-label={`Usar cor ${color}`} className={context.entry.iconColor === color ? 'active' : ''} style={{ background: color }} onClick={() => patchEntry(context.entry, { iconColor: color }, 'Cor do ícone alterada.')} />)}</div></div>
      </ContextButton>
      <ContextButton icon={X} label="Remove icon" onClick={() => patchEntry(context.entry, { icon: 'none' }, 'Ícone removido.')} />
      <MenuSeparator />
      <ContextButton icon={Pencil} label="Renomear" onClick={() => rename(context.entry)} />
      <ContextButton icon={Trash2} label="Apagar" danger onClick={() => remove(context.entry)} />
    </div>}
    {toast && <div className="file-toast" role="status">{toast}</div>}
  </div>;
}

function ContextButton({ icon: Icon, label, onClick, onMouseEnter, arrow, active, checked, danger, children }: { icon: typeof FileText; label: string; onClick: () => void; onMouseEnter?: () => void; arrow?: boolean; active?: boolean; checked?: boolean; danger?: boolean; children?: React.ReactNode }) {
  return <div className={`file-menu-item-wrap ${active ? 'submenu-open' : ''}`} onMouseEnter={onMouseEnter}>
    <button type="button" role="menuitem" className={`file-menu-item ${danger ? 'danger' : ''}`} onClick={event => { event.stopPropagation(); onClick(); }}><Icon size={17} /><span>{label}</span>{checked && <span className="file-menu-check">✓</span>}{arrow && <ChevronRight className="file-menu-arrow" size={15} />}</button>
    {children}
  </div>;
}

function MenuSeparator() {
  return <div className="file-menu-separator" role="separator" />;
}

function descendants(id: string, notes: Note[]) {
  const result = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const parent = queue.shift();
    for (const note of notes) if (note.parentId === parent && !result.has(note.id)) { result.add(note.id); queue.push(note.id); }
  }
  return result;
}

function isInside(note: Note, folderId: string | null, notes: Note[]) {
  if (!folderId) return true;
  if (note.id === folderId) return false;
  let parentId = note.parentId;
  while (parentId) {
    if (parentId === folderId) return true;
    parentId = notes.find(item => item.id === parentId)?.parentId;
  }
  return false;
}

function buildPath(entry: Note, notes: Note[]) {
  const segments = [entry.name];
  let parentId = entry.parentId;
  const visited = new Set<string>();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = notes.find(note => note.id === parentId);
    if (!parent) break;
    segments.unshift(parent.name);
    parentId = parent.parentId;
  }
  return '/' + segments.join('/');
}
