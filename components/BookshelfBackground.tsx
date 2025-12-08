import React, { useState, useRef } from 'react';
import { Edit2, Trash2, X, Check, Globe, ExternalLink, Plus } from 'lucide-react';
import { SmartBook, Language } from '../types';
import { translations } from '../utils/i18n';

interface BookshelfBackgroundProps {
    opacity: number;
    books: SmartBook[];
    onUpdateBooks: (books: SmartBook[]) => void;
    language: Language;
}

const BookshelfBackground: React.FC<BookshelfBackgroundProps> = ({ opacity, books, onUpdateBooks, language }) => {
    const [editingBook, setEditingBook] = useState<SmartBook | null>(null);
    const [editForm, setEditForm] = useState({ title: '', url: '', color: '#ef5350', position: 0 });
    const t = translations[language];
    
    // Ref to store the timer ID for click debounce
    const clickTimeoutRef = useRef<number | null>(null);

    const handleBookClick = (book: SmartBook) => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
            return;
        }

        clickTimeoutRef.current = window.setTimeout(() => {
            let url = book.url;
            if (!url.startsWith('http') && !url.startsWith('//')) url = 'https://' + url;
            window.open(url, '_blank');
            clickTimeoutRef.current = null;
        }, 250);
    };

    const handleBookDoubleClick = (e: React.MouseEvent, book: SmartBook) => {
        e.stopPropagation();
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }
        setEditingBook(book);
        setEditForm({ title: book.title, url: book.url, color: book.color, position: book.position });
    };

    const handleSaveEdit = () => {
        if (editingBook) {
            const updated = books.map(b => b.id === editingBook.id ? { ...b, ...editForm } : b);
            onUpdateBooks(updated);
            setEditingBook(null);
        }
    };

    const handleAddBook = (position: number) => {
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
        }

        const existing = books.find(b => b.position === position);
        if (existing) return;

        const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        const randomSpine = Math.floor(Math.random() * 4);

        const newBook: SmartBook = {
            id: Date.now().toString(),
            title: 'New Link',
            url: 'https://google.com',
            color: '#5c6bc0',
            position,
            spineDetail: randomSpine
        };
        onUpdateBooks([...books, newBook]);
        setEditingBook(newBook);
        setEditForm({ title: 'New Link', url: 'https://google.com', color: '#5c6bc0', position });
    };

    const deleteBook = (id: string) => {
         onUpdateBooks(books.filter(b => b.id !== id));
         setEditingBook(null);
    };

    // --- Layout Dimensions (ViewBox 1600 x 900) ---
    const CABINET_W = 1400;
    const CABINET_H = 600;
    const CABINET_X = 100;
    const CABINET_Y = 50;

    const COL_SIDE_W = 380;
    const COL_MID_W = CABINET_W - (COL_SIDE_W * 2); // 640

    const ROW_TOP_H = 200;
    const ROW_MID_H = 240;
    const ROW_BOT_H = 160; // Drawers

    // Divider Thickness
    const THICKNESS = 15;

    // Slot Mapping Logic
    // Maps a linear index (0..25) to specific (x, y) coordinates
    const getSlotCoords = (slotIdx: number) => {
        const bookW = 55; // Standard book width slot
        
        // --- Top Row (y relative to CabinetY + padding) ---
        const topRowY = CABINET_Y + ROW_TOP_H - 10; // Bottom of book sits on shelf

        // Left Col Top: Group 1 (Indices 0,1,2) & Group 2 (3,4,5)
        if (slotIdx >= 0 && slotIdx <= 2) {
            return { x: CABINET_X + 40 + (slotIdx * bookW), y: topRowY };
        }
        if (slotIdx >= 3 && slotIdx <= 5) {
            return { x: CABINET_X + 220 + ((slotIdx-3) * bookW), y: topRowY };
        }

        // Center Col Top: Group 3 (Indices 6,7,8) - Centered
        if (slotIdx >= 6 && slotIdx <= 8) {
             const startX = CABINET_X + COL_SIDE_W + (COL_MID_W - (3 * bookW)) / 2;
             return { x: startX + ((slotIdx-6) * bookW), y: topRowY };
        }

        // Right Col Top: Group 4 (9,10,11,12) & Group 5 (13,14,15)
        if (slotIdx >= 9 && slotIdx <= 12) {
            return { x: CABINET_X + COL_SIDE_W + COL_MID_W + 40 + ((slotIdx-9) * bookW), y: topRowY };
        }
        if (slotIdx >= 13 && slotIdx <= 15) {
            return { x: CABINET_X + COL_SIDE_W + COL_MID_W + 280 + ((slotIdx-13) * bookW), y: topRowY };
        }


        // --- Middle Row (y relative to CabinetY + TopH + MidH) ---
        const midRowY = CABINET_Y + ROW_TOP_H + ROW_MID_H - 10;

        // Left Col Mid: Group 6 (16,17,18) & Group 7 (19,20)
        if (slotIdx >= 16 && slotIdx <= 18) {
            return { x: CABINET_X + 40 + ((slotIdx-16) * bookW), y: midRowY };
        }
        if (slotIdx >= 19 && slotIdx <= 20) {
            return { x: CABINET_X + 240 + ((slotIdx-19) * bookW), y: midRowY };
        }

        // Right Col Mid: Group 8 (21,22,23,24) & Tall Slot (25)
        if (slotIdx >= 21 && slotIdx <= 24) {
             return { x: CABINET_X + COL_SIDE_W + COL_MID_W + 40 + ((slotIdx-21) * bookW), y: midRowY };
        }
        if (slotIdx === 25) {
             // Special slot for the tall book at the end
             return { x: CABINET_X + COL_SIDE_W + COL_MID_W + 300, y: midRowY };
        }

        return { x: -100, y: -100 }; // Hidden
    };

    const getBookHeight = (index: number) => {
        // Special fixed heights for visual matching
        if (index === 7) return 160; // Scholar (Top Center)
        if (index === 16) return 155; // GitHub (Mid Left 1)
        if (index === 25) return 180; // Gemini (Mid Right End)

        // Random variations for others
        const base = 135;
        const variation = [0, 10, -15, 5, -8, 12, -5, 8, -10, 15];
        return base + variation[index % variation.length];
    };

    const renderBook = (slotIndex: number) => {
        const { x, y } = getSlotCoords(slotIndex);
        if (x < 0) return null;

        const width = 45; 
        const maxH = 190; 
        
        const book = books.find(b => b.position === slotIndex);
        const height = getBookHeight(slotIndex);
        const bookY = y - height;

        // --- Render Decoration Lines (Spine Details) ---
        const renderDecorations = (bx: number, by: number, spineType: number = 1) => {
            const lines = [];
            if (spineType === 1 || spineType === 3) { // Top lines
                lines.push(<line key="t1" x1={bx + 5} y1={by + 15} x2={bx + width - 5} y2={by + 15} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />);
                lines.push(<line key="t2" x1={bx + 5} y1={by + 20} x2={bx + width - 5} y2={by + 20} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />);
            }
            if (spineType === 2 || spineType === 3) { // Bottom lines
                lines.push(<line key="b1" x1={bx + 5} y1={by + height - 20} x2={bx + width - 5} y2={by + height - 20} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />);
                lines.push(<line key="b2" x1={bx + 5} y1={by + height - 15} x2={bx + width - 5} y2={by + height - 15} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />);
            }
            return lines;
        }

        // --- Empty Slot (Render as a blank, clickable decorative book) ---
        if (!book) {
            return (
                <g key={`empty-${slotIndex}`} className="group cursor-pointer" onClick={() => handleAddBook(slotIndex)}>
                    {/* Shadow (Hidden by default, shows on hover) */}
                    <rect x={x + 4} y={bookY + 4} width={width - 4} height={height} fill="rgba(0,0,0,0.1)" rx="3" filter="url(#shadowBlur)" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Book Body (Light Grey) */}
                    <rect x={x} y={bookY} width={width - 4} height={height} fill="#E5E7EB" rx="3" stroke="#D1D5DB" strokeWidth="1" 
                          className="transition-transform duration-300 group-hover:-translate-y-2"/>
                    
                    {/* Spine Highlight */}
                    <rect x={x + 3} y={bookY} width={3} height={height} fill="rgba(255,255,255,0.3)" 
                           className="transition-transform duration-300 group-hover:-translate-y-2"/>
                    
                    {/* "New" or Plus Icon */}
                    <Plus size={16} x={x + width/2 - 10} y={y - height/2 - 8} className="text-stone-400 opacity-30 group-hover:opacity-80 transition-all duration-300 group-hover:-translate-y-2 pointer-events-none" />
                </g>
            );
        }

        const spineDetail = book.spineDetail !== undefined ? book.spineDetail : (slotIndex % 4);

        return (
            <g 
                key={book.id} 
                onClick={() => handleBookClick(book)}
                onDoubleClick={(e) => handleBookDoubleClick(e, book)}
                className="cursor-pointer group"
            >
                <title>{book.title}</title>
                
                {/* Shadow (Dynamic) */}
                <rect x={x + 4} y={bookY + 4} width={width - 4} height={height} fill="rgba(0,0,0,0.2)" rx="3" filter="url(#shadowBlur)" 
                      className="transition-all duration-300 group-hover:translate-y-2 group-hover:opacity-40" />
                
                {/* Animated Group for Book Body */}
                <g className="transition-transform duration-300 group-hover:-translate-y-4">
                    {/* Book Body */}
                    <rect x={x} y={bookY} width={width - 4} height={height} fill={book.color} rx="3" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    
                    {/* Spine Highlight */}
                    <rect x={x + 3} y={bookY} width={4} height={height} fill="rgba(255,255,255,0.15)" rx="1" />
                    <rect x={x + width - 8} y={bookY} width={2} height={height} fill="rgba(0,0,0,0.1)" rx="1"/>

                    {/* Decorations */}
                    {renderDecorations(x, bookY, spineDetail)}
                    
                    {/* Text (Vertical, Centered) */}
                    <foreignObject x={x} y={bookY} width={width-4} height={height} style={{ pointerEvents: 'none' }}>
                         <div className="w-full h-full flex items-center justify-center">
                             <div className="text-white font-bold text-[11px] leading-tight select-none truncate" style={{
                                 writingMode: 'vertical-rl',
                                 textOrientation: 'mixed',
                                 textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                 maxHeight: '80%'
                             }}>
                                 {book.title}
                             </div>
                         </div>
                    </foreignObject>

                    {/* Hover Icon */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" transform={`translate(${x + width/2 - 9}, ${bookY + height - 25})`}>
                        <circle cx="6" cy="6" r="10" fill="rgba(0,0,0,0.2)" />
                        <ExternalLink size={10} className="text-white" x="1" y="1" />
                    </g>
                </g>
            </g>
        );
    };

    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-stone-100 flex items-center justify-center font-sans">
             
             {/* Main SVG */}
             <svg 
                viewBox="0 0 1600 900" 
                preserveAspectRatio="xMidYMid slice" 
                className="w-full h-full max-w-full max-h-full drop-shadow-2xl"
             >
                 <defs>
                    <filter id="shadowBlur">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                    <linearGradient id="woodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E6D0AE" />
                        <stop offset="100%" stopColor="#D8C2A0" />
                    </linearGradient>
                    <linearGradient id="deskGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4C5A3" />
                        <stop offset="100%" stopColor="#C4B593" />
                    </linearGradient>
                 </defs>

                 {/* --- Desk Surface --- */}
                 <rect x="0" y={CABINET_Y + CABINET_H + 30} width="1600" height="400" fill="url(#deskGradient)" />
                 <line x1="0" y1={CABINET_Y + CABINET_H + 30} x2="1600" y2={CABINET_Y + CABINET_H + 30} stroke="#B8AA8B" strokeWidth="3" />
                 
                 {/* Desk Notebook Area Shadow/Overlay */}
                 <rect x="320" y={CABINET_Y + CABINET_H + 80} width="960" height="300" rx="4" fill="rgba(0,0,0,0.1)" />

                 {/* --- Cabinet Structure --- */}
                 <g transform={`translate(${CABINET_X}, ${CABINET_Y})`}>
                     
                     {/* 1. Main Frame Backing */}
                     <rect x="-10" y="-10" width={CABINET_W + 20} height={CABINET_H + 20} rx="4" fill="#E3D4B5" stroke="#D1BFA0" strokeWidth="2" />
                     
                     {/* 2. Inner Cream Backgrounds */}
                     {/* Top Row Background */}
                     <rect x="0" y="0" width={CABINET_W} height={ROW_TOP_H} fill="#FFFCF5" />
                     
                     {/* Mid Left Background */}
                     <rect x="0" y={ROW_TOP_H + THICKNESS} width={COL_SIDE_W} height={ROW_MID_H} fill="#FFFCF5" />
                     {/* Mid Center Background */}
                     <rect x={COL_SIDE_W + THICKNESS} y={ROW_TOP_H + THICKNESS} width={COL_MID_W - THICKNESS*2} height={ROW_MID_H + ROW_BOT_H + THICKNESS} fill="#FFFCF5" />
                     {/* Mid Right Background */}
                     <rect x={COL_SIDE_W + COL_MID_W} y={ROW_TOP_H + THICKNESS} width={COL_SIDE_W} height={ROW_MID_H} fill="#FFFCF5" />


                     {/* 3. Wooden Dividers & Shelves */}
                     {/* Horizontal: Top Shelf Floor */}
                     <rect x="0" y={ROW_TOP_H} width={CABINET_W} height={THICKNESS} fill="url(#woodGradient)" />
                     
                     {/* Horizontal: Middle Shelf Floor (Left & Right only) */}
                     <rect x="0" y={ROW_TOP_H + ROW_MID_H + THICKNESS} width={COL_SIDE_W} height={THICKNESS} fill="url(#woodGradient)" />
                     <rect x={COL_SIDE_W + COL_MID_W} y={ROW_TOP_H + ROW_MID_H + THICKNESS} width={COL_SIDE_W} height={THICKNESS} fill="url(#woodGradient)" />

                     {/* Vertical: Column Dividers */}
                     <rect x={COL_SIDE_W} y="0" width={THICKNESS} height={CABINET_H} fill="url(#woodGradient)" />
                     <rect x={COL_SIDE_W + COL_MID_W - THICKNESS} y="0" width={THICKNESS} height={CABINET_H} fill="url(#woodGradient)" />
                     
                     
                     {/* 4. Drawers (Bottom Left & Right) */}
                     {/* Left Drawer */}
                     <g transform={`translate(10, ${ROW_TOP_H + ROW_MID_H + THICKNESS*2 + 10})`}>
                         <rect x="0" y="0" width={COL_SIDE_W - 20} height={ROW_BOT_H - 20} fill="#F3EAD3" stroke="#DCC6A0" strokeWidth="2" />
                         <rect x="5" y="5" width={COL_SIDE_W - 30} height={ROW_BOT_H - 30} fill="none" stroke="#EFE4CC" strokeWidth="2" />
                         <circle cx={(COL_SIDE_W - 20)/2} cy={(ROW_BOT_H - 20)/2} r="12" fill="white" filter="url(#shadowBlur)" />
                         <circle cx={(COL_SIDE_W - 20)/2} cy={(ROW_BOT_H - 20)/2} r="4" fill="#E3D4B5" />
                     </g>

                     {/* Right Drawer */}
                     <g transform={`translate(${COL_SIDE_W + COL_MID_W + 10}, ${ROW_TOP_H + ROW_MID_H + THICKNESS*2 + 10})`}>
                         <rect x="0" y="0" width={COL_SIDE_W - 20} height={ROW_BOT_H - 20} fill="#F3EAD3" stroke="#DCC6A0" strokeWidth="2" />
                         <rect x="5" y="5" width={COL_SIDE_W - 30} height={ROW_BOT_H - 30} fill="none" stroke="#EFE4CC" strokeWidth="2" />
                         <circle cx={(COL_SIDE_W - 20)/2} cy={(ROW_BOT_H - 20)/2} r="12" fill="white" filter="url(#shadowBlur)" />
                         <circle cx={(COL_SIDE_W - 20)/2} cy={(ROW_BOT_H - 20)/2} r="4" fill="#E3D4B5" />
                     </g>


                     {/* 5. Center Decoration (Sticky Note) */}
                     <g transform={`translate(${COL_SIDE_W + COL_MID_W/2}, ${ROW_TOP_H + 80})`}>
                         <rect x="-50" y="0" width="100" height="80" fill="#FEF9C3" filter="url(#shadowBlur)" transform="rotate(-1)" />
                         <circle cx="0" cy="10" r="3" fill="#EF4444" opacity="0.8" />
                         {/* Lines */}
                         <line x1="-40" y1="25" x2="40" y2="25" stroke="#E5E7EB" strokeWidth="2" transform="rotate(-1)" />
                         <line x1="-40" y1="40" x2="40" y2="40" stroke="#E5E7EB" strokeWidth="2" transform="rotate(-1)" />
                         <line x1="-40" y1="55" x2="10" y2="55" stroke="#E5E7EB" strokeWidth="2" transform="rotate(-1)" />
                     </g>

                     {/* 6. Decorative Shelf Details (Right Mid) */}
                     <g transform={`translate(${COL_SIDE_W + COL_MID_W + 80}, ${ROW_TOP_H + 180})`}>
                         <rect x="0" y="0" width="60" height="12" fill="#EF4444" rx="1" opacity="0.8" />
                         <line x1="30" y1="12" x2="30" y2="30" stroke="#9CA3AF" strokeWidth="2" />
                         <rect x="-5" y="30" width="70" height="14" fill="#5F8D75" rx="1" />
                     </g>

                 </g>

                 {/* --- Books Rendering --- */}
                 {/* Top Row: 0-15 */}
                 {Array.from({length: 16}).map((_, i) => renderBook(i))}
                 
                 {/* Mid Row Left: 16-20 */}
                 {Array.from({length: 5}).map((_, i) => renderBook(16 + i))}

                 {/* Mid Row Right: 21-25 */}
                 {Array.from({length: 5}).map((_, i) => renderBook(21 + i))}
                 {/* Tall Book Slot */}
                 {renderBook(25)}

             </svg>

             {/* --- Edit Modal --- */}
             {editingBook && (
                 <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setEditingBook(null)}>
                     <div 
                        className="bg-white p-6 rounded-2xl shadow-2xl w-96 animate-in zoom-in-95 border border-stone-200" 
                        onClick={e => e.stopPropagation()}
                     >
                         <div className="flex justify-between items-center mb-6 border-b pb-4">
                             <h3 className="font-bold text-stone-800 flex items-center gap-2 text-lg">
                                 <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Edit2 size={20}/></div>
                                 Edit Book
                             </h3>
                             <button onClick={() => setEditingBook(null)} className="text-stone-400 hover:text-stone-600 p-1 hover:bg-stone-100 rounded-full transition-colors"><X size={20}/></button>
                         </div>
                         
                         <div className="space-y-5">
                             <div>
                                 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5">{t.settingsModal.bookTitle}</label>
                                 <input 
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-800 font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                                    value={editForm.title} 
                                    onChange={e => setEditForm({...editForm, title: e.target.value})} 
                                    autoFocus 
                                    placeholder="e.g. Scholar"
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1.5 flex items-center gap-2"><Globe size={12}/> {t.settingsModal.bookUrl}</label>
                                 <input 
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-600 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                                    value={editForm.url} 
                                    onChange={e => setEditForm({...editForm, url: e.target.value})} 
                                    placeholder="https://..."
                                 />
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">{t.settingsModal.bgColor}</label>
                                 <div className="flex justify-between items-center p-3 bg-stone-50 rounded-lg border border-stone-200">
                                     <div className="flex items-center gap-3">
                                         <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm p-0" value={editForm.color} onChange={e => setEditForm({...editForm, color: e.target.value})} />
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div className="mt-8 flex gap-3 pt-4 border-t">
                             <button onClick={() => deleteBook(editingBook.id)} className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-red-100"><Trash2 size={16}/> {t.note.delete}</button>
                             <div className="flex-1"></div>
                             <button onClick={() => setEditingBook(null)} className="px-5 py-2 text-sm text-stone-500 hover:bg-stone-100 rounded-lg font-bold transition-colors">{t.note.done}</button>
                             <button onClick={handleSaveEdit} className="px-6 py-2 text-sm bg-stone-800 text-white rounded-lg shadow-lg hover:bg-stone-900 font-bold flex items-center gap-2 transition-transform active:scale-95"><Check size={16}/> Save</button>
                         </div>
                     </div>
                 </div>
             )}

             {/* Overlay for theme opacity */}
             <div className="absolute inset-0 pointer-events-none bg-stone-900 transition-opacity z-10" style={{ opacity: 1 - opacity }}></div>
        </div>
    );
};

export default BookshelfBackground;