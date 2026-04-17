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

            const { doc } = state;
            const decorations: Decoration[] = [];

            // 1. Build a flat text representation of the document with position mapping
            // This allows us to find matches that span across multiple nodes/formatting.
            let fullText = '';
            const posMap: number[] = [];

            doc.descendants((node, pos) => {
              if (node.isText) {
                const nodeText = node.text || '';
                for (let i = 0; i < nodeText.length; i++) {
                  fullText += nodeText[i];
                  posMap.push(pos + i);
                }
              } else if (node.isBlock && fullText.length > 0 && !fullText.endsWith('\n')) {
                // Add a newline for block boundaries to keep text distinct
                fullText += '\n';
                posMap.push(pos);
              }
            });

            const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const cleanFullText = removeAccents(fullText);

            suggestions.forEach((suggestion) => {
              if (!suggestion || suggestion.trim().length < 3) return;

              // 2. Build a Word-Only Fuzzy Regex
              // We split the suggestion into words and join them with a wildcard pattern
              // that matches any punctuation, spaces, or newlines.
              const cleanSuggestion = removeAccents(suggestion);
              const parts = cleanSuggestion.split(/\.\.\.|…/);
              
              const regexStr = parts.map(part => {
                  const words = part.match(/[a-zA-Z0-9àèìòùÀÈÌÒÙáéíóúÁÉÍÓÚ]+/g) || [];
                  if (words.length === 0) return '';
                  return words.map(w => escapeRegex(w)).join('[\\s\\W\\n]+');
              }).filter(p => p).join('(?:.|\\n){0,300}?');

              if (!regexStr) return;

              try {
                const regex = new RegExp(regexStr, 'gi');
                let match;

                while ((match = regex.exec(cleanFullText)) !== null) {
                  const matchText = match[0];
                  if (matchText.length === 0) {
                    regex.lastIndex++;
                    continue;
                  }

                  const startIdx = match.index;
                  const endIdx = startIdx + matchText.length;

                  // 3. Map flat text indices back to ProseMirror positions
                  const startPos = posMap[startIdx];
                  // endPos is the position of the last character + 1
                  const lastCharPos = posMap[endIdx - 1];
                  const endPos = lastCharPos + 1;

                  if (startPos !== undefined && endPos !== undefined) {
                    decorations.push(
                      Decoration.inline(startPos, endPos, {
                        class: 'suggestion-highlight-pulse',
                      })
                    );
                  }
                }
              } catch (e) {
                // Ignore invalid regex issues
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
