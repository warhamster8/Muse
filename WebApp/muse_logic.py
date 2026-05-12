import os
import threading
import time

def salva_romanzo(testo, capitolo="Capitolo 1"):
    """
    Funzione originale per il salvataggio del romanzo.
    Simula il salvataggio su disco o database.
    """
    print(f"DEBUG: Salvataggio in corso di '{capitolo}'...")
    # Qui andrebbe la logica di salvataggio (es. scrittura su file o Supabase)
    with open(f"backup_{capitolo.replace(' ', '_')}.txt", "w", encoding="utf-8") as f:
        f.write(testo)
    print(f"DEBUG: '{capitolo}' salvato con successo.")
    return True

def carica_capitoli():
    """
    Simula il caricamento della lista dei capitoli.
    """
    return ["Prologue", "Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Events"]

def get_ai_suggestions(prompt):
    """
    Simula una chiamata all'IA per suggerimenti.
    """
    time.sleep(1) # Simula latenza
    return f"Suggerimento basato su: {prompt}\n- Aggiungi più tensione alla scena.\n- Esplora il monologo interiore del protagonista."
