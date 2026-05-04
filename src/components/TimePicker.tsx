
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, showUpward: false });
  
  const triggerRef = useRef<HTMLDivElement>(null);
  
  // 格式化函数
  const pad = (n: number) => n.toString().padStart(2, '0');
  const toISOLike = (d: Date) => {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  const parseValue = (val: string) => {
    const d = val ? new Date(val) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [selectedDate, setSelectedDate] = useState(parseValue(value));
  const [viewDate, setViewDate] = useState(new Date(selectedDate));

  const [isSimpleMode, setIsSimpleMode] = useState(true);

  const isOpen = isDateOpen || isTimeOpen;

  // 1. 深度同步：当外部 value 改变时，强制更新内部状态
  useEffect(() => {
    const d = parseValue(value);
    setSelectedDate(d);
    // 只有在面板未打开时才同步视图月份，防止用户翻页时被跳回
    if (!isOpen) {
      setViewDate(new Date(d));
    }
  }, [value, isOpen]);

  // 2. 核心：动态坐标计算
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelHeight = isDateOpen ? 300 : 200;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showUpward = spaceBelow < panelHeight && rect.top > panelHeight;

      setCoords({
        top: showUpward ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        showUpward
      });
    }
  }, [isOpen, isDateOpen, isTimeOpen, isSimpleMode]);

  // 3. 全局点击关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.time-picker-portal') && !triggerRef.current?.contains(target)) {
        setIsDateOpen(false);
        setIsTimeOpen(false);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, [isOpen]);

  const commitChange = (newDate: Date) => {
    setSelectedDate(newDate);
    onChange(toISOLike(newDate));
  };

  const handleDayClick = (day: number) => {
    const next = new Date(selectedDate);
    next.setFullYear(viewDate.getFullYear());
    next.setMonth(viewDate.getMonth());
    next.setDate(day);
    commitChange(next);
    setIsDateOpen(false);
  };

  const handleTimeClick = (h: number, m: number) => {
    const next = new Date(selectedDate);
    next.setHours(h);
    next.setMinutes(m);
    next.setSeconds(0);
    commitChange(next);
  };

  const formatDisplayDate = () => `${pad(selectedDate.getMonth() + 1)}/${pad(selectedDate.getDate())}`;
  const formatDisplayTime = () => `${pad(selectedDate.getHours())}:${pad(selectedDate.getMinutes())}`;

  // 生成日历数据
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Simple Mode Data
  const simpleHours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 to 22
  const simpleMinutes = [0, 10, 20, 30, 40, 50];

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className} relative`} ref={triggerRef}>
      <div className="relative flex-1 min-w-[70px]">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDateOpen(!isDateOpen); setIsTimeOpen(false); }}
          className="w-full text-xs p-1.5 border rounded-md border-stone-200 hover:bg-stone-50 bg-white text-stone-700 font-mono flex items-center justify-between transition-colors"
        >
          <span className="truncate">{formatDisplayDate()}</span>
          <CalendarIcon size={12} className="text-stone-400 ml-1 shrink-0" />
        </button>
      </div>

      <div className="relative flex-1 min-w-[60px]">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsTimeOpen(!isTimeOpen); setIsDateOpen(false); }}
          className="w-full text-xs p-1.5 border rounded-md border-stone-200 hover:bg-stone-50 bg-white text-stone-700 font-mono flex items-center justify-between transition-colors"
        >
          <span className="truncate">{formatDisplayTime()}</span>
          <Clock size={12} className="text-stone-400 ml-1 shrink-0" />
        </button>
      </div>

      {isDateOpen && createPortal(
        <div 
          className="time-picker-portal fixed z-[999999] bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.3)] border border-stone-200 p-3 w-48 select-none"
          style={{ 
            top: coords.showUpward ? 'auto' : coords.top, 
            bottom: coords.showUpward ? (window.innerHeight - coords.top + triggerRef.current!.offsetHeight + 8) : 'auto',
            left: coords.left,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center text-stone-700 font-bold px-1 mb-2">
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1 hover:bg-stone-100 rounded text-stone-400"><ChevronLeft size={14}/></button>
            <div className="text-xs">{viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1 hover:bg-stone-100 rounded text-stone-400"><ChevronRight size={14}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map(d => <div key={d} className="text-[9px] text-stone-400 font-bold uppercase">{d}</div>)}
            {days.map((d, i) => (
              <div key={i} className="aspect-square flex items-center justify-center">
                {d ? (
                  <button 
                    onClick={() => handleDayClick(d)}
                    className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-full transition-colors ${selectedDate.getDate() === d && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear() ? 'bg-blue-600 text-white font-bold' : 'text-stone-700 hover:bg-stone-100'}`}
                  >
                    {d}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

      {isTimeOpen && createPortal(
        <div 
          className={`time-picker-portal fixed z-[999999] bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.3)] border border-stone-200 flex flex-col overflow-hidden w-32 h-48`}
          style={{ 
            top: coords.showUpward ? 'auto' : coords.top, 
            bottom: coords.showUpward ? (window.innerHeight - coords.top + triggerRef.current!.offsetHeight + 8) : 'auto',
            left: coords.left + coords.width - 128,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-2 py-1 border-b border-stone-100 bg-stone-50">
             <span className="text-[10px] font-bold text-stone-500 uppercase">{isSimpleMode ? 'Simple' : 'Full'}</span>
             <button onClick={() => setIsSimpleMode(!isSimpleMode)} className="text-[10px] text-blue-600 hover:underline font-bold">Switch</button>
          </div>
          
          {isSimpleMode ? (
             <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar border-r border-stone-100 bg-white p-1">
                   <div className="text-[9px] text-stone-400 font-bold uppercase text-center mb-1">Hour</div>
                   <div className="grid grid-cols-1 gap-1">
                      {simpleHours.map(h => (
                        <button key={h} onClick={() => handleTimeClick(h, selectedDate.getMinutes())} className={`w-full py-1.5 text-center text-xs rounded hover:bg-stone-100 ${selectedDate.getHours() === h ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}>
                          {pad(h)}
                        </button>
                      ))}
                   </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-1">
                   <div className="text-[9px] text-stone-400 font-bold uppercase text-center mb-1">Min</div>
                   <div className="grid grid-cols-1 gap-1">
                      {simpleMinutes.map(m => (
                        <button key={m} onClick={() => handleTimeClick(selectedDate.getHours(), m)} className={`w-full py-1.5 text-center text-xs rounded hover:bg-stone-100 ${selectedDate.getMinutes() === m ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}>
                          {pad(m)}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          ) : (
             <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar border-r border-stone-100 bg-white p-1 overscroll-contain">
                  <div className="text-[9px] text-stone-400 font-bold uppercase text-center mb-1">Hour</div>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <button key={i} onClick={() => handleTimeClick(i, selectedDate.getMinutes())} className={`w-full py-2.5 text-center text-xs hover:bg-stone-100 ${selectedDate.getHours() === i ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}>
                      {pad(i)}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-1 overscroll-contain">
                  <div className="text-[9px] text-stone-400 font-bold uppercase text-center mb-1">Min</div>
                  {Array.from({ length: 60 }).map((_, i) => (
                    <button key={i} onClick={() => handleTimeClick(selectedDate.getHours(), i)} className={`w-full py-2.5 text-center text-xs hover:bg-stone-100 ${selectedDate.getMinutes() === i ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}>
                      {pad(i)}
                    </button>
                  ))}
                </div>
             </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default TimePicker;
