import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Note, NoteStatus, NoteImportance, Group, ColumnWidths, ThemeConfig, ViewState, Language, NoteTexture, NotePreset, NoteStyleVariant, NoteDecorationPosition, SmartBook } from '../types';
import { Pin, Trash2, MapPin, Bell, PenLine, Sparkles, Image as ImageIcon, Layout, GripVertical, Plus, Save, X, Calendar, FolderOpen, FileDown, FileUp, Library, Table, StickyNote as StickyNoteIcon, Settings2, Palette, Folder, RefreshCw, AlertTriangle, Globe, HelpCircle, Book, BookOpen, Settings, Layers, ClipboardList, Eye, Link, Star } from 'lucide-react';
import { parseNoteWithAI } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { translations } from '../utils/i18n';
import TimePicker from './TimePicker';
import NoteStyleControls from './NoteStyleControls';
import StickyNote from './StickyNote';

interface NotebookProps {
  groups: Group[];
  activeGroupId: string;
  onSetActiveGroupId: (id: string) => void;
  onUpdateGroup: (group: Group) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (id: string) => void;
  onReorderGroups: (fromIndex: number, toIndex: number) => void;

  notes: Note[];
  presets: NotePreset[];
  setPresets: (presets: NotePreset[]) => void;
  onAddNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onPinNote: (id: string, x?: number, y?: number) => void;
  onBatchPinNotes: (ids: string[]) => void;
  onReorderNotes: (fromIndex: number, toIndex: number) => void;
  
  bookshelfTheme: ThemeConfig;
  setBookshelfTheme: (t: ThemeConfig) => void;
  onResetBookshelfTheme: () => void;
  notebookTheme: ThemeConfig;
  setNotebookTheme: (t: ThemeConfig) => void;
  onResetNotebookTheme: () => void;
  
  currentMaxZIndex: number;
  viewState: ViewState;
  setViewState: React.Dispatch<React.SetStateAction<ViewState>>;

  language: Language;
  setLanguage: (lang: Language) => void;

  books: SmartBook[];
  onUpdateBooks: (books: SmartBook[]) => void;
}

const formatDate = (ts?: number) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const toDateTimeLocal = (ts?: number) => {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

type SortKey = 'createdAt' | 'startTime' | 'endTime' | 'importance' | 'status' | 'reminderTime';
interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning' | 'info';
  isCustomContent?: boolean;
}

