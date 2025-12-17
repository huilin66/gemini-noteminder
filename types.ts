


export enum NoteStatus {
  TODO = '待执行',
  IN_PROGRESS = '执行中',
  PARTIAL = '部分完成',
  DONE = '执行结束'
}

export enum NoteImportance {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export type NoteTexture = 'solid' | 'lined' | 'grid' | 'dots';

export interface NoteTheme {
  type: 'color' | 'image';
  value: string;
  textColor: string;
  opacity: number;
}

export interface ThemeConfig {
  type: 'color' | 'image' | 'bookshelf';
  value: string;
  textColor: string;
  opacity: number;
  texture?: NoteTexture;
}

export interface Group {
  id: string;
  name: string;
}

export type NoteStyleVariant = 'tape' | 'pin' | 'clip' | 'minimal' | 'spiral' | 'washi' | 'torn' | 'flower' | 'leaf';

export type NoteDecorationPosition = 'top-left' | 'top-center' | 'top-right' | 'mid-left' | 'mid-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface NotePreset {
  id: string;
  name: string;
  theme: NoteTheme;
  styleVariant: NoteStyleVariant;
  textureVariant: NoteTexture;
  decorationPosition: NoteDecorationPosition;
  isDefault?: boolean;
}

export interface Note {
  id: string;
  groupId: string;
  content: string;
  createdAt: number;
  
  startTime?: number;
  endTime?: number; 
  location?: string;
  status: NoteStatus;
  importance: NoteImportance;
  
  isReminderOn: boolean;
  reminderTime?: number;
  
  theme: NoteTheme;
  styleVariant?: NoteStyleVariant;
  textureVariant?: NoteTexture;
  decorationPosition?: NoteDecorationPosition;
  dimensions?: { width: number; height: number };
  
  isPinned: boolean;
  position: { x: number; y: number };
  zIndex: number;
}

export interface AIParsedNote {
  content: string;
  eventTime?: string;
  location?: string;
  status?: string;
}

export interface ColumnWidths {
  content: number;
  createdAt: number;
  startTime: number;
  endTime: number;
  location: number;
  importance: number;
  status: number;
  reminder: number;
  actions: number;
}

export interface ViewState {
  showGroups: boolean;
  showNotebook: boolean;
  showStickies: boolean; // "Desktop Stickies" (All pinned)
  showTodayStickies: boolean; // "Today Stickies" (Only today's pinned)
}

export type Language = 'en' | 'zh';

export interface SmartBook {
  id: string;
  title: string;
  url: string;
  color: string;
  position: number;
  spineDetail?: number; // 0: none, 1: top lines, 2: bottom lines, 3: both
}

export type LLMProvider = 'gemini' | 'openai' | 'deepseek' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  customPrompt?: string;
}
