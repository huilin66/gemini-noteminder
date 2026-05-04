
export enum NoteStatus {
  TODO = '待执行',
  IN_PROGRESS = '执行中',
  PARTIAL = '部分完成',
  CANCELLED = '取消执行',
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
  type?: 'standard' | 'ai_record'; 
  schema?: RecordFieldSchema[];
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
  recordData?: Record<string, any>;
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
  isTop?: boolean; // New: Pin to top in list
  position: { x: number; y: number };
  zIndex: number;

  noteType?: 'task' | 'record';
  recordData?: Record<string, any>;
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
  duration: number;
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

export type FieldType = 'text' | 'number' | 'date' | 'status' | 'link';
export interface RecordFieldSchema {
  id: string;          // 字段唯一ID，如 'config_file'
  label: string;       // 显示名称，如 '配置文件'
  type: FieldType;     // 字段类型
  isVisible: boolean;  // 是否在表格中显示
  order: number;       // 显示顺序
  width: number;       // 列宽
  defaultValue?: any;  // 用户设置的默认值
  isSystem?: boolean;  // 是否为系统自带的不可删除字段（如ID、添加时间）
}