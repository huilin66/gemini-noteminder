import React, { useState, useEffect, useRef } from 'react';
import Notebook from './components/Notebook';
import StickyNote from './components/StickyNote';
import BookshelfBackground from './components/BookshelfBackground';
import { Note, NoteStatus, NoteImportance, Group, ThemeConfig, ViewState, Language, NotePreset, SmartBook } from './types';
import { Bell, Clock, X, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'noteminder_notes_v4'; 
const GROUPS_KEY = 'noteminder_groups_v1';
const THEME_KEY = 'noteminder_theme_v2';
const LANG_KEY = 'noteminder_lang_v1';
const PRESETS_KEY = 'noteminder_presets_v1';
const BOOKSHELF_KEY = 'noteminder_bookshelf_v2';

const DEFAULT_GROUP_ID = 'default';

const DEFAULT_BOOKSHELF_THEME: ThemeConfig = {
  type: 'bookshelf',
  value: '#f3f4f6', 
  textColor: '#000000',
  opacity: 1
};

const DEFAULT_NOTEBOOK_THEME: ThemeConfig = {
  type: 'color',
  value: '#ffffff',
  textColor: '#000000',
  opacity: 0.95,
  texture: 'lined' 
};

const DEFAULT_BOOKS: SmartBook[] = [
    { id: '1', title: 'Scholar', url: 'https://scholar.google.com', color: '#4285f4', position: 2, spineDetail: 1 },
    { id: '2', title: 'GitHub', url: 'https://github.com', color: '#24292e', position: 5, spineDetail: 2 },
    { id: '3', title: 'Gemini', url: 'https://gemini.google.com', color: '#8e24aa', position: 8, spineDetail: 0 },
    { id: '4', title: 'Notes', url: '#', color: '#f59e0b', position: 9, spineDetail: 3 },
    { id: '5', title: 'Music', url: 'https://youtube.com', color: '#ef4444', position: 10, spineDetail: 1 },
    { id: '6', title: 'Docs', url: 'https://docs.google.com', color: '#3b82f6', position: 12, spineDetail: 0 },
    { id: '7', title: 'Design', url: 'https://dribbble.com', color: '#ec4899', position: 16, spineDetail: 2 },
    { id: '8', title: 'Ref', url: 'https://wikipedia.org', color: '#6b7280', position: 18, spineDetail: 3 },
];

// Favicon Data URIs
const FAVICON_NORMAL = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect x=%2210%22 y=%2210%22 width=%2280%22 height=%2280%22 fill=%22%23fef3c7%22 stroke=%22%23d1d5db%22 stroke-width=%225%22/><path d=%22M70 90 L90 70 L70 70 Z%22 fill=%22%23fbbf24%22/></svg>";
const FAVICON_ALARM = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2255%22 r=%2235%22 fill=%22white%22 stroke=%22%23ef4444%22 stroke-width=%225%22/><path d=%22M50 55 L50 35 M50 55 L65 65%22 stroke=%22%23374151%22 stroke-width=%224%22 stroke-linecap=%22round%22/><path d=%22M20 20 L30 30 M80 20 L70 30%22 stroke=%22%23ef4444%22 stroke-width=%226%22 stroke-linecap=%22round%22/><rect x=%2245%22 y=%2210%22 width=%2210%22 height=%2210%22 fill=%22%23ef4444%22/></svg>";


const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [groups, setGroups] = useState<Group[]>([{ id: DEFAULT_GROUP_ID, name: 'My Notebook 1' }]);
  const [presets, setPresets] = useState<NotePreset[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>(DEFAULT_GROUP_ID);
  
  const [books, setBooks] = useState<SmartBook[]>(DEFAULT_BOOKS);

  const [viewState, setViewState] = useState<ViewState>({
    showGroups: true,
    showNotebook: true,
    showStickies: true,
    showTodayStickies: false
  });

  const [bookshelfTheme, setBookshelfTheme] = useState<ThemeConfig>(DEFAULT_BOOKSHELF_THEME);
  const [notebookTheme, setNotebookTheme] = useState<ThemeConfig>(DEFAULT_NOTEBOOK_THEME);
  
  const [language, setLanguage] = useState<Language>('zh');

  const [maxZIndex, setMaxZIndex] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [activeAlert, setActiveAlert] = useState<Note | null>(null);
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const titleIntervalRef = useRef<number | null>(null);
  const originalTitle = "Gemini NoteMinder";

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    const faviconLink = document.getElementById('favicon') as HTMLLinkElement;
    if (faviconLink) faviconLink.href = FAVICON_NORMAL;
    document.title = originalTitle;
  }, []);

  useEffect(() => {
    const savedNotes = localStorage.getItem(STORAGE_KEY);
    const savedGroups = localStorage.getItem(GROUPS_KEY);
    const savedTheme = localStorage.getItem(THEME_KEY);
    const savedLang = localStorage.getItem(LANG_KEY);
    const savedPresets = localStorage.getItem(PRESETS_KEY);
    const savedBooks = localStorage.getItem(BOOKSHELF_KEY);
    
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }

    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        const migrated = parsed.map((n: any) => ({
             ...n, 
             groupId: n.groupId || DEFAULT_GROUP_ID,
             status: Object.values(NoteStatus).includes(n.status) ? n.status : NoteStatus.TODO,
             importance: Object.values(NoteImportance).includes(n.importance) ? n.importance : NoteImportance.MEDIUM,
             styleVariant: n.styleVariant || 'clip', 
             textureVariant: n.textureVariant || 'lined', 
             decorationPosition: n.decorationPosition || 'top-left',
             dimensions: n.dimensions || { width: 280, height: 275 }, 
             theme: { ...n.theme, opacity: n.theme.opacity ?? 1 }
        }));
        setNotes(migrated);
      } catch (e) {
        setNotes([]);
      }
    }

    if (savedPresets) {
        try {
            setPresets(JSON.parse(savedPresets));
        } catch (e) {}
    }

    if (savedBooks) {
        try {
            setBooks(JSON.parse(savedBooks));
        } catch (e) {}
    }

    if (savedTheme) {
      const parsedTheme = JSON.parse(savedTheme);
      if (parsedTheme.desktop) setBookshelfTheme(parsedTheme.desktop);
      if (parsedTheme.notebook) setNotebookTheme(parsedTheme.notebook);
    }
    
    if (savedLang === 'en' || savedLang === 'zh') {
        setLanguage(savedLang);
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
      localStorage.setItem(THEME_KEY, JSON.stringify({
        desktop: bookshelfTheme,
        notebook: notebookTheme
      }));
      localStorage.setItem(LANG_KEY, language);
      localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
      localStorage.setItem(BOOKSHELF_KEY, JSON.stringify(books));
    }
  }, [notes, groups, bookshelfTheme, notebookTheme, language, presets, books, isLoaded]);

  // Ensure Desktop Stickies and Today Stickies are mutually exclusive
  useEffect(() => {
     if (viewState.showTodayStickies && viewState.showStickies) {
         setViewState(prev => ({ ...prev, showStickies: false }));
     }
  }, [viewState.showTodayStickies]);

  useEffect(() => {
      if (viewState.showStickies && viewState.showTodayStickies) {
          setViewState(prev => ({ ...prev, showTodayStickies: false }));
      }
  }, [viewState.showStickies]);

  useEffect(() => {
    const checkReminders = () => {
        const now = Date.now();
        const triggered = notes.find(n => 
            n.isReminderOn && 
            n.reminderTime && 
            n.reminderTime <= now &&
            n.reminderTime > now - 60000 
        );

        if (triggered && !activeAlert) {
            triggerAlert(triggered);
        }
    };

    const interval = setInterval(checkReminders, 5000);
    return () => clearInterval(interval);
  }, [notes, activeAlert]);

  const triggerAlert = (note: Note) => {
      setActiveAlert(note);
      
      if ('Notification' in window) {
          if (Notification.permission === 'granted') {
             try {
                new Notification('Gemini NoteMinder Reminder', { 
                    body: note.content, 
                    icon: FAVICON_ALARM, 
                    tag: 'noteminder-alert'
                });
             } catch (e) {
                 console.error("Notification failed", e);
             }
          } else if (Notification.permission !== 'denied') {
             Notification.requestPermission();
          }
      }

      let visible = true;
      const faviconLink = document.getElementById('favicon') as HTMLLinkElement;
      
      if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
      
      titleIntervalRef.current = window.setInterval(() => {
          document.title = visible ? `🔔 ${note.content}` : originalTitle;
          if (faviconLink) {
              faviconLink.href = visible ? FAVICON_ALARM : FAVICON_NORMAL;
          }
          visible = !visible;
      }, 1000);
  };

  const stopAlert = () => {
      setActiveAlert(null);
      if (titleIntervalRef.current) {
          clearInterval(titleIntervalRef.current);
          titleIntervalRef.current = null;
      }
      document.title = originalTitle;
      const faviconLink = document.getElementById('favicon') as HTMLLinkElement;
      if (faviconLink) faviconLink.href = FAVICON_NORMAL;
  };

  const handleDismiss = () => {
      if (activeAlert) {
          updateNote({ ...activeAlert, isReminderOn: false });
          stopAlert();
      }
  };

  const handleSnooze = () => {
      if (activeAlert) {
          const newTime = Date.now() + (snoozeMinutes * 60 * 1000);
          updateNote({ 
              ...activeAlert, 
              reminderTime: newTime,
              isReminderOn: true 
          });
          stopAlert();
      }
  };

  const addNote = (newNote: Note) => {
    setMaxZIndex(prev => prev + 1);
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const reorderNotes = (fromIndex: number, toIndex: number) => {
      const currentGroupNotes = notes.filter(n => n.groupId === activeGroupId);
      const otherNotes = notes.filter(n => n.groupId !== activeGroupId);
      
      const copy = [...currentGroupNotes];
      const [movedItem] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedItem);
      
      setNotes([...copy, ...otherNotes]);
  };

  const togglePin = (id: string, startX?: number, startY?: number) => {
    setNotes(prev => prev.map(n => {
      if (n.id === id) {
        const isPinning = !n.isPinned;
        let position = n.position;

        if (isPinning) {
            position = { 
                x: startX ? startX - 140 : window.innerWidth / 2 - 140, 
                y: startY ? startY - 20 : window.innerHeight / 2 - 125 
            };
        }
        
        return {
          ...n,
          isPinned: isPinning,
          position: position,
          zIndex: maxZIndex + 1
        };
      }
      return n;
    }));
    
    setMaxZIndex(prev => prev + 1);
    setViewState(prev => ({ ...prev, showStickies: true }));
  };

  // Improved Batch Pinning: Left-to-Right with Staggered Vertical Offset
  const batchPinNotes = (ids: string[]) => {
      if (ids.length === 0) return;

      setMaxZIndex(prev => {
          let newMaxZ = prev;
          
          setNotes(prevNotes => {
              const startX = 50;
              const startY = 80;
              const noteWidth = 300; // Approximate width including gap
              const noteHeight = 320; // Approximate height including gap
              
              // Calculate available columns based on screen width
              const availableWidth = window.innerWidth - 100;
              const cols = Math.floor(availableWidth / noteWidth) || 1;

              let pinIndex = 0;

              const updatedNotes = prevNotes.map(n => {
                  if (ids.includes(n.id) && !n.isPinned) {
                      newMaxZ++;
                      
                      const col = pinIndex % cols;
                      const row = Math.floor(pinIndex / cols);
                      
                      // Organic offset: slightly wobble Y based on column
                      const wobbleY = Math.sin(col) * 30; 
                      // Organic offset: slightly wobble X based on row
                      const wobbleX = Math.cos(row) * 10;

                      const pos = {
                          x: startX + (col * noteWidth) + wobbleX,
                          y: startY + (row * noteHeight) + wobbleY
                      };
                      
                      pinIndex++;

                      return {
                          ...n,
                          isPinned: true,
                          position: pos,
                          zIndex: newMaxZ
                      };
                  }
                  return n;
              });
              return updatedNotes;
          });
          
          return newMaxZ;
      });

      setViewState(prev => ({ ...prev, showStickies: true, showTodayStickies: false }));
  };

  const bringToFront = (id: string) => {
    const newZ = maxZIndex + 1;
    setMaxZIndex(newZ);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, zIndex: newZ } : n));
  };

  const createGroup = () => {
    let baseName = "My Notebook";
    let count = 1;
    let newName = `${baseName} ${count}`;
    
    while (groups.some(g => g.name === newName)) {
        count++;
        newName = `${baseName} ${count}`;
    }

    const newGroup = { id: uuidv4(), name: newName };
    setGroups(prev => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };
  
  const updateGroup = (group: Group) => {
    setGroups(prev => prev.map(g => g.id === group.id ? group : g));
  };

  const reorderGroups = (fromIndex: number, toIndex: number) => {
    const copy = [...groups];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    setGroups(copy);
  };
  
  const deleteGroup = (id: string) => {
     if (groups.length <= 1) return;
     setGroups(prev => prev.filter(g => g.id !== id));
     setNotes(prev => prev.filter(n => n.groupId !== id));
     if (activeGroupId === id) setActiveGroupId(groups[0].id);
  };

  const handleResetBookshelfTheme = () => setBookshelfTheme(DEFAULT_BOOKSHELF_THEME);
  const handleResetNotebookTheme = () => setNotebookTheme(DEFAULT_NOTEBOOK_THEME);

  return (
    <div 
      className="w-screen h-screen relative overflow-hidden flex items-center justify-center font-sans"
      style={bookshelfTheme.type === 'color' ? { backgroundColor: bookshelfTheme.value } : 
             bookshelfTheme.type === 'image' ? { backgroundImage: `url("${bookshelfTheme.value}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* Background Layer */}
      {bookshelfTheme.type === 'bookshelf' && (
        <BookshelfBackground 
            opacity={bookshelfTheme.opacity} 
            books={books}
            onUpdateBooks={setBooks}
            language={language}
        />
      )}
      
      {/* Fallback opacity for color/image modes */}
      {(bookshelfTheme.type === 'image' || bookshelfTheme.type === 'color') && (
         <div className={`absolute inset-0 transition-opacity ${bookshelfTheme.type === 'image' ? 'bg-black' : 'bg-white'}`} style={{ opacity: 1 - bookshelfTheme.opacity }}></div>
      )}

      {/* Main App Container - Occupies Full Screen with Padding */}
      {/* ADDED pointer-events-none here to allow clicks to pass through to Bookshelf */}
      <div className="z-10 relative w-full h-full p-2 flex items-center justify-center pointer-events-none">
         <Notebook 
           groups={groups}
           activeGroupId={activeGroupId}
           onSetActiveGroupId={setActiveGroupId}
           onCreateGroup={createGroup}
           onUpdateGroup={updateGroup}
           onDeleteGroup={deleteGroup}
           onReorderGroups={reorderGroups}
           notes={notes}
           presets={presets}
           setPresets={setPresets}
           onAddNote={addNote}
           onUpdateNote={updateNote}
           onDeleteNote={deleteNote}
           onPinNote={togglePin}
           onBatchPinNotes={batchPinNotes}
           onReorderNotes={reorderNotes}
           bookshelfTheme={bookshelfTheme}
           setBookshelfTheme={setBookshelfTheme}
           onResetBookshelfTheme={handleResetBookshelfTheme}
           notebookTheme={notebookTheme}
           setNotebookTheme={setNotebookTheme}
           onResetNotebookTheme={handleResetNotebookTheme}
           currentMaxZIndex={maxZIndex}
           viewState={viewState}
           setViewState={setViewState}
           language={language}
           setLanguage={setLanguage}
           books={books}
           onUpdateBooks={setBooks}
         />
      </div>

      {/* Sticky Notes Layer */}
      {(viewState.showStickies || viewState.showTodayStickies) && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {notes.filter(n => {
                if (!n.isPinned) return false;
                if (viewState.showTodayStickies) {
                    const todayStart = new Date();
                    todayStart.setHours(0,0,0,0);
                    const todayEnd = new Date();
                    todayEnd.setHours(23,59,59,999);
                    const tsStart = todayStart.getTime();
                    const tsEnd = todayEnd.getTime();
                    // Overlap logic
                    if (!n.startTime) return false;
                    const end = n.endTime || n.startTime;
                    return n.startTime <= tsEnd && end >= tsStart;
                }
                return true; // Show all for desktop stickies
            }).map(note => (
                <div key={note.id} className="pointer-events-auto absolute">
                    <StickyNote
                    note={note}
                    presets={presets}
                    onUpdate={updateNote}
                    onClose={(id) => togglePin(id)}
                    onFocus={bringToFront}
                    language={language}
                    />
                </div>
            ))}
          </div>
      )}

      {/* Reminder Alert */}
      {activeAlert && (
          <div className="fixed top-4 right-4 z-[9999] w-80 bg-white rounded-lg shadow-2xl border-l-4 border-blue-500 animate-bounce-short pointer-events-auto">
              <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-stone-800">
                          <Bell className="text-blue-500 fill-blue-500" /> Reminder
                      </h3>
                      <button onClick={stopAlert} className="text-stone-400 hover:text-stone-600">
                          <X size={18} />
                      </button>
                  </div>
                  <p className="text-stone-700 mb-4 font-medium">{activeAlert.content}</p>
                  <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button onClick={handleDismiss} className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-700 py-2 rounded text-sm font-bold">Dismiss</button>
                        <button onClick={handleSnooze} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-bold">Snooze</button>
                      </div>
                      <div className="flex items-center gap-2 justify-center mt-1">
                          <Clock size={12} className="text-stone-400" />
                          <span className="text-xs text-stone-500">Snooze for</span>
                          <input type="number" value={snoozeMinutes} onChange={(e) => setSnoozeMinutes(parseInt(e.target.value) || 1)} className="w-12 text-xs border border-stone-300 rounded px-1 py-0.5 text-center" />
                          <span className="text-xs text-stone-500">mins</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;