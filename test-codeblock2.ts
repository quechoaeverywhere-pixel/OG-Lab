export function normalizeMarkdownTables(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown || '';

  let cleanedMarkdown = markdown
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

    const isHorizontalRule = /^(\s*[-*_]\s*){3,}$/.test(trimmed);

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
  return tableLines.map(x => "REPAIRED: " + x);
}

const input = `
Here is some typescript code:

\`\`\`typescript
type Union = A | B | C;
const x = 5 | 2;
\`\`\`

And a table:
| Name | Value |
|---|---|
| A | B |
`;

console.log(normalizeMarkdownTables(input));
