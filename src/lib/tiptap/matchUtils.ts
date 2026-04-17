import { Node as ProsemirrorNode } from '@tiptap/pm/model';

export interface MatchResult {
  from: number;
  to: number;
}

export const findMatchesInDoc = (doc: ProsemirrorNode, suggestion: string): MatchResult[] => {
  if (!suggestion || suggestion.trim().length < 3) return [];

  const matches: MatchResult[] = [];

  // 1. Build a flat text representation of the document with position mapping
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
      fullText += '\n';
      posMap.push(pos);
    }
  });

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const cleanFullText = removeAccents(fullText);
  const cleanSuggestion = removeAccents(suggestion);
  
  // 2. Build a Word-Only Fuzzy Regex
  const parts = cleanSuggestion.split(/\.\.\.|…/);
  
  const regexStr = parts.map(part => {
      const words = part.match(/[a-zA-Z0-9àèìòùÀÈÌÒÙáéíóúÁÉÍÓÚ]+/g) || [];
      if (words.length === 0) return '';
      return words.map(w => escapeRegex(w)).join('[\\s\\W\\n]+');
  }).filter(p => p).join('(?:.|\\n){0,300}?');

  if (!regexStr) return [];

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
      const lastCharPos = posMap[endIdx - 1];
      const endPos = lastCharPos + 1;

      if (startPos !== undefined && endPos !== undefined) {
        matches.push({ from: startPos, to: endPos });
      }
    }
  } catch (e) {
    // Ignore invalid regex issues
  }

  return matches;
};
