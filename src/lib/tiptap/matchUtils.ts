import { Node as ProsemirrorNode } from '@tiptap/pm/model';

export interface MatchResult {
  from: number;
  to: number;
}

/**
 * Normalizes a string for fuzzy matching (removes accents, normalizes quotes)
 */
export const normalizeForMatch = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u201C\u201D\u201E\u201F«»]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00A0/g, ' ');
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a fuzzy regex pattern from a query string
 */
export const buildFuzzyRegex = (query: string): string | null => {
  const cleanQuery = normalizeForMatch(query);
  const parts = cleanQuery.split(/\.\.\.|…/);
  
  const regexStr = parts.map(part => {
      // Focus on alphanumeric characters for the core words
      const words = part.match(/[a-zA-Z0-9àèìòùÀÈÌÒÙáéíóúÁÉÍÓÚ]+/g) || [];
      if (words.length === 0) return '';
      return words.map(w => escapeRegex(w)).join('[\\s\\W\\n]+');
  }).filter(p => p).join('(?:.|\\n){0,300}?');

  return regexStr || null;
};

/**
 * Finds matches of a query string within a document text using fuzzy matching
 */
export const findMatchInText = (fullText: string, query: string): { start: number; end: number } | null => {
  if (!query || query.trim().length < 3) return null;

  const cleanFullText = normalizeForMatch(fullText);
  const regexStr = buildFuzzyRegex(query);

  if (!regexStr) return null;

  try {
    const regex = new RegExp(regexStr, 'gi');
    const match = regex.exec(cleanFullText);
    
    if (match) {
      return {
        start: match.index,
        end: match.index + match[0].length
      };
    }
  } catch (e) {
    // Ignore invalid regex issues
  }

  return null;
};

/**
 * Finds matches of a query string within a Prosemirror document
 */
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

  const cleanFullText = normalizeForMatch(fullText);
  const regexStr = buildFuzzyRegex(suggestion);

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
