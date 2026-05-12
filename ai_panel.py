import customtkinter as ctk

class AIPanel(ctk.CTkFrame):
    def __init__(self, master, **kwargs):
        super().__init__(master, **kwargs)
        
        self.configure(fg_color="#1a1c1e")
        
        # Titolo della sezione
        self.title_label = ctk.CTkLabel(self, text="AI WRITING COMPANION", font=ctk.CTkFont(size=14, weight="bold"), text_color="#d1d1d1")
        self.title_label.pack(pady=(20, 10), padx=20, anchor="w")
        
        # --- AI ASSISTANT SECTION ---
        self.ai_box = self.create_section_frame("AI ASSISTANT")
        
        self.ai_input = ctk.CTkEntry(self.ai_box, placeholder_text="Type a prompt...", fg_color="#2b2d30", border_width=0)
        self.ai_input.pack(fill="x", padx=10, pady=10)
        
        self.gen_btn = ctk.CTkButton(self.ai_box, text="Generate [Prompt]", fg_color="#2eb0a3", hover_color="#248f84")
        self.gen_btn.pack(fill="x", padx=10, pady=5)
        
        # --- SUGGESTIONS SECTION ---
        self.sug_box = self.create_section_frame("SUGGESTIONS")
        self.sug_label = ctk.CTkLabel(self.sug_box, text='"Introduce an obstacle?"', font=ctk.CTkFont(slant="italic"), text_color="#d1d1d1")
        self.sug_label.pack(pady=10)
        
        # --- STATS SECTION ---
        self.stats_box = self.create_section_frame("PROGRESS")
        
        # Progress Bar 1
        self.create_stat_row(self.stats_box, "Plot Density", 0.7)
        self.create_stat_row(self.stats_box, "Character Arc", 0.4)

    def create_section_frame(self, title):
        frame = ctk.CTkFrame(self, fg_color="#252729", corner_radius=10)
        frame.pack(fill="x", padx=15, pady=10)
        
        lbl = ctk.CTkLabel(frame, text=title, font=ctk.CTkFont(size=10, weight="bold"), text_color="#888888")
        lbl.pack(pady=(10, 0), padx=15, anchor="w")
        return frame

    def create_stat_row(self, master, text, val):
        row = ctk.CTkFrame(master, fg_color="transparent")
        row.pack(fill="x", padx=10, pady=5)
        
        lbl = ctk.CTkLabel(row, text=text, font=ctk.CTkFont(size=11), text_color="#d1d1d1")
        lbl.pack(side="left", padx=5)
        
        bar = ctk.CTkProgressBar(row, progress_color="#2eb0a3", height=8)
        bar.set(val)
        bar.pack(side="right", fill="x", expand=True, padx=5)
