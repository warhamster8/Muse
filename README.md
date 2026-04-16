# Project Muse 🖋️✨

![Project Muse Hero](public/readme-hero.png)

> **The Architectural Hub for Creative Writers.**  
> **L'Architetto Narrativo per la Scrittura Creativa.**

---

## 🇮🇹 Introduzione
**Project Muse** è un'applicazione web modulare progettata per scrittori che desiderano unire l'arte della narrazione alla potenza dell'Intelligenza Artificiale. Non è un semplice editor di testo, ma un ecosistema completo per pianificare, scrivere e analizzare le tue storie.

## 🇬🇧 Introduction
**Project Muse** is a modular web application designed for writers who want to blend the art of storytelling with the power of Artificial Intelligence. It’s not just a text editor, but a complete ecosystem for planning, writing, and analyzing your stories.

---

## ✨ Caratteristiche / Key Features

### 📖 Narrativa / Narrative 
- **Editor Tiptap Avanzato**: Scrittura immersiva con supporto per scene e capitoli.
- **Integrazione Personaggi**: Richiama i dettagli dei tuoi personaggi direttamente nell'editor.
- **Advanced Tiptap Editor**: Immersive writing with support for scenes and chapters.
- **Character Integration**: Access character details directly within the editor.

### 👥 Personaggi & Mondo / Characters & World
- **Profili Dettagliati**: Gestisci motivazioni, tratti e archi narrativi dei personaggi.
- **World-Building**: Organizza i luoghi, la magia, la tecnologia e il lore del tuo universo.
- **Detailed Profiles**: Manage character motivations, traits, and narrative arcs.
- **World-Building**: Organize locations, magic, technology, and the lore of your universe.

### 🧠 AI Sidekick (Powered by Groq & Gemini Flash)
- **Multi-Provider**: Scegli tra la velocità di **Groq (Llama 3.3)** e l'immensa memoria di **Gemini 1.5 Flash**.
- **Revisione Intelligente**: Proposte di modifica chirurgiche per migliorare ritmo e stile.
- **Context Awareness**: Grazie a Gemini, Muse può analizzare interi romanzi (fino a 1M+ token) senza perdere il filo.
- **Braindump**: Trasforma pensieri sparsi in bozze narrative strutturate.
- **Transformer**: Riscrivi scene in diversi stili (Viscerale, Atmosferico, Psicologico).
- **Lessico**: Trova sinonimi ricercati e metafore originali.
- **Multi-Provider**: Choose between the raw speed of **Groq (Llama 3.3)** and the massive memory of **Gemini 1.5 Flash**.
- **Smart Revision**: Surgical editing suggestions to improve rhythm and style.
- **Long Context**: With Gemini, Muse can analyze entire novels (up to 1M+ tokens) with perfect memory.
- **Transformer**: Rewrite scenes in different styles (Visceral, Atmospheric, Psychological).

### 📊 Note & Analisi / Notes & Analysis
- **Mappe Mentali**: Collega idee e scene visivamente usando diagrammi di flusso.
- **Analisi Statistica**: Monitora la complessità del testo, i tempi di lettura e molto altro.
- **Mind Maps**: Connect ideas and scenes visually using flowcharts.
- **Statistical Analysis**: Monitor text complexity, reading times, and much more.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **Backend / DB**: [Supabase](https://supabase.com/)
- **AI Engines**: [Groq SDK](https://groq.com/), [Google Gemini Flash SDK](https://ai.google.dev/)
- **Editor**: [Tiptap](https://tiptap.dev/)
- **Visuals**: [XY Flow](https://reactflow.dev/) (Notes), [Recharts](https://recharts.org/) (Analysis)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)

---

## 🚀 Setup & Installazione / Setup & Installation

### Prerequisiti / Prerequisites
- Node.js (v18+)
- Account Supabase & API Key (Groq e/o Gemini)

### Installazione / Getting Started

1. **Clona il repository / Clone the repo**:
   ```bash
   git clone https://github.com/your-username/Muse.git
   cd Muse
   ```

2. **Installa le dipendenze / Install dependencies**:
   ```bash
   npm install
   ```

3. **Variabili d'ambiente / Environment Variables**:
   Crea un file `.env` basato su `.env.example`:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   VITE_GROQ_API_KEY=your_groq_key (Opzionale se usi Gemini)
   ```

4. **Configurazione Gemini (Sicurezza)**:
   Per Gemini, non inserire la chiave nel file `.env`. Accedi alla tua dashboard Supabase ed esegui il comando SQL per salvare la chiave nella tabella `user_profiles`. Questo garantisce che la chiave rimanga privata e non venga inclusa nel bundle del browser.

5. **Avvia in locale / Run locally**:
   ```bash
   npm run dev
   ```

---

## 📄 Licenza / License
Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.
Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Creato con ❤️ per gli scrittori di tutto il mondo. <br/>
  Made with ❤️ for writers everywhere.
</p>
