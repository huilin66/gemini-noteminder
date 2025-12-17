
import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteStatus, NoteImportance, NoteStyleVariant, NoteTexture, Language, NoteDecorationPosition, NotePreset } from '../types';
import { X, MapPin, Clock, GripHorizontal, Bell, CheckCircle, PlayCircle, Settings, Pin, Paperclip, Flower, Leaf, PieChart } from 'lucide-react';
import { translations } from '../utils/i18n';
import NoteStyleControls from './NoteStyleControls';

interface StickyNoteProps {
  note: Note;
  presets: NotePreset[];
  onUpdate: (updatedNote: Note) => void;
  onClose: (id: string) => void; // Unpin
  onFocus: (id: string) => void; // Bring to front
  language: Language;
}

const StickyNote: React.FC<StickyNoteProps> = ({ note, presets, onUpdate, onClose, onFocus, language }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const noteRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  // Default Dimensions
  const width = note.dimensions?.width || 280;
  const height = note.dimensions?.height || 275;
  const opacity = note.theme.opacity ?? 1;
  const styleVariant = note.styleVariant || 'clip';
  const textureVariant = note.textureVariant || 'lined';
  const decorationPosition = note.decorationPosition || 'top-left';

  // --- Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drags
    onFocus(note.id);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - note.position.x,
      y: e.clientY - note.position.y
    });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width, height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        onUpdate({
          ...note,
          position: { x: newX, y: newY }
        });
      }
      
      if (isResizing) {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;
          onUpdate({
              ...note,
              dimensions: {
                  width: Math.max(200, resizeStart.width + deltaX),
                  height: Math.max(150, resizeStart.height + deltaY)
              }
          });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, note, onUpdate]);

  const applyPreset = (preset: NotePreset) => {
      onUpdate({
          ...note,
          theme: preset.theme,
          styleVariant: preset.styleVariant,
          textureVariant: preset.textureVariant,
          decorationPosition: preset.decorationPosition
      });
  };

  // --- Helpers ---
  const formatTimeRange = (start?: number, end?: number) => {
    if (!start) return '';
    const sd = new Date(start);
    const ed = end ? new Date(end) : null;
    const isMultiDay = ed && (ed.getDate() !== sd.getDate() || ed.getMonth() !== sd.getMonth());
    const timeStr = (d: Date) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    let result = `${dateStr(sd)} ${timeStr(sd)}`;
    if (ed && ed.getTime() !== sd.getTime()) {
        result += ` - ${isMultiDay ? dateStr(ed) + ' ' : ''}${timeStr(ed)}`;
    }
    return result;
  };

  const getStatusIcon = (s: NoteStatus) => {
    switch (s) {
      case NoteStatus.IN_PROGRESS: return <PlayCircle size={14} className="text-blue-600" />;
      case NoteStatus.PARTIAL: return <PieChart size={14} className="text-orange-500" />;
      case NoteStatus.DONE: return <CheckCircle size={14} className="text-green-600" />;
      default: return <div className="w-3 h-3 rounded-full border border-stone-400 bg-white"></div>;
    }
  };

  const getImportanceLabel = (imp: NoteImportance) => {
    switch (imp) {
      case NoteImportance.HIGH: return t.importance.high;
      case NoteImportance.MEDIUM: return t.importance.medium;
      case NoteImportance.LOW: return t.importance.low;
      default: return '';
    }
  }

  const getPositionClass = (pos: NoteDecorationPosition) => {
      switch(pos) {
          case 'top-left': return '-top-4 -left-2';
          case 'top-center': return '-top-4 left-1/2 -translate-x-1/2';
          case 'top-right': return '-top-4 -right-2';
          case 'mid-left': return 'top-1/2 -translate-y-1/2 -left-4';
          case 'mid-right': return 'top-1/2 -translate-y-1/2 -right-4';
          case 'bottom-left': return '-bottom-4 -left-2';
          case 'bottom-center': return '-bottom-4 left-1/2 -translate-x-1/2';
          case 'bottom-right': return '-bottom-4 -right-2';
          default: return '-top-4 -left-2';
      }
  };

  const containerStyle: React.CSSProperties = {
    left: note.position.x,
    top: note.position.y,
    width: width,
    height: height,
    zIndex: note.zIndex,
    backgroundColor: note.theme.type === 'color' ? note.theme.value : undefined,
    backgroundImage: note.theme.type === 'image' ? `url(${note.theme.value})` : undefined,
    backgroundSize: 'cover',
    color: note.theme.textColor,
  };
  
  const tornClipPath = "polygon(0% 0%, 100% 0%, 100% 96%, 95% 100%, 90% 96%, 85% 100%, 80% 96%, 75% 100%, 70% 96%, 65% 100%, 60% 96%, 55% 100%, 50% 96%, 45% 100%, 40% 96%, 35% 100%, 30% 96%, 25% 100%, 20% 96%, 15% 100%, 10% 96%, 5% 100%, 0% 96%)";

  return (
    <div
      ref={noteRef}
      style={{
          ...containerStyle,
          clipPath: styleVariant === 'torn' ? tornClipPath : undefined
      }}
      className={`absolute shadow-xl flex flex-col transition-shadow duration-200 border-2 border-transparent hover:border-black/5 ${styleVariant === 'torn' ? '' : 'rounded-2xl'} ${isDragging ? 'cursor-grabbing shadow-2xl scale-[1.02]' : ''}`}
      onMouseDown={handleMouseDown}
    >
      {/* Background Opacity Layer */}
      {note.theme.type === 'color' && opacity < 1 && (
          <div className={`absolute inset-0 pointer-events-none ${styleVariant === 'torn' ? '' : 'rounded-2xl'}`} style={{ backgroundColor: 'white', opacity: 1 - opacity }}></div>
      )}

      {/* Texture Layer */}
      {textureVariant !== 'solid' && (
          <div className={`absolute inset-0 pointer-events-none opacity-30 ${styleVariant === 'torn' ? '' : 'rounded-2xl'} ${
            textureVariant === 'lined' ? 'bg-pattern-lines' : 
            textureVariant === 'grid' ? 'bg-pattern-grid' : 
            textureVariant === 'dots' ? 'bg-pattern-dots' : ''
          }`}></div>
      )}

      {/* --- Visual Variants (Decorations) --- */}
      <div className={`absolute z-20 pointer-events-none ${getPositionClass(decorationPosition)} drop-shadow-md`}>
        {styleVariant === 'tape' && (
            <div className="w-24 h-8 bg-white/40 backdrop-blur-sm rotate-1 shadow-sm border-x border-white/20"></div>
        )}
        {styleVariant === 'pin' && (
            <Pin size={32} className="fill-red-500 text-red-700" />
        )}
        {styleVariant === 'clip' && (
            <Paperclip size={40} className="text-stone-400 -rotate-12" strokeWidth={1.5} />
        )}
        {styleVariant === 'washi' && (
            <div className="w-20 h-6 bg-pink-200/80 rotate-3 shadow-sm opacity-90 border-l border-r border-white/30" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.5) 5px, rgba(255,255,255,0.5) 10px)'}}></div>
        )}
        {styleVariant === 'flower' && (
            <Flower size={36} className="text-pink-400 fill-pink-200" />
        )}
        {styleVariant === 'leaf' && (
            <Leaf size={32} className="text-green-500 fill-green-100 rotate-45" />
        )}
      </div>

      {styleVariant === 'spiral' && (
        <div className="absolute top-0 bottom-0 left-0 w-6 flex flex-col justify-evenly py-2 z-20 pointer-events-none opacity-80">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-4 h-4 -ml-2 rounded-full bg-stone-300 shadow-inner border border-stone-400"></div>
            ))}
        </div>
      )}

      {/* --- Importance Cloud (Top Right) --- */}
      {note.importance && (
        <div 
          className="absolute -top-3 -right-3 z-30 pointer-events-none"
          title={`Importance: ${note.importance}`}
        >
          <div className={`relative flex items-center justify-center transform rotate-12 drop-shadow-md ${
             note.importance === NoteImportance.HIGH ? 'text-red-500' : 
             note.importance === NoteImportance.LOW ? 'text-green-500' : 'text-orange-400'
          }`}>
             <svg width="60" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5,19c-3.037,0-5.5-2.463-5.5-5.5c0-0.105,0.006-0.209,0.014-0.313C11.876,13.061,11.691,13,11.5,13c-1.933,0-3.5,1.567-3.5,3.5S9.567,20,11.5,20h6c2.485,0,4.5-2.015,4.5-4.5S19.985,11,17.5,11c-0.174,0-0.344,0.015-0.512,0.041C16.81,6.896,13.12,4,9,4C4.582,4,1,7.582,1,12c0,2.158,0.86,4.116,2.257,5.578" opacity="0.9" />
             </svg>
             <span className="absolute text-[9px] font-bold text-white pt-1">{getImportanceLabel(note.importance)}</span>
          </div>
        </div>
      )}

      {/* --- Header / Toolbar --- */}
      <div 
        className={`h-9 w-full flex items-center justify-between px-2 z-30 group relative ${styleVariant === 'spiral' ? 'pl-6' : ''}`}
      >
         <div className="flex-1 h-full flex items-center cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown}>
            <GripHorizontal size={14} className="opacity-0 group-hover:opacity-40 transition-opacity ml-2" />
         </div>
         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={(e) => { e.stopPropagation(); onFocus(note.id); setShowSettings(!showSettings); }}
                className={`p-1 rounded hover:bg-black/10 ${showSettings ? 'bg-black/10 text-blue-600' : ''}`}
                title="Settings"
            >
                <Settings size={14} />
            </button>
            <button 
                onClick={() => onClose(note.id)} 
                className="hover:bg-red-100 hover:text-red-600 rounded p-1"
                title={t.note.unpin}
            >
                <X size={14} />
            </button>
         </div>
      </div>

      {/* --- Settings View (Outside) --- */}
      {showSettings && (
          <div className="absolute top-0 left-[105%] w-64 bg-white/95 backdrop-blur z-[100] rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 max-h-[400px] overflow-y-auto" onMouseDown={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-1 border-b pb-2">
                 <div className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t.note.settings}</div>
                 <button onClick={() => setShowSettings(false)} className="text-xs font-bold text-blue-600 hover:underline">{t.note.done}</button>
              </div>
              
              {/* Presets */}
              {presets.length > 0 && (
                  <div>
                      <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">{t.note.presets}</div>
                      <div className="grid grid-cols-2 gap-1">
                          {presets.map(p => (
                              <button key={p.id} onClick={() => applyPreset(p)} className="text-[10px] p-1 border rounded hover:bg-blue-50 text-left truncate">{p.name}</button>
                          ))}
                      </div>
                      <div className="border-b my-2"></div>
                  </div>
              )}

              {/* Reusable Style Controls */}
              <NoteStyleControls 
                theme={note.theme}
                styleVariant={styleVariant}
                textureVariant={textureVariant}
                decorationPosition={decorationPosition}
                opacity={opacity}
                onUpdate={(updates) => onUpdate({ ...note, ...updates })}
                language={language}
              />
          </div>
      )}

      {/* --- Normal Content --- */}
        <div className={`p-4 pt-1 flex-1 flex flex-col gap-2 relative z-10 font-handwriting ${styleVariant === 'spiral' ? 'pl-8' : ''}`}>
            <textarea 
            value={note.content}
            onChange={(e) => onUpdate({...note, content: e.target.value})}
            className={`w-full bg-transparent resize-none outline-none text-lg leading-snug font-medium placeholder-black/30 flex-1 ${note.status === NoteStatus.DONE ? 'line-through opacity-60' : ''}`}
            placeholder={t.note.placeholder}
            />
            
            <div className="mt-auto space-y-2 pt-3 border-t border-black/10 text-xs opacity-80">
                {(note.startTime) && (
                    <div className="flex items-start gap-2 font-mono text-[11px] leading-tight text-black/70">
                        <Clock size={12} className="mt-0.5 shrink-0" />
                        <span>{formatTimeRange(note.startTime, note.endTime)}</span>
                    </div>
                )}
                {note.location && note.location !== '无' && (
                    <div className="flex items-center gap-2 text-black/70 truncate">
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{note.location}</span>
                    </div>
                )}
                {note.isReminderOn && note.reminderTime && (
                    <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <Bell size={12} className="shrink-0 animate-pulse" />
                        <span>{new Date(note.reminderTime).toLocaleString([], { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                )}

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5" title={note.status}>
                        {getStatusIcon(note.status)}
                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">{note.status}</span>
                    </div>
                </div>
            </div>
        </div>

      {/* --- Resize Handle --- */}
      {!showSettings && (
          <div 
             className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-30 flex items-end justify-end p-1 opacity-0 hover:opacity-100 transition-opacity text-black/30"
             onMouseDown={handleResizeStart}
          >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                  <path d="M8 8H0L8 0V8Z" />
              </svg>
          </div>
      )}
    </div>
  );
};

export default StickyNote;
