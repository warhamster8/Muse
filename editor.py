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
        self.textbox.pack(fill="both", expand=True, padx=100, pady=(0, 50))
        
        # Placeholder text
        self.textbox.insert("0.0", "The heavy iron gates creaked, forcing the ancient mechanism to scream...")

    def get_text(self):
        return self.textbox.get("1.0", "end-1c")
