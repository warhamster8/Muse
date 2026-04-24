export interface AISuggestion {
  original: string;
  suggestion: string;
  reason: string;
  category: string;
}

export function parseAIAnalysis(text: string): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const lines = text.split('\n');
  
  let currentSuggestion: Partial<AISuggestion> | null = null;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // Detection patterns matching StructuredOutput.tsx logic
    if (/❌/.test(trimmedLine)) {
      if (currentSuggestion?.original && currentSuggestion?.suggestion) {
        suggestions.push(currentSuggestion as AISuggestion);
      }
      const cleanOriginal = trimmedLine
        .replace(/.*❌\s*(?:TESTO\s*ORIGINALE\s*(?:ESATTO)?:?)?\s*/i, '')
        .replace(/\*\*/g, '')
        .replace(/^["“”«»]+|["“”«»]+$/g, '')
        .trim();
      currentSuggestion = { original: cleanOriginal };
    } else if (/✅/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.suggestion = trimmedLine
          .replace(/.*✅\s*(?:NUOVA\s*VERSIONE\s*(?:SUGGERITA)?:?)?\s*/i, '')
          .replace(/\*\*/g, '')
          .replace(/^["“”«»]+|["“”«»]+$/g, '')
          .trim();
      }
    } else if (/💡/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.reason = trimmedLine.replace(/.*💡\s*(?:NOTA\s*EDITORIALE:?)?\s*/i, '').trim();
      }
    } else if (/🏷️/.test(trimmedLine)) {
      if (currentSuggestion) {
        currentSuggestion.category = trimmedLine.replace(/.*🏷️\s*(?:CATEGORIA:?)?\s*/i, '').trim();
      }
    } else if (currentSuggestion && !trimmedLine.includes('❌') && !trimmedLine.includes('✅')) {
      // Append multi-line text if it's continuing the original or suggestion
      if (currentSuggestion.original && !currentSuggestion.suggestion) {
        currentSuggestion.original += ' ' + trimmedLine;
      } else if (currentSuggestion.suggestion) {
        currentSuggestion.suggestion += ' ' + trimmedLine;
      }
    }
  });

  // Push last one
  const final: any = currentSuggestion;
  if (final && final.original && final.suggestion) {
    suggestions.push(final as AISuggestion);
  }

  return suggestions;
}
