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
        self.add_suggestion(self.sug_box, '"Introduce an obstacle?"')
        self.add_suggestion(self.sug_box, '"Enhance Elara\'s conflict"')
        
        # --- CHARACTER INSIGHTS ---
        self.char_box = self.create_section_frame("CHARACTER INSIGHTS")
        self.insight_lbl = ctk.CTkLabel(self.char_box, text="Analyze: Elara Vance\nView traits/arc", font=ctk.CTkFont(size=11), text_color="#d1d1d1", justify="left")
        self.insight_lbl.pack(pady=10, padx=10, anchor="w")
        self.insight_btn = ctk.CTkButton(self.char_box, text="View Insights", fg_color="transparent", border_width=1, border_color="#3f3f3f", height=25)
        self.insight_btn.pack(fill="x", padx=10, pady=5)

        # --- SCENE NOTES ---
        self.notes_box = self.create_section_frame("SCENE NOTES")
        self.scene_info = ctk.CTkLabel(self.notes_box, text="Atmosphere: Tense\nGoal: Uncover the secret", font=ctk.CTkFont(size=11), text_color="#d1d1d1", justify="left")
        self.scene_info.pack(pady=10, padx=10, anchor="w")

    def create_section_frame(self, title):
        frame = ctk.CTkFrame(self, fg_color="#252729", corner_radius=10)
        frame.pack(fill="x", padx=15, pady=10)
        
        lbl = ctk.CTkLabel(frame, text=title, font=ctk.CTkFont(size=10, weight="bold"), text_color="#888888")
        lbl.pack(pady=(10, 0), padx=15, anchor="w")
        return frame

    def add_suggestion(self, master, text):
        btn = ctk.CTkButton(master, text=text, fg_color="transparent", border_width=1, border_color="#3f3f3f", anchor="w", font=ctk.CTkFont(size=11))
        btn.pack(fill="x", padx=10, pady=5)
