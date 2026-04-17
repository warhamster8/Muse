# Project Muse 🖋️✨

![Project Muse Hero](public/readme-hero.png)

> **The Elite Content Intelligence Dashboard for Creative Writers.**  
> **L'Ecosistema Analitico d'Elite per la Narrazione Professionale.**

---

## 💎 The "Creative Dashboard" Evolution (Concept 3)
Project Muse è stato recentemente evoluto in un **Dashboard Creativo professionale**, adottando il design system **Emerald/Slate**. Un'interfaccia ad alta densità informativa che unisce estetica cinematografica (glassmorphism) e rigore analitico.

Project Muse has evolved into a professional **Creative Dashboard**, adopting the **Emerald/Slate** design system. A high-density information interface blending cinematic aesthetics with analytical precision.

---

## ✨ Caratteristiche / Key Features

### 🖋️ Narrative Intelligence
- **Cinema-Grade Canvas**: Scrittura immersiva con navigatore strutturale integrato.
- **Narrative Archetypes**: Organizzazione per scene e capitoli con **reordering persistente** (Drag & Drop).
- **Immersive Narrative**: Clean, distraction-free editor with integrated structural navigator.

### 👤 Cinematic Characters
- **Identity Hub**: Gestione profili psicologici, motivazioni e archi evolutivi.
- **Interactive Portraits**: Visualizzazione in grande formato con **riposizionamento interattivo (X/Y)** per centrare perfettamente il soggetto.
- **Identity Management**: Advanced psychological profiles and character arc tracking.

### 🌍 World Hub & Analytical Lore
- **Smart Categorization**: Organizzazione del mondo in **Luoghi** e **Oggetti**.
- **Lore Analytics**: Griglia strutturata per la gestione granulare degli elementi narrativi.
- **Lore Management**: Structured grid for granular management of locations and artifacts.

### 🧠 AI Sidekick & Side-Dash (Groq, DeepSeek, Gemini)
- **DeepSeek V3 & Llama 3.3**: Sfrutta i modelli più veloci e intelligenti al mondo per la revisione.
- **Revisione Chirurgica**: Proposte di modifica su stile, ritmo e coerenza.
- **Style Modulation**: Trasforma il tono delle scene (Viscerale, Atmosferico, Psicologico).
- **AI-Powered Insights**: Surgical suggestions for style, pacing, and coherence.

---

## 🛠️ Tech Stack

- **Modern Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Advanced Styling**: [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS), [Framer Motion](https://www.framer.com/motion/)
- **Backend / Cloud**: [Supabase](https://supabase.com/)
- **AI Intelligence**: [Groq SDK](https://groq.com/), [DeepSeek API](https://deepseek.com/), [Gemini Flash SDK](https://ai.google.dev/)
- **Core Components**: [Tiptap](https://tiptap.dev/), [@hello-pangea/dnd](https://github.com/hello-pangea/dnd), [Zustand](https://github.com/pmndrs/zustand)

---

## 🚀 Setup & Installation

### Configurazione Database (SQL)
Esegui questo script in Supabase per le nuove funzionalità di posizionamento e categorizzazione:

```sql
-- Reordering e World Building
ALTER TABLE notes ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'location';

-- Image Centering Support
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS avatar_pos_x INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS avatar_pos_y INTEGER DEFAULT 50;
```

### Getting Started
1. `git clone https://github.com/your-username/Muse.git`
2. `npm install`
3. Configura `.env` con chiavi Supabase, Groq e DeepSeek.
4. `npm run dev`

---

## 📄 License
Distribuito sotto licenza MIT.

<p align="center">
  Creato per l'eccellenza narrativa. <br/>
  Crafted for storytelling excellence.
</p>
