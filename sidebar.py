import customtkinter as ctk
from ui_bridge import UIBridge

class Sidebar(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        
        # Colore di sfondo scuro come da immagine
        self.configure(fg_color="#1a1c1e")
        
        # Titolo della sezione
        self.title_label = ctk.CTkLabel(self, text="PROJECT STRUCTURE", font=ctk.CTkFont(size=14, weight="bold"), text_color="#d1d1d1")
        self.title_label.pack(pady=(20, 10), padx=20, anchor="w")
        
        # Sottotitolo MANUSCRIPT
        self.manuscript_label = ctk.CTkLabel(self, text="MANUSCRIPT", font=ctk.CTkFont(size=12, weight="bold"), text_color="#2eb0a3")
        self.manuscript_label.pack(pady=(10, 5), padx=20, anchor="w")
        
        # Frame scrollabile per i capitoli
        self.scroll_frame = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        self.load_chapters()

    def load_chapters(self):
        chapters = UIBridge.fetch_chapters()
        for chapter in chapters:
            btn = ctk.CTkButton(
                self.scroll_frame, 
                text=f"  {chapter}", 
                anchor="w", 
                fg_color="transparent", 
                text_color="#d1d1d1",
                hover_color="#2eb0a3",
                height=35
            )
            btn.pack(fill="x", padx=10, pady=2)
