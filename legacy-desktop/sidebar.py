import customtkinter as ctk
from ui_bridge import UIBridge
from PIL import Image
import os

class Sidebar(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        
        self.configure(fg_color="#1a1c1e")
        
        # Caricamento Icone Premium
        self.folder_icon = ctk.CTkImage(light_image=Image.open("assets/folder.png"), 
                                      dark_image=Image.open("assets/folder.png"), size=(18, 18))
        self.doc_icon = ctk.CTkImage(light_image=Image.open("assets/document.png"), 
                                    dark_image=Image.open("assets/document.png"), size=(18, 18))
        
        # --- SEZIONE MANUSCRIPT ---
        self.create_header("PROJECT STRUCTURE")
        self.create_subheader("MANUSCRIPT")
        
        self.manuscript_frame = ctk.CTkScrollableFrame(self, fg_color="transparent", height=250)
        self.manuscript_frame.pack(fill="x", padx=5, pady=0)
        self.load_manuscript()

        # --- SEZIONE CHARACTERS ---
        self.create_subheader("CHARACTERS")
        self.char_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.char_frame.pack(fill="x", padx=20, pady=5)
        self.add_item(self.char_frame, "Elara Vance", "👤")
        self.add_item(self.char_frame, "Kaelen Croft", "👤")

        # --- SEZIONE LOCATIONS ---
        self.create_subheader("LOCATIONS")
        self.loc_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.loc_frame.pack(fill="x", padx=20, pady=5)
        self.add_item(self.loc_frame, "Aethel Tower", "📍")
        
        # --- SEZIONE NOTES ---
        self.create_subheader("NOTES")
        self.notes_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.notes_frame.pack(fill="x", padx=20, pady=5)
        self.create_note_row(self.notes_frame, "Plot Density", 0.2)
        self.create_note_row(self.notes_frame, "Timeline", 0.1)

    def create_header(self, text):
        lbl = ctk.CTkLabel(self, text=text, font=ctk.CTkFont(size=13, weight="bold"), text_color="#d1d1d1")
        lbl.pack(pady=(20, 5), padx=20, anchor="w")

    def create_subheader(self, text):
        lbl = ctk.CTkLabel(self, text=text, font=ctk.CTkFont(size=11, weight="bold"), text_color="#2eb0a3")
        lbl.pack(pady=(10, 2), padx=20, anchor="w")

    def load_manuscript(self):
        chapters = UIBridge.fetch_chapters()
        for chapter in chapters:
            btn = ctk.CTkButton(
                self.manuscript_frame, 
                text=f"  {chapter}", 
                image=self.folder_icon,
                anchor="w", 
                fg_color="transparent", 
                text_color="#d1d1d1",
                hover_color="#2b2d30",
                height=32,
                corner_radius=6
            )
            btn.pack(fill="x", padx=10, pady=2)

    def add_item(self, master, text, icon_str):
        lbl = ctk.CTkLabel(master, text=f"{icon_str}  {text}", font=ctk.CTkFont(size=12), text_color="#d1d1d1")
        lbl.pack(pady=2, anchor="w")

    def create_note_row(self, master, text, val):
        row = ctk.CTkFrame(master, fg_color="transparent")
        row.pack(fill="x", pady=2)
        lbl = ctk.CTkLabel(row, text=text, font=ctk.CTkFont(size=10), text_color="#888888", width=80, anchor="w")
        lbl.pack(side="left")
        bar = ctk.CTkProgressBar(row, progress_color="#2eb0a3", height=4, width=80)
        bar.set(val)
        bar.pack(side="left", padx=5)
