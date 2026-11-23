import { ScriptToken, SectionHeader } from './prompterTypes';

export interface ParsedScript {
  tokens: ScriptToken[];
  sections: SectionHeader[];
  totalWordCount: number;
}

export function parseShoppableScript(rawText: string): ParsedScript {
  const lines = rawText.split('\n');
  const tokens: ScriptToken[] = [];
  const sections: SectionHeader[] = [];
  let currentWordIndex = 0;
  let currentSectionIndex = 0;

  // Regex to match stage cues like [SHOW_PRODUCT: Jacket], [PAUSE 2s], [CALL_TO_ACTION: Buy Now], etc.
  const cueRegex = /\[(SHOW_PRODUCT|PIN_PRODUCT|PAUSE|CALL_TO_ACTION|QUESTION|NOTE)(?:\s*:?\s*([^\]]*))?\]/i;

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      tokens.push({
        id: `break-${lineIdx}`,
        type: 'break',
        content: '\n\n',
      });
      return;
    }

    // Markdown Headings
    if (trimmed.startsWith('#')) {
      const headingText = trimmed.replace(/^#+\s*/, '');
      const section: SectionHeader = {
        id: `sec-${sections.length}`,
        title: headingText,
        tokenIndex: tokens.length,
        wordIndex: currentWordIndex,
      };
      sections.push(section);

      tokens.push({
        id: `head-${tokens.length}`,
        type: 'heading',
        content: headingText,
        sectionIndex: sections.length - 1,
      });
      currentSectionIndex = sections.length - 1;
      return;
    }

    let remainingLine = line;

    while (remainingLine.length > 0) {
      const cueMatch = remainingLine.match(cueRegex);

      if (cueMatch && cueMatch.index !== undefined) {
        const textBefore = remainingLine.substring(0, cueMatch.index);
        if (textBefore) {
          const words = textBefore.split(/\s+/).filter(Boolean);
          words.forEach((w) => {
            tokens.push({
              id: `word-${tokens.length}`,
              type: 'word',
              content: w,
              wordIndex: currentWordIndex++,
              sectionIndex: currentSectionIndex,
            });
          });
        }

        const rawType = cueMatch[1].toUpperCase();
        const rawParam = (cueMatch[2] || '').trim();

        let cueType: ScriptToken['cueType'] = 'NOTE';
        let cueDurationSec = 2;
        let cueLabel = rawParam;

        if (rawType.includes('SHOW') || rawType.includes('PIN')) {
          cueType = 'SHOW_PRODUCT';
        } else if (rawType.includes('PAUSE')) {
          cueType = 'PAUSE';
          const matchSec = rawParam.match(/(\d+(?:\.\d+)?)/);
          if (matchSec) cueDurationSec = parseFloat(matchSec[1]);
        } else if (rawType.includes('ACTION')) {
          cueType = 'CALL_TO_ACTION';
        }

        tokens.push({
          id: `cue-${tokens.length}`,
          type: 'cue',
          content: cueMatch[0],
          cueType,
          cueDurationSec,
          cueLabel: cueLabel || cueType,
          sectionIndex: currentSectionIndex,
        });

        remainingLine = remainingLine.substring(cueMatch.index + cueMatch[0].length);
      } else {
        const words = remainingLine.split(/\s+/).filter(Boolean);
        words.forEach((w) => {
          tokens.push({
            id: `word-${tokens.length}`,
            type: 'word',
            content: w,
            wordIndex: currentWordIndex++,
            sectionIndex: currentSectionIndex,
          });
        });
        remainingLine = '';
      }
    }
  });

  return {
    tokens,
    sections,
    totalWordCount: currentWordIndex,
  };
}
