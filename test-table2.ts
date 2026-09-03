export function normalizeMarkdownTables(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown || '';

  // Clean out pre-existing corrupted table artifacts: | --- |\n| :--- |
  let cleanedMarkdown = markdown
    .replace(/\|\s*-{3,}\s*\|\r?\n\|\s*:?-+:?\s*\|/g, '')
    .replace(/^\|\s*-{3,}\s*\|$/gm, '');

  const lines = cleanedMarkdown.split('\n');
  const resultLines: string[] = [];
  let inTableBlock = false;
  let tableBuffer: string[] = [];

  const flushTableBuffer = () => {
    if (tableBuffer.length === 0) return;
    
    // Check if it's genuinely a table (must have a separator row in line 1 or 2)
    let isGenuineTable = false;
    if (tableBuffer.length >= 2) {
      const row1 = tableBuffer[0];
      const row2 = tableBuffer[1];
      if (/\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?/.test(row2) || /\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?/.test(row1)) {
        isGenuineTable = true;
      }
    }

    if (!isGenuineTable) {
      // Not a table, just output the lines as they are
      resultLines.push(...tableBuffer);
      tableBuffer = [];
      return;
    }

    const processedTable = repairTableLines(tableBuffer);
    
    // Ensure blank line before table if previous line isn't blank
    if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== '') {
      resultLines.push('');
    }
    
    resultLines.push(...processedTable);
    
    // Ensure blank line after table
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if line is a standard Markdown horizontal rule (---, ***, ___), NOT a table
    const isHorizontalRule = /^(\s*[-*_]\s*){3,}$/.test(trimmed);

    // Check if line looks like a valid table row (must explicitly contain '|' and not be a code fence or hr)
    const isTableRowCandidate = 
      !isHorizontalRule &&
      trimmed.includes('|') &&
      !trimmed.startsWith('```') &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('>') &&
      !trimmed.startsWith('$');

    if (isTableRowCandidate) {
      if (!inTableBlock) {
        inTableBlock = true;
      }
      tableBuffer.push(line);
    } else {
      if (inTableBlock) {
        inTableBlock = false;
        flushTableBuffer();
        if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== '') {
          resultLines.push('');
        }
      }
      resultLines.push(line);
    }
  }

  if (inTableBlock) {
    flushTableBuffer();
  }

  return resultLines.join('\n');
}

function repairTableLines(tableLines: string[]): string[] {
  // same as before...
  return tableLines;
}
