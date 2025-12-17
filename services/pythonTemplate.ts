
export const PYTHON_APP_CODE = `import tkinter as tk
from tkinter import font
import json
import os
import uuid

# Configuration
DATA_FILE = 'noteminder_data.json'
DEFAULT_WIDTH = 300
DEFAULT_HEIGHT = 300

class Note:
    def __init__(self, id=None, content="", x=100, y=100, width=DEFAULT_WIDTH, height=DEFAULT_HEIGHT, color='#fef3c7'):
        self.id = id if id else str(uuid.uuid4())
        self.content = content
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.color = color

    def to_dict(self):
        return self.__dict__

    @staticmethod
    def from_dict(data):
        return Note(**data)

class StickyWindow(tk.Toplevel):
    def __init__(self, master, note, on_save, on_delete):
        super().__init__(master)
        self.note = note
        self.on_save = on_save
        self.on_delete = on_delete
        
        # Window Setup
        self.overrideredirect(True) # Frameless
        self.geometry(f"{note.width}x{note.height}+{note.x}+{note.y}")
        self.attributes('-topmost', True)
        self.configure(bg=note.color)
        
        # State
        self.is_moving = False
        self.offset_x = 0
        self.offset_y = 0

        # UI Construction
        self.build_ui()
        self.bind_events()

    def build_ui(self):
        # Toolbar
        self.toolbar = tk.Frame(self, bg=self.darken(self.note.color), height=25, cursor="fleur")
        self.toolbar.pack(side='top', fill='x')
        self.toolbar.pack_propagate(False)

        # Controls
        btn_opts = {'bg': self.darken(self.note.color), 'fg': '#555', 'bd': 0, 'activebackground': self.note.color, 'font': ('Arial', 8, 'bold')}
        
        self.btn_close = tk.Button(self.toolbar, text="×", command=self.close_note, **btn_opts)
        self.btn_close.pack(side='right', padx=2)
        
        self.btn_add = tk.Button(self.toolbar, text="+", command=self.master.create_note, **btn_opts)
        self.btn_add.pack(side='left', padx=2)
        
        # Title/Drag Label
        lbl_title = tk.Label(self.toolbar, text="NoteMinder", bg=self.darken(self.note.color), fg="#666", font=('Arial', 8))
        lbl_title.pack(side='left', padx=5)

        # Text Area
        # Try to use a nice font, fallback to system default
        fonts = ["Segoe UI Emoji", "Segoe UI", "Arial"]
        used_font = "Arial"
        for f in fonts:
            if f in font.families():
                used_font = f
                break
                
        self.text_area = tk.Text(self, bg=self.note.color, fg='#222', font=(used_font, 12), relief='flat', padx=10, pady=10, undo=True)
        self.text_area.insert('1.0', self.note.content)
        self.text_area.pack(expand=True, fill='both')
        
        # Resize Grip
        self.grip = tk.Label(self, text="◢", bg=self.note.color, fg="#aaa", cursor="sizing", font=("Arial", 10))
        self.grip.place(relx=1.0, rely=1.0, anchor='se')

    def darken(self, hex_color):
        # Mapping for toolbar colors based on note color
        colors = {
            '#fef3c7': '#fbbf24', # Yellow
            '#dbeafe': '#93c5fd', # Blue
            '#dcfce7': '#86efac', # Green
            '#fce7f3': '#f9a8d4'  # Pink
        }
        return colors.get(hex_color, '#ccc')

    def bind_events(self):
        # Dragging
        self.toolbar.bind('<Button-1>', self.start_move)
        self.toolbar.bind('<B1-Motion>', self.do_move)
        
        # Resizing
        self.grip.bind('<Button-1>', self.start_resize)
        self.grip.bind('<B1-Motion>', self.do_resize)
        
        # Saving
        self.text_area.bind('<KeyRelease>', self.handle_input)
        
        # Context Menu
        self.menu = tk.Menu(self, tearoff=0)
        self.menu.add_command(label="Yellow", command=lambda: self.change_color('#fef3c7'))
        self.menu.add_command(label="Blue", command=lambda: self.change_color('#dbeafe'))
        self.menu.add_command(label="Green", command=lambda: self.change_color('#dcfce7'))
        self.menu.add_command(label="Pink", command=lambda: self.change_color('#fce7f3'))
        self.menu.add_separator()
        self.menu.add_command(label="Delete Note", command=lambda: self.on_delete(self.note.id))
        
        self.text_area.bind('<Button-3>', self.show_menu)

    def start_move(self, event):
        self.offset_x = event.x
        self.offset_y = event.y

    def do_move(self, event):
        x = self.winfo_pointerx() - self.offset_x
        y = self.winfo_pointery() - self.offset_y
        self.geometry(f"+{x}+{y}")
        self.note.x = x
        self.note.y = y
        self.on_save()

    def start_resize(self, event):
        self.resize_start_x = event.x_root
        self.resize_start_y = event.y_root
        self.start_w = self.winfo_width()
        self.start_h = self.winfo_height()

    def do_resize(self, event):
        dx = event.x_root - self.resize_start_x
        dy = event.y_root - self.resize_start_y
        w = max(150, self.start_w + dx)
        h = max(100, self.start_h + dy)
        self.geometry(f"{w}x{h}")
        self.note.width = w
        self.note.height = h
        self.on_save()

    def handle_input(self, event):
        self.note.content = self.text_area.get('1.0', 'end-1c')
        self.on_save()

    def close_note(self):
        # Just close this window, data persists
        self.destroy()

    def change_color(self, color):
        self.note.color = color
        self.configure(bg=color)
        self.text_area.configure(bg=color)
        self.grip.configure(bg=color)
        self.toolbar.configure(bg=self.darken(color))
        # Update buttons
        opts = {'bg': self.darken(color), 'activebackground': color}
        self.btn_close.configure(**opts)
        self.btn_add.configure(**opts)
        self.on_save()
        
    def show_menu(self, event):
        self.menu.post(event.x_root, event.y_root)

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.withdraw() # Hide main window (we only want stickies)
        self.notes = []
        self.windows = {}
        self.load_data()
        
        if not self.notes:
            self.create_note()
            
        print("NoteMinder Local Running...")

    def load_data(self):
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r') as f:
                    data = json.load(f)
                    self.notes = [Note.from_dict(n) for n in data]
                    for note in self.notes:
                        self.open_note(note)
            except Exception as e:
                print(f"Error loading data: {e}")

    def save_data(self):
        data = [n.to_dict() for n in self.notes]
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f)

    def create_note(self):
        # Offset new note slightly from last
        last = self.notes[-1] if self.notes else None
        x, y = (last.x + 30, last.y + 30) if last else (100, 100)
        
        note = Note(x=x, y=y)
        self.notes.append(note)
        self.save_data()
        self.open_note(note)

    def open_note(self, note):
        if note.id in self.windows:
            return
        # Pass callbacks
        win = StickyWindow(self, note, self.save_data, self.delete_note)
        self.windows[note.id] = win

    def delete_note(self, note_id):
        if note_id in self.windows:
            self.windows[note_id].destroy()
            del self.windows[note_id]
        
        self.notes = [n for n in self.notes if n.id != note_id]
        self.save_data()
        
        if not self.notes:
            # If all notes deleted, create a new blank one so app doesn't disappear
            self.create_note()

if __name__ == "__main__":
    app = App()
    app.mainloop()
`;
