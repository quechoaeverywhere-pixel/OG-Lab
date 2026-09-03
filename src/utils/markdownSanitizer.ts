/**
 * Utility to detect and auto-repair GFM Markdown tables.
 * Fixes common Markdown table formatting errors:
 * - Missing leading '|' or trailing '|' in header, separator, or body rows
 * - Inconsistent column counts across rows
 * - Missing blank lines before and after table blocks
 * - Prevents horizontal rules (---, ***, ___) from falsely converting into 1-column broken tables
 * - Removes artificial corrupted tables like "| --- | \n | :--- |"
 */

export function normalizeMarkdownTables(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown || '';

  // Fix common unescaped LaTeX temperature artifacts before processing
  let cleanedMarkdown = markdown
    .replace(/\^\{\\\\circ\}/g, '°')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\^\\\\circ/g, '°')
    .replace(/\^\\circ/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\^circ/g, '°')
    .replace(/\|\s*-{3,}\s*\|\r?\n\|\s*:?-+:?\s*\|/g, '')
    .replace(/^\|\s*-{3,}\s*\|$/gm, '');

  const lines = cleanedMarkdown.split('\n');
  const resultLines: string[] = [];
  let inTableBlock = false;
  let tableBuffer: string[] = [];
  let inCodeBlock = false;

  const flushTableBuffer = (): boolean => {
    if (tableBuffer.length === 0) return false;

    // A genuine markdown table must have a separator row (e.g. |---|)
    let isGenuineTable = false;
    if (tableBuffer.length >= 2) {
      const sepCandidate1 = tableBuffer[0].replace(/\s/g, '');
      const sepCandidate2 = tableBuffer[1].replace(/\s/g, '');
      if (/^\|?(:?-+:?\|)+(:?-+:?)?\|?$/.test(sepCandidate2) || sepCandidate2.includes('---')) {
        isGenuineTable = true;
      } else if (/^\|?(:?-+:?\|)+(:?-+:?)?\|?$/.test(sepCandidate1) || sepCandidate1.includes('---')) {
        isGenuineTable = true;
      }
    }

    if (!isGenuineTable) {
      resultLines.push(...tableBuffer);
      tableBuffer = [];
      return false;
    }

    const processedTable = repairTableLines(tableBuffer);
    
    // Ensure blank line before table if previous line isn't blank
    if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== '') {
      resultLines.push('');
    }

    resultLines.push(...processedTable);

    // Ensure blank line after table
    tableBuffer = [];
    return true;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (inTableBlock) {
        inTableBlock = false;
        const wasTable = flushTableBuffer();
        if (wasTable && resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== '') {
          resultLines.push('');
        }
      }
      resultLines.push(line);
      continue;
    }

    if (inCodeBlock) {
      resultLines.push(line);
      continue;
    }

    // Check if line is a standard Markdown horizontal rule (---, ***, ___), NOT a table
    const isHorizontalRule = /^(\s*[-*_]\s*){3,}$/.test(trimmed);

    // Check if line looks like a valid table row (must explicitly contain '|' and not be a code fence or hr)
    const isTableRowCandidate = 
      !isHorizontalRule &&
      trimmed.includes('|') &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('>') &&
      !trimmed.startsWith('$') &&
      !/^(\$\$|\\\[)/.test(trimmed);

    if (isTableRowCandidate) {
      if (!inTableBlock) {
        inTableBlock = true;
      }
      tableBuffer.push(line);
    } else {
      if (inTableBlock) {
        inTableBlock = false;
        const wasTable = flushTableBuffer();
        if (wasTable && resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== '') {
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
  if (tableLines.length === 0) return tableLines;

  // 1. Clean and normalize lines
  const cleanedRows = tableLines
    .map(rawLine => {
      let line = rawLine.trim();
      if (!line) return '';
      if (!line.startsWith('|')) {
        line = '| ' + line;
      }
      if (!line.endsWith('|')) {
        line = line + ' |';
      }
      return line;
    })
    .filter(line => line.length > 0);

  if (cleanedRows.length === 0) return tableLines;

  // 2. Identify maximum column count across rows
  let maxCols = 0;
  const parsedRows: string[][] = cleanedRows.map(row => {
    // Split by pipe, ignoring first and last empty elements caused by leading/trailing pipes
    const cells = row.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length > maxCols) {
      maxCols = cells.length;
    }
    return cells;
  });

  // A genuine markdown table MUST have at least 2 columns or at least 2 rows with distinct content.
  // If it only has 1 column and contains only '---' or trivial text, it's not a table!
  if (maxCols < 2 && cleanedRows.length < 2) {
    return tableLines;
  }

  if (maxCols === 0) return tableLines;

  // Check if row 1 (index 1) is a separator row.
  let hasSeparator = false;
  if (parsedRows.length >= 2) {
    const secondRowStr = parsedRows[1].join('');
    if (/^[\s:-]+$/.test(secondRowStr)) {
      hasSeparator = true;
    }
  }

  // Build normalized table lines
  const finalTableLines: string[] = [];

  parsedRows.forEach((cells, rowIndex) => {
    // Pad cells if row has fewer columns than maxCols
    while (cells.length < maxCols) {
      if (rowIndex === 1 && hasSeparator) {
        cells.push('---');
      } else {
        cells.push('');
      }
    }

    // Format row nicely with spacing around pipes
    const formattedRow = '| ' + cells.join(' | ') + ' |';
    finalTableLines.push(formattedRow);

    // If no separator row existed after header, inject one!
    if (rowIndex === 0 && !hasSeparator) {
      const sepRow = '| ' + Array(maxCols).fill(':---').join(' | ') + ' |';
      finalTableLines.push(sepRow);
    }
  });

  return finalTableLines;
}