const Notebook: React.FC<NotebookProps> = ({ 
  groups,
  activeGroupId,
  onSetActiveGroupId,
  onUpdateGroup,
  onCreateGroup,
  onDeleteGroup,
  onReorderGroups,
  notes, 
  presets,
  setPresets,
  onAddNote, 
  onUpdateNote, 
  onDeleteNote, 
  onPinNote,
  onBatchPinNotes,
  onReorderNotes,
  bookshelfTheme,
  setBookshelfTheme,
  onResetBookshelfTheme,
  notebookTheme,
  setNotebookTheme,
  onResetNotebookTheme,
  currentMaxZIndex,
  viewState,
  setViewState,
  language,
  setLanguage,
  books,
  onUpdateBooks
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState('');
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  
  const [groupsPanelWidth, setGroupsPanelWidth] = useState(256);
  const [isResizingGroups, setIsResizingGroups] = useState(false);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'bookshelf' | 'notebook' | 'presets'>('general');
  const [helpTab, setHelpTab] = useState<'bookshelf' | 'notebooks' | 'notebook' | 'note' | 'settings'>('bookshelf');
  
  const [newPresetName, setNewPresetName] = useState('');
  
  // State for Preset Editor in Settings
  const [draftPreset, setDraftPreset] = useState<{
      theme: ThemeConfig;
      styleVariant: NoteStyleVariant;
      textureVariant: NoteTexture;
      decorationPosition: NoteDecorationPosition;
  }>({
      theme: { type: 'color', value: '#fef3c7', textColor: '#000000', opacity: 1 },
      styleVariant: 'clip',
      textureVariant: 'lined',
      decorationPosition: 'top-left'
  });

  const [modalConfig, setModalConfig] = useState<ModalConfig>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  
  const [colWidths, setColWidths] = useState<ColumnWidths>({
    content: 400,
    createdAt: 110,
    startTime: 110,
    endTime: 110,
    location: 100,
    importance: 70,
    status: 90,
    reminder: 110,
    actions: 80
  });
  const [resizingCol, setResizingCol] = useState<keyof ColumnWidths | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  const notebookBgImageInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  const [formData, setFormData] = useState<{
    content: string;
    createdAt: string;
    startTime: string;
    endTime: string;
    location: string;
    status: NoteStatus;
    importance: NoteImportance;
    isReminderOn: boolean;
    reminderTime: string;
  }>({
    content: '',
    createdAt: '',
    startTime: '',
    endTime: '',
    location: '',
    status: NoteStatus.TODO,
    importance: NoteImportance.MEDIUM,
    isReminderOn: false,
    reminderTime: ''
  });
  
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const dragGroupItem = useRef<number | null>(null);
  const dragGroupOverItem = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId), [groups, activeGroupId]);
  const currentGroupNotes = useMemo(() => notes.filter(n => n.groupId === activeGroupId), [notes, activeGroupId]);

  const sortedNotes = useMemo(() => {
    let filtered = [...currentGroupNotes];

    if (showTodayOnly) {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayEnd = new Date();
        todayEnd.setHours(23,59,59,999);
        const tsStart = todayStart.getTime();
        const tsEnd = todayEnd.getTime();

        filtered = filtered.filter(n => {
            if (!n.startTime) return false;
            // Overlap logic: Event Start <= Today End AND Event End >= Today Start
            const end = n.endTime || n.startTime;
            return n.startTime <= tsEnd && end >= tsStart;
        });
    }

    if (!sortConfig) return filtered;
    
    return filtered.sort((a, b) => {
      let valA: any = a[sortConfig.key];
      let valB: any = b[sortConfig.key];

      if (sortConfig.key === 'reminderTime') {
        valA = a.isReminderOn ? (a.reminderTime || 0) : -1;
        valB = b.isReminderOn ? (b.reminderTime || 0) : -1;
      }

      if (sortConfig.key === 'importance') {
        const rank = { [NoteImportance.HIGH]: 3, [NoteImportance.MEDIUM]: 2, [NoteImportance.LOW]: 1 };
        valA = rank[a.importance] || 0;
        valB = rank[b.importance] || 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [currentGroupNotes, sortConfig, showTodayOnly]);

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setFormData({
      content: note.content,
      createdAt: toDateTimeLocal(note.createdAt),
      startTime: toDateTimeLocal(note.startTime),
      endTime: toDateTimeLocal(note.endTime),
      location: note.location || '无',
      status: note.status,
      importance: note.importance || NoteImportance.MEDIUM,
      isReminderOn: note.isReminderOn,
      reminderTime: toDateTimeLocal(note.reminderTime)
    });
  };

  const saveEditing = (id: string) => {
    const createdTs = formData.createdAt ? new Date(formData.createdAt).getTime() : Date.now();
    const startTs = formData.startTime ? new Date(formData.startTime).getTime() : undefined;
    const endTs = formData.endTime ? new Date(formData.endTime).getTime() : undefined;
    const remTs = formData.reminderTime ? new Date(formData.reminderTime).getTime() : undefined;
    
    const original = notes.find(n => n.id === id);
    if (!original) return;

    onUpdateNote({
      ...original,
      content: formData.content,
      createdAt: createdTs,
      startTime: startTs,
      endTime: endTs,
      location: formData.location,
      status: formData.status,
      importance: formData.importance,
      isReminderOn: formData.isReminderOn,
      reminderTime: remTs
    });
    setEditingId(null);
  };

  const createEmptyEvent = () => {
    const now = Date.now();
    const id = uuidv4();
    
    const defaultPreset = presets.find(p => p.isDefault) || {
        theme: { type: 'color', value: '#fef3c7', textColor: '#000000', opacity: 1 },
        styleVariant: 'clip',
        textureVariant: 'lined',
        decorationPosition: 'top-left'
    };

    // @ts-ignore
    const defaultNote: Note = {
      id: id,
      groupId: activeGroupId,
      content: 'happy every day!', 
      createdAt: now,
      startTime: now,
      endTime: now,
      location: '无',
      status: NoteStatus.TODO,
      importance: NoteImportance.MEDIUM,
      isReminderOn: false,
      reminderTime: now,
      isPinned: false,
      position: { x: window.innerWidth / 2 - 128, y: window.innerHeight / 2 - 100 },
      zIndex: currentMaxZIndex + 1,
      dimensions: { width: 280, height: 275 },
      
      theme: defaultPreset.theme,
      styleVariant: defaultPreset.styleVariant,
      textureVariant: defaultPreset.textureVariant,
      decorationPosition: defaultPreset.decorationPosition
    };
    onAddNote(defaultNote);
  };

  const handleCreatePreset = () => {
      if(!newPresetName) return;
      
      const existing = presets.find(p => p.name === newPresetName);
      if (existing) {
          alert("A style with this name already exists. Please choose a different name.");
          return;
      }
      
      const newPreset: NotePreset = {
          id: uuidv4(),
          name: newPresetName,
          ...draftPreset,
          isDefault: presets.length === 0 // If it's the first one, make it default
      };
      
      setPresets([...presets, newPreset]);
      setNewPresetName('');
  };

  const loadPresetIntoDraft = (preset: NotePreset) => {
      setDraftPreset({
          theme: preset.theme,
          styleVariant: preset.styleVariant,
          textureVariant: preset.textureVariant,
          decorationPosition: preset.decorationPosition
      });
      setNewPresetName(preset.name);
  }

  const handleDeletePreset = (id: string) => {
      setPresets(presets.filter(p => p.id !== id));
  };

  const handleSetDefaultPreset = (id: string) => {
      setPresets(presets.map(p => ({
          ...p,
          isDefault: p.id === id
      })));
  };

  const handleBatchPin = () => {
      const idsToPin = sortedNotes.filter(n => !n.isPinned).map(n => n.id);
      onBatchPinNotes(idsToPin);
  };

  const handleAIParse = async () => {
    if (!formData.content) return;
    setIsProcessingAI(true);
    const parsed = await parseNoteWithAI(formData.content);
    setIsProcessingAI(false);
    
    if (parsed) {
      const parsedTime = parsed.eventTime ? parsed.eventTime.slice(0, 19) : formData.startTime;
      setFormData(prev => ({
        ...prev,
        content: parsed.content || prev.content,
        startTime: parsedTime,
        endTime: parsedTime,
        location: parsed.location || prev.location
      }));
    }
  };

  const handleTitleDoubleClick = () => {
      if (activeGroup) {
          setTempTitle(activeGroup.name);
          setIsEditingTitle(true);
      }
  };

  const handleTitleSave = () => {
      if (activeGroup && tempTitle.trim()) {
          onUpdateGroup({ ...activeGroup, name: tempTitle });
      }
      setIsEditingTitle(false);
  }

  const confirmAction = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'danger') => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      type
    });
  };

  const showHelp = () => {
      // Close stickies view (hide notes) but keep notebook open (don't force false)
      setViewState(prev => ({ ...prev, showStickies: false, showTodayStickies: false }));
      setModalConfig({
          isOpen: true,
          title: t.help.title,
          message: "",
          onConfirm: () => setModalConfig(p => ({...p, isOpen: false})),
          type: 'info',
          isCustomContent: true
      })
  }

  const handleOpenSettings = () => {
      // Close stickies view (hide notes) but keep notebook open
      setViewState(prev => ({ ...prev, showStickies: false, showTodayStickies: false }));
      setShowSettingsModal(true);
  }

  const requestDeleteGroup = (id: string, name: string) => {
    if (groups.length <= 1) return;
    confirmAction(
      t.groups.deleteConfirmTitle,
      t.groups.deleteConfirmMsg,
      () => onDeleteGroup(id)
    );
  };

  const requestDeleteNote = (id: string) => {
    confirmAction(
      t.note.deleteConfirmTitle,
      t.note.deleteConfirmMsg,
      () => onDeleteNote(id)
    );
  };

  const requestResetBookshelf = () => {
    confirmAction(
      t.themeMenu.reset,
      t.themeMenu.resetDesktopMsg,
      onResetBookshelfTheme,
      'warning'
    );
  };

  const requestResetNotebook = () => {
    confirmAction(
      t.themeMenu.reset,
      t.themeMenu.resetNotebookMsg,
      onResetNotebookTheme,
      'warning'
    );
  };

  const exportCSV = () => {
    const groupName = groups.find(g => g.id === activeGroupId)?.name || 'Export';
    const header = ['ID', 'Content', 'AddedTime', 'StartTime', 'EndTime', 'Location', 'Status', 'Importance', 'ReminderOn', 'ReminderTime'].join(',');
    const rows = sortedNotes.map(n => [
      n.id,
      `"${n.content.replace(/"/g, '""')}"`,
      new Date(n.createdAt).toISOString(),
      n.startTime ? new Date(n.startTime).toISOString() : '',
      n.endTime ? new Date(n.endTime).toISOString() : '',
      `"${(n.location || '').replace(/"/g, '""')}"`,
      n.status,
      n.importance,
      n.isReminderOn,
      n.reminderTime ? new Date(n.reminderTime).toISOString() : ''
    ].join(','));
    
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return; 

      const newNotes: Note[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (cols.length < 2) continue;
        
        const clean = (s: string) => s ? s.replace(/^"|"$/g, '').replace(/""/g, '"') : '';
        const content = clean(cols[1]);
        if (!content) continue;

        const now = Date.now();
        newNotes.push({
          id: uuidv4(),
          groupId: activeGroupId,
          content: content,
          createdAt: cols[2] ? new Date(clean(cols[2])).getTime() : now,
          startTime: cols[3] ? new Date(clean(cols[3])).getTime() : undefined,
          endTime: cols[4] ? new Date(clean(cols[4])).getTime() : undefined,
          location: clean(cols[5]) || '无',
          status: (Object.values(NoteStatus).includes(clean(cols[6]) as any) ? clean(cols[6]) as NoteStatus : NoteStatus.TODO),
          importance: (Object.values(NoteImportance).includes(clean(cols[7]) as any) ? clean(cols[7]) as NoteImportance : NoteImportance.MEDIUM),
          isReminderOn: clean(cols[8]) === 'true',
          reminderTime: cols[9] ? new Date(clean(cols[9])).getTime() : undefined,
          theme: { type: 'color', value: '#fef3c7', textColor: '#000000', opacity: 1 },
          isPinned: false,
          position: { x: 100, y: 100 },
          zIndex: currentMaxZIndex + 1,
          styleVariant: 'clip',
          textureVariant: 'lined',
          dimensions: { width: 280, height: 275 }
        });
      }
      newNotes.forEach(n => onAddNote(n));
      alert(`Imported ${newNotes.length} events into current group.`);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        alert(`Connected to folder: ${dirHandle.name}\n(Note: Persistent file watching requires further browser permissions implementation. Please use Import/Export for now.)`);
      } catch (err) { }
    } else {
      alert("Your browser does not support direct folder access. Please use the Import/Export CSV buttons to manage your data files.");
    }
  };

  const handleNotebookBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNotebookTheme({ ...notebookTheme, type: 'image', value: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewBook = () => {
      // Find a free position or just append
      const positions = books.map(b => b.position);
      let nextPos = 0;
      while(positions.includes(nextPos)) nextPos++;
      
      const newBook: SmartBook = {
          id: Date.now().toString(),
          title: 'New Book',
          url: 'https://',
          color: '#607d8b',
          position: nextPos,
          spineDetail: Math.floor(Math.random() * 4)
      };
      onUpdateBooks([...books, newBook]);
  };

  const handleMouseDownResize = (e: React.MouseEvent, col: keyof ColumnWidths) => {
    setResizingCol(col);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = colWidths[col];
    document.body.style.cursor = 'col-resize';
  };

  const handleGroupsPanelResizeStart = (e: React.MouseEvent) => {
    setIsResizingGroups(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = groupsPanelWidth;
    document.body.style.cursor = 'ew-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingCol) {
        const diff = e.clientX - resizeStartX.current;
        const newWidth = Math.max(50, resizeStartWidth.current + diff);
        setColWidths(prev => ({ ...prev, [resizingCol]: newWidth }));
      }
      if (isResizingGroups) {
         const diff = e.clientX - resizeStartX.current;
         const newWidth = Math.max(150, Math.min(600, resizeStartWidth.current + diff));
         setGroupsPanelWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (resizingCol) {
          setResizingCol(null);
          document.body.style.cursor = 'default';
      }
      if (isResizingGroups) {
          setIsResizingGroups(false);
          document.body.style.cursor = 'default';
      }
    };

    if (resizingCol || isResizingGroups) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, isResizingGroups]);

  // Updated to support opacity on the background layer directly
  const getContainerStyle = (theme: ThemeConfig) => {
      const style: React.CSSProperties = {
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          opacity: theme.opacity, // Apply user opacity here
          backgroundColor: theme.type === 'color' ? theme.value : undefined,
          backgroundImage: theme.type === 'image' ? `url(${theme.value})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '1.5rem', // Match rounded-3xl
      };
      return style;
  };

  const SortArrow = ({ column }: { column: SortKey }) => {
    const isActive = sortConfig?.key === column;
    return (
      <div className="flex flex-col ml-1 opacity-50 text-[8px] leading-[8px]">
        <span className={isActive && sortConfig?.direction === 'asc' ? 'text-black opacity-100' : ''}>▲</span>
        <span className={isActive && sortConfig?.direction === 'desc' ? 'text-black opacity-100' : ''}>▼</span>
      </div>
    );
  };

  const HeaderCell = ({ label, colKey, sortKey }: { label: string, colKey: keyof ColumnWidths, sortKey?: SortKey }) => (
    <div 
      className="relative flex items-center h-full px-2 text-xs font-bold text-stone-600 uppercase tracking-wider select-none bg-stone-50/80 hover:bg-stone-200/80 transition-colors backdrop-blur-sm"
      style={{ width: colWidths[colKey] }}
    >
      <div className="flex-1 flex items-center cursor-pointer" onClick={() => sortKey && handleSort(sortKey)}>
        {label}
        {sortKey && <SortArrow column={sortKey} />}
      </div>
      <div 
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-20"
        onMouseDown={(e) => handleMouseDownResize(e, colKey)}
      ></div>
    </div>
  );

  const handleSort = (key: SortKey) => {
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' });
      else setSortConfig(null);
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };

  const handleDragStart = (e: React.DragEvent, position: number) => {
    if (editingId || sortConfig || showTodayOnly) { e.preventDefault(); return; }
    dragItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnter = (e: React.DragEvent, position: number) => {
    if (editingId || sortConfig || showTodayOnly) return;
    dragOverItem.current = position;
  };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && !sortConfig && !showTodayOnly) {
       onReorderNotes(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleGroupDragStart = (e: React.DragEvent, position: number) => {
    if (editingGroupId) { e.preventDefault(); return; }
    dragGroupItem.current = position;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleGroupDragEnter = (e: React.DragEvent, position: number) => {
    if (editingGroupId) return;
    dragGroupOverItem.current = position;
  };
  const handleGroupDragEnd = () => {
    if (dragGroupItem.current !== null && dragGroupOverItem.current !== null && dragGroupItem.current !== dragGroupOverItem.current) {
       onReorderGroups(dragGroupItem.current, dragGroupOverItem.current);
    }
    dragGroupItem.current = null;
    dragGroupOverItem.current = null;
  };

  const SidebarIcon = ({ 
    icon: Icon, 
    label, 
    isActive, 
    onClick, 
    glow 
  }: { icon: any, label: string, isActive: boolean, onClick: () => void, glow?: boolean }) => (
     <div className="relative group/icon flex items-center justify-center w-12 h-12">
        <button 
           onClick={onClick}
           className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-white text-blue-600 shadow-lg scale-110' : 'text-stone-300 bg-white/10 hover:bg-white/30 hover:text-white'} ${glow ? 'shadow-[0_0_15px_rgba(255,255,255,0.6)] animate-pulse' : ''}`}
        >
           <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </button>
        <div className="absolute left-full ml-3 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {label}
        </div>
     </div>
  );

  // --- Render Dummy Preview Note ---
  const renderPreviewNote = () => {
      const dummyNote: Note = {
          id: 'preview',
          groupId: '',
          content: 'This is a style preview.',
          createdAt: Date.now(),
          startTime: Date.now(),
          endTime: Date.now() + 3600000,
          status: NoteStatus.TODO,
          importance: NoteImportance.MEDIUM,
          isReminderOn: false,
          isPinned: true,
          // Calculate Center Position for 220x220 note in 300x300 container
          // Container: 300x300
          // Note scaled: ~220x220 (approx, scale-75 of 280ish)
          // Actually let's just center it
          position: { x: 35, y: 40 },
          zIndex: 1,
          theme: draftPreset.theme,
          styleVariant: draftPreset.styleVariant,
          textureVariant: draftPreset.textureVariant,
          decorationPosition: draftPreset.decorationPosition,
          dimensions: { width: 220, height: 220 }
      };
      
      return (
          <div className="relative w-full h-full pointer-events-none select-none overflow-hidden scale-75 origin-top-left" style={{ transform: 'scale(0.75) translate(20px, 20px)' }}>
              <StickyNote 
                note={dummyNote} 
                presets={[]} 
                onUpdate={()=>{}} 
                onClose={()=>{}} 
                onFocus={()=>{}} 
                language={language} 
              />
          </div>
      )
  }

  return (
    // CRITICAL: pointer-events-none ensures clicks pass through empty space to the Bookshelf
    <div className="flex w-full h-full max-w-[1800px] mx-auto transition-all relative justify-center pointer-events-none">
      
      {/* ... Sidebar and Panels ... */}
      
      {/* --- Sidebar (3-Groups) --- */}
      {/* CRITICAL: pointer-events-auto ensures the sidebar is clickable */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 w-20 z-[900] flex flex-col items-center justify-start py-6 gap-0 -translate-x-[65%] hover:translate-x-0 transition-transform duration-300 bg-stone-900/80 backdrop-blur-md rounded-r-2xl shadow-2xl border-y border-r border-white/10 group pointer-events-auto">
          <div className="absolute right-0 top-0 bottom-0 w-8 cursor-pointer flex items-center justify-center">
              <div className="w-1 h-12 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors"></div>
          </div>
          <div className="flex flex-col items-center pr-2 w-full gap-0">
            {/* GROUP 1: Workspace */}
            <SidebarIcon icon={BookOpen} label={t.sidebar.bookshelf} isActive={!viewState.showGroups && !viewState.showNotebook} onClick={() => setViewState(p => ({ ...p, showGroups: false, showNotebook: false }))} />
            
            <SidebarIcon icon={Library} label={t.sidebar.notebooks} isActive={viewState.showGroups} onClick={() => setViewState(p => ({ ...p, showGroups: !p.showGroups }))} />
            <SidebarIcon icon={Table} label={t.sidebar.notebook} isActive={viewState.showNotebook} onClick={() => setViewState(p => ({ ...p, showNotebook: !p.showNotebook }))} />
            
            {/* Desktop Stickies */}
            <SidebarIcon 
                icon={StickyNoteIcon} 
                label={t.sidebar.note} 
                isActive={viewState.showStickies} 
                onClick={() => setViewState(p => ({ ...p, showStickies: !p.showStickies, showTodayStickies: false }))} 
                glow={viewState.showStickies && notes.some(n => n.isPinned)} 
            />
            
            <div className="w-8 h-px bg-white/20 my-3"></div>
            
            {/* GROUP 2: Focus */}
            <SidebarIcon icon={Calendar} label={t.sidebar.today} isActive={showTodayOnly} onClick={() => setShowTodayOnly(!showTodayOnly)} />
            
            <SidebarIcon 
                icon={ClipboardList} 
                label={t.sidebar.todayStickies} 
                isActive={viewState.showTodayStickies} 
                onClick={() => setViewState(p => ({ ...p, showTodayStickies: !p.showTodayStickies, showStickies: false }))} 
            />

            <div className="w-8 h-px bg-white/20 my-3"></div>

            {/* GROUP 3: System */}
            <SidebarIcon icon={Settings} label={t.sidebar.settings} isActive={showSettingsModal} onClick={handleOpenSettings} />
            <SidebarIcon icon={HelpCircle} label={t.sidebar.help} isActive={false} onClick={showHelp} />
          </div>
      </div>

      {/* --- Groups Panel --- */}
      {/* CRITICAL: pointer-events-auto */}
      <div 
         className={`relative transition-all duration-500 ease-in-out flex flex-col gap-2 shrink-0 pointer-events-auto ${viewState.showGroups ? 'opacity-100 mr-1' : 'w-0 opacity-0 mr-0 overflow-hidden'}`}
         style={{ width: viewState.showGroups ? groupsPanelWidth : 0 }}
      >
        <div 
          className="relative w-full h-full rounded-3xl shadow-xl overflow-hidden border border-white/20 flex flex-col"
          style={getContainerStyle(notebookTheme)}
        >
          {/* Content Wrapper for Z-Index */}
          <div className="relative z-10 w-full h-full flex flex-col bg-white/30">
            {/* Texture */}
            {notebookTheme.texture && notebookTheme.texture !== 'solid' && (
                  <div className={`absolute inset-0 pointer-events-none opacity-20 ${
                    notebookTheme.texture === 'lined' ? 'bg-pattern-lines' : 
                    notebookTheme.texture === 'grid' ? 'bg-pattern-grid' : 
                    notebookTheme.texture === 'dots' ? 'bg-pattern-dots' : ''
                  }`}></div>
            )}
            <div className="p-4 h-full overflow-y-auto flex flex-col">
              <div className="text-xs font-bold text-stone-500 px-2 py-1 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Library size={12} /> {t.groups.title}
              </div>
              {groups.map((group, index) => (
                  <div 
                  key={group.id}
                  draggable={!editingGroupId}
                  onDragStart={(e) => handleGroupDragStart(e, index)}
                  onDragEnter={(e) => handleGroupDragEnter(e, index)}
                  onDragEnd={handleGroupDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => onSetActiveGroupId(group.id)}
                  onDoubleClick={() => { setEditingGroupId(group.id); setTempGroupName(group.name); }}
                  className={`p-3 mb-2 rounded-xl cursor-pointer text-sm font-medium transition-all flex items-center justify-between group/item border border-transparent ${activeGroupId === group.id ? 'bg-stone-800 text-white shadow-md border-stone-600' : 'hover:bg-black/5 text-stone-700 hover:border-black/10'}`}
                  >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <div className="cursor-grab active:cursor-grabbing text-stone-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <GripVertical size={12} />
                      </div>
                      {editingGroupId === group.id ? (
                          <input 
                          autoFocus 
                          className="w-full bg-white text-black rounded px-1 outline-none"
                          value={tempGroupName}
                          onChange={(e) => setTempGroupName(e.target.value)}
                          onBlur={() => { onUpdateGroup({ ...group, name: tempGroupName }); setEditingGroupId(null); }}
                          onKeyDown={(e) => { if(e.key === 'Enter') { onUpdateGroup({ ...group, name: tempGroupName }); setEditingGroupId(null); }}}
                          />
                      ) : (
                          <span className="truncate">{group.name}</span>
                      )}
                  </div>
                  {groups.length > 1 && (
                      <button 
                      onClick={(e) => { e.stopPropagation(); requestDeleteGroup(group.id, group.name); }}
                      className="opacity-0 group-hover/item:opacity-100 hover:text-red-400 p-1 transition-opacity shrink-0"
                      title="Delete Notebook"
                      >
                      <X size={12} />
                      </button>
                  )}
                  </div>
              ))}
              <button onClick={onCreateGroup} className="mt-2 p-3 border-2 border-dashed border-black/10 rounded-xl text-black/40 hover:border-black/30 hover:text-black/60 flex justify-center transition-colors" title={t.groups.newGroup}>
                  <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
        {viewState.showGroups && (
            <div 
                className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-400 z-50 transition-colors pointer-events-auto"
                onMouseDown={handleGroupsPanelResizeStart}
            ></div>
        )}
      </div>

      {/* --- Main Table Panel --- */}
      {/* CRITICAL: pointer-events-auto */}
      <div className={`relative transition-all duration-500 ease-in-out flex flex-col overflow-hidden pointer-events-auto ${viewState.showNotebook ? 'flex-1 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10'}`}>
         {/* Notebook Container - Separation of Background from Content for Opacity */}
         <div className="relative w-full h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
             
             {/* Background Layer with Opacity */}
             <div style={getContainerStyle(notebookTheme)}></div>

             {/* Texture Layer */}
             {notebookTheme.texture && notebookTheme.texture !== 'solid' && (
                  <div className={`absolute inset-0 pointer-events-none opacity-20 z-0 ${
                    notebookTheme.texture === 'lined' ? 'bg-pattern-lines' : 
                    notebookTheme.texture === 'grid' ? 'bg-pattern-grid' : 
                    notebookTheme.texture === 'dots' ? 'bg-pattern-dots' : ''
                  }`}></div>
             )}

            <div className="absolute left-0 top-0 bottom-0 w-3 z-20 flex flex-col justify-evenly py-4 opacity-50">
               {Array.from({ length: 12 }).map((_, i) => (
               <div key={i} className="w-6 h-3 -ml-4 rounded-full bg-stone-400 shadow-sm border border-stone-500 rotate-12"></div>
               ))}
            </div>

            {/* Toolbar */}
            <div className="relative z-[60] bg-white/30 backdrop-blur-md p-3 border-b border-stone-200/50 flex justify-between items-center shadow-sm shrink-0">
               <div className="pl-2">
                  <div className="flex items-center gap-2">
                      <PenLine className="text-stone-600" />
                      {isEditingTitle ? (
                          <input 
                            autoFocus
                            className="text-xl font-bold text-stone-800 bg-white/50 px-1 rounded border border-stone-300 outline-none"
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                          />
                      ) : (
                          <h1 
                            className="text-xl font-bold text-stone-800 cursor-text hover:bg-black/5 rounded px-1 transition-colors"
                            onDoubleClick={handleTitleDoubleClick}
                            title={t.toolbar.doubleClick}
                          >
                            {activeGroup?.name || "Notebook"}
                          </h1>
                      )}
                  </div>
                  <p className="text-[10px] text-stone-500 ml-8">
                     {showTodayOnly 
                       ? <span className="text-blue-600 font-bold flex items-center gap-1"><Calendar size={10}/> {t.sidebar.today}</span> 
                       : sortConfig ? t.toolbar.sortingActive : t.toolbar.dragToReorder}
                  </p>
               </div>
               
               <div className="flex gap-2 items-center">
                   <button
                     onClick={handleBatchPin}
                     className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow hover:shadow-lg active:scale-95 transform"
                     title={t.toolbar.pinAllTitle}
                  >
                     <Layers size={16} /> <span className="hidden sm:inline">{t.toolbar.pinAll}</span>
                  </button>

                  <button
                     onClick={createEmptyEvent}
                     className="flex items-center gap-1 px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium shadow-lg hover:shadow-xl active:scale-95 transform"
                  >
                     <Plus size={16} /> <span className="hidden sm:inline">{t.toolbar.newEvent}</span>
                  </button>

                  <div className="h-6 w-px bg-stone-300 mx-2"></div>

                  <div className="relative group">
                     <button className="p-2 text-stone-600 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1" title={t.toolbar.dataOptions}>
                        <FolderOpen size={18} />
                     </button>
                     <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block">
                        <div className="bg-white rounded-lg shadow-xl border border-stone-100 p-1">
                           <button onClick={handleOpenFolder} className="flex items-center gap-2 w-full p-2 text-xs hover:bg-stone-100 text-left rounded text-stone-700">
                               <Folder size={14} className="text-yellow-500" /> {t.dataMenu.openFolder}
                           </button>
                           <div className="border-t my-1"></div>
                           <button onClick={exportCSV} className="flex items-center gap-2 w-full p-2 text-xs hover:bg-stone-100 text-left rounded text-stone-700">
                              <FileDown size={14} className="text-blue-500" /> {t.dataMenu.exportCSV}
                           </button>
                           <label className="flex items-center gap-2 w-full p-2 text-xs hover:bg-stone-100 text-left rounded cursor-pointer text-stone-700">
                              <FileUp size={14} className="text-green-500" /> {t.dataMenu.importCSV}
                              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={importCSV} />
                           </label>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto notebook-scroll paper-lines relative z-10">
               {/* ... Table ... */}
               <div style={{ width: (Object.values(colWidths) as number[]).reduce((a, b) => a + b, 0) + 40, minWidth: '100%' }}>
                  
                  <div className="flex sticky top-0 z-10 shadow-sm h-9 pl-4 border-b border-stone-300/50 bg-white/40 backdrop-blur-md">
                      <HeaderCell label={t.table.content} colKey="content" />
                      <HeaderCell label={t.table.added} colKey="createdAt" sortKey="createdAt" />
                      <HeaderCell label={t.table.start} colKey="startTime" sortKey="startTime" />
                      <HeaderCell label={t.table.end} colKey="endTime" sortKey="endTime" />
                      <HeaderCell label={t.table.location} colKey="location" />
                      <HeaderCell label={t.table.importance} colKey="importance" sortKey="importance" />
                      <HeaderCell label={t.table.status} colKey="status" sortKey="status" />
                      <HeaderCell label={t.table.reminder} colKey="reminder" sortKey="reminderTime" />
                      <div style={{ width: colWidths.actions }} className="flex items-center justify-end px-2 text-xs font-bold text-stone-600 uppercase bg-stone-50/80 backdrop-blur-sm">
                        {t.table.actions}
                      </div>
                  </div>

                  <div className="pb-10 pl-4">
                      {sortedNotes.length === 0 && (
                          <div className="text-center py-12 text-stone-500/50 italic">
                              {t.table.empty}
                          </div>
                      )}
                      {sortedNotes.map((note, index) => {
                        const isEditing = editingId === note.id;
                        const isDraggable = !editingId && !sortConfig && !showTodayOnly;

                        if (isEditing) {
                            return (
                                <div key={note.id} className="flex items-start border-b border-blue-200 bg-blue-50/90 backdrop-blur-sm">
                                    <div style={{ width: colWidths.content }} className="p-2">
                                    <div className="flex gap-1">
                                        <input autoFocus className="w-full text-sm p-1.5 border rounded" placeholder="Event description..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
                                        <button onClick={handleAIParse} disabled={isProcessingAI} className="p-1 bg-indigo-100 text-indigo-600 rounded"><Sparkles size={14} className={isProcessingAI ? 'animate-spin' : ''} /></button>
                                    </div>
                                    </div>
                                    <div style={{ width: colWidths.createdAt }} className="p-2">
                                        <TimePicker value={formData.createdAt} onChange={(v) => setFormData({...formData, createdAt: v})} />
                                    </div>
                                    <div style={{ width: colWidths.startTime }} className="p-2">
                                    <TimePicker 
                                        value={formData.startTime} 
                                        onChange={(v) => setFormData({ ...formData, startTime: v, endTime: (!formData.endTime || formData.endTime === formData.startTime) ? v : formData.endTime })} 
                                    />
                                    </div>
                                    <div style={{ width: colWidths.endTime }} className="p-2">
                                    <TimePicker value={formData.endTime} onChange={(v) => setFormData({...formData, endTime: v})} />
                                    </div>
                                    <div style={{ width: colWidths.location }} className="p-2"><input className="w-full text-xs p-1 border rounded" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} /></div>
                                    <div style={{ width: colWidths.importance }} className="p-2">
                                    <select className="w-full text-xs p-1 border rounded" value={formData.importance} onChange={e => setFormData({...formData, importance: e.target.value as NoteImportance})}>
                                        <option value={NoteImportance.HIGH}>{t.importance.high}</option>
                                        <option value={NoteImportance.MEDIUM}>{t.importance.medium}</option>
                                        <option value={NoteImportance.LOW}>{t.importance.low}</option>
                                    </select>
                                    </div>
                                    <div style={{ width: colWidths.status }} className="p-2">
                                    <select className="w-full text-xs p-1 border rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as NoteStatus})}>
                                        <option value={NoteStatus.TODO}>{NoteStatus.TODO}</option>
                                        <option value={NoteStatus.IN_PROGRESS}>{NoteStatus.IN_PROGRESS}</option>
                                        <option value={NoteStatus.DONE}>{NoteStatus.DONE}</option>
                                    </select>
                                    </div>
                                    <div style={{ width: colWidths.reminder }} className="p-2">
                                    <button onClick={() => setFormData(prev => ({...prev, isReminderOn: !prev.isReminderOn}))} className={`w-full text-[10px] p-1 mb-1 rounded border ${formData.isReminderOn ? 'bg-blue-100 text-blue-700' : 'bg-stone-100'}`}>{formData.isReminderOn ? 'ON' : 'OFF'}</button>
                                    {formData.isReminderOn && <TimePicker value={formData.reminderTime} onChange={(v) => setFormData({...formData, reminderTime: v})} />}
                                    </div>
                                    <div style={{ width: colWidths.actions }} className="p-2 flex justify-end gap-1">
                                    <button onClick={() => saveEditing(note.id)} className="p-1.5 bg-green-600 text-white rounded"><Save size={14} /></button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-stone-200 text-stone-600 rounded"><X size={14} /></button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={note.id}
                                draggable={isDraggable}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                onDoubleClick={() => startEditing(note)}
                                onAuxClick={(e) => { if(e.button === 1) { e.preventDefault(); onPinNote(note.id, e.clientX, e.clientY); }}}
                                className={`flex items-center border-b border-transparent hover:border-black/10 hover:bg-black/5 transition-colors group h-12 ${note.status === NoteStatus.DONE ? 'opacity-60 grayscale-[0.5]' : ''} ${note.isPinned ? 'bg-indigo-50/50' : ''}`}
                            >
                                <div style={{ width: colWidths.content }} className="flex items-center gap-2 px-2 overflow-hidden relative h-full">
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 ${isDraggable ? 'cursor-move text-stone-400' : 'cursor-not-allowed text-stone-200'}`}>
                                    <GripVertical size={12} />
                                    </div>
                                    <div className="pl-4 flex items-center gap-2 w-full truncate">
                                    {note.isPinned && <Pin size={12} className="text-indigo-500 shrink-0" />}
                                    <span className={`font-medium text-stone-800 truncate text-sm ${note.status === NoteStatus.DONE ? 'line-through decoration-stone-400' : ''}`} title={note.content}>
                                        {note.content}
                                    </span>
                                    </div>
                                </div>
                                <div style={{ width: colWidths.createdAt }} className="px-2 text-xs text-stone-500 truncate">{formatDate(note.createdAt)}</div>
                                <div style={{ width: colWidths.startTime }} className="px-2 text-xs text-stone-800 font-mono truncate">{note.startTime ? formatDate(note.startTime) : '-'}</div>
                                <div style={{ width: colWidths.endTime }} className="px-2 text-xs text-stone-400 font-mono truncate">{note.endTime ? formatDate(note.endTime) : '-'}</div>
                                <div style={{ width: colWidths.location }} className="px-2 text-xs text-stone-500 truncate" title={note.location}>{note.location && note.location !== '无' ? (<span className="flex items-center gap-1"><MapPin size={10} /> {note.location}</span>) : '-'}</div>
                                <div style={{ width: colWidths.importance }} className="px-2">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                                    note.importance === NoteImportance.HIGH ? 'bg-red-50 text-red-600 border-red-200' : 
                                    note.importance === NoteImportance.LOW ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-200'
                                    }`}>
                                    {note.importance === NoteImportance.HIGH ? t.importance.high : note.importance === NoteImportance.MEDIUM ? t.importance.medium : t.importance.low}
                                    </span>
                                </div>
                                <div style={{ width: colWidths.status }} className="px-2">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                    note.status === NoteStatus.TODO ? 'text-stone-400' :
                                    note.status === NoteStatus.IN_PROGRESS ? 'text-blue-500' : 'text-green-500'
                                    }`}>
                                    {t.status[note.status === NoteStatus.TODO ? 'todo' : note.status === NoteStatus.IN_PROGRESS ? 'inProgress' : 'done']}
                                    </span>
                                </div>
                                <div style={{ width: colWidths.reminder }} className="px-2 text-[10px] text-stone-400 font-mono">
                                    {note.isReminderOn && note.reminderTime ? (
                                    <span className="text-blue-600 flex items-center gap-1"><Bell size={10} /> {formatDate(note.reminderTime)}</span>
                                    ) : '-'}
                                </div>
                                <div style={{ width: colWidths.actions }} className="px-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onPinNote(note.id)} className={`p-1 rounded hover:bg-black/10 ${note.isPinned ? 'text-indigo-500' : 'text-stone-400'}`} title={t.note.unpin}><Pin size={14} /></button>
                                    <button onClick={() => requestDeleteNote(note.id)} className="p-1 rounded hover:bg-red-100 text-stone-400 hover:text-red-500" title={t.note.delete}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        );
                      })}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* --- Settings Modal --- */}
      {showSettingsModal && (
          <div className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto" onClick={() => setShowSettingsModal(false)}>
              <div 
                className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" 
                onClick={e => e.stopPropagation()}
              >
                  {/* ... Header and Tabs ... */}
                  {/* Modal Header */}
                  <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                      <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                          <Settings2 className="text-blue-600" />
                          {t.settingsModal.title}
                      </h2>
                      <button onClick={() => setShowSettingsModal(false)} className="p-1 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-600 transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-stone-100">
                      <button onClick={() => setSettingsTab('general')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${settingsTab === 'general' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}>{t.settingsModal.general}</button>
                      <button onClick={() => setSettingsTab('bookshelf')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${settingsTab === 'bookshelf' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}>{t.settingsModal.bookshelf}</button>
                      <button onClick={() => setSettingsTab('notebook')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${settingsTab === 'notebook' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}>{t.settingsModal.notebook}</button>
                      <button onClick={() => setSettingsTab('presets')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${settingsTab === 'presets' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-stone-500 hover:bg-stone-50'}`}>{t.settingsModal.presets}</button>
                  </div>

                  {/* Content */}
                  <div className="p-6 overflow-y-auto min-h-[300px]">
                      
                      {/* General Tab */}
                      {settingsTab === 'general' && (
                          <div className="space-y-6">
                              <div>
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">{t.settingsModal.language}</label>
                                  <div className="flex gap-2">
                                      <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg border text-sm font-bold ${language === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>English</button>
                                      <button onClick={() => setLanguage('zh')} className={`px-4 py-2 rounded-lg border text-sm font-bold ${language === 'zh' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>中文</button>
                                  </div>
                              </div>
                              <div className="p-4 bg-stone-50 rounded-xl text-stone-500 text-sm leading-relaxed border border-stone-100">
                                  <p>Version 4.3.0</p>
                                  <p className="mt-2">Gemini NoteMinder is designed to help you organize your life with AI-powered task management and a beautiful, skeuomorphic interface.</p>
                              </div>
                          </div>
                      )}

                      {/* Bookshelf Tab */}
                      {settingsTab === 'bookshelf' && (
                          <div className="space-y-6">
                              <div>
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">{t.settingsModal.bgType}</label>
                                  <div className="grid grid-cols-3 gap-2">
                                      <button onClick={() => setBookshelfTheme({...bookshelfTheme, type: 'bookshelf'})} className={`p-3 rounded-lg border text-sm font-bold ${bookshelfTheme.type === 'bookshelf' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-stone-50 text-stone-600'}`}>{t.settingsModal.bg3d}</button>
                                      <button onClick={() => setBookshelfTheme({...bookshelfTheme, type: 'color'})} className={`p-3 rounded-lg border text-sm font-bold ${bookshelfTheme.type === 'color' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-stone-50 text-stone-600'}`}>{t.settingsModal.bgSolid}</button>
                                      <button onClick={() => setBookshelfTheme({...bookshelfTheme, type: 'image'})} className={`p-3 rounded-lg border text-sm font-bold ${bookshelfTheme.type === 'image' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-stone-50 text-stone-600'}`}>{t.settingsModal.bgImg}</button>
                                  </div>
                              </div>

                              {bookshelfTheme.type === 'bookshelf' && (
                                   <div className="space-y-4">
                                       <div className="p-4 bg-blue-50 text-blue-700 text-sm rounded-lg flex items-start gap-3">
                                           <Library className="shrink-0 mt-0.5" size={18} />
                                           <div>
                                               <p className="font-bold">{t.settingsModal.interactiveMode}</p>
                                               <p className="opacity-80 text-xs mt-1">{t.settingsModal.interactiveModeDesc}</p>
                                           </div>
                                       </div>

                                       <div>
                                           <div className="flex justify-between items-end mb-2">
                                               <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t.settingsModal.manageBooks}</label>
                                               <button onClick={handleAddNewBook} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                                   <Plus size={12}/> {t.settingsModal.addBook}
                                               </button>
                                           </div>
                                           <div className="border rounded-xl divide-y divide-stone-100 max-h-60 overflow-y-auto">
                                               {books.sort((a,b) => a.position - b.position).map(book => (
                                                   <div key={book.id} className="p-2 flex gap-2 items-center hover:bg-stone-50 group">
                                                       <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white shrink-0" style={{backgroundColor: book.color}}>
                                                           {book.position}
                                                       </div>
                                                       <input 
                                                          className="flex-1 min-w-0 text-sm border-b border-transparent focus:border-blue-300 outline-none bg-transparent"
                                                          value={book.title}
                                                          onChange={(e) => onUpdateBooks(books.map(b => b.id === book.id ? { ...b, title: e.target.value } : b))}
                                                          placeholder={t.settingsModal.bookTitle}
                                                       />
                                                       <input 
                                                          className="flex-[2] min-w-0 text-xs text-stone-500 border-b border-transparent focus:border-blue-300 outline-none bg-transparent font-mono"
                                                          value={book.url}
                                                          onChange={(e) => onUpdateBooks(books.map(b => b.id === book.id ? { ...b, url: e.target.value } : b))}
                                                          placeholder={t.settingsModal.bookUrl}
                                                       />
                                                       <button 
                                                           onClick={() => onUpdateBooks(books.filter(b => b.id !== book.id))}
                                                           className="p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                       >
                                                           <Trash2 size={14} />
                                                       </button>
                                                   </div>
                                               ))}
                                               {books.length === 0 && <div className="p-4 text-center text-sm text-stone-400 italic">No books in shelf. Click empty slots to add.</div>}
                                           </div>
                                       </div>
                                   </div>
                              )}

                              {(bookshelfTheme.type === 'color' || bookshelfTheme.type === 'image') && (
                                  <>
                                      {bookshelfTheme.type === 'color' && (
                                            <div>
                                                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">{t.settingsModal.bgColor}</label>
                                                <div className="flex gap-2 items-center">
                                                    <input type="color" value={bookshelfTheme.value} onChange={e => setBookshelfTheme({...bookshelfTheme, value: e.target.value})} className="h-10 w-20 cursor-pointer rounded border border-stone-200 p-0" />
                                                    <div className="text-sm font-mono text-stone-500">{bookshelfTheme.value}</div>
                                                </div>
                                            </div>
                                      )}
                                      <div>
                                          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">{t.settingsModal.opacity} ({(bookshelfTheme.opacity * 100).toFixed(0)}%)</label>
                                          <input 
                                              type="range" 
                                              min="0" max="1" step="0.05" 
                                              value={bookshelfTheme.opacity} 
                                              onChange={e => setBookshelfTheme({...bookshelfTheme, opacity: parseFloat(e.target.value)})} 
                                              className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                          />
                                      </div>
                                  </>
                              )}

                              <div className="pt-4 border-t">
                                  <button onClick={requestResetBookshelf} className="text-red-500 text-sm font-bold hover:underline flex items-center gap-1"><RefreshCw size={14} /> {t.themeMenu.reset}</button>
                              </div>
                          </div>
                      )}

                      {/* Notebook Tab */}
                      {settingsTab === 'notebook' && (
                          <div className="space-y-6">
                              <div>
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">{t.settingsModal.bgType}</label>
                                  <div className="flex gap-2 items-center">
                                      <button onClick={() => setNotebookTheme({...notebookTheme, type: 'color'})} className={`px-4 py-2 rounded-lg border text-sm font-bold ${notebookTheme.type === 'color' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-stone-50 text-stone-600'}`}>{t.settingsModal.bgColor}</button>
                                      <button onClick={() => setNotebookTheme({...notebookTheme, type: 'image'})} className={`px-4 py-2 rounded-lg border text-sm font-bold ${notebookTheme.type === 'image' ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-stone-50 text-stone-600'}`}>{t.settingsModal.bgImage}</button>
                                  </div>
                              </div>
                              
                              {notebookTheme.type === 'image' && (
                                  <div>
                                      <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">Upload Image</label>
                                      <div className="flex gap-2 items-center">
                                          <label className="cursor-pointer px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm font-bold text-stone-600 flex items-center gap-2">
                                              <ImageIcon size={16} /> Choose File
                                              <input type="file" accept="image/*" className="hidden" ref={notebookBgImageInputRef} onChange={handleNotebookBgImageUpload} />
                                          </label>
                                          {notebookTheme.value && <div className="text-xs text-stone-400 truncate max-w-[200px]">Image Set</div>}
                                      </div>
                                  </div>
                              )}

                              <div>
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">{t.settingsModal.texture}</label>
                                  <div className="grid grid-cols-4 gap-2">
                                      {['solid', 'lined', 'grid', 'dots'].map(tex => (
                                          <button 
                                              key={tex}
                                              onClick={() => setNotebookTheme({...notebookTheme, texture: tex as NoteTexture})}
                                              className={`p-2 border rounded text-xs capitalize ${notebookTheme.texture === tex ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'text-stone-600 hover:bg-stone-50'}`}
                                          >
                                              {t.textures[tex as keyof typeof t.textures]}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">{t.settingsModal.opacity} ({(notebookTheme.opacity * 100).toFixed(0)}%)</label>
                                  <input 
                                      type="range" 
                                      min="0" max="1" step="0.05" 
                                      value={notebookTheme.opacity} 
                                      onChange={e => setNotebookTheme({...notebookTheme, opacity: parseFloat(e.target.value)})} 
                                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                                  />
                              </div>

                              <div className="pt-4 border-t">
                                  <button onClick={requestResetNotebook} className="text-red-500 text-sm font-bold hover:underline flex items-center gap-1"><RefreshCw size={14} /> {t.themeMenu.reset}</button>
                              </div>
                          </div>
                      )}

                      {/* Presets Tab */}
                      {settingsTab === 'presets' && (
                          <div className="flex gap-6 h-[400px]">
                              {/* Left: Editor */}
                              <div className="w-[240px] flex flex-col gap-4">
                                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex-1 overflow-y-auto">
                                      <NoteStyleControls 
                                          theme={draftPreset.theme}
                                          styleVariant={draftPreset.styleVariant}
                                          textureVariant={draftPreset.textureVariant}
                                          decorationPosition={draftPreset.decorationPosition}
                                          opacity={draftPreset.theme.opacity}
                                          language={language}
                                          onUpdate={(updates) => {
                                              setDraftPreset(prev => ({
                                                  ...prev,
                                                  ...updates,
                                                  theme: { ...prev.theme, ...updates.theme }
                                              }));
                                          }}
                                      />
                                  </div>
                                  <div className="flex gap-2">
                                      <input 
                                          className="flex-1 border rounded px-2 py-1.5 text-sm"
                                          placeholder="Style Name"
                                          value={newPresetName}
                                          onChange={e => setNewPresetName(e.target.value)}
                                      />
                                      <button onClick={handleCreatePreset} disabled={!newPresetName} className="bg-stone-800 text-white px-3 rounded text-sm font-bold disabled:opacity-50">{t.settingsModal.newPreset.split(' ')[0]}</button>
                                  </div>
                              </div>

                              {/* Right: List & Preview */}
                              <div className="flex-1 flex flex-col gap-4">
                                  <div className="h-[280px] bg-stone-100 rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden relative">
                                      <div className="absolute top-2 left-2 text-xs font-bold text-stone-400 uppercase">{t.note.preview}</div>
                                      {renderPreviewNote()}
                                  </div>
                                  
                                  <div className="flex-1 overflow-y-auto pr-1">
                                      <div className="text-xs font-bold text-stone-400 uppercase mb-2">{t.settingsModal.presets}</div>
                                      {presets.length === 0 && <div className="text-sm text-stone-400 italic">No styles saved yet.</div>}
                                      <div className="grid grid-cols-1 gap-2">
                                          {presets.map(preset => (
                                              <div key={preset.id} className={`flex items-center justify-between p-2 rounded border transition-colors group ${preset.isDefault ? 'bg-yellow-50 border-yellow-200' : 'hover:bg-stone-50 border-stone-200'}`}>
                                                  <button onClick={() => loadPresetIntoDraft(preset)} className="text-sm font-bold text-stone-700 truncate text-left flex-1 flex items-center gap-2">
                                                      {preset.name}
                                                      {preset.isDefault && <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full">Default</span>}
                                                  </button>
                                                  
                                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button 
                                                        onClick={() => handleSetDefaultPreset(preset.id)} 
                                                        className={`p-1.5 rounded transition-colors ${preset.isDefault ? 'text-yellow-500' : 'text-stone-300 hover:text-yellow-500 hover:bg-yellow-50'}`}
                                                        title="Set as Default"
                                                      >
                                                          <Star size={14} fill={preset.isDefault ? "currentColor" : "none"} />
                                                      </button>
                                                      <button 
                                                        onClick={() => handleDeletePreset(preset.id)} 
                                                        className="p-1.5 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                      >
                                                          <Trash2 size={14}/>
                                                      </button>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                  </div>
              </div>
          </div>
      )}

      {/* --- Confirmation Modal --- */}
      {/* ... Confirmation Modal ... */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[1100] bg-black/30 backdrop-blur-[2px] flex items-center justify-center p-4 pointer-events-auto" onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                
                {modalConfig.isCustomContent ? (
                     <div className="flex flex-col h-[80vh] max-h-[600px]">
                         <div className="p-4 border-b flex justify-between items-center bg-stone-50">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-stone-700"><HelpCircle size={20} className="text-blue-500"/> {modalConfig.title}</h3>
                            <button onClick={() => setModalConfig({...modalConfig, isOpen: false})}><X size={20} className="text-stone-400 hover:text-stone-600"/></button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-0 flex">
                              {/* Help Sidebar */}
                              <div className="w-32 bg-stone-50 border-r border-stone-100 py-4 flex flex-col gap-1">
                                  {['bookshelf', 'notebooks', 'notebook', 'note', 'settings'].map(section => (
                                      <button 
                                        key={section}
                                        onClick={() => setHelpTab(section as any)}
                                        className={`px-4 py-2 text-xs font-bold text-left transition-colors ${helpTab === section ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-500' : 'text-stone-500 hover:text-stone-800'}`}
                                      >
                                          {t.help.sections[section as keyof typeof t.help.sections].title}
                                      </button>
                                  ))}
                              </div>
                              {/* Help Content */}
                              <div className="flex-1 p-6">
                                  <h4 className="text-xl font-bold text-stone-800 mb-4">{t.help.sections[helpTab].title}</h4>
                                  <ul className="space-y-3">
                                      {t.help.sections[helpTab].items.map((item, idx) => (
                                          <li key={idx} className="flex gap-3 text-sm text-stone-600 leading-relaxed">
                                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
                                              <span>{item}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                         </div>
                     </div>
                ) : (
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-3 rounded-full ${modalConfig.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-stone-800">{modalConfig.title}</h3>
                        </div>
                        <p className="text-stone-600 mb-6 leading-relaxed">{modalConfig.message}</p>
                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                                className="px-5 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={modalConfig.onConfirm}
                                className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${modalConfig.type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-stone-800 hover:bg-stone-900'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Notebook;