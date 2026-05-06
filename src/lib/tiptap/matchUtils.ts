import { Node as ProsemirrorNode } from '@tiptap/pm/model';

interface MatchResult {
  from: number;
  to: number;
}

/**
 * Finds matches of a query string within a document text using a robust index-mapping strategy
 */
/**
 * Finds matches of a query string within a document text using a robust index-mapping strategy
 */
export const findMatchInText = (fullText: string, query: string): { start: number; end: number }[] => {
  if (!query || query.trim().length < 1) return [];

  const normalizedQuery = query.toLowerCase().replace(/\s+/g, ' ');
  if (!normalizedQuery.trim()) return [];

  // Strategy: Try strict match first, then relaxed
  const words = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(/\s+/).filter(w => w.length > 0);
  
  const tryRegex = (separator: string) => {
    const regexStr = words.join(separator);
    const results: { start: number; end: number }[] = [];
    try {
      const regex = new RegExp(regexStr, 'gi');
      let match;
      const normalizedFullText = fullText.toLowerCase();
      while ((match = regex.exec(normalizedFullText)) !== null) {
        results.push({
          start: match.index,
          end: match.index + match[0].length
        });
        if (match.index === regex.lastIndex) regex.lastIndex++;
      }
    } catch (e) {}
    return results;
  };

  const strictMatches = tryRegex('\\s+');
  if (strictMatches.length > 0) return strictMatches;

  return tryRegex('[\\s\\p{P}\\p{S}]+');
};

/**
 * Builds a flat text representation of a Prosemirror document with a map back to PM positions efficiently
 */
export const getDocTextAndMap = (doc: ProsemirrorNode): { fullText: string, posMap: number[] } => {
  const textChunks: string[] = [];
  const posMap: number[] = [];

  doc.descendants((node, pos) => {
    if (node.isText) {
      const nodeText = node.text || '';
      textChunks.push(nodeText);
      for (let i = 0; i < nodeText.length; i++) {
        posMap.push(pos + i);
      }
    } else if (node.isBlock && textChunks.length > 0 && !textChunks[textChunks.length - 1].endsWith('\n')) {
      textChunks.push('\n');
      posMap.push(pos);
    }
  });

  return {
    fullText: textChunks.join(''),
    posMap
  };
};

/**
 * Finds matches of a query string within a Prosemirror document
 */
export const findMatchesInDoc = (doc: ProsemirrorNode, suggestion: string): MatchResult[] => {
  if (!suggestion || suggestion.trim().length < 1) return [];

  const { fullText, posMap } = getDocTextAndMap(doc);
  const matches = findMatchInText(fullText, suggestion);
  
  return matches.map(match => {
    let startPM = posMap[match.start];
    let endPM = posMap[match.end - 1] + 1;

    // Critical fix: If the match ends with a block separator (\n) that wasn't in the query,
    // we must shrink the range to avoid merging paragraphs.
    if (fullText[match.end - 1] === '\n' && !suggestion.endsWith('\n')) {
      endPM = posMap[match.end - 1]; // Move back to before the block boundary
    }
    
    // Similarly for the start
    if (fullText[match.start] === '\n' && !suggestion.startsWith('\n')) {
      startPM = posMap[match.start] + 1;
    }

    return { from: startPM, to: endPM };
  }).filter(m => m.from !== undefined && m.to !== undefined);
};

/**
 * Optimized version: Finds matches for multiple suggestions in a single pass
 */
export const findManyMatchesInDoc = (doc: ProsemirrorNode, suggestions: string[]): MatchResult[][] => {
  if (!suggestions || suggestions.length === 0) return suggestions.map(() => []);

  const { fullText, posMap } = getDocTextAndMap(doc);
  
    return suggestions.map(sug => {
      if (!sug || sug.trim().length < 1) return [];
      const matches = findMatchInText(fullText, sug);
      return matches.map(match => {
        if (match.start < 0 || match.end > fullText.length) return null;
        
        let startPM = posMap[match.start];
        let endPM = (posMap[match.end - 1] ?? startPM) + 1;

        // Critical fix: prevent paragraph merging
        if (fullText[match.end - 1] === '\n' && !sug.endsWith('\n')) {
          endPM = posMap[match.end - 1];
        }
        if (fullText[match.start] === '\n' && !sug.startsWith('\n')) {
          startPM = posMap[match.start] + 1;
        }

        return { from: startPM, to: endPM };
      }).filter((m): m is MatchResult => m !== null && m.from !== undefined && m.to !== undefined);
    });
};
