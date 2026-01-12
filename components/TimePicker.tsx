
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
  const dateObj = value ? new Date(value) : new Date();
  const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const [viewDate, setViewDate] = useState(new Date(safeDate));
  const [selectedHour, setSelectedHour] = useState(safeDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(safeDate.getMinutes());

  const isOpen = isDateOpen || isTimeOpen;

  // 1. 核心：动态坐标计算与溢出检测
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelHeight = isDateOpen ? 280 : 200; // 预估面板高度
      const spaceBelow = window.innerHeight - rect.bottom;
      const showUpward = spaceBelow < panelHeight;

      setCoords({
        top: showUpward ? rect.top - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        showUpward
      });
    }
  }, [isOpen, isDateOpen, isTimeOpen]);

  // 2. 全局点击监控，关闭面板
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

  const commit = (d: Date, h: number, m: number) => {
    const newDate = new Date(d);
    newDate.setHours(h);
    newDate.setMinutes(m);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    onChange(`${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}:00`);
  };

  const formatDisplayDate = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${safeDate.getFullYear()}/${pad(safeDate.getMonth() + 1)}/${pad(safeDate.getDate())}`;
  };

  const formatDisplayTime = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(safeDate.getHours())}:${pad(safeDate.getMinutes())}`;
  };

  // 生成日历数据
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // 渲染日期选择面板
  const renderDatePanel = () => {
    if (!isDateOpen) return null;
    return createPortal(
      <div 
        className="time-picker-portal fixed z-[999999] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] border border-stone-200 p-3 w-56 select-none"
        style={{ 
          top: coords.showUpward ? 'auto' : coords.top, 
          bottom: coords.showUpward ? (window.innerHeight - coords.top) : 'auto',
          left: coords.left,
          opacity: 1,
          pointerEvents: 'auto'
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center text-stone-700 font-bold px-1 mb-2">
          <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth()-1); setViewDate(d); }} className="p-1 hover:bg-stone-100 rounded text-stone-400"><ChevronLeft size={14}/></button>
          <div className="text-xs">{viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
          <button onClick={() => { const d = new Date(viewDate); d.setMonth(d.getMonth()+1); setViewDate(d); }} className="p-1 hover:bg-stone-100 rounded text-stone-400"><ChevronRight size={14}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map(d => <div key={d} className="text-[9px] text-stone-400 font-bold uppercase">{d}</div>)}
          {days.map((d, i) => (
            <div key={i} className="aspect-square flex items-center justify-center">
              {d ? (
                <button 
                  onClick={() => {
                    const newDate = new Date(viewDate);
                    newDate.setDate(d);
                    commit(newDate, selectedHour, selectedMinute);
                    setIsDateOpen(false);
                  }}
                  className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-full transition-colors ${safeDate.getDate() === d && safeDate.getMonth() === viewDate.getMonth() && safeDate.getFullYear() === viewDate.getFullYear() ? 'bg-blue-600 text-white font-bold' : 'text-stone-700 hover:bg-stone-100'}`}
                >
                  {d}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  // 渲染时间选择面板
  const renderTimePanel = () => {
    if (!isTimeOpen) return null;
    return createPortal(
      <div 
        className="time-picker-portal fixed z-[999999] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.25)] border border-stone-200 w-32 h-48 flex overflow-hidden"
        style={{ 
          top: coords.showUpward ? 'auto' : coords.top, 
          bottom: coords.showUpward ? (window.innerHeight - coords.top) : 'auto',
          left: coords.left + coords.width - 128,
          opacity: 1,
          pointerEvents: 'auto'
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto no-scrollbar border-r border-stone-100 bg-white overscroll-contain">
          {Array.from({ length: 24 }).map((_, i) => (
            <button key={i} onClick={() => { setSelectedHour(i); commit(viewDate, i, selectedMinute); }} className={`w-full py-2.5 text-center text-xs hover:bg-stone-100 ${selectedHour === i ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}>
              {i.toString().padStart(2, '0')}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white overscroll-contain">
          {Array.from({ length: 60 }).map((_, i) => (
            <button key={i} onClick={() => { setSelectedMinute(i); commit(viewDate, selectedHour, i); }} className={`w-full py-2.5 text-center text-xs hover:bg-stone-100 ${selectedMinute === i ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}>
              {i.toString().padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className} relative`} ref={triggerRef}>
      {/* Date Trigger */}
      <div className="relative flex-1 min-w-[90px]">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDateOpen(!isDateOpen); setIsTimeOpen(false); }}
          className="w-full text-xs p-1.5 border rounded-md border-stone-200 hover:bg-stone-50 bg-white text-stone-700 font-mono flex items-center justify-between"
        >
          <span className="truncate">{formatDisplayDate()}</span>
          <CalendarIcon size={12} className="text-stone-400 ml-1" />
        </button>
      </div>

      {/* Time Trigger */}
      <div className="relative w-20 min-w-[70px]">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsTimeOpen(!isTimeOpen); setIsDateOpen(false); }}
          className="w-full text-xs p-1.5 border rounded-md border-stone-200 hover:bg-stone-50 bg-white text-stone-700 font-mono flex items-center justify-between"
        >
          <span className="truncate">{formatDisplayTime()}</span>
          <Clock size={12} className="text-stone-400 ml-1" />
        </button>
      </div>

      {renderDatePanel()}
      {renderTimePanel()}
    </div>
  );
};

export default TimePicker;
