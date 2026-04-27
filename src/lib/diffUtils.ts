
export interface DiffPart {
  value: string;
  added?: boolean;
  removed?: boolean;
}

/**
 * Utility per calcolare un semplice diff a livello di parole tra due stringhe.
 */
export function diffWords(oldStr: string, newStr: string): DiffPart[] {
  const oldWords = oldStr.split(/(\s+)/);
  const newWords = newStr.split(/(\s+)/);
  
  const result: DiffPart[] = [];
  
  // Semplice algoritmo di diffing (per performance e brevità)
  // In un caso reale si userebbe una libreria come 'diff'
  let i = 0, j = 0;
  
  while (i < oldWords.length || j < newWords.length) {
    if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
      result.push({ value: oldWords[i] });
      i++;
      j++;
    } else {
      // Trovata differenza
      if (i < oldWords.length && !newWords.includes(oldWords[i])) {
        result.push({ value: oldWords[i], removed: true });
        i++;
      } else if (j < newWords.length) {
        result.push({ value: newWords[j], added: true });
        j++;
      } else if (i < oldWords.length) {
        result.push({ value: oldWords[i], removed: true });
        i++;
      }
    }
  }
  
  return result;
}
