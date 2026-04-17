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
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey('suggestionHighlight'),
        props: {
          decorations(state) {
            const { suggestions } = extension.options;
            if (!suggestions || suggestions.length === 0) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];
            const { doc } = state;


            doc.descendants((node, pos) => {
              if (node.isText) {
                const text = node.text || '';
                
                suggestions.forEach((suggestion) => {
                  if (!suggestion || suggestion.length < 3) return;

                  // Create a regex that searches the RAW text but is flexible with spaces/quotes
                  // Normalize parts of the suggestion
                  const cleanSuggestion = suggestion
                    .replace(/[\u201C\u201D\u201E\u201F«»]/g, '["“«»”]')
                    .replace(/[\u2018\u2019\u201A\u201B']/g, "['’]")
                    .replace(/[\u2013\u2014-]/g, '[-—–]')
                    .replace(/\s+/g, '[\\s\\u00A0]+');

                  const parts = cleanSuggestion.split(/\.\.\.|…/);
                  const gapPattern = '[\\s\\W]*';
                  
                  // Build a regex that matches the suggestion even with formatting or quote variations
                  const regexStr = parts.map(part => {
                      // Break into words/tokens to allow flexible gaps
                      const tokens = part.match(/[a-zA-Z0-9àèìòùÀÈÌÒÙáéíóúÁÉÍÓÚ]+|[^\s\w]/g) || [];
                      return tokens.map(t => {
                          // If it's a word, match it literally (already escaped or normalized)
                          // If it's a special quote/char already handled by our normalization above, keep it
                          return t;
                      }).join(gapPattern);
                  }).filter(p => p).join('(?:.|\\n){0,150}?');

                  if (regexStr) {
                    try {
                      // We search in the RAW text (node.text)
                      const regex = new RegExp(regexStr, 'gi');
                      let match;

                      while ((match = regex.exec(text)) !== null) {
                        if (match[0].length === 0) {
                          regex.lastIndex++;
                          continue;
                        }
                        
                        const start = pos + match.index;
                        const end = start + match[0].length;

                        decorations.push(
                          Decoration.inline(start, end, {
                            class: 'suggestion-highlight-pulse',
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
        },
      }),
    ];
  },
});
