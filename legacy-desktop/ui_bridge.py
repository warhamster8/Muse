import muse_logic

class UIBridge:
    """
    Bridge Modulare per collegare la UI alla logica di business.
    Protegge il codice originale e gestisce le chiamate asincrone.
    """
    
    @staticmethod
    def save_content(text, chapter_name):
        # Il ponte chiama la funzione originale
        return muse_logic.salva_romanzo(text, chapter_name)

    @staticmethod
    def fetch_chapters():
        return muse_logic.carica_capitoli()

    @staticmethod
    def request_ai_help(prompt):
        return muse_logic.get_ai_suggestions(prompt)
