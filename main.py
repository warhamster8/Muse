import customtkinter as ctk
from sidebar import Sidebar
from editor import Editor
from ai_panel import AIPanel

class NovaMuseApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("NovaMuse - Professional Writing Environment")
        self.geometry("1400x900")
        
        # Imposta il tema scuro (senza file JSON esterno per evitare errori)
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue") # Tema base sicuro
        
        # Configurazione della griglia principale (3 colonne)
        # Colonna 0: Sidebar (larghezza fissa)
        # Colonna 1: Editor (espandibile)
        # Colonna 2: AI Panel (larghezza fissa)
        self.grid_columnconfigure(0, weight=0)
        self.grid_columnconfigure(1, weight=1)
        self.grid_columnconfigure(2, weight=0)
        self.grid_rowconfigure(0, weight=1)

        # Inizializzazione dei componenti (verranno implementati nei prossimi passi)
        self.sidebar = Sidebar(self, width=250)
        self.sidebar.grid(row=0, column=0, sticky="nsew", padx=0, pady=0)

        self.editor = Editor(self)
        self.editor.grid(row=0, column=1, sticky="nsew", padx=0, pady=0)

        self.ai_panel = AIPanel(self, width=300)
        self.ai_panel.grid(row=0, column=2, sticky="nsew", padx=0, pady=0)

        # Avvio del thread di Autosave (Phase 5)
        self.autosave_enabled = True
        self.start_autosave_thread()

    def start_autosave_thread(self):
        import threading
        import time
        from ui_bridge import UIBridge

        def autosave_loop():
            while self.autosave_enabled:
                time.sleep(30) # Salva ogni 30 secondi
                content = self.editor.get_text()
                UIBridge.save_content(content, "Autosave_Current")
        
        thread = threading.Thread(target=autosave_loop, daemon=True)
        thread.start()

if __name__ == "__main__":
    app = NovaMuseApp()
    app.mainloop()
