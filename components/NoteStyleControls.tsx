
import React, { useRef } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { NoteStyleVariant, NoteTexture, NoteDecorationPosition, Language, NoteTheme } from '../types';
import { translations } from '../utils/i18n';

interface NoteStyleControlsProps {
  theme: {
    type: string; 
    value: string;
    textColor: string;
    opacity: number;
  };
  styleVariant: NoteStyleVariant;
  textureVariant: NoteTexture;
  decorationPosition: NoteDecorationPosition;
  opacity: number;
  onUpdate: (updates: Partial<{
    theme: NoteTheme;
    styleVariant: NoteStyleVariant;
    textureVariant: NoteTexture;
    decorationPosition: NoteDecorationPosition;
  }>) => void;
  language: Language;
}

const NoteStyleControls: React.FC<NoteStyleControlsProps> = ({
  theme,
  styleVariant,
  textureVariant,
  decorationPosition,
  opacity,
  onUpdate,
  language
}) => {
  const t = translations[language];
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      // @ts-ignore - Valid cast for NoteTheme
      onUpdate({ theme: { ...theme, type: 'image', value: reader.result as string } });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Color Picker */}
      <div>
        <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">{t.settingsModal.bgColor}</div>
        <div className="flex items-center gap-2">
          <input 
            type="color" 
            value={theme.type === 'color' ? theme.value : '#fef3c7'} 
            onChange={e => {
                // @ts-ignore
                onUpdate({ theme: { ...theme, type: 'color', value: e.target.value } })
            }} 
            className="w-8 h-8 rounded cursor-pointer border border-stone-200 p-0" 
          />
          <label className="cursor-pointer p-1.5 bg-stone-100 hover:bg-stone-200 rounded text-stone-600">
            <ImageIcon size={16} />
            <input type="file" accept="image/*" className="hidden" ref={bgImageInputRef} onChange={handleImageUpload} />
          </label>
          <input 
            type="range" 
            min="0.2" 
            max="1" 
            step="0.05" 
            value={opacity} 
            onChange={e => {
                // @ts-ignore
                onUpdate({ theme: { ...theme, opacity: parseFloat(e.target.value) } })
            }} 
            className="flex-1 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer" 
          />
        </div>
      </div>

      {/* Style Variant */}
      <div>
        <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">{t.note.decoration}</div>
        <div className="grid grid-cols-3 gap-1">
          {['clip', 'pin', 'tape', 'spiral', 'washi', 'minimal', 'torn', 'flower', 'leaf'].map(v => (
            <button 
              key={v} 
              onClick={() => onUpdate({ styleVariant: v as NoteStyleVariant })}
              className={`py-1 px-0.5 rounded border text-[9px] capitalize text-center ${styleVariant === v ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-stone-200 hover:bg-stone-50'}`}
            >
              {t.styles[v as keyof typeof t.styles]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Position Selector */}
      <div>
        <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">{t.note.position}</div>
        <div className="grid grid-cols-3 gap-1 w-20 mx-auto">
          {['top-left', 'top-center', 'top-right', 'mid-left', null, 'mid-right', 'bottom-left', 'bottom-center', 'bottom-right'].map((pos, i) => (
            pos ? (
              <button 
                key={pos}
                onClick={() => onUpdate({ decorationPosition: pos as NoteDecorationPosition })}
                className={`w-6 h-6 border rounded hover:bg-stone-100 ${decorationPosition === pos ? 'bg-blue-500 border-blue-600' : 'bg-white'}`}
              ></button>
            ) : <div key={i} className="w-6 h-6"></div>
          ))}
        </div>
      </div>

      {/* Texture */}
      <div>
        <div className="text-[10px] text-stone-400 font-bold uppercase mb-1">{t.note.paper}</div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: 'solid', label: t.textures.solid },
            { id: 'lined', label: t.textures.lined },
            { id: 'grid', label: t.textures.grid },
            { id: 'dots', label: t.textures.dots }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => onUpdate({ textureVariant: item.id as NoteTexture })}
              className={`py-1 px-0.5 rounded border text-[9px] capitalize text-center ${textureVariant === item.id ? 'bg-blue-50 border-blue-400 text-blue-700' : 'border-stone-200 hover:bg-stone-50'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NoteStyleControls;
