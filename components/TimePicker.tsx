
import React, { useState, useRef, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  
  const dateContainerRef = useRef<HTMLDivElement>(null);
  const timeContainerRef = useRef<HTMLDivElement>(null);

  // Initialize state from props
  const dateObj = value ? new Date(value) : new Date();
  const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const [viewDate, setViewDate] = useState(new Date(safeDate)); // For calendar navigation
  
  const [selectedHour, setSelectedHour] = useState(safeDate.getHours());
  const [selectedMinute, setSelectedMinute] = useState(safeDate.getMinutes());

  // Sync state when reopening or value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
        setSelectedHour(d.getHours());
        setSelectedMinute(d.getMinutes());
      }
    }
  }, [value]);

  const commit = (d: Date, h: number, m: number) => {
    const newDate = new Date(d);
    newDate.setHours(h);
    newDate.setMinutes(m);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${newDate.getFullYear()}-${pad(newDate.getMonth() + 1)}-${pad(newDate.getDate())}T${pad(newDate.getHours())}:${pad(newDate.getMinutes())}:00`;
    onChange(localIso);
  };

  const handleDayClick = (e: React.MouseEvent, d: number) => {
    e.stopPropagation();
    const newDate = new Date(viewDate);
    newDate.setDate(d);
    setViewDate(newDate);
    commit(newDate, selectedHour, selectedMinute);
    setIsDateOpen(false);
  };

  const handleTimeSelect = (e: React.MouseEvent, h: number, m: number) => {
    e.stopPropagation();
    setSelectedHour(h);
    setSelectedMinute(m);
    commit(viewDate, h, m);
  };

  const changeMonth = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setViewDate(newDate);
  };

  const formatDisplayDate = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${safeDate.getFullYear()}/${pad(safeDate.getMonth() + 1)}/${pad(safeDate.getDate())}`;
  };

  const formatDisplayTime = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(safeDate.getHours())}:${pad(safeDate.getMinutes())}`;
  };

  // Calendar Generation
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay(); // 0 = Sun
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const isSelectedDate = (d: number) => {
    return safeDate.getDate() === d && 
           safeDate.getMonth() === viewDate.getMonth() && 
           safeDate.getFullYear() === viewDate.getFullYear();
  };

  // 通用事件拦截器 - 防止点击面板时触发底层的行选中或列表滚动
  const preventBubbling = (e: React.MouseEvent | React.WheelEvent) => {
    e.stopPropagation();
  };

  const isOpen = isDateOpen || isTimeOpen;

  return (
    <div className={`flex flex-wrap gap-1 items-center ${className}`}>
      {/* 遮罩层 (Backdrop): 当任意面板打开时，覆盖全屏并拦截所有事件 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[1000] bg-transparent cursor-default pointer-events-auto"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDateOpen(false);
            setIsTimeOpen(false);
          }}
          onWheel={(e) => {
            // 拦截背景滚动
            e.stopPropagation();
            e.preventDefault();
          }}
        />
      )}

      {/* Date Picker */}
      <div 
        className="relative flex-1 min-w-[90px] z-[1001]" 
        ref={dateContainerRef}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsDateOpen(!isDateOpen); setIsTimeOpen(false); }}
          className="w-full text-xs p-1.5 border rounded-md border-stone-200 hover:bg-stone-50 bg-white transition-colors text-left flex items-center justify-between text-stone-700 font-mono tracking-tight"
        >
          <span className="truncate">{formatDisplayDate()}</span>
          <CalendarIcon size={12} className="text-stone-400 shrink-0 ml-1" />
        </button>

        {isDateOpen && (
          <div 
            className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-stone-200 z-[1002] p-3 w-56 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-2 pointer-events-auto" 
            onMouseDown={preventBubbling}
            onMouseUp={preventBubbling}
            onClick={preventBubbling}
            onWheel={preventBubbling}
          >
               <div className="flex justify-between items-center text-stone-700 font-bold px-1">
                  <button onClick={(e) => changeMonth(e, -1)} className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600"><ChevronLeft size={14}/></button>
                  <div className="text-xs">
                    {viewDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                  </div>
                  <button onClick={(e) => changeMonth(e, 1)} className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600"><ChevronRight size={14}/></button>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center">
                  {weekDays.map(d => (
                    <div key={d} className="text-[9px] text-stone-400 font-bold uppercase">{d}</div>
                  ))}
                  {days.map((d, i) => (
                    <div key={i} className="aspect-square flex items-center justify-center">
                      {d ? (
                        <button 
                          onClick={(e) => handleDayClick(e, d)}
                          className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-full transition-colors ${isSelectedDate(d) ? 'bg-blue-600 text-white font-bold' : 'text-stone-700 hover:bg-stone-100'}`}
                        >
                          {d}
                        </button>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  ))}
               </div>
          </div>
        )}
      </div>

      {/* Time Picker */}
      <div 
        className="relative w-20 min-w-[70px] z-[1001]" 
        ref={timeContainerRef}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsTimeOpen(!isTimeOpen); setIsDateOpen(false); }}
          className="w-full text-xs p-1.5 border rounded-md border-stone-200 hover:bg-stone-50 bg-white transition-colors text-left flex items-center justify-between text-stone-700 font-mono tracking-tight"
        >
          <span className="truncate">{formatDisplayTime()}</span>
          <Clock size={12} className="text-stone-400 shrink-0 ml-1" />
        </button>

        {isTimeOpen && (
          <div 
            className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-2xl border border-stone-200 z-[1002] w-32 h-40 flex overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
            onMouseDown={preventBubbling}
            onMouseUp={preventBubbling}
            onClick={preventBubbling}
            onWheel={preventBubbling}
          >
               <div 
                className="flex-1 overflow-y-auto no-scrollbar border-r border-stone-100 overscroll-contain"
                onWheel={preventBubbling}
               >
                   {Array.from({ length: 24 }).map((_, i) => (
                       <button 
                         key={i} 
                         onClick={(e) => handleTimeSelect(e, i, selectedMinute)}
                         className={`w-full py-1 text-center text-xs hover:bg-stone-100 ${selectedHour === i ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}
                       >
                           {i.toString().padStart(2, '0')}
                       </button>
                   ))}
               </div>
               <div 
                className="flex-1 overflow-y-auto no-scrollbar overscroll-contain"
                onWheel={preventBubbling}
               >
                   {Array.from({ length: 60 }).map((_, i) => (
                       <button 
                         key={i} 
                         onClick={(e) => handleTimeSelect(e, selectedHour, i)}
                         className={`w-full py-1 text-center text-xs hover:bg-stone-100 ${selectedMinute === i ? 'bg-blue-50 text-blue-600 font-bold' : 'text-stone-600'}`}
                       >
                           {i.toString().padStart(2, '0')}
                       </button>
                   ))}
               </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimePicker;
