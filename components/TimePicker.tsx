

import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string; // ISO string
  onChange: (value: string) => void;
  className?: string;
}

const TumblerColumn = ({ 
  options, 
  value, 
  onChange, 
  label 
}: { 
  options: number[], 
  value: number, 
  onChange: (v: number) => void,
  label?: string 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected value on open
  useEffect(() => {
    if (scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(`[data-value="${value}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1 min-w-[40px]">
      {label && <div className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">{label}</div>}
      <div 
        ref={scrollRef}
        className="w-full h-32 overflow-y-auto no-scrollbar snap-y snap-mandatory relative group"
      >
        <div className="h-12"></div> {/* Spacer top */}
        {options.map(opt => (
          <div 
            key={opt}
            data-value={opt}
            onClick={() => {
                onChange(opt);
                scrollRef.current?.querySelector(`[data-value="${opt}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className={`h-8 flex items-center justify-center snap-center cursor-pointer transition-all text-sm font-mono ${opt === value ? 'text-stone-800 font-bold scale-110' : 'text-stone-300 hover:text-stone-500'}`}
          >
            {opt.toString().padStart(2, '0')}
          </div>
        ))}
        <div className="h-12"></div> {/* Spacer bottom */}
        
        {/* Minimal Selection Indicator */}
        <div className="absolute top-12 left-0 right-0 h-8 pointer-events-none border-y border-stone-100 bg-stone-50/50"></div>
      </div>
    </div>
  );
};

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dateObj = value ? new Date(value) : new Date();
  
  const [year, setYear] = useState(dateObj.getFullYear());
  const [month, setMonth] = useState(dateObj.getMonth() + 1);
  const [day, setDay] = useState(dateObj.getDate());
  const [hour, setHour] = useState(dateObj.getHours());
  const [minute, setMinute] = useState(dateObj.getMinutes());
  const [second, setSecond] = useState(dateObj.getSeconds());

  // Sync state with props when opening or when value changes
  useEffect(() => {
      if (isOpen && value) {
          const d = new Date(value);
          if (!isNaN(d.getTime())) {
            setYear(d.getFullYear());
            setMonth(d.getMonth() + 1);
            setDay(d.getDate());
            setHour(d.getHours());
            setMinute(d.getMinutes());
            setSecond(d.getSeconds());
          }
      } else if (isOpen && !value) {
          const d = new Date();
          setYear(d.getFullYear());
          setMonth(d.getMonth() + 1);
          setDay(d.getDate());
          setHour(d.getHours());
          setMinute(d.getMinutes());
          setSecond(d.getSeconds());
      }
  }, [isOpen, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdate = (y: number, m: number, d: number, h: number, min: number, s: number) => {
      setYear(y); setMonth(m); setDay(d); setHour(h); setMinute(min); setSecond(s);
      
      const newDate = new Date();
      newDate.setFullYear(y);
      newDate.setMonth(m - 1);
      newDate.setDate(d);
      newDate.setHours(h);
      newDate.setMinutes(min);
      newDate.setSeconds(s);
      newDate.setMilliseconds(0);

      const pad = (n: number) => n.toString().padStart(2, '0');
      const iso = `${newDate.getFullYear()}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}`;
      onChange(iso);
  };

  const formatDisplay = () => {
      if (!value) return "Select Time";
      const d = new Date(value);
      if (isNaN(d.getTime())) return "Invalid Time";
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear().toString().slice(-2)}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Ranges
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 11}, (_, i) => currentYear - 5 + i); // 5 years back, 5 forward
  const months = Array.from({length: 12}, (_, i) => i + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  const hours = Array.from({length: 24}, (_, i) => i);
  const minutes = Array.from({length: 60}, (_, i) => i);
  const seconds = Array.from({length: 60}, (_, i) => i);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs p-1.5 border rounded-md border-transparent hover:border-stone-200 hover:bg-stone-50 transition-colors text-left flex items-center justify-between text-stone-600 font-mono tracking-tight"
      >
        <span>{formatDisplay()}</span>
        <Clock size={12} className="text-stone-300" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-stone-100 z-[100] p-4 flex gap-4 animate-in fade-in zoom-in-95 duration-200">
             
             {/* Date Section */}
             <div className="flex gap-1">
                <TumblerColumn label="Yr" options={years} value={year} onChange={(v) => handleUpdate(v, month, day, hour, minute, second)} />
                <TumblerColumn label="Mo" options={months} value={month} onChange={(v) => handleUpdate(year, v, day, hour, minute, second)} />
                <TumblerColumn label="Dy" options={days} value={day} onChange={(v) => handleUpdate(year, month, v, hour, minute, second)} />
             </div>

             <div className="w-px bg-stone-100 self-center h-28"></div>

             {/* Time Section */}
             <div className="flex gap-1">
                <TumblerColumn label="Hr" options={hours} value={hour} onChange={(v) => handleUpdate(year, month, day, v, minute, second)} />
                <TumblerColumn label="Mn" options={minutes} value={minute} onChange={(v) => handleUpdate(year, month, day, hour, v, second)} />
                <TumblerColumn label="Sc" options={seconds} value={second} onChange={(v) => handleUpdate(year, month, day, hour, minute, v)} />
             </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;