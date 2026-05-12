import customtkinter as ctk

class Editor(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        
        self.configure(fg_color="#1e1e1e") # Leggermente più chiaro della sidebar
        
        # Titolo del capitolo nell'editor
        self.header_label = ctk.CTkLabel(
            self, 
            text="Chapter 1: The Obsidian Keep", 
            font=ctk.CTkFont(family="Inter", size=24, weight="bold"),
            text_color="#ffffff"
        )
        self.header_label.pack(pady=(50, 20))
        
        # Widget Textbox per l'editor
        # Usiamo padx e pady elevati per l'effetto "foglio" centrale
        self.textbox = ctk.CTkTextbox(
            self, 
            font=ctk.CTkFont(family="Inter", size=16),
            fg_color="#1e1e1e",
            text_color="#d1d1d1",
            border_width=0,
            padx=50,
            pady=50,
            wrap="word"
        )
        self.textbox.pack(fill="both", expand=True, padx=100, pady=(0, 20))
        
        # Toolbar inferiore
        self.toolbar = ctk.CTkFrame(self, fg_color="transparent")
        self.toolbar.pack(fill="x", padx=100, pady=(0, 20))
        
        # Word count
        self.word_count = ctk.CTkLabel(self.toolbar, text="3,450 words", font=ctk.CTkFont(size=12), text_color="#888888")
        self.word_count.pack(side="left", padx=10)
        
        # Pulsanti formattazione (Simulati)
        self.format_frame = ctk.CTkFrame(self.toolbar, fg_color="transparent")
        self.format_frame.pack(side="left", expand=True)
        
        for icon in ["B", "I", "U"]:
            btn = ctk.CTkButton(self.format_frame, text=icon, width=30, height=30, fg_color="transparent", border_width=1, border_color="#3f3f3f")
            btn.pack(side="left", padx=2)
            
        # Autosave Toggle
        self.autosave_lbl = ctk.CTkLabel(self.toolbar, text="Autosave", font=ctk.CTkFont(size=12), text_color="#888888")
        self.autosave_lbl.pack(side="right", padx=(0, 5))
        self.autosave_switch = ctk.CTkSwitch(self.toolbar, text="", progress_color="#2eb0a3", width=40)
        self.autosave_switch.select()
        self.autosave_switch.pack(side="right", padx=10)

        # Placeholder text
        self.textbox.insert("0.0", "The heavy iron gates creaked, forcing the ancient mechanism to scream...")

    def get_text(self):
        return self.textbox.get("1.0", "end-1c")
