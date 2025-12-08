

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    sidebar: {
      notebooks: "Notebooks",
      notebook: "Notebook",
      note: "Note",
      today: "Today's Filter",
      todayStickies: "Today's Stickies",
      bookshelf: "Bookshelf",
      settings: "Settings",
      help: "User Manual"
    },
    groups: {
      title: "Your Notebooks",
      newGroup: "New Notebook",
      deleteConfirmTitle: "Delete Notebook",
      deleteConfirmMsg: "Are you sure you want to delete this notebook and ALL its events? This cannot be undone."
    },
    toolbar: {
      sortingActive: "Sorting active",
      dragToReorder: "Drag to reorder",
      doubleClick: "Double-click to edit",
      newEvent: "New Event",
      pinAll: "Pin View",
      pinAllTitle: "Pin all events in current view",
      dataOptions: "Data Options",
      themeSettings: "Theme Settings",
      language: "Language",
      help: "User Manual"
    },
    settingsModal: {
      title: "Settings",
      general: "General",
      bookshelf: "Bookshelf",
      notebook: "Notebook(s)",
      presets: "Notes",
      language: "Language",
      bgType: "Background Type",
      bgColor: "Color",
      bgImage: "Image",
      opacity: "Opacity",
      texture: "Paper Texture",
      newPreset: "Save New Preset",
      deletePreset: "Delete",
      manageBooks: "Manage Books",
      addBook: "Add Book",
      bookTitle: "Title",
      bookUrl: "URL",
      interactiveMode: "Interactive Bookshelf",
      interactiveModeDesc: "Click books to visit websites. Hover for effects.",
      bg3d: "Interactive",
      bgSolid: "Solid Color",
      bgImg: "Custom Image"
    },
    dataMenu: {
      openFolder: "Open Data Folder",
      exportCSV: "Export CSV",
      importCSV: "Import CSV"
    },
    themeMenu: {
      desktopTheme: "Bookshelf Theme",
      notebookTheme: "Notebook Theme",
      reset: "Reset",
      resetDesktopMsg: "Restore bookshelf background to default settings?",
      resetNotebookMsg: "Restore notebook appearance to default settings?",
      paperTexture: "Paper Texture"
    },
    table: {
      content: "Content",
      added: "Added",
      start: "Start",
      end: "End",
      location: "Location",
      importance: "Imp.",
      status: "Status",
      reminder: "Reminder",
      actions: "Actions",
      empty: "No events found."
    },
    note: {
      placeholder: "Write something...",
      settings: "Note Style",
      decoration: "Decoration",
      position: "Position",
      paper: "Paper",
      presets: "Presets",
      applyPreset: "Apply",
      saveAsPreset: "Save as Preset",
      preview: "Preview",
      done: "Close",
      unpin: "Unpin",
      delete: "Delete",
      deleteConfirmTitle: "Delete Event",
      deleteConfirmMsg: "Are you sure you want to delete this event? This action cannot be undone."
    },
    styles: {
      clip: "Clip",
      pin: "Pin",
      tape: "Tape",
      spiral: "Spiral",
      washi: "Washi",
      minimal: "Minimal",
      torn: "Torn Paper",
      flower: "Flower",
      leaf: "Leaf"
    },
    textures: {
      solid: "Solid",
      lined: "Lined",
      grid: "Grid",
      dots: "Dots"
    },
    status: {
      todo: "To Do",
      inProgress: "In Progress",
      done: "Done"
    },
    importance: {
      high: "High",
      medium: "Med",
      low: "Low"
    },
    help: {
      title: "NoteMinder User Manual",
      sections: {
        bookshelf: {
          title: "Bookshelf",
          items: [
            "Primary workspace background. Click sidebar 'Bookshelf' icon to hide all windows.",
            "Interactive Books: Hover to pull out, Click to open link, Double-click to edit.",
            "Empty Slots: Click empty gray books to add new links.",
            "Management: You can also edit book Titles and URLs directly in Settings."
          ]
        },
        notebooks: {
          title: "Notebooks",
          items: [
            "Containers for tasks (e.g., Work, Personal).",
            "Double-click name to rename. Drag to reorder.",
            "Use '+' to create, 'X' to delete."
          ]
        },
        notebook: {
          title: "Notebook",
          items: [
             "Main list view. Double-click cells to edit.",
             "Batch Pinning: Click 'Layers' button to pin all visible tasks.",
             "Today Filter: Sidebar 'Calendar' icon filters for tasks happening today.",
             "Time Picker: Click dates for precise tumbler selection."
          ]
        },
        note: {
          title: "Note",
          items: [
             "View Modes: 'Desktop Stickies' shows ALL pins. 'Today Stickies' shows only today's pins. Clicking one mode automatically closes the other.",
             "Styling: Click 'Gear' icon. Panel opens to the side to avoid covering content.",
             "Decorations: Choose style (Flower, Pin, etc.) and set one of 8 positions (corners/sides).",
             "Presets: Save your favorite styles in Settings -> Presets, then apply them quickly."
          ]
        },
        settings: {
          title: "Settings",
          items: [
             "Theme: Customize opacity/textures.",
             "Bookshelf: Manage your link library.",
             "Presets: Create and manage reusable sticky note styles.",
             "Language: Switch English/Chinese."
          ]
        }
      }
    }
  },
  zh: {
    sidebar: {
      notebooks: "笔记本库",
      notebook: "当前列表",
      note: "桌面便签",
      today: "今日待办",
      todayStickies: "今日便签",
      bookshelf: "书架桌面",
      settings: "系统设置",
      help: "使用说明"
    },
    groups: {
      title: "我的笔记本",
      newGroup: "新建笔记本",
      deleteConfirmTitle: "删除笔记本",
      deleteConfirmMsg: "确定要删除此笔记本及其所有事件吗？此操作无法撤销。"
    },
    toolbar: {
      sortingActive: "正在排序",
      dragToReorder: "拖拽调整顺序",
      doubleClick: "双击编辑",
      newEvent: "新建事件",
      pinAll: "一键固定",
      pinAllTitle: "将当前视图所有事件固定到桌面",
      dataOptions: "数据选项",
      themeSettings: "主题设置",
      language: "语言",
      help: "使用说明"
    },
    settingsModal: {
      title: "设置",
      general: "常规",
      bookshelf: "书架桌面",
      notebook: "笔记本(s)",
      presets: "便签样式",
      language: "语言",
      bgType: "背景类型",
      bgColor: "颜色",
      bgImage: "图片",
      opacity: "不透明度",
      texture: "纸张纹理",
      newPreset: "保存为新样式",
      deletePreset: "删除",
      manageBooks: "书籍管理",
      addBook: "添加书籍",
      bookTitle: "标题",
      bookUrl: "网址",
      interactiveMode: "书架交互模式已激活",
      interactiveModeDesc: "单击书本访问网页，悬停查看效果，双击编辑。",
      bg3d: "交互书架",
      bgSolid: "纯色背景",
      bgImg: "自定义图片"
    },
    dataMenu: {
      openFolder: "打开数据文件夹",
      exportCSV: "导出 CSV",
      importCSV: "导入 CSV"
    },
    themeMenu: {
      desktopTheme: "书架主题",
      notebookTheme: "笔记本主题",
      reset: "重置",
      resetDesktopMsg: "恢复书架背景为默认设置？",
      resetNotebookMsg: "恢复笔记本外观为默认设置？",
      paperTexture: "纸张纹理"
    },
    table: {
      content: "事件内容",
      added: "添加时间",
      start: "开始时间",
      end: "结束时间",
      location: "地点",
      importance: "优先级",
      status: "状态",
      reminder: "提醒",
      actions: "操作",
      empty: "未找到事件。"
    },
    note: {
      placeholder: "写点什么...",
      settings: "样式设置",
      decoration: "装饰组件",
      position: "装饰位置",
      paper: "纸张风格",
      presets: "预设样式",
      applyPreset: "应用",
      saveAsPreset: "存为预设",
      preview: "预览",
      done: "关闭",
      unpin: "取下便签",
      delete: "删除",
      deleteConfirmTitle: "删除事件",
      deleteConfirmMsg: "确定要删除此事件吗？此操作无法撤销。"
    },
    styles: {
      clip: "回形针",
      pin: "图钉",
      tape: "胶带",
      spiral: "螺旋本",
      washi: "和纸胶带",
      minimal: "极简",
      torn: "撕纸",
      flower: "花朵",
      leaf: "树叶"
    },
    textures: {
      solid: "纯色",
      lined: "横线",
      grid: "方格",
      dots: "点阵"
    },
    status: {
      todo: "待执行",
      inProgress: "执行中",
      done: "执行结束"
    },
    importance: {
      high: "高",
      medium: "中",
      low: "低"
    },
    help: {
      title: "NoteMinder 使用说明",
      sections: {
        bookshelf: {
          title: "书架 (Bookshelf)",
          items: [
            "工作区背景。点击侧边栏“书本”图标进入纯净桌面模式。",
            "交互书籍：鼠标悬停会有抽出效果。单击打开网页，双击编辑链接。",
            "填充空位：点击灰色的空白书本即可添加新链接。",
            "书籍管理：您也可以在设置中批量编辑所有书本的标题和网址。"
          ]
        },
        notebooks: {
          title: "笔记本库 (Notebooks)",
          items: [
            "任务分类容器。双击重命名，拖拽排序。",
            "点击“+”新建，悬停点击“X”删除。"
          ]
        },
        notebook: {
          title: "当前列表 (Notebook)",
          items: [
             "核心表格视图。双击单元格编辑，支持AI识别。",
             "一键固定：点击“层叠”按钮，将当前列表所有事项按顺序排列到桌面。",
             "今日待办：点击侧边栏“日历”图标，仅显示今日任务。",
             "时间选择器：滚轮式精确选择时间。"
          ]
        },
        note: {
          title: "桌面便签 (Note)",
          items: [
             "视图模式：'桌面便签'显示所有固定项；'今日便签'仅显示今日固定项。",
             "样式设置：点击设置齿轮，面板会在便签侧边打开。",
             "装饰位置：支持8个方位的装饰（左上、右下等）。",
             "预设系统：在设置中保存常用样式组合，一键应用。"
          ]
        },
        settings: {
          title: "系统设置",
          items: [
             "主题：调整透明度、背景图。",
             "书架桌面：管理书本链接。",
             "便签预设：创建和管理常用的便签外观模板。",
             "语言：中英文切换。"
          ]
        }
      }
    }
  }
};