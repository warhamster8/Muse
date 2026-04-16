import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export interface SuggestionHighlightOptions {
  suggestions: string[];
}

export const SuggestionHighlight = Extension.create<SuggestionHighlightOptions>({
  name: 'suggestionHighlight',

  addOptions() {
    return {
      suggestions: [],
    };
  },

  addProseMirrorPlugins() {
    const { suggestions } = this.options;

    return [
      new Plugin({
        key: new PluginKey('suggestionHighlight'),
        state: {
          init(_, { doc }) {
            const decorations: Decoration[] = [];
            
            if (!suggestions || suggestions.length === 0) {
              return DecorationSet.empty;
            }

            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text || '';
                
                // Normalizziamo il testo del nodo (come in AISidekick)
                const normalizeIt = (str: string) => str
                    .replace(/[\u201C\u201D]/g, '"')
                    .replace(/[\u2018\u2019]/g, "'")
                    .replace(/E['’]/g, 'È')
                    .replace(/\u00A0/g, ' ')
                    .trim();
                const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                
                const searchNodeText = removeAccents(normalizeIt(text));

                suggestions.forEach((suggestion) => {
                  const searchSuggestion = removeAccents(normalizeIt(suggestion));
                  
                  // Regex flessibile come in AISidekick
                  const gapPattern = '[^a-zA-Z0-9]*';
                  const parts = searchSuggestion.split(/\.\.\.|…/);
                  let regexStr = parts.map(part => {
                      const words = part.match(/[a-zA-Z0-9]+/g) || [];
                      return words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join(gapPattern);
                  }).filter(p => p).join('(?:.|\\n){0,150}?');

                  if (regexStr) {
                    try {
                      const regex = new RegExp(regexStr, 'gi');
                      let match;

                      while ((match = regex.exec(searchNodeText)) !== null) {
                        // Prevent infinite loop on zero-length matches
                        if (match[0].length === 0) {
                          regex.lastIndex++;
                          continue;
                        }
                        
                        const startObj = match.index;
                        const endObj = startObj + match[0].length;

                        // Per mappare l'indice del testo pulito al testo originale è complesso se modifichiamo molto
                        // Qui assumiamo che il testo non abbia cambiato troppo dimensione. 
                        // Per una corrispondenza esatta servirebbe la mappa come in AISidekick.
                        
                        decorations.push(
                          Decoration.inline(pos + startObj, pos + endObj, {
                            class: 'suggestion-highlight',
                          })
                        );
                      }
                    } catch (e) {
                       // ignore invalid regex
                    }
                  }
                });
              }
            });

            return DecorationSet.create(doc, decorations);
          },
          apply(tr, oldState) {
            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
