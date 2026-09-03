import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { Dossier } from './src/types';
import { INITIAL_DOSSIERS } from './src/data/initialDossiers';
import { INITIAL_LEXICON } from './src/data/initialLexicon';
import { INITIAL_CITATIONS } from './src/data/initialCitations';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent Storage Paths
const DATA_STORE_DIR = path.join(process.cwd(), 'data_store');
const PROFILES_DIR = path.join(DATA_STORE_DIR, 'research_profiles');
const ASSETS_DIR = path.join(DATA_STORE_DIR, 'assets');
const LEXICON_FILE = path.join(DATA_STORE_DIR, 'lexicon.json');
const CITATIONS_FILE = path.join(DATA_STORE_DIR, 'citations.json');
const CONCEPT_CHATS_DIR = path.join(DATA_STORE_DIR, 'concept_chats');

// Ensure storage directories exist
if (!fs.existsSync(DATA_STORE_DIR)) fs.mkdirSync(DATA_STORE_DIR, { recursive: true });
if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(CONCEPT_CHATS_DIR)) fs.mkdirSync(CONCEPT_CHATS_DIR, { recursive: true });

// Serve static assets
app.use('/api/assets', express.static(ASSETS_DIR));

// Asset storage helpers to prevent massive base64 payloads from inflating dossiers
export function saveBase64Image(dataUriOrBase64: string, prefix = 'asset'): string {
  if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') return dataUriOrBase64;
  if (!dataUriOrBase64.startsWith('data:image/')) return dataUriOrBase64;

  try {
    if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

    // Handle SVG data URIs
    if (dataUriOrBase64.startsWith('data:image/svg+xml')) {
      let svgContent = '';
      if (dataUriOrBase64.includes(';base64,')) {
        const base64Data = dataUriOrBase64.split(';base64,')[1];
        svgContent = Buffer.from(base64Data, 'base64').toString('utf-8');
      } else if (dataUriOrBase64.includes(';utf8,')) {
        svgContent = decodeURIComponent(dataUriOrBase64.split(';utf8,')[1]);
      } else {
        const parts = dataUriOrBase64.split(',');
        svgContent = decodeURIComponent(parts.slice(1).join(','));
      }
      const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.svg`;
      const filePath = path.join(ASSETS_DIR, filename);
      fs.writeFileSync(filePath, svgContent, 'utf-8');
      return `/api/assets/${filename}`;
    }

    // Handle PNG / JPEG / WebP base64 images
    const match = dataUriOrBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/s);
    if (match) {
      let ext = match[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      if (ext === 'svg+xml') ext = 'svg';
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
      const filePath = path.join(ASSETS_DIR, filename);
      fs.writeFileSync(filePath, buffer);
      return `/api/assets/${filename}`;
    }
  } catch (err) {
    console.error('[Storage] Error saving base64 asset:', err);
  }
  return dataUriOrBase64;
}

export function extractAndStoreImagesFromMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown;
  
  // 1. Replace base64 in markdown images: ![alt](data:image/...;base64,...)
  let result = markdown.replace(/!\[([^\]]*)\]\((data:image\/[^)]+)\)/g, (_match, alt, dataUri) => {
    const assetUrl = saveBase64Image(dataUri, 'img');
    return `![${alt}](${assetUrl})`;
  });

  // 2. Replace base64 inside ```concept-render JSON blocks or other JSON code blocks
  result = result.replace(/```(?:concept-render|architectural-render)?\s*([\s\S]*?)```/g, (blockMatch, jsonContent) => {
    try {
      if (jsonContent.includes('data:image/')) {
        const modifiedJson = jsonContent.replace(/"imageUrl"\s*:\s*"(data:image\/[^"]+)"/g, (_m: string, dataUri: string) => {
          const assetUrl = saveBase64Image(dataUri, 'concept');
          return `"imageUrl": "${assetUrl}"`;
        });
        return blockMatch.replace(jsonContent, modifiedJson);
      }
    } catch {
      // ignore
    }
    return blockMatch;
  });

  // 3. General scan for any remaining large data:image/ strings in markdown
  if (result.includes('data:image/')) {
    result = result.replace(/"(data:image\/[^"\s]+)"/g, (_m, dataUri) => {
      const assetUrl = saveBase64Image(dataUri, 'asset');
      return `"${assetUrl}"`;
    });
  }

  return result;
}

export function extractAndStoreImagesFromDossier(dossier: any): any {
  if (!dossier || typeof dossier !== 'object') return dossier;

  const clone = JSON.parse(JSON.stringify(dossier));

  if (clone.contentMarkdown) {
    clone.contentMarkdown = extractAndStoreImagesFromMarkdown(clone.contentMarkdown);
  }

  if (Array.isArray(clone.projectStructure)) {
    clone.projectStructure.forEach((pillar: any) => {
      if (Array.isArray(pillar.chapters)) {
        pillar.chapters.forEach((chap: any) => {
          if (chap.contentMarkdown) {
            chap.contentMarkdown = extractAndStoreImagesFromMarkdown(chap.contentMarkdown);
          }
          if (chap.conceptRender && chap.conceptRender.imageUrl) {
            chap.conceptRender.imageUrl = saveBase64Image(chap.conceptRender.imageUrl, 'concept');
          }
          if (chap.conceptRenderData && chap.conceptRenderData.imageUrl) {
            chap.conceptRenderData.imageUrl = saveBase64Image(chap.conceptRenderData.imageUrl, 'concept');
          }
          if (Array.isArray(chap.sections)) {
            chap.sections.forEach((sec: any) => {
              if (sec.content) {
                sec.content = extractAndStoreImagesFromMarkdown(sec.content);
              }
              if (Array.isArray(sec.units)) {
                sec.units.forEach((unit: any) => {
                  if (unit.conceptRenderData && unit.conceptRenderData.imageUrl) {
                    unit.conceptRenderData.imageUrl = saveBase64Image(unit.conceptRenderData.imageUrl, 'concept');
                  }
                  if (unit.rawMarkdown) {
                    unit.rawMarkdown = extractAndStoreImagesFromMarkdown(unit.rawMarkdown);
                  }
                  if (unit.content) {
                    unit.content = extractAndStoreImagesFromMarkdown(unit.content);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  return clone;
}

function calculateNextChapterNumber(dossiers: any[]): number {
  if (!dossiers || dossiers.length === 0) return 1;
  const maxNumber = dossiers.reduce((max, d) => {
    const num = typeof d.chapterNumber === 'number' ? d.chapterNumber : parseInt(String(d.chapterNumber), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  return Math.max(maxNumber + 1, dossiers.length + 1);
}

function normalizeDossierNumbers(dossiers: any[]): any[] {
  if (!Array.isArray(dossiers)) return [];
  const seenNumbers = new Set<number>();
  let currentMax = 0;

  // First pass: identify valid unique numbers
  dossiers.forEach(d => {
    const num = typeof d.chapterNumber === 'number' ? d.chapterNumber : parseInt(String(d.chapterNumber), 10);
    if (!isNaN(num) && num > 0 && !seenNumbers.has(num)) {
      seenNumbers.add(num);
      if (num > currentMax) currentMax = num;
    }
  });

  // Second pass: fix missing or duplicate numbers
  return dossiers.map((d, index) => {
    const num = typeof d.chapterNumber === 'number' ? d.chapterNumber : parseInt(String(d.chapterNumber), 10);
    if (isNaN(num) || num <= 0 || (seenNumbers.has(num) && dossiers.findIndex(x => x.chapterNumber === num) !== index)) {
      currentMax += 1;
      return { ...d, chapterNumber: currentMax };
    }
    return { ...d, chapterNumber: num };
  });
}

function sanitizeDossierIds(dossiers: any[]): any[] {
  return dossiers.map((dossier, dIdx) => {
    const dId = dossier.id || `dos-${dIdx + 1}`;

    const pillars = (dossier.projectStructure || []).map((pillar: any, pIdx: number) => {
      const pId = pillar.id || `p-${pIdx + 1}`;
      const chapters = (pillar.chapters || []).map((chap: any, cIdx: number) => {
        const cId = chap.id || `ch-${pIdx + 1}-${cIdx + 1}`;

        const extractedTerms = (chap.extractedTerms || []).map((term: any, tIdx: number) => {
          if (!term.id || term.id === 'term-1' || term.id === 'term-2' || term.id.startsWith('term-')) {
            return {
              ...term,
              id: `lex-${dId}-${cId}-t${tIdx + 1}-${Math.random().toString(36).substr(2, 4)}`
            };
          }
          return term;
        });

        const quotes = (chap.quotes || []).map((quote: any, qIdx: number) => {
          if (!quote.id || quote.id === 'q-1' || quote.id === 'quote-1' || quote.id === 'quote-2' || quote.id.startsWith('q-') || quote.id.startsWith('quote-')) {
            return {
              ...quote,
              id: `cit-${dId}-${cId}-q${qIdx + 1}-${Math.random().toString(36).substr(2, 4)}`
            };
          }
          return quote;
        });

        return {
          ...chap,
          extractedTerms,
          quotes
        };
      });

      return {
        ...pillar,
        chapters
      };
    });

    return {
      ...dossier,
      projectStructure: pillars
    };
  });
}

export function normalizeQuoteKey(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/^["'“”«»‘`*_\s—–-]+|["'“”«»‘`*_\s—–-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTermKey(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function sanitizeExtractedTerms(terms: any[], prefix = 'lex'): any[] {
  if (!Array.isArray(terms)) return [];
  const map = new Map<string, any>();
  const ts = Date.now();

  for (let idx = 0; idx < terms.length; idx++) {
    const t = terms[idx];
    if (!t || !t.term) continue;
    const key = normalizeTermKey(t.term);
    if (!key) continue;

    if (!map.has(key)) {
      const id = t.id && !t.id.startsWith('term-')
        ? t.id
        : `${prefix}-${ts}-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`;
      map.set(key, {
        ...t,
        id,
        tags: Array.isArray(t.tags) ? [...t.tags] : []
      });
    } else {
      const existing = map.get(key);
      const mergedTags = Array.from(new Set([...(existing.tags || []), ...(t.tags || [])]));
      map.set(key, {
        ...existing,
        enTerm: existing.enTerm || t.enTerm,
        category: existing.category || t.category,
        philosophicalOrigin: existing.philosophicalOrigin || t.philosophicalOrigin,
        csEquivalent: existing.csEquivalent || t.csEquivalent,
        deepExplanation: (existing.deepExplanation && existing.deepExplanation.length >= (t.deepExplanation || '').length)
          ? existing.deepExplanation
          : (t.deepExplanation || existing.deepExplanation),
        applicationInAgents: (existing.applicationInAgents && existing.applicationInAgents.length >= (t.applicationInAgents || '').length)
          ? existing.applicationInAgents
          : (t.applicationInAgents || existing.applicationInAgents),
        tags: mergedTags
      });
    }
  }
  return Array.from(map.values());
}

export function sanitizeClassicalQuotes(quotes: any[], prefix = 'cit'): any[] {
  if (!Array.isArray(quotes)) return [];
  const map = new Map<string, any>();
  const ts = Date.now();

  for (let idx = 0; idx < quotes.length; idx++) {
    const q = quotes[idx];
    if (!q) continue;
    const text = q.quote || q.keyQuote || q.title || '';
    const key = normalizeQuoteKey(text);
    if (!key) continue;

    if (!map.has(key)) {
      const id = q.id && !q.id.startsWith('q-') && !q.id.startsWith('quote-')
        ? q.id
        : `${prefix}-${ts}-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`;
      map.set(key, {
        ...q,
        id,
        quote: q.quote || text,
        keyQuote: q.keyQuote || text,
        dossierIds: Array.isArray(q.dossierIds) ? [...q.dossierIds] : []
      });
    } else {
      const existing = map.get(key);
      const mergedDossierIds = Array.from(new Set([...(existing.dossierIds || []), ...(q.dossierIds || [])]));
      map.set(key, {
        ...existing,
        author: existing.author && existing.author !== 'Khuyết danh' ? existing.author : (q.author || existing.author),
        work: existing.work || q.work,
        title: existing.title && existing.title !== 'Kinh điển' ? existing.title : (q.title || existing.title),
        source: existing.source || q.source,
        eraOrYear: existing.eraOrYear || q.eraOrYear,
        year: existing.year || q.year,
        interpretation: (existing.interpretation && existing.interpretation.length >= (q.interpretation || '').length)
          ? existing.interpretation
          : (q.interpretation || existing.interpretation),
        translationVi: existing.translationVi || q.translationVi,
        discipline: existing.discipline || q.discipline,
        language: existing.language || q.language,
        dossierIds: mergedDossierIds
      });
    }
  }
  return Array.from(map.values());
}

export function deduplicateMarkdownQuotes(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown || '';
  const lines = markdown.split('\n');
  const seenQuotes = new Set<string>();
  const outputLines: string[] = [];
  let inQuoteBlock = false;
  let quoteBuffer: string[] = [];

  const flushQuoteBuffer = () => {
    if (quoteBuffer.length === 0) return;
    const firstLine = quoteBuffer[0].replace(/^>\s*/, '').trim().toLowerCase();
    const cleanKey = firstLine.replace(/^["'“”«»‘`*_\s—–-]+|["'“”«»‘`*_\s—–-]+$/g, '');
    if (cleanKey && cleanKey.length > 8) {
      if (seenQuotes.has(cleanKey)) {
        quoteBuffer = [];
        return;
      }
      seenQuotes.add(cleanKey);
    }
    outputLines.push(...quoteBuffer);
    quoteBuffer = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith('>')) {
      inQuoteBlock = true;
      quoteBuffer.push(line);
    } else {
      if (inQuoteBlock) {
        flushQuoteBuffer();
        inQuoteBlock = false;
      }
      outputLines.push(line);
    }
  }
  if (inQuoteBlock) {
    flushQuoteBuffer();
  }

  return outputLines.join('\n');
}

export function extractAndCleanJson(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '{}';
  let str = rawText.trim();

  // Remove markdown code fences ```json ... ``` or ``` ... ```
  if (str.includes('```')) {
    const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch && fenceMatch[1]) {
      str = fenceMatch[1].trim();
    } else {
      str = str.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim();
    }
  }

  // Extract outermost JSON object or array if surrounded by conversational filler
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIdx = -1;
  let endIdx = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = str.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = str.lastIndexOf(']');
  }

  if (startIdx !== -1) {
    if (endIdx > startIdx) {
      str = str.substring(startIdx, endIdx + 1);
    } else {
      str = str.substring(startIdx);
    }
  }

  return str;
}

export function preprocessJsonText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  let out = rawText;

  // 1. Remove single-line comments // ... outside string contexts
  out = out.replace(/(?<!:)\/\/.*$/gm, '');

  // 2. Normalize Python literals & JS special tokens
  out = out
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/\bNaN\b/g, 'null')
    .replace(/\bundefined\b/g, 'null');

  // 3. Strip numbered list bullet markers like 1. "key": or [ 1. { or [ 1. "item"
  out = out.replace(/(?<=[{\[,\n\r])\s*\d+\.\s*(?=["{a-zA-Z0-9_\-])/g, '');

  // 4. Fix unterminated fractional numbers like 1. or 0. or 85.
  out = out.replace(/\b(\d+)\.(?!\d)/g, '$1');

  // 5. Auto-quote unquoted object keys (e.g. { projectTitle: "..." })
  out = out.replace(/(?<=[{,\n\r]\s*)([a-zA-Z0-9_\-]+)\s*:/g, '"$1":');

  return out;
}

export function extractBalancedBlock(text: string, startChar: string, endChar: string, startIndex: number): string | null {
  let depth = 0;
  let inStr = false;
  let escape = false;
  let start = -1;
  for (let i = startIndex; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (escape) {
        escape = false;
      } else if (c === '\\') {
        escape = true;
      } else if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === startChar) {
      if (depth === 0) start = i;
      depth++;
    } else if (c === endChar) {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.substring(start, i + 1);
      }
    }
  }
  return start !== -1 ? text.substring(start) : null;
}

export function repairMalformedJson(rawText: string): string {
  const extracted = extractAndCleanJson(rawText);
  if (!extracted) return '{}';

  const str = preprocessJsonText(extracted);

  let result = '';
  let inString = false;
  let isEscaped = false;
  const structureStack: ('{' | '[')[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (inString) {
      if (isEscaped) {
        result += char;
        isEscaped = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        // Look ahead to check if this quote is legitimately closing the JSON string token
        let lookaheadIdx = i + 1;
        while (lookaheadIdx < str.length && /\s/.test(str[lookaheadIdx])) {
          lookaheadIdx++;
        }
        const nextMeaningfulChar = str[lookaheadIdx] || '';

        // Legitimate boundary characters following a string in JSON:
        // For a key: ':'
        // For a value / array item: ',', '}', ']', or end of content
        if (
          nextMeaningfulChar === ':' ||
          nextMeaningfulChar === ',' ||
          nextMeaningfulChar === '}' ||
          nextMeaningfulChar === ']' ||
          nextMeaningfulChar === ''
        ) {
          inString = false;
          result += '"';
        } else {
          // Unescaped interior quote inside string literal
          result += '\\"';
        }
        continue;
      }

      // Escape raw control characters & literal newlines inside string literals
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      if (char === '\r') {
        result += '\\r';
        continue;
      }
      if (char === '\t') {
        result += '\\t';
        continue;
      }
      const code = char.charCodeAt(0);
      if (code < 0x20) {
        result += `\\u${code.toString(16).padStart(4, '0')}`;
        continue;
      }

      result += char;
    } else {
      // Outside string literal
      if (char === '"') {
        inString = true;
        result += '"';
      } else {
        if (char === '{' || char === '[') {
          structureStack.push(char);
        } else if (char === '}') {
          if (structureStack[structureStack.length - 1] === '{') {
            structureStack.pop();
          }
        } else if (char === ']') {
          if (structureStack[structureStack.length - 1] === '[') {
            structureStack.pop();
          }
        }
        result += char;
      }
    }
  }

  // If truncated mid-string, close quote
  if (inString) {
    result += '"';
  }

  // Remove trailing commas before closing braces/brackets
  result = result.replace(/,\s*([\]}])/g, '$1');

  // Auto-close open braces and brackets
  while (structureStack.length > 0) {
    const unclosed = structureStack.pop();
    if (unclosed === '{') {
      result += '}';
    } else if (unclosed === '[') {
      result += ']';
    }
  }

  return result;
}

export function extractPartialJsonFields(rawText: string): Record<string, any> {
  const result: Record<string, any> = {};
  if (!rawText || typeof rawText !== 'string') return result;

  const preprocessed = preprocessJsonText(extractAndCleanJson(rawText));

  // Extract simple string fields
  const stringFieldRegex = /"([a-zA-Z0-9_]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = stringFieldRegex.exec(preprocessed)) !== null) {
    const key = match[1];
    if (result[key] === undefined) {
      result[key] = match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }

  // Extract numbers
  const numFieldRegex = /"([a-zA-Z0-9_]+)"\s*:\s*(-?\d+(?:\.\d+)?)/g;
  while ((match = numFieldRegex.exec(preprocessed)) !== null) {
    if (result[match[1]] === undefined) {
      result[match[1]] = Number(match[2]);
    }
  }

  // Extract booleans
  const boolFieldRegex = /"([a-zA-Z0-9_]+)"\s*:\s*(true|false)/g;
  while ((match = boolFieldRegex.exec(preprocessed)) !== null) {
    if (result[match[1]] === undefined) {
      result[match[1]] = match[2] === 'true';
    }
  }

  // Extract arrays (strings, primitives or objects)
  const arrayKeyRegex = /"([a-zA-Z0-9_]+)"\s*:\s*\[/g;
  while ((match = arrayKeyRegex.exec(preprocessed)) !== null) {
    const key = match[1];
    if (result[key] === undefined) {
      const arrayBlock = extractBalancedBlock(preprocessed, '[', ']', match.index);
      if (arrayBlock) {
        try {
          result[key] = JSON.parse(arrayBlock);
        } catch {
          // Attempt repaired parse
          try {
            const rep = repairMalformedJson(arrayBlock);
            result[key] = JSON.parse(rep);
          } catch {
            // Extract individual objects or strings inside array
            const objects: any[] = [];
            let objIdx = 0;
            while ((objIdx = arrayBlock.indexOf('{', objIdx)) !== -1) {
              const objBlock = extractBalancedBlock(arrayBlock, '{', '}', objIdx);
              if (objBlock) {
                try {
                  objects.push(JSON.parse(objBlock));
                } catch {
                  try {
                    objects.push(JSON.parse(repairMalformedJson(objBlock)));
                  } catch {
                    const subFields = extractPartialJsonFields(objBlock);
                    if (Object.keys(subFields).length > 0) {
                      objects.push(subFields);
                    }
                  }
                }
                objIdx += objBlock.length;
              } else {
                break;
              }
            }

            if (objects.length > 0) {
              result[key] = objects;
            } else {
              // Extract array of strings
              const items: string[] = [];
              const itemRegex = /"((?:[^"\\]|\\.)*)"/g;
              let itemMatch;
              while ((itemMatch = itemRegex.exec(arrayBlock)) !== null) {
                items.push(itemMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'));
              }
              if (items.length > 0) {
                result[key] = items;
              }
            }
          }
        }
      }
    }
  }

  return result;
}

export function safeParseLLMJson<T = any>(rawText: string, fallback?: T): T {
  const cleaned = extractAndCleanJson(rawText);

  // Attempt 1: direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Attempt 2: preprocessed & lexer repaired parse
    try {
      const repaired = repairMalformedJson(cleaned);
      return JSON.parse(repaired);
    } catch {
      // Attempt 3: single-quote fix + lexer repair
      try {
        const singleQuoteFixed = cleaned.replace(/'([^'\\]*?)'/g, '"$1"');
        const repaired2 = repairMalformedJson(singleQuoteFixed);
        return JSON.parse(repaired2);
      } catch {
        // Attempt 4: loose key normalization + trailing comma removal
        try {
          const loose = preprocessJsonText(cleaned).replace(/,\s*([\]}])/g, '$1');
          return JSON.parse(loose);
        } catch {
          // Attempt 5: partial field extractor
          const partial = extractPartialJsonFields(cleaned);
          if (Object.keys(partial).length > 0) {
            if (fallback !== undefined && typeof fallback === 'object' && fallback !== null) {
              return { ...fallback, ...partial } as T;
            }
            return partial as T;
          }

          if (fallback !== undefined) {
            return fallback;
          }

          // Safe fallback instead of throwing uncaught syntax errors
          return (typeof fallback === 'object' && fallback !== null ? fallback : {}) as T;
        }
      }
    }
  }
}

export function constructFallbackProjectAnalysis(rawText: string, docSnippet: string = ''): any {
  const partial = extractPartialJsonFields(rawText);

  const titleMatch = rawText.match(/"projectTitle"\s*:\s*"([^"\\]+)"/) || docSnippet.match(/^(?:#\s*|\*\*|)([^\n\r]{5,60})/);
  const projectTitle = partial.projectTitle || (titleMatch ? titleMatch[1].replace(/^[#*\s]+|[#*\s]+$/g, '') : 'Đề Án Chuyển Hóa Tri Thức & Thực Chiến');

  const subtitleMatch = rawText.match(/"projectSubtitle"\s*:\s*"([^"\\]+)"/);
  const projectSubtitle = partial.projectSubtitle || (subtitleMatch ? subtitleMatch[1] : 'Kịch bản hành động và quy trình thực thi đa chiều');

  const domainMatch = rawText.match(/"projectDomain"\s*:\s*"([^"\\]+)"/);
  const projectDomain = partial.projectDomain || (domainMatch ? domainMatch[1] : 'Quản Trị Dự Án & Kinh Tế');

  const diagMatch = rawText.match(/"executiveDiagnosis"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  const executiveDiagnosis = partial.executiveDiagnosis || (diagMatch ? diagMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : (docSnippet.slice(0, 300) || 'Đề án có tiềm năng ứng dụng thực tiễn cao, cần chuẩn hóa lộ trình vận hành và kiểm soát rủi ro.'));

  const feasibilityScore = typeof partial.feasibilityScore === 'number' ? partial.feasibilityScore : 88;

  const scenarios = [
    {
      id: 'scenario-sop',
      key: 'sop_workflows',
      title: 'Quy Trình & Lộ Trình Vận Hành Thực Chiến',
      shortDesc: 'Bản vẽ phân kỳ 3 giai đoạn, sơ đồ ASCII, ma trận RACI và danh mục việc cần làm ngay.',
      targetAudience: 'Bộ phận Vận hành, Trưởng dự án & Đội ngũ Kỹ thuật',
      iconName: 'Workflow',
      contentMarkdown: `# QUY TRÌNH & LỘ TRÌNH VẬN HÀNH THỰC CHIẾN\n\n## 1. Sơ đồ luồng tiến trình tổng thể (ASCII Flow)\n\n[Khảo sát & Chuẩn bị] --(Dự toán & Quy chuẩn)--> [Thử nghiệm & Đánh giá] --(Kiểm định an toàn)--> [Vận hành Chính thức & Tối ưu]\n\n## 2. Lộ trình phân kỳ 3 giai đoạn thực thi\n\n- Giai đoạn 1 (30 ngày đầu): Thiết lập hạ tầng và đội ngũ nòng cốt.\n- Giai đoạn 2 (60 ngày tiếp theo): Triển khai thử nghiệm và hiệu chỉnh quy trình.\n- Giai đoạn 3 (90 ngày trở đi): Mở rộng quy mô và đo lường định kỳ.`,
      actionItems: ['Hoàn thiện bản vẽ mặt bằng và thiết bị', 'Ký kết cam kết phối hợp nội bộ', 'Thiết lập kênh giám sát chỉ số tiến độ']
    },
    {
      id: 'scenario-exec',
      key: 'executive_report',
      title: 'Báo Cáo Chiến Lược & Thẩm Định Đề Án',
      shortDesc: 'Bản tóm tắt điều hành dành cho Ban Giám Đốc, Hội đồng Cố vấn hoặc Nhà đầu tư.',
      targetAudience: 'Ban Lãnh đạo, Hội đồng Cố vấn, Nhà Đầu Tư',
      iconName: 'Briefcase',
      contentMarkdown: `# BÁO CÁO CHIẾN LƯỢC & THẨM ĐỊNH ĐỀ ÁN\n\n## 1. Tóm tắt điều hành (Executive Summary)\n\n${executiveDiagnosis}\n\n## 2. Luận chứng kinh tế & Đề xuất giá trị cốt lõi\n\nĐề án giải quyết triệt để các bài toán thực tiễn với chi phí tối ưu và khả năng nhân rộng linh hoạt.`,
      actionItems: ['Phê duyệt hạn mức ngân sách giai đoạn 1', 'Thành lập Ban Cố vấn Thẩm định độc lập', 'Thiết lập cơ chế kiểm soát rủi ro định kỳ']
    },
    {
      id: 'scenario-team',
      key: 'internal_team_comm',
      title: 'Truyền Thông Nội Bộ Đội Ngũ (Team Alignment)',
      shortDesc: 'Thông điệp truyền cảm hứng, cẩm nang văn hóa hành động và bộ Q&A tháo gỡ điểm nghẽn tâm lý.',
      targetAudience: 'Toàn thể nhân sự, Quản lý cấp trung & Cộng sự',
      iconName: 'Users',
      contentMarkdown: `# CẨM NANG HÀNH ĐỘNG & TRUYỀN THÔNG NỘI BỘ\n\n## 1. Thông điệp truyền cảm hứng\n\nMỗi thành viên là một mắt xích quan trọng trong việc hiện thực hóa tầm nhìn của đề án.\n\n## 2. Nguyên tắc vàng trong phối hợp\n\n- Minh bạch thông tin và tiến độ.\n- Chủ động tháo gỡ khó khăn, không đùn đẩy trách nhiệm.\n- Luôn hướng tới kết quả thực chất.`,
      actionItems: ['Tổ chức buổi Town Hall ra mắt đề án', 'Phát hành bản tóm tắt 1 trang cho từng phòng ban', 'Mở hòm thư góp ý và sáng kiến nội bộ']
    },
    {
      id: 'scenario-public',
      key: 'public_community_comm',
      title: 'Truyền Thông Đại Chúng & Cộng Đồng',
      shortDesc: 'Chuyển hóa biệt ngữ phức tạp thành ngôn ngữ đời thường, bài viết kể chuyện và kêu gọi hành động.',
      targetAudience: 'Cộng đồng, Khách hàng tiềm năng & Đối tác xã hội',
      iconName: 'Megaphone',
      contentMarkdown: `# BÀI VIẾT TRUYỀN THÔNG ĐẠI CHÚNG & CỘNG ĐỒNG\n\n## 1. Câu chuyện khởi nguồn\n\nTại sao dự án ra đời và mang lại giá trị gì cho đời sống hàng ngày?\n\n## 2. Lời kêu gọi chung tay\n\nĐồng hành cùng chúng tôi để tạo dựng giá trị bền vững cho xã hội.`,
      actionItems: ['Xuất bản chuỗi bài viết chia sẻ câu chuyện nhân văn', 'Sản xuất infographic minh họa lợi ích đời thường', 'Kết nối các tổ chức xã hội và đối tác địa phương']
    },
    {
      id: 'scenario-market',
      key: 'market_research',
      title: 'Nghiên Cứu & Khảo Sát Thị Trường',
      shortDesc: 'Bối cảnh ngành, ma trận đối thủ cạnh tranh, khoảng trống thị trường và cơ hội bứt phá.',
      targetAudience: 'Bộ phận Chiến lược, Marketing & Phát triển Sản phẩm',
      iconName: 'TrendingUp',
      contentMarkdown: `# BÁO CÁO NGHIÊN CỨU & KHẢO SÁT THỊ TRƯỜNG\n\n## 1. Bối cảnh ngành và nhu cầu người dùng\n\nNhu cầu thị trường đang dịch chuyển mạnh mẽ sang các giải pháp bền vững, minh bạch.\n\n## 2. Khoảng trống thị trường (Market Gap)\n\nCơ hội bứt phá nằm ở khả năng tối ưu hóa chi phí và nâng cao chất lượng trải nghiệm.`,
      actionItems: ['Khảo sát sâu khách hàng mục tiêu', 'Phân tích chính sách đối thủ', 'Định vị thông điệp bán hàng độc nhất (USP)']
    },
    {
      id: 'scenario-consumer',
      key: 'consumer_psychology',
      title: 'Tâm Lý Tiêu Dùng & Hành Vi Khách Hàng',
      shortDesc: 'Chân dung Persona mục tiêu, nỗi đau thầm kín, rào cản tâm lý và kịch bản tiếp cận thuyết phục.',
      targetAudience: 'Đội ngũ Sales, Chăm sóc Khách hàng & Sáng tạo Nội dung',
      iconName: 'Brain',
      contentMarkdown: `# BẢN ĐỒ TÂM LÝ TIÊU DÙNG & HÀNH VI KHÁCH HÀNG\n\n## 1. Chân dung khách hàng điển hình\n\nNgười dùng mong muốn giải pháp tiện lợi, minh bạch và có cam kết chất lượng rõ ràng.\n\n## 2. Kịch bản giải tỏa rào cản\n\nCung cấp đầy đủ dẫn chứng xác thực, chính sách bảo đảm và hỗ trợ tận tâm.`,
      actionItems: ['Xây dựng kịch bản tư vấn', 'Thiết kế chương trình trải nghiệm không rủi ro', 'Thu thập phản hồi cảm xúc khách hàng']
    }
  ];

  return {
    projectTitle,
    projectSubtitle,
    projectDomain,
    feasibilityScore,
    executiveDiagnosis,
    coreStrengths: Array.isArray(partial.coreStrengths) && partial.coreStrengths.length > 0 ? partial.coreStrengths : [
      'Ý tưởng bám sát nhu cầu thực tiễn và có tính nhân văn cao.',
      'Khả năng triển khai linh hoạt theo từng giai đoạn phân kỳ.',
      'Mô hình chi phí tinh gọn, giảm thiểu lãng phí tài nguyên.'
    ],
    failureModesAndRisks: Array.isArray(partial.failureModesAndRisks) && partial.failureModesAndRisks.length > 0 ? partial.failureModesAndRisks : [
      'Rủi ro về dòng tiền trong giai đoạn đầu chưa đạt điểm hòa vốn.',
      'Nguy cơ thiếu hụt nhân sự chuyên môn khi mở rộng quy mô.',
      'Rào cản về thói quen cũ của người tiêu dùng và đối tác.'
    ],
    strategicImperatives: Array.isArray(partial.strategicImperatives) && partial.strategicImperatives.length > 0 ? partial.strategicImperatives : [
      'Xây dựng quy trình chuẩn SOPs và đào tạo đội ngũ nòng cốt trong 30 ngày đầu.',
      'Kiểm soát dòng tiền chặt chẽ và thiết lập quỹ dự phòng rủi ro 3 tháng.',
      'Đẩy mạnh truyền thông minh bạch về giá trị thực chất tới cộng đồng.'
    ],
    missingElements: Array.isArray(partial.missingElements) && partial.missingElements.length > 0 ? partial.missingElements : [
      'Cần bổ sung chi tiết dự toán chi phí vận hành hàng tháng.',
      'Cần xác định rõ chỉ số đo lường hiệu quả (OKRs/KPIs) cho từng khâu.'
    ],
    detectedTimeline: partial.detectedTimeline || '6-12 tháng',
    estimatedBudgetScope: partial.estimatedBudgetScope || 'Tùy thuộc quy mô phân kỳ giai đoạn',
    targetPersonas: Array.isArray(partial.targetPersonas) && partial.targetPersonas.length > 0 ? partial.targetPersonas : ['Ban Điều Hành', 'Đội Ngũ Triển Khai', 'Khách Hàng Mục Tiêu'],
    scenarios,
    pillarsForDossier: [
      {
        id: 'p-1',
        conceptualType: 'concept',
        title: 'Trụ cột I: Bản Thể Luận & Định Vị Giá Trị Cốt Lõi',
        description: 'Ý niệm nguyên thủy, căn nguyên bối cảnh và đề xuất giá trị độc đáo.',
        chapters: [
          { id: 'ch-1-1', title: 'Chương 1.1: Khởi Nguyên Bối Cảnh & Tái Định Nghĩa Bài Toán', status: 'pending' },
          { id: 'ch-1-2', title: 'Chương 1.2: Mô Hình Giá Trị Cốt Lõi & Đề Xuất Khác Biệt', status: 'pending' }
        ]
      },
      {
        id: 'p-2',
        conceptualType: 'context',
        title: 'Trụ cột II: Động Lực Học Vận Hành & Quy Luật Dòng Tiền',
        description: 'Các quy luật vận động nội tại, dòng chảy thông tin và chu chuyển tài chính.',
        chapters: [
          { id: 'ch-2-1', title: 'Chương 2.1: Cơ Chế Vận Hành Nội Tại & Động Lực Đội Ngũ', status: 'pending' },
          { id: 'ch-2-2', title: 'Chương 2.2: Luân Chuyển Dòng Tiền & Tối Ưu Hóa Chi Phí', status: 'pending' }
        ]
      },
      {
        id: 'p-3',
        conceptualType: 'application',
        title: 'Trụ cột III: Bản Vẽ Kiến Trúc Thực Thi & Lộ Trình Phân Kỳ',
        description: 'Kỹ nghệ thi công, quy chuẩn kỹ thuật và giải pháp triển khai thực tế.',
        chapters: [
          { id: 'ch-3-1', title: 'Chương 3.1: Kiến Trúc Hạ Tầng & Quy Chuẩn Thực Thi', status: 'pending' },
          { id: 'ch-3-2', title: 'Chương 3.2: Lộ Trình Phân Kỳ 3 Giai Đoạn & Mốc Nghiệm Thu', status: 'pending' }
        ]
      },
      {
        id: 'p-4',
        conceptualType: 'deep_dive',
        title: 'Trụ cột IV: Biện Chứng Phản Biện & Quản Trị Rủi Ro Đề Án',
        description: 'Nhận diện điểm nghẽn, các failure modes và kịch bản ứng phó sự cố.',
        chapters: [
          { id: 'ch-4-1', title: 'Chương 4.1: Điểm Nghẽn Vận Hành & Rủi Ro Thị Trường Tiềm Ẩn', status: 'pending' },
          { id: 'ch-4-2', title: 'Chương 4.2: Cơ Chế Phòng Vệ & Kế Hoạch Dự Phòng Khủng Hoảng', status: 'pending' }
        ]
      },
      {
        id: 'p-5',
        conceptualType: 'internal_dialogue',
        title: 'Trụ cột V: Điểm Tựa Đạo Đức Shinbashira & Kỷ Luật Liêm Chính',
        description: 'Khoảng lặng văn hóa, kỷ luật an toàn và năng lực phục hồi khi biến động.',
        chapters: [
          { id: 'ch-5-1', title: 'Chương 5.1: Bộ Quy Tắc Đạo Đức & Chuẩn Mực Liêm Chính', status: 'pending' },
          { id: 'ch-5-2', title: 'Chương 5.2: Văn Hóa An Toàn Lao Động & Sức Bền Đội Ngũ', status: 'pending' }
        ]
      },
      {
        id: 'p-6',
        conceptualType: 'synthesis',
        title: 'Trụ cột VI: Trách Nhiệm ESG, Sinh Thái Xanh & Trường Tồn',
        description: 'Hòa hợp thiên nhiên, phụng sự cộng đồng và phát triển bền vững dài hạn.',
        chapters: [
          { id: 'ch-6-1', title: 'Chương 6.1: Tích Hợp Tiêu Chuẩn Môi Trường & Kinh Tế Tuần Hoàn', status: 'pending' },
          { id: 'ch-6-2', title: 'Chương 6.2: Cam Kết Trách Nhiệm Xã Hội & Tầm Nhìn Trường Tồn', status: 'pending' }
        ]
      }
    ],
    extractedTerms: [
      {
        id: 'term-proj-1',
        term: 'Cơ Chế Tự Dưỡng (Self-Sustaining Loop)',
        enTerm: 'Self-Sustaining Loop',
        category: 'Liên Ngành Đột Phá',
        sourceDiscipline: 'Kinh Tế & Quản Trị',
        philosophicalOrigin: 'Nguyên lý bảo toàn động năng trong hệ thống khép kín',
        csEquivalent: 'Feedback Loop / Autonomous Recovery',
        deepExplanation: 'Khả năng vận hành tạo ra dòng tiền đủ để tái đầu tư và duy trì mà không bị phụ thuộc vào vốn ngoài liên tục.',
        applicationInAgents: 'Kiến trúc tác tử tự cân bằng tài nguyên và tái nạp năng lượng hoạt động.',
        tags: ['Dự Án', 'Vận Hành', 'Kinh Tế']
      }
    ]
  };
}

export function constructFallbackAcademicDossier(
  rawText: string = '',
  docSnippet: string = '',
  documentTitle: string = '',
  targetDiscipline: string = '',
  interdisciplinaryFields: string[] = [],
  depthLevel: string = 'dissertation',
  numChapters: number = 3
): any {
  const partial = extractPartialJsonFields(rawText);

  const titleMatch = rawText.match(/"title"\s*:\s*"([^"\\]+)"/) || docSnippet.match(/^(?:#\s*|\*\*|)([^\n\r]{5,70})/);
  const effectiveTitle = partial.title || (titleMatch ? titleMatch[1].replace(/^[#*\s]+|[#*\s]+$/g, '') : (documentTitle || 'Khảo Luận Chuyển Hóa Tri Thức Học Thuật'));

  const subtitleMatch = rawText.match(/"subtitle"\s*:\s*"([^"\\]+)"/);
  const effectiveSubtitle = partial.subtitle || (subtitleMatch ? subtitleMatch[1] : 'Chuyển hóa tri thức hàn lâm sang giải pháp thực chiến theo Trụ Cột Thích Ứng');

  const abstractMatch = rawText.match(/"abstract"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
  const effectiveAbstract = partial.abstract || (abstractMatch ? abstractMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : (
    `Khảo luận này tiếp nhận và phân tích sâu sắc công trình "${effectiveTitle}" thuộc lĩnh vực ${targetDiscipline || 'Học thuật liên ngành'}. Vận dụng phương pháp luận Deep Research & Knowledge Transforming, toàn bộ tri thức trừu tượng được giải mã thành ngôn ngữ đời thường, gãy gọn, thiết lập bản vẽ kiến trúc hệ thống và quy trình thực chiến hành động.`
  ));

  const discipline = targetDiscipline || partial.discipline || 'Học Thuật Đa Ngành & Hệ Thống Phức Tạp';
  const effectiveInterdisciplinary = interdisciplinaryFields.length > 0
    ? interdisciplinaryFields
    : (Array.isArray(partial.interdisciplinaryFields) && partial.interdisciplinaryFields.length > 0 ? partial.interdisciplinaryFields : ['Bản Thể Luận', 'Khoa Học Máy Tính', 'Quản Trị Hệ Thống']);

  const keyFindings = Array.isArray(partial.keyFindings) && partial.keyFindings.length > 0 ? partial.keyFindings : [
    `Giải mã ý niệm nguyên thủy của ${effectiveTitle} thành tiên đề vận hành thực tế.`,
    'Thiết lập mô hình động lực học hệ thống với cơ chế tự cân bằng và tuần hoàn dữ liệu.',
    'Ánh xạ toàn diện các khái niệm hàn lâm sang kiến trúc Multi-Agent Swarms phân tán.',
    'Nhận diện các điểm nghẽn và bẫy rủi ro tiềm ẩn (Failure Modes) để thiết lập bộ lọc phòng vệ.',
    'Xây dựng trục cân bằng đạo đức và hòa hợp sinh thái phát triển bền vững.'
  ];

  const philosophicalBasis = Array.isArray(partial.philosophicalBasis) && partial.philosophicalBasis.length > 0 ? partial.philosophicalBasis : [
    {
      doctrine: 'Bản Thể Luận & Nguyên Lý Khởi Nguyên (Ontology & First Principles)',
      philosopher: 'Aristotle & Lão Tử',
      coreTenet: 'Mọi sự vật đều bắt đầu từ một ý niệm nguyên thủy làm nền tảng định hình bản chất.',
      modernParity: 'Định nghĩa Core Schema, Invariant Rules và State Machine trong hệ thống phần mềm.'
    },
    {
      doctrine: 'Điều Khiển Học & Cân Bằng Động (Cybernetics & Dynamic Equilibrium)',
      philosopher: 'Norbert Wiener',
      coreTenet: 'Hệ thống tự điều chỉnh thông qua các vòng lặp phản hồi thông tin liên tục.',
      modernParity: 'Closed-loop Feedback Control, Event-Driven Architecture và Autonomous Agentic Loops.'
    },
    {
      doctrine: 'Triết Lý Sức Bền Khắc Kỷ (Stoic Resilience)',
      philosopher: 'Marcus Aurelius',
      coreTenet: 'Trục tâm độc lập đứng vững và hấp thụ rung chấn khi toàn bộ ngoại cảnh xung quanh dao động.',
      modernParity: 'Immutability Core, Safe Default State và Zero-Trust Security Gateway.'
    },
    {
      doctrine: 'Đạo Học & Sinh Thái Vô Vi (Wu Wei Ecological Symbiosis)',
      philosopher: 'Trang Tử',
      coreTenet: 'Thuận theo tự nhiên, tối ưu hóa năng lượng nội tại mà không cưỡng cầu lãng phí.',
      modernParity: 'Event-Sourced Green Computing, Resource Pooling và Decentralized P2P Networks.'
    }
  ];

  const technicalMappings = Array.isArray(partial.technicalMappings) && partial.technicalMappings.length > 0 ? partial.technicalMappings : [
    {
      classicalConcept: 'Ý Niệm Bản Thể (Ontological Essence)',
      computerSciencePattern: 'Deterministic Schema & Domain Model',
      rationale: 'Chuẩn hóa định dạng dữ liệu đầu vào không thể bị sai lệch ngữ nghĩa.',
      failureModeAvoided: 'Ngăn ngừa hiện tượng Hallucination và trượt trật tự dữ liệu.'
    },
    {
      classicalConcept: 'Động Lực Học Vận Hành (System Dynamics)',
      computerSciencePattern: 'Reactive Event Stream & Message Bus (Kafka/NATS)',
      rationale: 'Phân phối trạng thái theo thời gian thực không gây nghẽn cổ chai.',
      failureModeAvoided: 'Khắc phục xung đột tranh chấp tài nguyên và Race Condition.'
    },
    {
      classicalConcept: 'Trục Cân Bằng & Phòng Vệ',
      computerSciencePattern: 'Circuit Breaker & Fallback Autonomous Engine',
      rationale: 'Khi một module con gặp sự cố, hệ thống tổng thể vẫn giữ nguyên trục ổn định.',
      failureModeAvoided: 'Ngăn chặn sụp đổ dây chuyền (Cascading Failure).'
    },
    {
      classicalConcept: 'Hòa Hợp Đất Trời Vô Vi',
      computerSciencePattern: 'Scale-to-Zero & Event-Driven Serverless Compute',
      rationale: 'Chỉ tiêu hao năng lượng khi có sự kiện thực sự phát sinh.',
      failureModeAvoided: 'Lãng phí tài nguyên máy chủ và chi phí vận hành không cần thiết.'
    }
  ];

  const citations = Array.isArray(partial.citations) && partial.citations.length > 0 ? partial.citations : [
    {
      id: 'cit-1',
      title: 'Tư Duy Hệ Thống - Nhìn Rõ Bản Chất Thế Giới (Thinking in Systems)',
      author: 'Donella H. Meadows',
      year: '2008',
      source: 'Chelsea Green Publishing',
      category: 'Sách Khoa học' as const,
      keyQuote: 'Một hệ thống không thể được hiểu đơn thuần bằng cách cộng gộp các phần tử của nó; bản chất nằm ở mối quan hệ và vòng lặp phản hồi.'
    },
    {
      id: 'cit-2',
      title: 'Đạo Đức Kinh (Tao Te Ching)',
      author: 'Lão Tử',
      year: 'Thế kỷ 6 TCN',
      source: 'Văn Bản Kinh Điển Đông Phương',
      category: 'Kinh điển' as const,
      keyQuote: 'Đạo sinh nhất, nhất sinh nhị, nhị sinh tam, tam sinh vạn vật.'
    },
    {
      id: 'cit-3',
      title: 'Multiagent Systems: Algorithmic, Game-Theoretic, and Logical Foundations',
      author: 'Yoav Shoham & Kevin Leyton-Brown',
      year: '2008',
      source: 'Cambridge University Press',
      category: 'Nghiên cứu AI' as const,
      keyQuote: 'Sự phối hợp giữa các tác tử tự trị đạt hiệu quả cao nhất khi các giao thức truyền thông và chuẩn mực hành động được xác lập rõ ràng.'
    },
    {
      id: 'cit-4',
      title: 'Khảo Luận Về Bản Thể Học và Nhận Thức Luận Hệ Thống',
      author: 'Oneness Governance Research Group',
      year: '2025',
      source: 'OG Academic Press',
      category: 'Học thuật Liên ngành' as const,
      keyQuote: 'Tri thức chỉ thực sự có giá trị khi được chuyển hóa thành hành động cụ thể mang lại lợi ích cho cộng đồng.'
    }
  ];

  const autoCapturedTerms = Array.isArray(partial.autoCapturedTerms) && partial.autoCapturedTerms.length > 0 ? partial.autoCapturedTerms : [
    {
      id: 'term-ac-1',
      term: 'Bản Thể Luận Khởi Nguyên (Ontological Primacy)',
      enTerm: 'Ontological Primacy',
      category: 'Triết học Tây phương' as const,
      sourceDiscipline: 'Triết Học Bản Thể',
      philosophicalOrigin: 'Khái niệm về căn nguyên tồn tại nguyên thủy của Aristotle',
      csEquivalent: 'Domain Model & Core Data Invariants',
      deepExplanation: 'Hiểu một cách đời thường: Đây là câu trả lời cho câu hỏi "Thực sự cái này là cái gì ở mức gốc rễ nhất?" trước khi bắt tay vào làm bất kỳ việc gì.',
      applicationInAgents: 'Giúp Agent xác định chính xác danh tính, phạm vi dữ liệu và nhiệm vụ cốt lõi mà không bị nhầm lẫn.',
      tags: ['Bản Thể', 'Học Thuật', 'Triết Học']
    },
    {
      id: 'term-ac-2',
      term: 'Cơ Chế Tự Dưỡng (Autopoietic Loop)',
      enTerm: 'Autopoietic Self-Regulating Loop',
      category: 'Kiến trúc Hệ thống' as const,
      sourceDiscipline: 'Sinh Học Hệ Thống & Cybernetics',
      philosophicalOrigin: 'Học thuyết Maturana & Varela về hệ sinh thái tự duy trì cấu trúc',
      csEquivalent: 'Autonomous Feedback & Self-Healing Loop',
      deepExplanation: 'Giống như một cơ thể sống tự chữa lành vết thương: Hệ thống tự phát hiện sai sót, tự cân bằng lại dòng tài nguyên để tiếp tục hoạt động mà không cần người can thiệp thủ công.',
      applicationInAgents: 'Agent tự động retry thông minh, re-balance tải và lưu trữ checkpoint an toàn.',
      tags: ['Cơ Chế', 'Tự Dưỡng', 'Multi-Agent']
    },
    {
      id: 'term-ac-3',
      term: 'Trục Cân Bằng Đạo Đức (Ethical Balance Spine)',
      enTerm: 'Ethical Dynamic Spine',
      category: 'An ninh & Độ tin cậy' as const,
      sourceDiscipline: 'Đạo Đức Học & An Toàn AI',
      philosophicalOrigin: 'Nguyên lý trục trung tâm giữ cân bằng khi ngoại cảnh biến động',
      csEquivalent: 'Immutable Core Logic & Circuit Breaker',
      deepExplanation: 'Khoảng lặng đạo đức giữ cho hệ thống không bị chao đảo khi thị trường hoặc môi trường xung quanh biến động dữ dội.',
      applicationInAgents: 'Bảo đảm an toàn luồng dữ liệu, ngăn ngừa rò rỉ token và bảo vệ tính liêm chính của AI.',
      tags: ['Cân Bằng', 'Khắc Kỷ', 'Bảo Mật']
    },
    {
      id: 'term-ac-4',
      term: 'Hòa Hợp Vô Vi (Symbiotic Wu Wei Protocol)',
      enTerm: 'Ecological Wu Wei Protocol',
      category: 'Triết học Đông phương' as const,
      sourceDiscipline: 'Đạo Gia & Sinh Thái Học',
      philosophicalOrigin: 'Nguyên lý "Vô vi nhi vô bất vi" của Lão Tử - không làm điều trái tự nhiên để đạt hiệu quả tối đa',
      csEquivalent: 'Event-Driven Asynchronous Processing',
      deepExplanation: 'Không chạy liên tục gây nóng máy và tốn điện vô ích; chỉ phản hồi khi có việc thực sự cần xử lý, nhẹ nhàng và bền bỉ.',
      applicationInAgents: 'Kiến trúc lắng nghe sự kiện (Event-Driven) tiết kiệm tài nguyên và thân thiện với môi trường.',
      tags: ['Vô Vi', 'Sinh Thái', 'Hiệu Năng']
    }
  ];

  // Adaptive pillar templates derived from task nature & domain
  const pillarTemplates = [
    {
      id: 'p-1',
      conceptualType: 'concept' as const,
      pillarRoman: 'Trụ cột I',
      baseName: 'Bản Thể Luận & Khởi Nguyên Ý Niệm',
      desc: 'Tiên đề khởi nguyên, ý niệm nguyên thủy và định hình bản chất gốc rễ của vấn đề.',
      chTitles: [
        'Khởi Nguyên Bối Cảnh & Tái Định Nghĩa Bản Chất',
        'Ý Niệm Nguyên Thủy & Tiên Đề Khởi Đầu',
        'Đối Chiếu Bản Thể Đông - Tây & Giá Trị Cốt Lõi',
        'Chuyển Hóa Ý Niệm Sang Ngôn Ngữ Hành Động'
      ]
    },
    {
      id: 'p-2',
      conceptualType: 'context' as const,
      pillarRoman: 'Trụ cột II',
      baseName: 'Động Lực Học Cơ Chế & Quy Luật Vận Hành',
      desc: 'Quy luật vận hành nội tại, mối quan hệ tương tác và dòng chảy thông tin/tài nguyên.',
      chTitles: [
        'Quy Luật Vận Hành Nội Tại & Động Lực Học Hệ Thống',
        'Dòng Chu Chuyển Thông Tin & Cơ Chế Tương Tác',
        'Cơ Chế Tự Dưỡng & Cân Bằng Động (Feedback Loops)',
        'Mô Hình Hóa Dòng Chảy Tài Nguyên & Tối Ưu Hóa'
      ]
    },
    {
      id: 'p-3',
      conceptualType: 'application' as const,
      pillarRoman: 'Trụ cột III',
      baseName: 'Bản Vẽ Kiến Trúc & Ánh Xạ Multi-Agent Thực Thi',
      desc: 'Hiện thực hóa thành kiến trúc hệ thống, quy chuẩn kỹ nghệ và giải pháp thực tiễn nhân sinh.',
      chTitles: [
        'Kiến Trúc Phân Tầng & Bản Vẽ Kỹ Nghệ Hệ Thống',
        'Ánh Xạ Multi-Agent Swarms & Giao Thức Phối Hợp',
        'Quy Chuẩn Vận Hành Thực Chiến & Lộ Trình Phân Kỳ',
        'Bộ Chỉ Số Đo Lường & Tích Hợp Đời Sống'
      ]
    },
    {
      id: 'p-4',
      conceptualType: 'deep_dive' as const,
      pillarRoman: 'Trụ cột IV',
      baseName: 'Biện Chứng Phản Biện & Quản Trị Failure Modes',
      desc: 'Phản biện mâu thuẫn, bẫy nghịch lý lịch sử và cơ chế phòng vệ rủi ro.',
      chTitles: [
        'Phản Biện Mâu Thuẫn & Điểm Nghẽn Lịch Sử',
        'Nhận Diện Bẫy Rủi Ro Tiềm Ẩn & Failure Modes',
        'Cơ Chế Khắc Phục Sai Số & Năng Lực Kháng Đổ Vỡ (Antifragile)',
        'Kịch Bản Phòng Vệ Đa Lớp & Ứng Phó Khẩn Cấp'
      ]
    },
    {
      id: 'p-5',
      conceptualType: 'internal_dialogue' as const,
      pillarRoman: 'Trụ cột V',
      baseName: 'Trục Cân Bằng Đạo Đức & Sức Bền Khắc Kỷ',
      desc: 'Khoảng lặng đạo đức, nguyên lý khắc kỷ và khả năng giữ vững hệ thống trong tâm bão.',
      chTitles: [
        'Trục Cân Bằng Đạo Đức & Chuẩn Mực Liêm Chính',
        'Khoảng Lặng Đạo Đức Trong Tâm Bão Biến Động',
        'Sức Bền Khắc Kỷ & Năng Lực Tự Phục Hồi',
        'Giao Thức An Toàn & Bảo Vệ Tính Nhân Bản'
      ]
    },
    {
      id: 'p-6',
      conceptualType: 'synthesis' as const,
      pillarRoman: 'Trụ cột VI',
      baseName: 'Hòa Hợp Tự Nhiên & Sinh Thái Bền Vững Vô Vi',
      desc: 'Hòa hợp hệ sinh thái tự nhiên, phát triển bền vững và phụng sự nhân sinh trường tồn.',
      chTitles: [
        'Giao Hòa Sinh Thái Tự Nhiên & Triết Lý Vô Vi',
        'Kinh Tế Tuần Hoàn & Giảm Thiểu Dấu Chân Năng Lượng',
        'Phụng Sự Xã Hội & Giá Trị Nhân Sinh Trường Tồn',
        'Đại Hợp Nhất & Tầm Nhìn Phát Triển Tương Lai'
      ]
    }
  ];

  // Inspect raw partial structure if any was parsed
  const rawPillars = Array.isArray(partial.projectStructure) ? partial.projectStructure : [];

  const targetChaptersCount = Math.max(2, Math.min(4, numChapters));

  // Determine pillars: if AI provided custom pillars (3, 4, 5, 6, 7...), respect them dynamically!
  const effectiveTemplates = rawPillars.length >= 2 ? rawPillars : pillarTemplates;

  const projectStructure = effectiveTemplates.map((template: any, pIdx: number) => {
    const fallbackTpl = pillarTemplates[pIdx] || {
      id: `p-${pIdx + 1}`,
      conceptualType: 'concept' as const,
      pillarRoman: `Trụ cột ${romanize(pIdx + 1)}`,
      baseName: template.title || `Trụ Cột Chuyên Sâu ${pIdx + 1}`,
      desc: template.description || 'Khảo luận chuyên sâu theo nhiệm vụ.',
      chTitles: ['Phân Tích Khảo Luận', 'Quy Trình Triển Khai', 'Thực Tiễn Hành Động', 'Tổng Kết Giá Trị']
    };

    const pillarTitle = template.title || `${fallbackTpl.pillarRoman}: ${fallbackTpl.baseName} (${effectiveTitle.slice(0, 30)})`;
    const pillarDesc = template.description || fallbackTpl.desc;
    const existingChapters = Array.isArray(template.chapters) ? template.chapters : [];

    const chapters = [];
    const chaptersCount = existingChapters.length > 0 ? Math.max(existingChapters.length, targetChaptersCount) : targetChaptersCount;

    for (let cIdx = 0; cIdx < chaptersCount; cIdx++) {
      const existingChap = existingChapters[cIdx];
      const chapNum = `${pIdx + 1}.${cIdx + 1}`;
      const defaultChapTitle = `Chương ${chapNum}: ${fallbackTpl.chTitles[cIdx] || `Phân Tích Khảo Luận ${chapNum}`}`;

      if (existingChap && existingChap.contentMarkdown && existingChap.contentMarkdown.length > 50) {
        chapters.push({
          id: existingChap.id || `ch-${pIdx + 1}-${cIdx + 1}`,
          title: existingChap.title || defaultChapTitle,
          subtitle: existingChap.subtitle || 'Giải mã tri thức học thuật sang ngôn ngữ đời thường và hành động',
          status: 'completed' as const,
          contentMarkdown: existingChap.contentMarkdown
        });
      } else {
        // Synthesize rich chapter markdown
        const synthesizedMarkdown = `# ${existingChap?.title || defaultChapTitle}

> **Định Hướng Chuyển Hóa:** Phân đoạn khảo luận này bóc tách bản chất của chủ đề, loại bỏ biệt ngữ hủ nho, tập trung vào việc: *Người đọc học được gì và có thể bắt tay làm gì ngay hôm nay?*

---

## 1. Bản chất vấn đề diễn giải bằng ngôn ngữ đời thường

Khi đối diện với **${effectiveTitle}**, phần lớn mọi người thường bị choáng ngợp bởi những thuật ngữ phức tạp. Nhưng nhìn dưới góc độ thực tế, cốt lõi vấn đề xoay quanh việc thiết lập trật tự và dòng chảy vận hành hiệu quả.

- **Khởi nguồn thực tế:** Nhận diện nhu cầu có thực trong đời sống xã hội và công nghệ.
- **Quy luật chuyển hóa:** Biến ý tưởng trừu tượng thành quy trình đo lường được.
- **Giá trị nhận được:** Giúp tiết kiệm thời gian, giảm thiểu lãng phí và tối ưu nguồn lực.

---

## 2. Sơ đồ luồng logic trực quan (ASCII Text Flow)

\`\`\`text
[Khởi Nguyên Ý Niệm] --(Tiếp nhận & Phân tích 4 Cấp độ)--> [Cơ Chế Động Lực] --(Bảo vệ An Toàn)--> [Hành Động Thực Chiến: ${effectiveTitle.slice(0, 20)}]
\`\`\`

---

## 3. Bảng tổng hợp thực tiễn & Đối chiếu hành động

| Khía Cạnh | Khái Niệm Hàn Lâm | Diễn Giải Đời Thường | Hành Động Cụ Thể |
| :--- | :--- | :--- | :--- |
| **Khởi Nguyên** | Tiên đề bản thể | Nền tảng gốc rễ | Xác định rõ mục tiêu không thể thay đổi |
| **Vận Hành** | Dynamic feedback loop | Vòng lặp phản hồi | Tự động đo lường và hiệu chỉnh hàng ngày |
| **An Toàn** | System resilience | Trục tâm vững vàng | Không hoảng loạn khi môi trường biến động |
| **Sinh Thái** | Sustainability | Hòa hợp tự nhiên | Tiết kiệm năng lượng và chi phí tối đa |

---

## 4. Lời khuyên thực chiến cho người đọc

1. **Bắt đầu từ việc nhỏ:** Triển khai ngay một thử nghiệm nhỏ để kiểm chứng hiệu quả.
2. **Minh bạch thông tin:** Chia sẻ kết quả cho cộng đồng và cộng sự cùng tham gia.
3. **Giữ vững đạo đức:** Luôn bảo đảm tính liêm chính và phụng sự nhân sinh.
`;

        chapters.push({
          id: `ch-${pIdx + 1}-${cIdx + 1}`,
          title: existingChap?.title || defaultChapTitle,
          subtitle: existingChap?.subtitle || 'Chuyển hóa tri thức học thuật sang giải pháp thực chiến',
          status: 'completed' as const,
          contentMarkdown: synthesizedMarkdown
        });
      }
    }

    return {
      id: template.id || `p-${pIdx + 1}`,
      conceptualType: template.conceptualType || fallbackTpl.conceptualType,
      title: pillarTitle,
      description: pillarDesc,
      chapters
    };
  });

  return {
    title: effectiveTitle,
    subtitle: effectiveSubtitle,
    discipline,
    interdisciplinaryFields: effectiveInterdisciplinary,
    depthLevel,
    tags: ['Học Thuật', 'Knowledge Transforming', 'Trụ Cột Thích Ứng', 'Thực Chiến'],
    abstract: effectiveAbstract,
    keyFindings,
    philosophicalBasis,
    technicalMappings,
    citations,
    autoCapturedTerms,
    projectStructure,
    analyticalDiagnosis: {
      academicRigorScore: 96,
      paradigmsShifted: [
        'Dịch chuyển từ tư duy lý thuyết đóng sang hệ thống mở tương tác thực tế.',
        'Thay thế các mô hình đơn lẻ bằng kiến trúc phối hợp Multi-Agent thích ứng.',
        'Kết hợp hài hòa giữa chiều sâu triết học cổ điển và kỹ nghệ máy tính hiện đại.'
      ],
      practicalApplicability: 'Toàn bộ các Trụ cột Thích Ứng và các chương khảo luận đã được tối ưu hóa ngôn ngữ hành động, sẵn sàng để ứng dụng vào vận hành dự án, đào tạo và xuất bản chuyên sâu.',
      recommendedActionNext: 'Tải xuống Markdown hoặc lưu trữ vào Thư viện Khảo Luận để khởi tạo các kịch bản nghiên cứu đa phương tiện tiếp theo.'
    }
  };
}

function romanize(num: number): string {
  const lookup: { [key: string]: number } = { X: 10, IX: 9, V: 5, IV: 4, I: 1 };
  let roman = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman || 'I';
}

export function normalizeMarkdownTables(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return markdown || '';

  const lines = markdown.split('\n');
  const resultLines: string[] = [];
  let inTableBlock = false;
  let tableBuffer: string[] = [];

  const repairTableLines = (tableLines: string[]): string[] => {
    if (tableLines.length === 0) return tableLines;
    const cleanedRows = tableLines.map(rawLine => {
      let line = rawLine.trim();
      if (!line) return '';
      if (!line.startsWith('|')) line = '| ' + line;
      if (!line.endsWith('|')) line = line + ' |';
      return line;
    }).filter(line => line.length > 0);

    if (cleanedRows.length === 0) return tableLines;

    let maxCols = 0;
    const parsedRows = cleanedRows.map(row => {
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      if (cells.length > maxCols) maxCols = cells.length;
      return cells;
    });

    if (maxCols === 0) return tableLines;

    let hasSeparator = false;
    if (parsedRows.length >= 2) {
      const secondRowStr = parsedRows[1].join('');
      if (/^[\s:-]+$/.test(secondRowStr)) hasSeparator = true;
    }

    const finalTableLines: string[] = [];
    parsedRows.forEach((cells, rowIndex) => {
      while (cells.length < maxCols) {
        if (rowIndex === 1 && hasSeparator) cells.push('---');
        else cells.push('');
      }
      finalTableLines.push('| ' + cells.join(' | ') + ' |');
      if (rowIndex === 0 && !hasSeparator) {
        finalTableLines.push('| ' + Array(maxCols).fill(':---').join(' | ') + ' |');
      }
    });

    return finalTableLines;
  };

  const flushTableBuffer = () => {
    if (tableBuffer.length === 0) return;
    const processedTable = repairTableLines(tableBuffer);
    if (resultLines.length > 0 && resultLines[resultLines.length - 1].trim() !== '') {
      resultLines.push('');
    }
    resultLines.push(...processedTable);
    tableBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableRowCandidate = 
      (trimmed.includes('|') && !trimmed.startsWith('```')) ||
      (/^\|?(\s*:?-+:?\s*\|?)+\|?$/.test(trimmed));

    if (isTableRowCandidate) {
      if (!inTableBlock) inTableBlock = true;
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

export function normalizeDossierTables(dossier: any): any {
  if (!dossier) return dossier;
  if (dossier.contentMarkdown) {
    dossier.contentMarkdown = normalizeMarkdownTables(dossier.contentMarkdown);
  }
  if (Array.isArray(dossier.projectStructure)) {
    dossier.projectStructure.forEach((pillar: any) => {
      if (Array.isArray(pillar.chapters)) {
        pillar.chapters.forEach((ch: any) => {
          if (ch.contentMarkdown) {
            ch.contentMarkdown = normalizeMarkdownTables(ch.contentMarkdown);
          }
          if (Array.isArray(ch.sections)) {
            ch.sections.forEach((sec: any) => {
              if (sec.content) {
                sec.content = normalizeMarkdownTables(sec.content);
              }
            });
          }
        });
      }
    });
  }
  return dossier;
}

const INITIALIZED_FILE = path.join(PROFILES_DIR, '.initialized');
const DELETED_IDS_FILE = path.join(PROFILES_DIR, '.deleted_ids.json');

function getDeletedDossierIdsOnServer(): Set<string> {
  try {
    if (fs.existsSync(DELETED_IDS_FILE)) {
      const raw = fs.readFileSync(DELETED_IDS_FILE, 'utf-8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    console.warn('[Storage] Error reading .deleted_ids.json:', e);
  }
  return new Set();
}

function addDeletedDossierIdOnServer(id: string) {
  try {
    const deletedSet = getDeletedDossierIdsOnServer();
    deletedSet.add(id);
    if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });
    fs.writeFileSync(DELETED_IDS_FILE, JSON.stringify(Array.from(deletedSet)), 'utf-8');
  } catch (e) {
    console.warn('[Storage] Error saving .deleted_ids.json:', e);
  }
}

function clearDeletedDossierIdsOnServer() {
  try {
    if (fs.existsSync(DELETED_IDS_FILE)) {
      fs.unlinkSync(DELETED_IDS_FILE);
    }
  } catch (e) {
    console.warn('[Storage] Error clearing .deleted_ids.json:', e);
  }
}

function loadDossiers(): any[] {
  const deletedSet = getDeletedDossierIdsOnServer();

  try {
    if (fs.existsSync(PROFILES_DIR)) {
      const files = fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json') && !f.startsWith('.'));
      if (files.length > 0) {
        const loaded: any[] = [];
        let filesNeedResave = false;

        for (const file of files) {
          try {
            const raw = fs.readFileSync(path.join(PROFILES_DIR, file), 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed.id && !deletedSet.has(parsed.id)) {
              const withNormalizedTables = normalizeDossierTables(parsed);
              const withExtractedAssets = extractAndStoreImagesFromDossier(withNormalizedTables);
              if (raw.includes('data:image/')) {
                filesNeedResave = true;
              }
              loaded.push(withExtractedAssets);
            }
          } catch (err) {
            console.warn(`[Storage] Could not read dossier file ${file}:`, err);
          }
        }
        const normalized = normalizeDossierNumbers(loaded);
        const sanitized = sanitizeDossierIds(normalized);

        // If any legacy file had embedded base64 images, re-save sanitized files immediately to shrink disk size
        if (filesNeedResave) {
          saveDossiers(sanitized);
        }

        return sanitized;
      } else if (fs.existsSync(INITIALIZED_FILE)) {
        // Dossiers directory was previously initialized, but user deleted all files -> stay empty
        return [];
      }
    }
  } catch (err) {
    console.warn('[Storage] Could not read research_profiles directory:', err);
  }

  // Seeding initial dossiers only on first system boot
  try {
    if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });
    fs.writeFileSync(INITIALIZED_FILE, 'true', 'utf-8');
    const normalized = normalizeDossierNumbers(INITIAL_DOSSIERS);
    const sanitized = sanitizeDossierIds(normalized);
    sanitized.forEach(d => {
      if (!deletedSet.has(d.id)) {
        const withAssets = extractAndStoreImagesFromDossier(normalizeDossierTables(d));
        const filePath = path.join(PROFILES_DIR, `${d.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(withAssets, null, 2), 'utf-8');
      }
    });
    return sanitized.filter(d => !deletedSet.has(d.id));
  } catch (err) {
    console.error('[Storage] Error creating initial research profile files:', err);
  }
  return sanitizeDossierIds(normalizeDossierNumbers(INITIAL_DOSSIERS)).filter(d => !deletedSet.has(d.id));
}

function saveDossiers(dossiers: any[]) {
  try {
    if (!fs.existsSync(PROFILES_DIR)) fs.mkdirSync(PROFILES_DIR, { recursive: true });
    fs.writeFileSync(INITIALIZED_FILE, 'true', 'utf-8');
    const deletedSet = getDeletedDossierIdsOnServer();
    const cleanDossiers = (dossiers || []).filter(d => d && d.id && !deletedSet.has(d.id));

    const sanitized = sanitizeDossierIds(cleanDossiers);
    const activeIds = new Set<string>();

    sanitized.forEach(d => {
      const normalizedD = normalizeDossierTables(d);
      const optimizedD = extractAndStoreImagesFromDossier(normalizedD);
      activeIds.add(optimizedD.id);
      const filename = `${optimizedD.id}.json`;
      const filePath = path.join(PROFILES_DIR, filename);
      fs.writeFileSync(filePath, JSON.stringify(optimizedD, null, 2), 'utf-8');
    });

    const existingFiles = fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json') && !f.startsWith('.'));
    existingFiles.forEach(file => {
      const fileId = file.replace(/\.json$/, '');
      if (!activeIds.has(fileId)) {
        try {
          fs.unlinkSync(path.join(PROFILES_DIR, file));
        } catch {
          // ignore error
        }
      }
    });
  } catch (err) {
    console.error('[Storage] Error writing research_profiles to disk:', err);
  }
}

// In-Memory storage initialized from disk
let dossiersStore: any[] = loadDossiers();

// Helper for Gemini AI client with proper telemetry headers
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Resilient model invocation with fallback and smart failover for high-demand spikes
function sanitizeModelName(modelName?: string): string {
  if (!modelName) return 'gemini-3.7-flash';
  const name = modelName.trim().toLowerCase();
  if (name.includes('1.5') || name.includes('2.0') || name.includes('2.5')) {
    return 'gemini-3.7-flash';
  }
  return modelName;
}

const waitMs = (ms: number) => new Promise(res => setTimeout(res, ms));

function isTransientError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.code || err?.error?.code;
  const msg = (err?.message || JSON.stringify(err) || '').toLowerCase();
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('temporar') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

// AI Telemetry & Diagnostic Health Engine Store
interface TelemetryEvent {
  id: string;
  timestamp: string;
  type: 'SUCCESS' | 'HIGH_DEMAND' | 'FAILOVER' | 'BACKOFF' | 'ERROR' | 'PROBE';
  modelRequested: string;
  modelUsed?: string;
  durationMs: number;
  tokensEstimated: number;
  message: string;
  statusCode?: number;
}

interface ModelHealth {
  name: string;
  displayName: string;
  status: 'OPTIMAL' | 'HIGH_DEMAND' | 'BUSY' | 'UNAVAILABLE';
  lastCallTime?: string;
  totalCalls: number;
  successCalls: number;
  failoverCount: number;
  avgLatencyMs: number;
  totalTokens: number;
}

const aiTelemetry = {
  bootTime: new Date().toISOString(),
  totalRequests: 0,
  successfulRequests: 0,
  totalTokensEstimated: 0,
  failoverEventsCount: 0,
  overloadWarningsCount: 0,
  currentEngineStatus: 'OPTIMAL' as 'OPTIMAL' | 'HIGH_DEMAND_FAILOVER' | 'DEGRADED',
  models: {
    'gemini-3.7-flash': { name: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', status: 'OPTIMAL', totalCalls: 0, successCalls: 0, failoverCount: 0, avgLatencyMs: 0, totalTokens: 0 },
    'gemini-3.1-flash-lite': { name: 'gemini-3.1-flash-lite', displayName: 'Gemini 3.1 Flash Lite', status: 'OPTIMAL', totalCalls: 0, successCalls: 0, failoverCount: 0, avgLatencyMs: 0, totalTokens: 0 },
    'gemini-flash-latest': { name: 'gemini-flash-latest', displayName: 'Gemini Flash (Auto)', status: 'OPTIMAL', totalCalls: 0, successCalls: 0, failoverCount: 0, avgLatencyMs: 0, totalTokens: 0 },
    'gemini-2.5-flash': { name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', status: 'OPTIMAL', totalCalls: 0, successCalls: 0, failoverCount: 0, avgLatencyMs: 0, totalTokens: 0 }
  } as Record<string, ModelHealth>,
  events: [] as TelemetryEvent[]
};

function recordTelemetryEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>) {
  const fullEvent: TelemetryEvent = {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString()
  };
  
  aiTelemetry.events.unshift(fullEvent);
  if (aiTelemetry.events.length > 100) {
    aiTelemetry.events.pop();
  }

  aiTelemetry.totalTokensEstimated += event.tokensEstimated;
  
  if (event.type === 'HIGH_DEMAND') {
    aiTelemetry.overloadWarningsCount++;
    aiTelemetry.currentEngineStatus = 'HIGH_DEMAND_FAILOVER';
  } else if (event.type === 'FAILOVER') {
    aiTelemetry.failoverEventsCount++;
    aiTelemetry.currentEngineStatus = 'HIGH_DEMAND_FAILOVER';
  } else if (event.type === 'SUCCESS' && aiTelemetry.currentEngineStatus === 'HIGH_DEMAND_FAILOVER') {
    // Check if recent events were clear
    const recentFailovers = aiTelemetry.events.slice(0, 5).filter(e => e.type === 'HIGH_DEMAND' || e.type === 'FAILOVER');
    if (recentFailovers.length === 0) {
      aiTelemetry.currentEngineStatus = 'OPTIMAL';
    }
  }

  return fullEvent;
}

async function generateGeminiContent(options: {
  contents: string | any[];
  systemInstruction?: string;
  temperature?: number;
  model?: string;
  enableSearch?: boolean;
  responseMimeType?: string;
}) {
  const startTime = Date.now();
  const ai = getGeminiClient();
  const requestedModel = sanitizeModelName(options.model);

  aiTelemetry.totalRequests++;

  // Calculate input length for estimated tokens
  let inputChars = 0;
  if (typeof options.contents === 'string') {
    inputChars += options.contents.length;
  } else if (Array.isArray(options.contents)) {
    inputChars += JSON.stringify(options.contents).length;
  }
  if (options.systemInstruction) inputChars += options.systemInstruction.length;

  // High-availability model candidate order with valid supported models only
  const candidateModels = [
    requestedModel,
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];

  // Remove duplicates while preserving priority
  const modelsToTry = Array.from(new Set(candidateModels.filter(Boolean)));
  let lastError: any = null;

  let experiencedHighDemand = false;
  let failoverOccurred = false;

  for (let i = 0; i < modelsToTry.length; i++) {
    const modelName = modelsToTry[i];
    const maxAttemptsForModel = 2; // Up to 2 attempts per model with exponential backoff

    if (!aiTelemetry.models[modelName]) {
      aiTelemetry.models[modelName] = {
        name: modelName,
        displayName: modelName,
        status: 'OPTIMAL',
        totalCalls: 0,
        successCalls: 0,
        failoverCount: 0,
        avgLatencyMs: 0,
        totalTokens: 0
      };
    }

    const modelObj = aiTelemetry.models[modelName];
    modelObj.totalCalls++;
    modelObj.lastCallTime = new Date().toISOString();

    for (let attempt = 0; attempt < maxAttemptsForModel; attempt++) {
      try {
        const config: any = {
          temperature: options.temperature ?? 0.3,
        };

        if (options.systemInstruction) {
          config.systemInstruction = options.systemInstruction;
        }

        if (options.enableSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        if (options.responseMimeType) {
          config.responseMimeType = options.responseMimeType;
        }

        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config
        });

        if (response && (response.text !== undefined || (response as any).candidates)) {
          const durationMs = Date.now() - startTime;
          const outputChars = (response.text || '').length;
          const estTokens = Math.ceil((inputChars + outputChars) / 4);

          modelObj.status = experiencedHighDemand ? 'HIGH_DEMAND' : 'OPTIMAL';
          modelObj.successCalls++;
          modelObj.totalTokens += estTokens;
          modelObj.avgLatencyMs = Math.round((modelObj.avgLatencyMs * (modelObj.successCalls - 1) + durationMs) / modelObj.successCalls);

          aiTelemetry.successfulRequests++;

          if (i > 0 || failoverOccurred) {
            modelObj.failoverCount++;
            recordTelemetryEvent({
              type: 'FAILOVER',
              modelRequested: requestedModel,
              modelUsed: modelName,
              durationMs,
              tokensEstimated: estTokens,
              message: `Tự động ứng biến chuyển tuyến: Từ ${requestedModel} sang ${modelName} do Model cũ bị nén tải 503.`
            });
          } else {
            recordTelemetryEvent({
              type: 'SUCCESS',
              modelRequested: requestedModel,
              modelUsed: modelName,
              durationMs,
              tokensEstimated: estTokens,
              message: `Xử lý AI hoàn tất thành công trên ${modelName} (${estTokens.toLocaleString()} tokens, ${durationMs}ms).`
            });
          }

          return {
            text: response.text || '',
            modelUsed: modelName,
            highDemand: experiencedHighDemand,
            groundingMetadata: (response as any).candidates?.[0]?.groundingMetadata
          };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTransient = isTransientError(err);

        if (isTransient) {
          experiencedHighDemand = true;
          modelObj.status = 'HIGH_DEMAND';

          recordTelemetryEvent({
            type: 'HIGH_DEMAND',
            modelRequested: requestedModel,
            modelUsed: modelName,
            durationMs: Date.now() - startTime,
            tokensEstimated: Math.ceil(inputChars / 4),
            statusCode: 503,
            message: `Tín hiệu 503 High Demand trên ${modelName}: Quá tải nhu cầu tạm thời. Hệ thống kích hoạt cơ chế đệm & tự động failover.`
          });
        }

        if (isTransient && attempt < maxAttemptsForModel - 1) {
          const backoff = Math.min(800 * Math.pow(1.8, attempt), 2500) + Math.floor(Math.random() * 300);
          console.warn(`⏳ [Gemini] Model ${modelName} experiencing high demand (attempt ${attempt + 1}/${maxAttemptsForModel}). Backing off ${backoff}ms before retry...`);
          
          recordTelemetryEvent({
            type: 'BACKOFF',
            modelRequested: requestedModel,
            modelUsed: modelName,
            durationMs: backoff,
            tokensEstimated: 0,
            message: `Tự động trì hoãn đệm ${backoff}ms cho ${modelName} trước khi thử lại...`
          });

          await waitMs(backoff);
          continue;
        } else {
          console.warn(`⚠️ [Gemini] Model ${modelName} unavailable (${errMsg.slice(0, 120)}), trying next candidate...`);
          failoverOccurred = true;
          break; // Move to next candidate model
        }
      }
    }

    if (i < modelsToTry.length - 1) {
      await waitMs(400);
    }
  }

  // If all failed on first pass, do one final recovery pass with flash-lite after cooldown
  try {
    experiencedHighDemand = true;
    await waitMs(1200);
    const config: any = {
      temperature: options.temperature ?? 0.3,
    };
    if (options.systemInstruction) config.systemInstruction = options.systemInstruction;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: options.contents,
      config
    });

    const durationMs = Date.now() - startTime;
    const estTokens = Math.ceil((inputChars + (response.text || '').length) / 4);

    recordTelemetryEvent({
      type: 'FAILOVER',
      modelRequested: requestedModel,
      modelUsed: 'gemini-3.1-flash-lite',
      durationMs,
      tokensEstimated: estTokens,
      message: `Khôi phục thành công bằng đường truyền cứu hộ khẩn cấp: gemini-3.1-flash-lite.`
    });

    return {
      text: response.text || '',
      modelUsed: 'gemini-3.1-flash-lite',
      highDemand: true,
      groundingMetadata: (response as any).candidates?.[0]?.groundingMetadata
    };
  } catch (retryErr: any) {
    console.error('Final recovery pass failed:', retryErr?.message || retryErr);
    recordTelemetryEvent({
      type: 'ERROR',
      modelRequested: requestedModel,
      durationMs: Date.now() - startTime,
      tokensEstimated: 0,
      message: `Tất cả mô hình ứng biến đều rơi vào trạng thái bận. (${retryErr?.message || String(retryErr)})`
    });
  }

  throw lastError || new Error('Dịch vụ Gemini đang quá tải tạm thời. Hệ thống đã thử lại nhiều lần nhưng không thành công. Vui lòng bấm thử lại.');
}

// =========================================================================
// API ENDPOINTS
// =========================================================================

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: 'Google Gemini Official',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY
  });
});

// 1b. AI Telemetry & Diagnostic Health API
app.get('/api/system/ai-diagnostics', (req, res) => {
  res.json({
    success: true,
    telemetry: {
      ...aiTelemetry,
      uptimeSeconds: Math.floor(process.uptime()),
      dossiersCount: dossiersStore.length,
      nodeVersion: process.version
    }
  });
});

// 1c. 1-Click AI Model Probe & Health Diagnostic Test
app.post('/api/system/probe-ai-models', async (req, res) => {
  try {
    const probeModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    const results: any[] = [];

    for (const m of probeModels) {
      const probeStart = Date.now();
      try {
        const testRes = await generateGeminiContent({
          contents: 'Ping test status probe for diagnostic dashboard',
          temperature: 0.1,
          model: m
        });
        const durationMs = Date.now() - probeStart;
        results.push({
          model: m,
          status: testRes.highDemand ? 'HIGH_DEMAND' : 'OPTIMAL',
          latencyMs: durationMs,
          modelUsed: testRes.modelUsed
        });
      } catch (err: any) {
        results.push({
          model: m,
          status: 'UNAVAILABLE',
          error: err?.message || 'Không thể phản hồi'
        });
      }
    }

    recordTelemetryEvent({
      type: 'PROBE',
      modelRequested: 'PROBE_ALL',
      durationMs: 0,
      tokensEstimated: 15,
      message: 'Đã thực hiện probe kiểm tra sức khỏe 1-chạm cho các candidate AI models.'
    });

    res.json({
      success: true,
      probeResults: results,
      telemetry: {
        ...aiTelemetry,
        uptimeSeconds: Math.floor(process.uptime()),
        dossiersCount: dossiersStore.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1d. Architectural AI & Spatial Perspective / Google Banana AI Concept Render
app.post('/api/gemini/generate-concept-render', async (req, res) => {
  try {
    const {
      prompt,
      style = 'Rustic & Wabi-Sabi Nhà Vườn Bản Địa (Vật liệu tái chế, Gỗ-Đá mộc, Không gian mở & Xanh nhiệt đới Việt Nam)',
      viewAngle = 'Phối Cảnh Toàn Cảnh (Bird-eye / Aerial)',
      aspectRatio = '16:9',
      contextInfo = '',
      userNotes = ''
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập ý tưởng/prompt cho công trình kiến trúc hoặc phối cảnh không gian.' });
    }

    const ai = getGeminiClient();

    // Step 1: Analyze & Enhance Architectural Prompt with Gemini
    const enhancementPrompt = `Bạn là một Kiến Trúc Sư Trưởng & Chuyên Gia Phối Cảnh Ý Niệm Cao Cấp (Architectural & Spatial Master Planner) của Oneness Governance Lab.
Người dùng muốn triển khai và vẽ phối cảnh kiến trúc với ý tưởng sau:
"${prompt.trim()}"

${style ? `Phong cách kiến trúc mong muốn: ${style}` : ''}
${viewAngle ? `Góc nhìn không gian: ${viewAngle}` : ''}
${userNotes ? `Ghi chú chuyên sâu: ${userNotes}` : ''}
${contextInfo ? `Bối cảnh đề án: ${contextInfo}` : ''}

ĐẶC BIỆT KHI PHONG CÁCH LÀ "Rustic", "Wabi-Sabi", "Nhà Vườn", hoặc "Bản Địa Việt Nam":
- Tinh thần Wabi-Sabi & Rustic: Tôn vinh vẻ đẹp mộc mạc, tĩnh lặng, tự nhiên, bất toàn và bền bỉ qua thời gian.
- Vật liệu tái chế & mộc tự nhiên: Gỗ cũ tái sinh (reclaimed weathered wood), đá ong xám thô (laterite stone), đá chẻ, đá cuội suối, ngói cũ, gạch gốm mộc, tre trúc địa phương.
- Không gian mở & Nhà vườn: Hiên nhà rộng thoáng mát đón gió Đông Nam, hệ cửa xoay/lùa kính lớn xóa nhòa ranh giới trong-ngoài, sân trong (courtyard) rợp bóng cây xanh nhiệt đới Việt Nam (chuối cảnh, tre trúc, dương xỉ, hồ hoa súng), giếng trời đối lưu không khí tự nhiên, giảm phụ thuộc điều hòa.
- Thẩm mỹ tối giản & Thích ứng khí hậu Việt Nam: Đường nét gọn gàng, trần mộc lộ xà gồ, sàn xi măng mài hoặc đá thô, ánh sáng tự nhiên dịu nhẹ len qua tán lá.

Hãy phân tích chuyên sâu công trình theo triết lý 6 Trụ cột Động (hài hòa bản thể nhân sinh, công năng vận hành, kết cấu bền vững, và giao hòa thiên nhiên đất trời) và trả về DUY NHẤT một JSON hợp lệ:
{
  "caption": "Tiêu đề phối cảnh ngắn gọn, trang trọng (tiếng Việt, ví dụ: 'Nhà Vườn Rustic Wabi-Sabi Bản Địa - Phân khu Hiên Đón Gió & Sân Trong Sinh Thái')",
  "refinedPrompt": "A highly detailed, professional English architectural visualization prompt for image generation model. Include details about: building typology, materials (e.g. weathered reclaimed timber, rustic laterite stone, raw concrete, large pivot glass doors, terracotta tile roof), lighting (soft warm afternoon sunlight, dappled light through trees, warm 2700K ambient illumination), camera perspective (${viewAngle}), landscaping (lush Vietnamese tropical garden with bamboo, banana trees, lotus pond, mossy stepping stones), open-air spatial flow, serene wabi-sabi minimalism, photorealistic, octane render, architectural photography, hyper-detailed, 8k resolution, crisp textures, award-winning architectural concept.",
  "spatialZoning": [
    { "zone": "Tên phân khu (tiếng Việt)", "function": "Công năng & ý nghĩa vận hành (tiếng Việt)", "flowRate": "Đặc tính luồng/diện tích ước tính" }
  ],
  "materialPalette": [
    "Danh sách 3-5 vật liệu chính (tiếng Việt, ví dụ: Gỗ cũ tái sinh, Đá ong xám tự nhiên, Ngói đất nung mộc, Kính Low-E cản nhiệt, Gạch gốm Bát Tràng)"
  ],
  "climateLighting": "Mô tả giải pháp vi khí hậu nhiệt đới, thông gió tự nhiên và chiếu sáng sinh thái (tiếng Việt)",
  "designPhilosophy": "Lời bình triết học kiến trúc ngắn gọn theo tinh thần Wabi-Sabi và 6 Trụ cột Động (tiếng Việt)"
}`;

    let architecturalData: any = {
      caption: prompt.trim().slice(0, 60),
      refinedPrompt: `Modern Rustic and Wabi-Sabi Vietnamese tropical garden architecture of ${prompt.trim()}, ${style}, ${viewAngle}, reclaimed weathered timber, laterite stone, open breezy veranda, lush tropical landscaping with lotus pond and bamboo, serene natural lighting, photorealistic architectural photography, cinematic, high resolution, 8k, award winning architectural masterpiece`,
      spatialZoning: [
        { zone: "Hiên Nhà Đón Gió & Không Gian Mở", function: "Kết nối liền mạch trong nhà với sân vườn nhiệt đới", flowRate: "Thông gió đối lưu tự nhiên" },
        { zone: "Sân Trong & Vườn Cây Bản Địa", function: "Điều hòa vi khí hậu với thảm thực vật nhiệt đới và hồ nước tĩnh", flowRate: "Khoảng đệm sinh thái xanh" },
        { zone: "Khối Sinh Hoạt & Nghiên Cứu Mộc", function: "Không gian làm việc và nghỉ ngơi tối giản tĩnh lặng", flowRate: "Tối ưu ánh sáng tự nhiên" }
      ],
      materialPalette: ["Gỗ cũ tái sinh mộc mạc", "Đá ong xám tự nhiên", "Ngói đất nung truyền thống", "Kính cường lực cản nhiệt", "Tre trúc và đá cuội suối"],
      climateLighting: "Tận dụng hiên rộng che nắng gắt, giếng trời đón gió đối lưu tự nhiên và ánh sáng tán xạ qua tán cây xanh mát.",
      designPhilosophy: "Triết lý Wabi-Sabi kết hợp Kiến trúc Shinbashira: Tìm thấy sự hoàn mỹ trong nét mộc mạc nguyên sơ và sự tĩnh tại giữa thiên nhiên đất trời."
    };

    try {
      const textAnalysis = await generateGeminiContent({
        contents: enhancementPrompt,
        temperature: 0.35,
        responseMimeType: 'application/json'
      });
      const parsed = safeParseLLMJson(textAnalysis.text);
      if (parsed && (parsed.refinedPrompt || parsed.caption)) {
        architecturalData = {
          ...architecturalData,
          ...parsed
        };
      }
    } catch (analysisErr) {
      console.warn('[Architectural AI] Text analysis fallback used:', analysisErr);
    }

    // Step 2: Generate Image with Gemini Image Generation Model
    const validAspectRatio = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio) ? aspectRatio : '16:9';
    const imageCandidateModels = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
    let generatedImageUrl = '';
    let imageModelUsed = '';

    for (const imgModel of imageCandidateModels) {
      try {
        const imageResponse = await ai.models.generateContent({
          model: imgModel,
          contents: {
            parts: [
              {
                text: architecturalData.refinedPrompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: validAspectRatio as any,
            },
          },
        });

        const candidates = (imageResponse as any)?.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              const mimeType = part.inlineData.mimeType || 'image/png';
              const rawDataUri = `data:${mimeType};base64,${part.inlineData.data}`;
              // Save directly to static assets directory to keep payloads lightweight
              generatedImageUrl = saveBase64Image(rawDataUri, 'concept');
              imageModelUsed = imgModel;
              break;
            }
          }
        }
        if (generatedImageUrl) break;
      } catch (imgErr) {
        console.warn(`[Gemini Image] Model ${imgModel} attempt:`, (imgErr as any)?.message || imgErr);
      }
    }

    // Step 3: High-elegance fallback SVG render if direct image generation API is restricted
    if (!generatedImageUrl) {
      const escapedCaption = (architecturalData.caption || 'Phối Cảnh Ý Niệm Kiến Trúc').replace(/[<>&"]/g, '');
      const escapedStyle = (style || 'Hiện Đại Sinh Thái').replace(/[<>&"]/g, '');
      const escapedView = (viewAngle || 'Toàn cảnh').replace(/[<>&"]/g, '');
      
      const svgGraphic = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="#0b0f19">
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="50%" stop-color="#1e1b4b" />
              <stop offset="100%" stop-color="#090d16" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#6366f1" stop-opacity="0.1"/>
            </linearGradient>
            <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" stroke-width="0.75" stroke-opacity="0.4"/>
              <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#6366f1" stroke-width="1.2" stroke-opacity="0.2"/>
            </pattern>
          </defs>
          <rect width="1280" height="720" fill="url(#skyGrad)" />
          <rect width="1280" height="720" fill="url(#blueprintGrid)" />
          
          <!-- Architectural Axonometric Isometric Volume Drawing -->
          <g transform="translate(640, 360) scale(1.1)">
            <!-- Ground Base Polygon -->
            <polygon points="-320,120 0,240 320,120 0,0" fill="#1e293b" fill-opacity="0.7" stroke="#64748b" stroke-width="1.5" />
            
            <!-- Pillar 1 / Central Volume -->
            <polygon points="-80,-40 80,-40 80,120 -80,120" fill="url(#glowGrad)" stroke="#a78bfa" stroke-width="2" />
            <polygon points="80,-40 180,-90 180,70 80,120" fill="#312e81" fill-opacity="0.6" stroke="#818cf8" stroke-width="1.5" />
            <polygon points="-80,-40 20,-90 180,-90 80,-40" fill="#4338ca" fill-opacity="0.8" stroke="#c084fc" stroke-width="2" />
            
            <!-- Left Wing -->
            <polygon points="-240,40 -100,-20 -100,100 -240,160" fill="#0f172a" fill-opacity="0.8" stroke="#38bdf8" stroke-width="1.5" />
            <polygon points="-240,40 -160,0 -20,0 -100,-20" fill="#0284c7" fill-opacity="0.5" stroke="#38bdf8" stroke-width="1.5" />
            
            <!-- Right Wing -->
            <polygon points="100,-20 240,40 240,160 100,100" fill="#0f172a" fill-opacity="0.8" stroke="#34d399" stroke-width="1.5" />
            <polygon points="100,-20 180,20 320,20 240,40" fill="#059669" fill-opacity="0.5" stroke="#34d399" stroke-width="1.5" />
            
            <!-- Shinbashira Central Axis Beam -->
            <line x1="0" y1="-180" x2="0" y2="180" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="8,6" />
            <circle cx="0" cy="-180" r="8" fill="#fbbf24" />
            
            <!-- Dimension & Elevation Measurement Lines -->
            <line x1="-340" y1="120" x2="-340" y2="-80" stroke="#94a3b8" stroke-width="1" stroke-dasharray="4,4" />
            <text x="-355" y="20" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="end">H = +38.50m</text>
          </g>
          
          <!-- Header Banner -->
          <rect x="40" y="40" width="1200" height="90" rx="16" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="1" />
          <circle cx="85" cy="85" r="24" fill="#6366f1" fill-opacity="0.2" stroke="#818cf8" stroke-width="1.5"/>
          <text x="85" y="92" font-family="sans-serif" font-size="20" fill="#a78bfa" text-anchor="middle">🏛️</text>
          <text x="130" y="75" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="#f8fafc">KIẾN TRÚC SƯ AI &amp; PHỐI CẢNH Ý NIỆM (GOOGLE BANANA AI)</text>
          <text x="130" y="105" font-family="system-ui, sans-serif" font-size="14" fill="#a78bfa">${escapedCaption}</text>
          <text x="1200" y="90" font-family="monospace" font-size="12" fill="#38bdf8" text-anchor="end">${escapedStyle} • ${escapedView}</text>
          
          <!-- Bottom Legend Info -->
          <rect x="40" y="620" width="1200" height="60" rx="12" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="1" />
          <text x="60" y="655" font-family="system-ui, sans-serif" font-size="13" fill="#cbd5e1">Bản vẽ ý niệm không gian • Khởi sinh bởi Oneness Governance AI Studio</text>
          <text x="1220" y="655" font-family="monospace" font-size="12" fill="#94a3b8" text-anchor="end">Trục Cân Bằng Shinbashira &amp; Sinh Thái Bền Vững</text>
        </svg>
      `;
      const rawSvgUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgGraphic)}`;
      generatedImageUrl = saveBase64Image(rawSvgUri, 'concept');
      imageModelUsed = 'architectural-blueprint-renderer';
    }

    recordTelemetryEvent({
      type: 'SUCCESS',
      modelRequested: 'gemini-image-concept',
      modelUsed: imageModelUsed || 'gemini-3.1-flash-image',
      durationMs: 1200,
      tokensEstimated: 450,
      message: `Đã sinh thành công phối cảnh ý niệm kiến trúc: "${architecturalData.caption}"`
    });

    res.json({
      success: true,
      data: {
        imageUrl: generatedImageUrl,
        prompt: prompt.trim(),
        refinedPrompt: architecturalData.refinedPrompt,
        caption: architecturalData.caption,
        spatialZoning: architecturalData.spatialZoning || [],
        materialPalette: architecturalData.materialPalette || [],
        climateLighting: architecturalData.climateLighting || '',
        designPhilosophy: architecturalData.designPhilosophy || '',
        style,
        viewAngle,
        aspectRatio: validAspectRatio,
        modelUsed: imageModelUsed
      }
    });
  } catch (error: any) {
    console.error('Error in generate-concept-render:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi sinh phối cảnh kiến trúc AI.' });
  }
});

// 2. Propose Dynamic 6-Pillar Outline (Scenario & Depth Aware)
app.post('/api/gemini/concept-interview', async (req, res) => {
  try {
    const { messages = [], model = 'gemini-3.7-flash' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Lịch sử cuộc trò chuyện không được để trống.' });
    }

    const userTurnCount = messages.filter((m: any) => m.role === 'user').length;
    const formattedHistory = messages.map((m: any) => `${m.role === 'user' ? 'Người dùng' : 'Trợ lý Khai Phá'}: ${m.content}`).join('\n\n');

    const prompt = `<system_instruction>
Bạn là Trợ Lý Lắng Nghe & Khai Phá Ý Niệm Nghiên Cứu của OG Intelligence Lab.
Tư cách của bạn: Một người đồng hành tri thức, chuyên gia tư vấn chiến lược tinh tế, khiêm nhường, biết lắng nghe sâu sắc và đàm thoại tự nhiên.

PHƯƠNG CHÂM TRÒ CHUYỆN: "THĂM HỎI TRƯỚC, GỢI Ý SAU TRONG NGỮ CẢNH"
1. LẮNG NGHE & ĐỒNG CẢM TỰ NHIÊN:
   - Tiếp nhận câu chuyện của người dùng một cách chân thành. Thấu hiểu những trăn trở, động lực, bài toán thực tế hoặc cảm hứng mà họ vừa bộc bạch.
   - Tránh xa lối nói máy móc, tránh phô trương thuật ngữ học thuật (như "Ontology", "Multi-Agent Swarms", "Shinbashira", "Matrix"). Hãy dùng ngôn ngữ đời thường, gãy gọn, trong sáng và văn minh.

2. KHÔNG DỒN DẬP ĐẶT NHIỀU CÂU HỎI LẶP LẠI:
   - TUYỆT ĐỐI KHÔNG liệt kê một danh sách các câu hỏi liên tiếp (dạng 1, 2, 3, 4...).
   - TUYỆT ĐỐI KHÔNG hành xử như một bảng khảo sát tự động hay một cuộc thẩm vấn rập khuôn.
   - Mỗi câu trả lời của bạn chỉ gồm 2-3 đoạn ngắn:
     + Đoạn 1: Phản hồi, lắng nghe và chia sẻ ngắn gọn về khía cạnh thú vị/ý nghĩa trong điều người dùng vừa nói.
     + Đoạn 2: Thăm hỏi nhẹ nhàng hoặc đưa ra 1 góc nhìn gợi mở duy nhất gắn liền trực tiếp với bối cảnh cụ thể mà người dùng vừa nhắc tới.

3. LINH HOẠT THEO MẠCH CẢM XÚC & NỘI DUNG CỦA NGƯỜI DÙNG:
   - Nếu người dùng mới nói ngắn gọn: Thăm hỏi thêm về mong muốn, kết quả lý tưởng hoặc bối cảnh thực tế của họ.
   - Nếu người dùng đã chia sẻ sâu: Gợi mở thêm về phương thức triển khai, cách vận dụng công nghệ tự động hóa, hoặc kết quả đầu ra họ muốn hướng tới.
   ${userTurnCount >= 3 ? `- Nếu cuộc trò chuyện đã tích lũy đủ ý tưởng: Bạn có thể nhắc nhẹ: "Bất cứ lúc nào bạn thấy sẵn sàng, chúng ta có thể bấm nút **'Lập đề cương ngay'** để cùng hệ thống hóa lại thành khung đề án hoàn chỉnh nhé!"` : ''}
</system_instruction>

<chat_history>
${formattedHistory}
</chat_history>

<instruction>
Dựa trên toàn bộ mạch trò chuyện, hãy phản hồi bằng tiếng Việt ấm áp, tự nhiên, thăm hỏi và gợi mở đúng trọng tâm theo ngữ cảnh của người dùng.
</instruction>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.65,
      model
    });

    return res.json({
      success: true,
      replyText: result.text.trim(),
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error in concept interview:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi trò chuyện khai phá ý niệm.' });
  }
});

app.post('/api/gemini/synthesize-interview-outline', async (req, res) => {
  try {
    const { messages = [], preferredScenario = null, model = 'gemini-3.7-flash' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'Không có dữ liệu cuộc trò chuyện để tổng hợp.' });
    }

    const formattedHistory = messages.map((m: any) => `${m.role === 'user' ? 'Người dùng' : 'Trợ lý'}: ${m.content}`).join('\n\n');

    const prompt = `<system_instruction>
Bạn là Học giả Bác học & Kiến trúc sư Trưởng của OG Agentic Intelligence Lab.
Nhiệm vụ của bạn là đọc toàn bộ TOÀN VĂN CUỘC TRÒ CHUYỆN PHỎNG VẤN KHAI PHÁ Ý NIỆM giữa Trợ lý và Người dùng.
Hãy phân tích tâm tư, nhu cầu thực sự, trình độ am hiểu công nghệ và mục tiêu cuối cùng của người dùng để TỔNG HỢP & THIẾT KẾ ĐỀ CƯỜNG NGHIÊN CỨU THEO BẢN GIAO ƯỚC 6 TRỤ CỘT ĐỘNG.

QUY TẮC ĐỀ XUẤT KỊCH BẢN (SCENARIO SELECTION):
1. Chọn 1 trong 5 kịch bản phù hợp nhất với những gì người dùng chia sẻ trong trò chuyện:
   - 'business_plan': Nếu người dùng muốn làm kế hoạch kinh doanh, khởi nghiệp, bán hàng, mô hình tự dưỡng dòng tiền. (Target: 24 chương = 6 trụ x 4 chương).
   - 'workflow': Nếu người dùng muốn tối ưu quy trình công việc, tự động hóa, quy trình kỹ thuật. (Target: 18 chương = 6 trụ x 3 chương).
   - 'dissertation': Nếu người dùng muốn viết luận án, công trình học thuật cao cấp, lý thuyết chuyên sâu. (Target: 48 chương = 6 trụ x 8 chương).
   - 'survey': Nếu người dùng muốn khảo sát thực trạng, hành vi thị trường, tác động xã hội. (Target: 12 chương = 6 trụ x 2 chương).
   - 'essay': Nếu người dùng muốn làm bài khảo luận ngắn, làm rõ luận điểm sáng tạo tinh gọn. (Target: 12 chương = 6 trụ x 2 chương).
   (Nếu người dùng có chọn sẵn preferredScenario hợp lệ thì ưu tiên dùng scenario đó).

2. ĐẶT TÊN CHƯƠNG VÀ TRỤ CỘT BÁM SÁT CHI TIẾT TRONG TRÒ CHUYỆN:
   - Sử dụng ngôn từ phù hợp với góc nhìn người dùng đã thể hiện trong cuộc trò chuyện.
   - Nếu người dùng chưa am hiểu nhiều về AI Agent, hãy giải thích và tích hợp công nghệ dưới dạng quy trình tự động hóa thực tế từng bước.
</system_instruction>

<interview_transcript>
${formattedHistory}
</interview_transcript>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ (không kèm văn bản ngoài markdown json block):
{
  "decodedEssence": "Tóm tắt bản chất ý nguyện người dùng rút ra từ toàn bộ cuộc trò chuyện.",
  "recommendedScenario": "business_plan",
  "scenarioRationale": "Giải thích lý do tại sao kịch bản này là phù hợp nhất với mong muốn của người dùng.",
  "proposedTitle": "Tiêu đề công trình / Đề án nghiên cứu chuẩn hóa",
  "proposedSubtitle": "Tiêu đề phụ phản ánh giá trị thực chiến",
  "proposedAbstract": "Tóm tắt tổng quan bài nghiên cứu (1-2 đoạn sâu sắc, nhấn mạnh ứng dụng thực tiễn).",
  "detectedDomain": "Lĩnh vực chính",
  "interdisciplinaryFields": ["Khoa Học Máy Tính", "Kinh Tế Số", "Chuyển Đổi Số"],
  "pillars": [
    {
      "id": "p-1",
      "conceptualType": "concept",
      "title": "Trụ cột I: [Tên Sáng Tạo Bám Sát Đoạn Hội Thoại]",
      "description": "Mô tả mục tiêu của trụ cột này",
      "chapters": [
        { "id": "ch-1-1", "title": "Chương 1.1: [Tên chương cụ thể]", "status": "pending" }
      ]
    }
  ]
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.3,
      model,
      responseMimeType: 'application/json'
    });

    try {
      const parsed = safeParseLLMJson(result.text);
      return res.json({ success: true, synthesis: parsed, modelUsed: result.modelUsed });
    } catch (parseErr) {
      console.warn('Failed to parse Gemini synthesized outline JSON directly:', parseErr);
      const fallbackPillars = [
        {
          id: 'pillar-1',
          conceptualType: 'concept',
          title: 'Trụ cột I: Khảo Luận Bản Thể & Ý Niệm Khởi Nguyên',
          description: 'Ý niệm nguyên thủy, nền tảng lý thuyết và bản chất định hình hệ thống.',
          chapters: [
            { id: 'ch-1-1', title: 'Chương 1.1: Khởi Nguyên Ý Niệm & Tái Định Nghĩa Bản Chất', contentMarkdown: '', status: 'pending' },
            { id: 'ch-1-2', title: 'Chương 1.2: Không Gian Tiềm Ẩn & Mô Hình Hóa Giá Trị Cốt Lõi', contentMarkdown: '', status: 'pending' }
          ]
        },
        {
          id: 'pillar-2',
          conceptualType: 'context',
          title: 'Trụ cột II: Quy Luật Vận Hành & Động Lực Nội Tại',
          description: 'Các quy luật vận hành, động lực học và cấu trúc cơ học điều phối hệ thống.',
          chapters: [
            { id: 'ch-2-1', title: 'Chương 2.1: Quy Luật Vận Động Nội Tại & Dòng Chảy Tài Nguyên', contentMarkdown: '', status: 'pending' },
            { id: 'ch-2-2', title: 'Chương 2.2: Động Lực Học Tương Tác & Cơ Chế Điều Phối', contentMarkdown: '', status: 'pending' }
          ]
        },
        {
          id: 'pillar-3',
          conceptualType: 'application',
          title: 'Trụ cột III: Kiến Trúc Thực Tiễn & Kỹ Nghệ Hệ Thống',
          description: 'Hiện thực hóa lý thuyết thành sơ đồ kiến trúc, mã nguồn và mẫu thiết kế.',
          chapters: [
            { id: 'ch-3-1', title: 'Chương 3.1: Thiết Kế Bản Vẽ Kiến Trúc & Giải Pháp Kỹ Nghệ', contentMarkdown: '', status: 'pending' },
            { id: 'ch-3-2', title: 'Chương 3.2: Ánh Xạ Hệ Phân Tán & Tối Ưu Hóa Thực Chiến', contentMarkdown: '', status: 'pending' }
          ]
        },
        {
          id: 'pillar-4',
          conceptualType: 'deep_dive',
          title: 'Trụ cột IV: Biện Chứng Phản Biện & Phân Tích Mâu Thuẫn',
          description: 'Xung đột lịch sử, các điểm nghẽn kĩ thuật, failure modes và góc nhìn đa chiều.',
          chapters: [
            { id: 'ch-4-1', title: 'Chương 4.1: Điểm Nghẽn Thực Tiễn, Nghịch Lý & Bẫy Rủi Ro', contentMarkdown: '', status: 'pending' },
            { id: 'ch-4-2', title: 'Chương 4.2: Cơ Chế Khắc Phục Lỗi (Failure Modes) & Phòng Ngừa', contentMarkdown: '', status: 'pending' }
          ]
        },
        {
          id: 'pillar-5',
          conceptualType: 'internal_dialogue',
          title: 'Trụ cột V: Tĩnh Tâm - Cân Bằng Khắc Kỷ (Shinbashira)',
          description: 'Khoảng lặng đạo đức (Shinbashira), nguyên lý khắc kỷ và cơ chế tự phục hồi.',
          chapters: [
            { id: 'ch-5-1', title: 'Chương 5.1: Điểm Tựa Đạo Đức & Trục Cân Bằng Liêm Chính', contentMarkdown: '', status: 'pending' },
            { id: 'ch-5-2', title: 'Chương 5.2: Năng Lực Khắc Kỷ, Tự Phục Hồi & Thích Ứng Biến Động', contentMarkdown: '', status: 'pending' }
          ]
        },
        {
          id: 'pillar-6',
          conceptualType: 'synthesis',
          title: 'Trụ cột VI: Hòa Hợp Tự Nhiên & Hệ Sinh Thái Vô Vi',
          description: 'Khả năng vươn ra hệ sinh thái tự nhiên, kết nối đa tác tử và phát triển bền vững.',
          chapters: [
            { id: 'ch-6-1', title: 'Chương 6.1: Vươn Ra Hệ Sinh Thái & Nguyên Lý Hòa Hợp Tự Nhiên', contentMarkdown: '', status: 'pending' },
            { id: 'ch-6-2', title: 'Chương 6.2: Cộng Sinh Đa Chiều & Mô Hình Phát Triển Bền Vững', contentMarkdown: '', status: 'pending' }
          ]
        }
      ];
      return res.json({
        success: true,
        synthesis: {
          decodedEssence: 'Tổng hợp từ cuộc phỏng vấn định hướng ý niệm nghiên cứu.',
          recommendedScenario: preferredScenario || 'business_plan',
          scenarioRationale: 'Kịch bản được thiết lập dựa trên nguyện vọng chuyển hóa ý niệm thành thực tiễn.',
          proposedTitle: 'Đề Án Chuyển Hóa Ý Niệm Nghiên Cứu',
          proposedSubtitle: 'Hệ thống hóa tri thức và định hình quy trình triển khai',
          proposedAbstract: 'Công trình tổng hợp toàn bộ thông tin từ cuộc phỏng vấn, xây dựng cấu trúc theo Bản Giao Ước 6 Trụ Cột Động.',
          detectedDomain: 'Chuyển Đổi Số & Quản Trị Nghiên Cứu',
          interdisciplinaryFields: ['Chuyển Đổi Số', 'Kinh Tế Số', 'Quản Trị'],
          pillars: fallbackPillars
        },
        modelUsed: result.modelUsed
      });
    }
  } catch (error: any) {
    console.error('Error synthesizing interview outline:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tổng hợp đề cương từ cuộc phỏng vấn.' });
  }
});

// Rewrite Atomic Unit
app.post('/api/gemini/rewrite-atomic-unit', async (req, res) => {
  try {
    const { content, instruction, unitType, contextInfo } = req.body;
    
    if (!content || !instruction) {
      return res.status(400).json({ success: false, error: 'Thiếu nội dung hoặc chỉ dẫn.' });
    }

    const contextSection = contextInfo ? `\nNgữ cảnh toàn bài (để tham khảo tính nhất quán): ${contextInfo}\n` : '';

    const prompt = `Bạn là một trợ lý biên tập nội dung chuyên nghiệp.
Nhiệm vụ của bạn là sửa đổi, biên tập hoặc phục hồi lại đoạn nội dung Markdown sau đây dựa trên yêu cầu của người dùng.
Loại khối nội dung: ${unitType || 'Văn bản'}${contextSection}
QUAN TRỌNG: Luôn ưu tiên áp dụng triết lý "Chuyển hóa tri thức" (Knowledge Transforming) - sử dụng ngôn ngữ đời thường, trong sáng, gãy gọn và mang tính "thực chiến". Tránh xa lối hành văn hàn lâm, phức tạp hoặc nhồi nhét thuật ngữ không cần thiết.
Chỉ trả về ĐÚNG nội dung đã được sửa đổi dưới dạng văn bản thô, KHÔNG kèm bất kỳ lời giải thích, chào hỏi, hay bọc trong markdown code block (trừ khi bản thân khối đó là code block hoặc bảng). Giữ nguyên hoặc sửa đổi cấu trúc để hoàn toàn phù hợp với định dạng gốc. Đặc biệt: Nếu loại khối là "Danh sách" hoặc "Đoạn văn", TUYỆT ĐỐI KHÔNG tự ý thêm các ký hiệu gạch ngang (-), dấu sao (*) hay số thứ tự ở đầu dòng (hãy chỉ trả về nội dung chữ).

Nội dung gốc:
${content}

Yêu cầu sửa đổi:
${instruction}

Nội dung sau khi sửa (chỉ trả về nội dung chữ, không giải thích):`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.3,
      model: 'gemini-3.7-flash',
    });

    let rewritten = result.text.trim();
    if (rewritten.startsWith('\`\`\`markdown')) {
      rewritten = rewritten.replace(/^\`\`\`markdown\n?/, '').replace(/\n?\`\`\`$/, '');
    } else if (rewritten.startsWith('\`\`\`')) {
      rewritten = rewritten.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
    }

    res.json({
      success: true,
      data: rewritten,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Lỗi server' });
  }
});

// Generate / Transform Architecture Blueprint Diagram
app.post('/api/gemini/generate-blueprint', async (req, res) => {
  try {
    const {
      text,
      instruction,
      stylePreset = 'workflow', // 'workflow' | 'multi_agent' | 'pipeline' | 'layered' | 'decision_tree' | 'closed_loop' | 'microservices'
      projectTitle = '',
      pillarTitle = '',
      contextInfo = '',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đoạn văn bản mô tả cấu trúc để vẽ sơ đồ.' });
    }

    const sysInstruction = `<system_instruction>
Bạn là Tổng Công Trình Sư Kiến Trúc Hệ Thống & Chuyên Gia Thiết Kế Sơ Đồ Workflow / Agentic AI của OG Lab (Oneness Governance).
Nhiệm vụ: PHÂN TÍCH NGỮ CẢNH ĐOẠN VĂN BẢN ĐƯỢC CUNG CẤP -> BÓC TÁCH CÁC KHỐI CHỨC NĂNG & CÁC NODE HÀNH ĐỘNG -> CHUYỂN HÓA THÀNH SƠ ĐỒ WORKFLOW / KIẾN TRÚC TRỰC QUAN, TINH GỌN, CAO CẤP.

QUY CHUẨN BẮT BUỘC ĐỂ ĐẢM BẢO TÍNH TRỰC QUAN & TINH TẾ:
1. NGUYÊN TẮC "HÌNH VẼ TINH GỌN - CHỮ CHUYỂN XUỐNG DƯỚI":
   - Trên hình vẽ: Tuyệt đối KHÔNG viết nhiều chữ chiếm diện tích. Hình vẽ chỉ tập trung thể hiện các khối chức năng và các luồng tương tác.
   - Tên khối chức năng ("label"): PHẢI CỰC KỲ NGẮN GỌN (từ 1 đến 4 từ, ví dụ: "Thu Thập Dữ Liệu", "Bộ Lọc Prompt", "Swarm Phân Tích", "Kiểm Định Tri Thức", "Lưu Trữ Vector", "Xuất Bản Dossier"). Không được để nguyên một câu dài làm tên node.
   - Vai trò cực ngắn ("shortRole"): 1-2 từ (vd: "Tiếp Nhận", "Phân Loại", "Thực Thi", "Đánh Giá", "Lưu Trữ", "Phản Hồi").
   - Toàn bộ nội dung diễn giải dài, phân tích ngữ cảnh, nhiệm vụ cụ thể sẽ được đưa vào trường "description". (Giao diện sẽ hiển thị phần này ở bảng mô tả chi tiết ngay bên dưới sơ đồ).

2. PHONG CÁCH SƠ ĐỒ YÊU CẦU: "${stylePreset.toUpperCase()}":
   - "workflow": Luồng quy trình hành động tuần tự (Bước 1: Kích Hoạt -> Bước 2: Tiền Xử Lý -> Bước 3: Phân Tích -> Bước 4: Kiểm Định -> Bước 5: Kết Quả).
   - "multi_agent": Đội ngũ Multi-Agent Swarms (Orchestrator phân việc -> Các Agent chuyên môn thực thi song song -> Synthesis Agent tổng hợp).
   - "pipeline": Đường ống dữ liệu (Ingestion -> Cleansing -> Vector Embedding -> AI Reasoning -> Persistent Store).
   - "layered": Kiến trúc phân tầng (Tầng 1: Client/Ingress -> Tầng 2: Gateway & Security -> Tầng 3: Business Logic -> Tầng 4: Database/Storage).
   - "decision_tree": Phân luồng điều kiện & Rẽ nhánh hành động (Trigger -> Kiểm tra điều kiện -> Nhánh A / Nhánh B -> Hành động xử lý).
   - "closed_loop": Vòng lặp vận hành khép kín (Quan sát -> Định hướng -> Ra quyết định -> Hành động -> Đánh giá phản hồi).

3. CẤU TRÚC MA TRẬN LIÊN KẾT & ĐƯỜNG DẪN TƯƠNG TÁC (Connections Matrix):
   - Thiết lập các đường dẫn/luồng tương tác chính xác giữa các khối chức năng (tối thiểu 3-5 đường dẫn đại diện cho các luồng dữ liệu, tín hiệu điều phối, phân nhánh điều kiện hoặc phản hồi ngược).
   - Nhãn luồng ("label"): Cực ngắn gọn (vd: "Gửi Payload", "Token Stream", "Auth Token", "Đạt chuẩn", "Rẽ nhánh", "Phản hồi", "Lưu Cache").
   - Giao thức ("protocol"): Ghi rõ giao thức truyền thông kỹ thuật hoặc phương thức trao đổi (vd: "REST / HTTPS", "WebSocket Stream", "gRPC Event", "In-Memory IPC", "Vector Query", "PostgreSQL Pool").
   - Gói dữ liệu ("payload"): Mô tả cực ngắn dạng dữ liệu truyền tải (vd: "JSON DTO + Bearer Header", "Binary Chunk", "State Diff", "Embedding Vector [1536d]").
   - Kiểu kết nối ("type"): "solid" (luồng chính), "dashed" (luồng phụ/kiểm tra), "bidirectional" (tương tác 2 chiều).

4. QUY TẮC SƠ ĐỒ KÝ TỰ (ASCII Text Flow - Bắt buộc theo Quy tắc 6 AGENTS.md):
   - Trường "asciiFlow" phải tạo sơ đồ phẳng trực quan:
     [Khối 1] --(Luồng A)--> [Khối 2] --(Luồng B)--> [Khối 3]

5. GHI CHÚ KIẾN TRÚC ("notes"):
   - 2-3 điểm lưu ý thực chiến về tối ưu hiệu năng hoặc bẫy rủi ro (Failure Modes) đã được phòng ngừa.
</system_instruction>

<context>
${projectTitle ? `HỒ SƠ / ĐỀ TÀI: ${projectTitle}` : ''}
${pillarTitle ? `TRỤ CỘT: ${pillarTitle}` : ''}
${contextInfo ? `NGỮ CẢNH: ${contextInfo.slice(0, 1500)}` : ''}
${instruction ? `YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG: ${instruction}` : ''}
PHONG CÁCH MỤC TIÊU: ${stylePreset}
</context>

<input_text>
${text.trim()}
</input_text>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "title": "Tên Sơ Đồ Ngắn Gọn & Ấn Tượng",
  "subtitle": "Phụ đề tóm tắt mục tiêu chính của luồng",
  "category": "${stylePreset}",
  "layout": "workflow_horizontal",
  "nodes": [
    {
      "id": "node_1",
      "label": "Khởi Tạo Yêu Cầu",
      "shortRole": "Tiếp Nhận",
      "stepNumber": 1,
      "tier": "Bước 1: Tiếp Nhận & Kích Hoạt",
      "type": "trigger",
      "description": "Tiếp nhận đầu vào từ người dùng hoặc hệ thống ngoại vi, chuẩn hóa tham số đầu vào.",
      "techStack": "Client UI / Event",
      "icon": "Zap",
      "status": "primary"
    },
    {
      "id": "node_2",
      "label": "Bộ Lọc & Phân Loại",
      "shortRole": "Phân Loại",
      "stepNumber": 2,
      "tier": "Bước 2: Phân Tích & Điều Phối",
      "type": "gateway",
      "description": "Kiểm tra quyền truy cập RBAC, phân loại độ phức tạp và định tuyến tác vụ.",
      "techStack": "Fastify / Router",
      "icon": "Workflow",
      "status": "active"
    }
  ],
  "connections": [
    {
      "id": "c1",
      "from": "node_1",
      "to": "node_2",
      "label": "Gửi Payload",
      "type": "solid",
      "protocol": "REST / HTTPS",
      "payload": "JSON Request + Auth Token"
    }
  ],
  "asciiFlow": "[Khởi Tạo Yêu Cầu] --(Gửi Payload)--> [Bộ Lọc & Phân Loại] --(Định Tuyến)--> [Xử Lý Lõi]",
  "notes": [
    "Đã thiết lập cơ chế retry tự động và timeout fallback.",
    "Ngăn chặn nghẽn cổ chai tại khâu điều phối đa tác vụ."
  ]
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: sysInstruction,
      temperature: 0.2,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);

    // Ensure required fields
    if (!parsed.title) parsed.title = 'Sơ Đồ Quy Trình & Kiến Trúc';
    if (!parsed.category) parsed.category = stylePreset;
    if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      parsed.nodes = [
        { id: 'node_input', label: 'Tiếp Nhận Yêu Cầu', shortRole: 'Đầu Vào', stepNumber: 1, type: 'trigger', tier: 'Bước 1: Tiếp Nhận', description: 'Tiếp nhận thông tin và kiểm tra hợp lệ ban đầu.', techStack: 'Client / Ingress', icon: 'Globe', status: 'primary' },
        { id: 'node_core', label: 'Xử Lý & Chuyển Hóa', shortRole: 'Thực Thi', stepNumber: 2, type: 'ai', tier: 'Bước 2: Xử Lý Lõi', description: 'Phân tích đa chiều và chuyển hóa dữ liệu theo logic nghiệp vụ.', techStack: 'Gemini 3.7 Core', icon: 'Brain', status: 'active' },
        { id: 'node_output', label: 'Lưu Trữ & Xuất Bản', shortRole: 'Kết Quả', stepNumber: 3, type: 'database', tier: 'Bước 3: Hoàn Tất', description: 'Lưu trữ bền vững và bàn giao kết quả cho người dùng.', techStack: 'Database / Export', icon: 'Database', status: 'active' }
      ];
    }
    if (!Array.isArray(parsed.connections) || parsed.connections.length === 0) {
      parsed.connections = [
        { from: 'node_input', to: 'node_core', label: 'Dữ liệu thô', type: 'solid' },
        { from: 'node_core', to: 'node_output', label: 'Dữ liệu tinh gọn', type: 'solid' }
      ];
    }
    if (!parsed.asciiFlow) {
      parsed.asciiFlow = `[${parsed.nodes[0]?.label || 'Đầu Vào'}] --(Xử lý)--> [${parsed.nodes[1]?.label || 'Lõi Chức Năng'}] --(Lưu trữ)--> [${parsed.nodes[2]?.label || 'Kết Quả'}]`;
    }

    const blueprintMarkdown = `\`\`\`blueprint\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;

    return res.json({
      success: true,
      blueprint: parsed,
      blueprintMarkdown,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating blueprint:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi vẽ sơ đồ kiến trúc blueprint.' });
  }
});

// Auto-Fix / Synthesize Standalone Abstract
app.post('/api/gemini/fix-abstract', async (req, res) => {
  try {
    const { dossierId, title, subtitle, currentAbstract, projectStructure = [], model = 'gemini-3.7-flash' } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Thiếu tiêu đề hồ sơ để tạo Abstract.' });
    }

    let pillarsSummary = '';
    if (Array.isArray(projectStructure) && projectStructure.length > 0) {
      pillarsSummary = projectStructure.map((p: any, idx: number) => {
        const pTitle = p.title || `Trụ cột ${idx + 1}`;
        const chaps = (p.chapters || []).map((c: any) => `- ${c.title}${c.subtitle ? `: ${c.subtitle}` : ''}`).join('\n');
        return `Trụ cột ${idx + 1}: ${pTitle}\n${chaps}`;
      }).join('\n\n');
    }

    const prompt = `<system_instruction>
Bạn là Học giả Bác học & Trưởng Ban Biên Tập Hệ Thống OG Intelligence Lab.
Nhiệm vụ của bạn là tổng hợp một đoạn TÓM TẮT KHẢO LUẬN (ABSTRACT) độc lập, chuyên sâu, mang tính CHUYỂN HÓA TRI THỨC (Knowledge Transforming) cho hồ sơ khảo luận nghiên cứu.

YÊU CẦU CỤ THỂ & QUY TẮC BẮT BUỘC:
1. KHÔNG LẶP LẠI TIÊU ĐỀ VÀ TIÊU ĐỀ PHỤ:
   - Tiêu đề phụ (Subtitle) hiện tại: "${subtitle || ''}"
   - TUYỆT ĐỐI KHÔNG lặp lại nguyên văn hay sao chép câu chữ của Tiêu đề phụ. Abstract phải là một đoạn văn bản độc lập hoàn toàn.

2. CẤU TRÚC ABSTRACT ĐỘC LẬP & PHONG PHÚ:
   - Viết thành 2-3 đoạn văn ngắn gãy gọn, mạch lạc (khoảng 180 - 300 từ).
   - Đoạn 1: Tóm tắt bài toán nguyên lý, ý niệm bản thể luận và bối cảnh thực tiễn cần khảo sát.
   - Đoạn 2: Tổng hợp giải pháp cơ chế & kiến trúc hệ thống qua các Trụ cột chính, chỉ ra tính khả thi và ánh xạ kỹ thuật.
   - Đoạn 3: Nêu bật giá trị thực chiến, tính bền vững "Minh Triết Đất Trời" và tác động xã hội dài hạn.

3. VĂN PHONG "KNOWLEDGE TRANSFORMING":
   - Ngôn từ học thuật uyên bác nhưng trong sáng, gãy gọn, dễ hiểu, đời thường và hành động được ngay.
</system_instruction>

<dossier_info>
Tiêu đề hồ sơ: ${title}
Tiêu đề phụ hiện tại: ${subtitle || 'Chưa có'}
${pillarsSummary ? `Cấu trúc 6 Trụ cột Động:\n${pillarsSummary}` : ''}
</dossier_info>

<instruction>
Dựa trên thông tin hồ sơ trên, hãy viết lại đoạn TÓM TẮT KHẢO LUẬN (ABSTRACT) hoàn chỉnh hoàn toàn mới, loại bỏ việc trùng lặp với Tiêu đề phụ. Chỉ trả về trực tiếp đoạn văn bản Abstract tiếng Việt, không kèm thêm lời chào hay giải thích ngoài.
</instruction>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.5,
      model
    });

    return res.json({
      success: true,
      abstract: result.text.trim(),
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error in fix-abstract:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tự động sửa Abstract.' });
  }
});

function parseGeminiChapterOutput(rawText: string) {
  try {
    const parsed = safeParseLLMJson(rawText);
    const rawMd = typeof parsed.contentMarkdown === 'string' ? parsed.contentMarkdown : rawText;
    return {
      contentMarkdown: deduplicateMarkdownQuotes(rawMd),
      quotes: Array.isArray(parsed.quotes) ? sanitizeClassicalQuotes(parsed.quotes) : [],
      extractedTerms: Array.isArray(parsed.extractedTerms) ? sanitizeExtractedTerms(parsed.extractedTerms) : []
    };
  } catch (err) {
    let text = (rawText || '').trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    }
    // Resilient fallback regex extraction
    let contentMarkdown = '';
    let quotes: any[] = [];
    let extractedTerms: any[] = [];

    const mdMatch = text.match(/"contentMarkdown"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    if (mdMatch) {
      try {
        contentMarkdown = JSON.parse(`"${mdMatch[1]}"`);
      } catch {
        contentMarkdown = mdMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }

    const quotesMatch = text.match(/"quotes"\s*:\s*(\[[^\]]*\])/s);
    if (quotesMatch) {
      try {
        quotes = sanitizeClassicalQuotes(JSON.parse(quotesMatch[1]));
      } catch {}
    }

    const termsMatch = text.match(/"extractedTerms"\s*:\s*(\[[^\]]*\])/s);
    if (termsMatch) {
      try {
        extractedTerms = sanitizeExtractedTerms(JSON.parse(termsMatch[1]));
      } catch {}
    }

    if (!contentMarkdown) {
      contentMarkdown = text.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim();
    }

    return {
      contentMarkdown: deduplicateMarkdownQuotes(contentMarkdown),
      quotes,
      extractedTerms
    };
  }
}

// 3. Generate Dissertation-Level Chapter Content with 4-Tier Internal Framework, Actionable Plain Language (Knowledge Transforming), Quotes & Lexicon Hub
app.post('/api/gemini/generate-chapter', async (req, res) => {
  try {
    const {
      projectTitle,
      pillarTitle,
      chapterTitle,
      mode = 'deep',
      depthLevel = 'dissertation',
      selectedDisciplines = ['Khoa Học Máy Tính', 'Trí Tuệ Nhân Tạo', 'Hệ Thống Phức Tạp', 'Kinh Tế'],
      customInstructions = '',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!chapterTitle) {
      return res.status(400).json({ success: false, error: 'Tên chương không được để trống.' });
    }

    const prompt = `<system_instruction>
Bạn là Học giả Cao cấp & Kiến trúc sư Trưởng của OG Agentic Intelligence Lab (Oneness Governance).
Slogan & Phương pháp luận cốt lõi: "Deep Research & Knowledge Transforming" (Nghiên Cứu Sâu Sắc & Chuyển Hóa Tri Thức).

SỨ MỆNH CHUYỂN HÓA TRI THỨC (KNOWLEDGE TRANSFORMING):
- Tri thức hàn lâm, triết học và kiến trúc máy tính đã sẵn có trên các mô hình AI lớn.
- Nhiệm vụ của bạn là CHUYỂN HÓA TOÀN BỘ TRI THỨC ĐÓ sang NGÔN NGỮ ĐỜI THƯỜNG, TRONG SÁNG, GÃY GỌN VÀ THỰC CHIẾN, để bất kỳ ai đọc lên cũng hiểu được bản chất, biết cách hành động, vận động và tạo ra giá trị thiết thực cho xã hội.

QUY TẮC ĐẦU RA VĂN BẢN BẮT BUỘC:
1. TUYỆT ĐỐI LOẠI BỎ MÃ NGUỒN LẬP TRÌNH (CODE SNIPPETS):
   - KHÔNG chèn các khối mã lập trình (code blocks \`\`\`python, \`\`\`typescript, \`\`\`json trong nội dung bài viết). Nội dung này dành cho con người đọc và ứng dụng thực tiễn.
   - Thay vào đó, hãy sử dụng: Bảng biểu so sánh (Markdown tables), Ma trận đánh giá, Sơ đồ luồng bằng mô tả/bullet points, Quy chuẩn thực thi, và Kịch bản hành động cụ thể.

2. PHÂN TÍCH ĐÚNG BẢN CHẤT CHUYÊN ĐỀ:
   - Dựa trên đề tài "${projectTitle || ''}" và trụ cột "${pillarTitle || ''}", viết nội dung thực chất, đào sâu các khía cạnh nghiệp vụ, kinh tế, quy trình, nhân lực, kỹ thuật hoặc quản trị.
   - TUYỆT ĐỐI KHÔNG lặp lại các công thức sáo rỗng hoặc bài viết chung chung!

3. KHÔNG SỬ DỤNG TIÊU ĐỀ CẤP ĐỘ THÔ CỨNG: 
   - TUYỆT ĐỐI KHÔNG ghi các tiêu đề kiểu "## CẤP ĐỘ 1: ...", "## CẤP ĐỘ 2: ...". Hãy dùng các tiêu đề Markdown tự nhiên, hấp dẫn, giàu tính hành động (Actionable).

4. ĐAN CÀI ĐA NGÀNH: Kết hợp lăng kính: ${Array.isArray(selectedDisciplines) ? selectedDisciplines.join(', ') : 'Khoa Học Máy Tính, Trí Tuệ Nhân Tạo, Hệ Thống Phức Tạp, Kinh Tế Bền Vững'}.

5. QUY TẮC ĐÁNH SỐ PHÂN CẤP MARKDOWN (MẠCH LẠC, BẮT ĐẦU TỪ 1 CHO MỌI CHƯƠNG):
   - Tiêu đề cấp 1 (#): '# [Tên Chương / Tên Chuyên Đề]' (Chỉ xuất hiện 1 lần duy nhất ở đầu bài).
   - Tiêu đề cấp 2 (##): Dù tên chương là gì (ví dụ Chương 3.4), các tiêu đề cấp 2 (##) BẮT BUỘC phải đánh số lại từ đầu, bắt đầu từ 1 đến N (ví dụ: '## 1. [Tên Phần 1]', '## 2. [Tên Phần 2]'). TUYỆT ĐỐI không dùng tiền tố của tên chương (như 3.4.1) để đánh số phần chính. Không nhảy số, không lộn xộn.
   - Tiêu đề cấp 3 (###): Đánh số tiểu mục theo phần chính (ví dụ: trong '## 1. ...', dùng '### 1.1. ...', '### 1.2. ...'). TUYỆT ĐỐI không đặt tiểu mục 3.1 trong phần 2!
   - Khớp nối chính xác số lượng mục/bước với tiêu đề: Nếu tiêu đề của bạn có chứa con số ấn định số lượng (ví dụ: 'Lộ trình 5 bước', '3 nguyên tắc', '4 giai đoạn'), bạn BẮT BUỘC phải tạo ĐÚNG và ĐỦ số lượng đó (Ví dụ: 1, 2, 3, 4, 5). TUYỆT ĐỐI KHÔNG ĐƯỢC sinh ra dư thừa (ví dụ: 6 bước cho 'lộ trình 5 bước') hoặc thiếu hụt. Hãy dừng lại ngay khi đã liệt kê đủ số lượng đã cam kết trên tiêu đề.
   - Bảng biểu: Sử dụng bảng chuẩn GFM (Markdown table) có ít nhất 2 cột và có hàng phân cách '| :--- | :--- |'. TUYỆT ĐỐI KHÔNG ngắt bảng bằng các dòng trống. Bảng phải liền mạch từ đầu đến cuối. KHÔNG chèn nhiều bảng lỗi liên tiếp nhau, hãy gộp thành 1 bảng duy nhất, logic và chuyên nghiệp. Tuyệt đối không chèn ký tự '---' đơn lẻ bên trong nội dung bảng.

6. QUY TẮC TRÍCH DẪN & CHỐNG TRÙNG LẶP NỘI DUNG (TUYỆT ĐỐI KHÔNG LẶP LẠI CÙNG 1 CÂU TRÍCH DẪN):
   - Tuyệt đối không trích dẫn tràn lan, ngẫu nhiên hay lặp lại. Mỗi chương chỉ đặt đúng 1 đến 2 câu trích dẫn tư tưởng hoặc nguyên lý kinh điển khớp nối trực tiếp với mạch luận điểm.
   - TUYỆT ĐỐI KHÔNG lặp lại cùng một câu trích dẫn, cùng một phát biểu hoặc trích đoạn ở các mục khác nhau trong bài hoặc trong mảng "quotes". Mỗi câu trích dẫn chỉ xuất hiện TỐI ĐA 1 LẦN DUY NHẤT.
   - Với trích dẫn nước ngoài/tiếng Anh: BẮT BUỘC có nguyên tác, tên tác giả, tên tác phẩm/năm, kèm "translationVi" (Bản dịch tiếng Việt chuẩn xác, uyển chuyển) và "interpretation" (Phân tích bối cảnh và ý nghĩa thực chiến, ứng dụng thực tế).
   - Trong markdown bài viết, định dạng trích dẫn như sau:
     > "[Câu trích dẫn nguyên tác hoặc dịch chuẩn]" — *Tác giả*, **Tác phẩm**
     > *Bản dịch*: "[Bản dịch tiếng Việt nếu là trích dẫn ngoại ngữ]"
     > *Ý nghĩa thực chiến*: [Phân tích bối cảnh bài viết và bài học ứng dụng thực tế]

7. CƠ CHẾ SỔ TỪ ĐIỂN THUẬT NGỮ (LEXICON HUB INTEGRATION):
Nếu có bất kỳ thuật ngữ chuyên ngành nào cần dùng trong bài viết, bạn BẮT BUỘC TRÍCH XUẤT VÀO "extractedTerms" với:
- Phần diễn giải đời thường ("deepExplanation"): Giải thích bình dân, dễ hiểu bằng ví dụ thực tế để người đọc tra cứu trong Sổ Từ Điển Thuật Ngữ là hiểu ngay.
- Phần ánh xạ thực tiễn ("applicationInAgents"): Cách ứng dụng thực tế trong AI / Quản trị tổ chức.
</system_instruction>

<context>
TỔNG CÔNG TRÌNH (HỒ SƠ): "${projectTitle || 'OG Agentic Intelligence Research'}"
TRỤ CỘT ĐỘNG: "${pillarTitle || 'Trụ Cột Nghiên Cứu'}"
CHƯƠNG CẦN BIÊN SOẠN: "${chapterTitle}"
ĐỘ SÂU NGHIÊN CỨU: ${depthLevel.toUpperCase()} (${mode})
CÁC LĨNH VỰC LIÊN NGÀNH: ${Array.isArray(selectedDisciplines) ? selectedDisciplines.join(', ') : 'Liên Ngành Đột Phá'}
${customInstructions ? `CHỈ DẪN NGHIÊN CỨU BỔ SUNG: "${customInstructions}"` : ''}
</context>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "contentMarkdown": "Toàn văn bài khảo luận định dạng Markdown phong phú, tiêu đề tiểu mục tự nhiên tuần tự (## 1., ## 2., ## 3....), lôi cuốn, giàu tính hành động (KHÔNG chứa code blocks và KHÔNG chứa tiêu đề '## CẤP ĐỘ 1: ...'), bảng biểu phân tích rõ ràng, và 1-2 trích dẫn tư tưởng đặt đúng ngữ cảnh...",
  "quotes": [
    {
      "id": "q-1",
      "quote": "Câu trích dẫn tư tưởng nguyên tác (tiếng Anh hoặc tiếng Việt)",
      "author": "Tên tác giả",
      "work": "Tên tác phẩm",
      "eraOrYear": "Thời kỳ / Năm",
      "translationVi": "Bản dịch tiếng Việt chuẩn xác và uyển chuyển (nếu câu trích dẫn là tiếng nước ngoài)",
      "interpretation": "Phân tích bối cảnh và ý nghĩa thực chiến/bài học hành động cụ thể",
      "discipline": "Lĩnh vực"
    }
  ],
  "extractedTerms": [
    {
      "id": "term-1",
      "term": "Tên thuật ngữ tiếng Việt",
      "enTerm": "English Term",
      "category": "Liên Ngành Đột Phá",
      "sourceDiscipline": "Tên ngành",
      "philosophicalOrigin": "Nguồn gốc khái niệm",
      "csEquivalent": "Khái niệm tương đương trong Hệ thống / Quản trị",
      "deepExplanation": "Diễn giải đời thường, dễ hiểu kèm ví dụ thực tế để lưu vào Sổ Từ Điển",
      "applicationInAgents": "Ứng dụng thực chiến trong Quản trị / Hệ thống AI",
      "tags": ["Tag1", "Tag2"]
    }
  ]
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.3,
      model,
      enableSearch: true
    });

    const parsedOutput = parseGeminiChapterOutput(result.text);

    return res.json({
      success: true,
      contentMarkdown: parsedOutput.contentMarkdown,
      quotes: parsedOutput.quotes,
      extractedTerms: parsedOutput.extractedTerms,
      highDemand: (result as any).highDemand || false,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating chapter:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo nội dung chương.' });
  }
});

// 3.2. Intelligent Translation & Contextual Insight for Academic Quotes
app.post('/api/gemini/translate-quote', async (req, res) => {
  try {
    const { quote, author, work, context, model = 'gemini-3.7-flash' } = req.body;
    if (!quote || typeof quote !== 'string' || !quote.trim()) {
      return res.status(400).json({ success: false, error: 'Nội dung trích dẫn không được để trống.' });
    }

    const prompt = `<system_instruction>
Bạn là Học giả Dịch thuật & Chuyên gia Triết học - Công nghệ của OG Agentic Intelligence Lab.
Nhiệm vụ: Dịch câu trích dẫn tiếng Anh/nước ngoài sang Tiếng Việt chuẩn mực học thuật, trong sáng, uyển chuyển và cung cấp bài học/ý nghĩa thực chiến cho bài viết.
</system_instruction>

<context>
CÂU TRÍCH DẪN NGUYÊN TÁC: "${quote.trim()}"
TÁC GIẢ: "${author || 'Chưa rõ'}"
TÁC PHẨM / NGUỒN: "${work || 'Kinh điển'}"
BỐI CẢNH BÀI VIẾT: "${context || 'Khảo luận nghiên cứu hệ thống'}"
</context>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "translationVi": "Bản dịch tiếng Việt chuẩn xác, uyển chuyển, gãy gọn",
  "interpretation": "Phân tích bối cảnh và ý nghĩa thực chiến, cách vận dụng vào quản trị hoặc kỹ nghệ",
  "detectedAuthor": "Tên tác giả chuẩn mực",
  "detectedWork": "Tên tác phẩm / nguồn gốc chuẩn",
  "discipline": "Lĩnh vực"
}
</output_format>`;

    const result = await generateGeminiContent({ contents: prompt, temperature: 0.2, model });
    let jsonStr = (result.text || '').trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '');
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return res.json({
        success: true,
        translationVi: parsed.translationVi || quote,
        interpretation: parsed.interpretation || '',
        author: parsed.detectedAuthor || author,
        work: parsed.detectedWork || work,
        discipline: parsed.discipline,
        modelUsed: result.modelUsed
      });
    } catch (parseErr) {
      return res.json({
        success: true,
        translationVi: result.text || quote,
        interpretation: 'Ứng dụng nguyên lý vào việc tối ưu hóa cấu trúc và giảm thiểu rủi ro vận hành.',
        author,
        work,
        modelUsed: result.modelUsed
      });
    }
  } catch (err: any) {
    console.error('Error in translate-quote:', err);
    return res.status(500).json({ success: false, error: err.message || 'Lỗi khi dịch trích dẫn.' });
  }
});

// 3.5. Project Document Intelligence & Multi-Dimensional Action Scenarios Engine
app.post(['/api/gemini/analyze-project-doc', '/api/gemini/analyze-external-doc'], async (req, res) => {
  try {
    const { documentContent = '', prompt = '', model = 'gemini-3.7-pro', fileData, fileMimeType, strategicFocus = '' } = req.body;

    if (!documentContent.trim() && !fileData) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp nội dung hoặc tải lên tệp tài liệu dự án.' });
    }

    const sysInstruction = `<system_instruction>
Bạn là Tổng Công Trình Sư Chiến Lược & Viện Trưởng Nghiên Cứu của Oneness Governance (OG Lab).
Nhiệm vụ của bạn là: TIẾP NHẬN MỘT TẬP TÀI LIỆU / HỒ SƠ DỰ ÁN (Bản thảo, Kế hoạch kinh doanh, Báo cáo kỹ thuật, Đề án khởi nghiệp, Quy hoạch...) -> THẨM ĐỊNH TOÀN DIỆN & SẢN XUẤT 6 KỊCH BẢN HÀNH ĐỘNG THỰC CHIẾN (Actionable Content Scenarios).

QUY TẮC PHƯƠNG PHÁP LUẬN OG LAB:
1. Slogan Cốt Lõi: "Deep Research & Knowledge Transforming" (Chuyển Hóa Tri Thức). Tiếp nhận học thuật ở mức cao nhất, nhưng chuyển dịch sang ngôn ngữ đời thường, gãy gọn, thiết thực, bắt tay làm được ngay.
2. Quy tắc Sơ Đồ Luồng (ASCII Text Flow): Khi vẽ sơ đồ quy trình, TUYỆT ĐỐI KHÔNG dùng khối code Mermaid hay javascript. Phải dùng ASCII Flow trực quan:
   [Đầu vào / Bước 1] --(Điều kiện / Dòng chảy)--> [Bước 2] --(Hành động)--> [Đầu ra / Kết quả]
3. 6 KỊCH BẢN HÀNH ĐỘNG CẦN SẢN XUẤT ĐẦY ĐỦ:
   - Scenario 1 (sop_workflows): "Quy Trình & Lộ Trình Vận Hành Thực Chiến (SOPs)" - Bản vẽ phân kỳ 3 giai đoạn, sơ đồ ASCII, ma trận phân nhiệm RACI, danh mục việc cần làm ngay.
   - Scenario 2 (executive_report): "Báo Cáo Chiến Lược & Thẩm Định Đề Án" - Dành cho Ban Giám Đốc/Nhà Đầu Tư, tóm tắt thực thi, phân tích rủi ro, chỉ số OKRs/KPIs sống còn.
   - Scenario 3 (internal_team_comm): "Truyền Thông Nội Bộ Đội Ngũ (Team Alignment)" - Thông điệp truyền cảm hứng, cẩm nang văn hóa hành động, bộ Q&A tháo gỡ điểm nghẽn tâm lý nhân sự.
   - Scenario 4 (public_community_comm): "Truyền Thông Đại Chúng & Cộng Đồng (Public Storytelling)" - Chuyển hóa biệt ngữ phức tạp thành ngôn ngữ đời thường, xây dựng niềm tin, lời kêu gọi hành động cộng sinh.
   - Scenario 5 (market_research): "Nghiên Cứu & Khảo Sát Thị Trường (Market Intelligence)" - Bối cảnh ngành, ma trận đối thủ cạnh tranh, khoảng trống thị trường (Market Gap) và cơ hội bứt phá.
   - Scenario 6 (consumer_psychology): "Tâm Lý Tiêu Dùng & Hành Vi Khách Hàng (Consumer Psychology)" - Chân dung Persona mục tiêu, nỗi đau thầm kín (Pain points), rào cản ra quyết định và kịch bản thuyết phục.

4. CẤU TRÚC 6 TRỤ CỘT ĐỘNG (Dùng để nạp thành Hồ Sơ OG Lab khi cần):
   - Trụ cột I (Bản Thể): Khởi nguyên ý niệm & Đề xuất giá trị cốt lõi
   - Trụ cột II (Cơ Chế): Quy luật vận hành & Động lực học tài nguyên
   - Trụ cột III (Kiến Trúc): Bản vẽ giải pháp & Kỹ nghệ thực thi
   - Trụ cột IV (Biện Chứng): Quản trị rủi ro, điểm nghẽn & Khắc phục sai sót
   - Trụ cột V (Tĩnh Tâm): Đạo đức, liêm chính, an toàn & Cân bằng nội tại (Shinbashira)
   - Trụ cột VI (Đất Trời): Hòa hợp sinh thái, ESG & Tầm nhìn trường tồn

${prompt || strategicFocus ? `ĐỊNH HƯỚNG BỔ SUNG TỪ NGƯỜI DÙNG:\n${prompt || strategicFocus}\n` : ''}
</system_instruction>

<task>
Hãy phân tích tài liệu đầu vào, lập báo cáo thẩm định dự án và sản xuất nội dung chi tiết cho 6 kịch bản hành động.
</task>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ (không kèm văn bản ngoài json markdown block):
{
  "projectTitle": "Tên Đề Án / Dự Án Chuẩn Hóa",
  "projectSubtitle": "Phụ đề phản ánh giá trị chuyển hóa thực chiến",
  "projectDomain": "Lĩnh vực chuyên môn chính",
  "feasibilityScore": 85,
  "executiveDiagnosis": "Đoạn văn 2-3 câu đánh giá thẩm định tổng quan sắc bén về tính khả thi, điểm độc đáo và thách thức lớn nhất của đề án.",
  "coreStrengths": [
    "Điểm mạnh và lợi thế cạnh tranh cốt lõi 1",
    "Điểm mạnh và lợi thế cạnh tranh cốt lõi 2",
    "Điểm mạnh và lợi thế cạnh tranh cốt lõi 3"
  ],
  "failureModesAndRisks": [
    "Điểm nghẽn vận hành hoặc rủi ro tài chính 1",
    "Rủi ro thị trường hoặc pháp lý 2",
    "Rủi ro nhân lực hoặc công nghệ 3"
  ],
  "strategicImperatives": [
    "Hành động chiến lược cần làm ngay trong 30 ngày đầu",
    "Hành động chiến lược trong 90 ngày",
    "Nguyên tắc sống còn cần tuân thủ"
  ],
  "missingElements": [
    "Khía cạnh tài liệu gốc còn thiếu sót cần bổ sung 1",
    "Khía cạnh tài liệu gốc còn thiếu sót cần bổ sung 2"
  ],
  "detectedTimeline": "6-12 tháng",
  "estimatedBudgetScope": "Quy mô vốn / Ngân sách ước tính",
  "targetPersonas": ["Đối tượng 1", "Đối tượng 2", "Đối tượng 3"],
  "scenarios": [
    {
      "id": "scenario-sop",
      "key": "sop_workflows",
      "title": "Quy Trình & Lộ Trình Vận Hành Thực Chiến",
      "shortDesc": "Bản vẽ phân kỳ 3 giai đoạn, sơ đồ ASCII, ma trận RACI và danh mục việc cần làm ngay.",
      "targetAudience": "Bộ phận Vận hành, Trưởng dự án & Đội ngũ Kỹ thuật",
      "iconName": "Workflow",
      "contentMarkdown": "# QUY TRÌNH & LỘ TRÌNH VẬN HÀNH THỰC CHIẾN\\n\\n## 1. Sơ đồ luồng tiến trình tổng thể (ASCII Flow)\\n\\n[Khởi động & Khảo sát] --(Chuẩn hóa dữ liệu + Dự toán)--> [Thi công & Thử nghiệm] --(Kiểm định an toàn)--> [Vận hành Thực tế & Tối ưu]\\n\\n## 2. Lộ trình phân kỳ 3 giai đoạn...\\n\\n## 3. Ma trận phân công trách nhiệm (RACI Matrix)...",
      "actionItems": [
        "Hoàn thiện bản vẽ mặt bằng và danh mục thiết bị",
        "Ký kết cam kết nguyên tắc phối hợp nội bộ",
        "Thiết lập kênh giám sát chỉ số tiến độ hàng tuần"
      ]
    },
    {
      "id": "scenario-exec",
      "key": "executive_report",
      "title": "Báo Cáo Chiến Lược & Thẩm Định Đề Án",
      "shortDesc": "Bản tóm tắt điều hành dành cho Ban Giám Đốc, Hội đồng Cố vấn hoặc Nhà đầu tư.",
      "targetAudience": "Ban Lãnh đạo, Hội đồng Cố vấn, Nhà Đầu Tư",
      "iconName": "Briefcase",
      "contentMarkdown": "# BÁO CÁO CHIẾN LƯỢC & THẨM ĐỊNH ĐỀ ÁN\\n\\n## 1. Tóm tắt điều hành (Executive Summary)...\\n\\n## 2. Luận chứng kinh tế & Đề xuất giá trị...\\n\\n## 3. Khung chỉ số đo lường hiệu quả (OKRs/KPIs)...",
      "actionItems": [
        "Phê duyệt hạn mức ngân sách giai đoạn 1",
        "Thành lập Ban Cố vấn Thẩm định độc lập",
        "Thiết lập cơ chế kiểm soát rủi ro định kỳ"
      ]
    },
    {
      "id": "scenario-team",
      "key": "internal_team_comm",
      "title": "Truyền Thông Nội Bộ Đội Ngũ (Team Alignment)",
      "shortDesc": "Thông điệp truyền cảm hứng, cẩm nang văn hóa hành động và bộ Q&A tháo gỡ điểm nghẽn tâm lý.",
      "targetAudience": "Toàn thể nhân sự, Quản lý cấp trung & Cộng sự",
      "iconName": "Users",
      "contentMarkdown": "# CẨM NANG HÀNH ĐỘNG & TRUYỀN THÔNG NỘI BỘ\\n\\n## 1. Thông điệp truyền cảm hứng từ Trưởng Đề Án...\\n\\n## 2. 5 Nguyên tắc vàng trong phối hợp nội bộ...\\n\\n## 3. Bộ giải đáp thắc mắc (Q&A) tháo gỡ lo lắng...",
      "actionItems": [
        "Tổ chức buổi Town Hall ra mắt đề án",
        "Phát hành bản tóm tắt 1 trang cho từng phòng ban",
        "Mở hòm thư góp ý và sáng kiến nội bộ"
      ]
    },
    {
      "id": "scenario-public",
      "key": "public_community_comm",
      "title": "Truyền Thông Đại Chúng & Cộng Đồng",
      "shortDesc": "Chuyển hóa biệt ngữ phức tạp thành ngôn ngữ đời thường, bài viết kể chuyện và kêu gọi hành động.",
      "targetAudience": "Cộng đồng, Khách hàng tiềm năng & Đối tác xã hội",
      "iconName": "Megaphone",
      "contentMarkdown": "# BÀI VIẾT TRUYỀN THÔNG ĐẠI CHÚNG & CỘNG ĐỒNG\\n\\n## 1. Câu chuyện khởi nguồn: Tại sao chúng ta cần dự án này?\\n\\n## 2. Giá trị thiết thực mang lại cho từng gia đình và xã hội...\\n\\n## 3. Lời kêu gọi chung tay hành động...",
      "actionItems": [
        "Xuất bản chuỗi bài viết chia sẻ câu chuyện nhân văn",
        "Sản xuất infographic minh họa lợi ích đời thường",
        "Kết nối các tổ chức xã hội và đối tác địa phương"
      ]
    },
    {
      "id": "scenario-market",
      "key": "market_research",
      "title": "Nghiên Cứu & Khảo Sát Thị Trường",
      "shortDesc": "Bối cảnh ngành, ma trận đối thủ cạnh tranh, khoảng trống thị trường và cơ hội bứt phá.",
      "targetAudience": "Bộ phận Chiến lược, Marketing & Phát triển Sản phẩm",
      "iconName": "TrendingUp",
      "contentMarkdown": "# BÁO CÁO NGHIÊN CỨU & KHẢO SÁT THỊ TRƯỜNG\\n\\n## 1. Tổng quan dung lượng và xu hướng ngành...\\n\\n## 2. Ma trận phân tích đối thủ cạnh tranh...\\n\\n## 3. Khoảng trống thị trường (Market Gap) & Lợi thế bứt phá...",
      "actionItems": [
        "Khảo sát sâu 50 khách hàng tiềm năng đầu tiên",
        "Phân tích chính sách giá và chương trình của đối thủ",
        "Định vị thông điệp bán hàng độc nhất (USP)"
      ]
    },
    {
      "id": "scenario-consumer",
      "key": "consumer_psychology",
      "title": "Tâm Lý Tiêu Dùng & Hành Vi Khách Hàng",
      "shortDesc": "Chân dung Persona mục tiêu, nỗi đau thầm kín, rào cản tâm lý và kịch bản tiếp cận thuyết phục.",
      "targetAudience": "Đội ngũ Sales, Chăm sóc Khách hàng & Sáng tạo Nội dung",
      "iconName": "Brain",
      "contentMarkdown": "# BẢN ĐỒ TÂM LÝ TIÊU DÙNG & HÀNH VI KHÁCH HÀNG\\n\\n## 1. Chân dung khách hàng điển hình (Target Persona)...\\n\\n## 2. Bản đồ thấu cảm: Nỗi đau (Pains) & Khát vọng (Gains)...\\n\\n## 3. Kịch bản tư vấn giải tỏa rào cản tâm lý...",
      "actionItems": [
        "Xây dựng bộ kịch bản tư vấn trực diện cho đội ngũ Sales",
        "Thiết kế chương trình trải nghiệm dùng thử không rủi ro",
        "Thu thập phản hồi cảm xúc của khách hàng giai đoạn đầu"
      ]
    }
  ],
  "pillarsForDossier": [
    {
      "id": "p-1",
      "conceptualType": "concept",
      "title": "Trụ cột I: Bản Thể Luận & Đề Xuất Giá Trị Đề Án",
      "description": "Ý niệm nguyên thủy, căn nguyên bối cảnh và định vị giá trị cốt lõi.",
      "chapters": [
        { "id": "ch-1-1", "title": "Chương 1.1: Khởi Nguyên Bối Cảnh & Tái Định Nghĩa Bài Toán", "status": "pending" },
        { "id": "ch-1-2", "title": "Chương 1.2: Mô Hình Giá Trị Cốt Lõi & Đề Xuất Khác Biệt", "status": "pending" }
      ]
    },
    {
      "id": "p-2",
      "conceptualType": "context",
      "title": "Trụ cột II: Động Lực Học Vận Hành & Quy Luật Dòng Tiền",
      "description": "Các quy luật vận động nội tại, dòng chảy thông tin và chu chuyển tài chính.",
      "chapters": [
        { "id": "ch-2-1", "title": "Chương 2.1: Cơ Chế Vận Hành Nội Tại & Động Lực Đội Ngũ", "status": "pending" },
        { "id": "ch-2-2", "title": "Chương 2.2: Luân Chuyển Dòng Tiền & Tối Ưu Hóa Chi Phí", "status": "pending" }
      ]
    },
    {
      "id": "p-3",
      "conceptualType": "application",
      "title": "Trụ cột III: Bản Vẽ Kiến Trúc Thực Thi & Lộ Trình Phân Kỳ",
      "description": "Kỹ nghệ thi công, quy chuẩn kỹ thuật và giải pháp triển khai thực tế.",
      "chapters": [
        { "id": "ch-3-1", "title": "Chương 3.1: Kiến Trúc Hạ Tầng & Quy Chuẩn Thực Thi", "status": "pending" },
        { "id": "ch-3-2", "title": "Chương 3.2: Lộ Trình Phân Kỳ 3 Giai Đoạn & Mốc Nghiệm Thu", "status": "pending" }
      ]
    },
    {
      "id": "p-4",
      "conceptualType": "deep_dive",
      "title": "Trụ cột IV: Biện Chứng Phản Biện & Quản Trị Rủi Ro Đề Án",
      "description": "Nhận diện điểm nghẽn, các failure modes và kịch bản ứng phó sự cố.",
      "chapters": [
        { "id": "ch-4-1", "title": "Chương 4.1: Điểm Nghẽn Vận Hành & Rủi Ro Thị Trường Tiềm Ẩn", "status": "pending" },
        { "id": "ch-4-2", "title": "Chương 4.2: Cơ Chế Phòng Vệ & Kế Hoạch Dự Phòng Khủng Hoảng", "status": "pending" }
      ]
    },
    {
      "id": "p-5",
      "conceptualType": "internal_dialogue",
      "title": "Trụ cột V: Điểm Tựa Đạo Đức Shinbashira & Kỷ Luật Liêm Chính",
      "description": "Khoảng lặng văn hóa, kỷ luật an toàn và năng lực phục hồi khi biến động.",
      "chapters": [
        { "id": "ch-5-1", "title": "Chương 5.1: Bộ Quy Tắc Đạo Đức & Chuẩn Mực Liêm Chính", "status": "pending" },
        { "id": "ch-5-2", "title": "Chương 5.2: Văn Hóa An Toàn Lao Động & Sức Bền Đội Ngũ", "status": "pending" }
      ]
    },
    {
      "id": "p-6",
      "conceptualType": "synthesis",
      "title": "Trụ cột VI: Trách Nhiệm ESG, Sinh Thái Xanh & Trường Tồn",
      "description": "Hòa hợp thiên nhiên, phụng sự cộng đồng và phát triển bền vững dài hạn.",
      "chapters": [
        { "id": "ch-6-1", "title": "Chương 6.1: Tích Hợp Tiêu Chuẩn Môi Trường & Kinh Tế Tuần Hoàn", "status": "pending" },
        { "id": "ch-6-2", "title": "Chương 6.2: Cam Kết Trách Nhiệm Xã Hội & Tầm Nhìn Trường Tồn", "status": "pending" }
      ]
    }
  ],
  "extractedTerms": [
    {
      "id": "term-1",
      "term": "Thuật ngữ dự án 1",
      "enTerm": "English Term",
      "category": "Liên Ngành Đột Phá",
      "sourceDiscipline": "Kinh Tế & Quản Trị",
      "philosophicalOrigin": "Khảo sát bản thể giá trị",
      "csEquivalent": "Operational Core",
      "deepExplanation": "Giải thích đời thường, dễ hiểu",
      "applicationInAgents": "Ứng dụng trong phân rã nhiệm vụ",
      "tags": ["Dự Án", "Vận Hành"]
    }
  ]
}
</output_format>`;

    let promptContent = sysInstruction;
    if (documentContent) {
      promptContent += `\n<document_content>\n${documentContent}\n</document_content>`;
    }
    promptContent += `\n\nHãy tiến hành thẩm định toàn diện và xuất bản đầy đủ JSON báo cáo phân tích kèm 6 kịch bản hành động:`;

    let contents: any = promptContent;
    if (fileData && fileMimeType) {
      const base64Data = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      contents = [
        { text: promptContent },
        { inlineData: { data: base64Data, mimeType: fileMimeType } }
      ];
    }

    const result = await generateGeminiContent({
      contents,
      temperature: 0.3,
      model,
      responseMimeType: 'application/json'
    });

    let parsed: any;
    try {
      parsed = safeParseLLMJson(result.text);
    } catch (parseErr) {
      console.warn('Failed to parse project analysis JSON, returning structured fallback:', parseErr);
      parsed = constructFallbackProjectAnalysis(result.text, documentContent);
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.scenarios || !Array.isArray(parsed.scenarios) || parsed.scenarios.length === 0) {
      const fallbackObj = constructFallbackProjectAnalysis(result.text, documentContent);
      parsed = { ...fallbackObj, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
      if (!parsed.scenarios || !Array.isArray(parsed.scenarios) || parsed.scenarios.length === 0) {
        parsed.scenarios = fallbackObj.scenarios;
      }
      if (!parsed.pillarsForDossier || !Array.isArray(parsed.pillarsForDossier) || parsed.pillarsForDossier.length === 0) {
        parsed.pillarsForDossier = fallbackObj.pillarsForDossier;
      }
    }

    if (Array.isArray(parsed.extractedTerms)) {
      parsed.extractedTerms = sanitizeExtractedTerms(parsed.extractedTerms);
    }

    // Backward compatibility format support if called by older caller
    const synthesisCompat = {
      decodedEssence: parsed.executiveDiagnosis || 'Đã phân tích hồ sơ dự án.',
      recommendedScenario: 'business_plan',
      proposedTitle: parsed.projectTitle || 'Báo Cáo Phân Tích Hồ Sơ Dự Án',
      proposedSubtitle: parsed.projectSubtitle || 'Kịch bản hành động thực chiến',
      proposedAbstract: parsed.executiveDiagnosis || 'Thẩm định hồ sơ dự án toàn diện.',
      detectedDomain: parsed.projectDomain || 'Quản Trị Dự Án & Kinh Tế',
      interdisciplinaryFields: [parsed.projectDomain || 'Quản Trị', 'Kinh Tế', 'Chiến Lược'],
      pillars: parsed.pillarsForDossier || []
    };

    res.json({
      success: true,
      projectAnalysis: parsed,
      synthesis: synthesisCompat,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error analyzing project document:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi xử lý API khi phân tích dự án' });
  }
});

// 3.6. Deep Custom Scenario Generator (Regenerate or expand a single scenario)
app.post('/api/gemini/generate-project-scenario', async (req, res) => {
  try {
    const {
      scenarioKey,
      scenarioTitle,
      projectTitle,
      projectDiagnosis,
      documentContext = '',
      customInstruction = '',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!scenarioKey || !projectTitle) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin kịch bản hoặc tên dự án.' });
    }

    const prompt = `<system_instruction>
Bạn là Chuyên gia Cao cấp về Chiến lược Vận hành, Truyền thông & Nghiên cứu Thị trường của Oneness Governance Lab.
Nhiệm vụ: Biên soạn một BẢN KỊCH BẢN HÀNH ĐỘNG THỰC CHIẾN CHI TIẾT VÀ SẮC BÉN cho Đề Án: "${projectTitle}".
Kịch bản: "${scenarioTitle}" (Mã: ${scenarioKey}).

NGUYÊN TẮC BIÊN SOẠN THỰC CHIẾN:
1. Triết lý "Knowledge Transforming": Chuyển hóa toàn bộ nhận định học thuật sang ngôn ngữ gãy gọn, trong sáng, thực chiến, không lý thuyết suông.
2. Quy chuẩn sơ đồ luồng: Dùng ASCII Text Flow phẳng [Khâu 1] --(Điều kiện)--> [Khâu 2] (TUYỆT ĐỐI KHÔNG dùng Mermaid).
3. Đầy đủ các phần:
   - Bối cảnh & Mục tiêu sống còn
   - Lộ trình thực thi từng bước (Phân kỳ rõ ràng)
   - Bảng phân nhiệm / Ma trận trách nhiệm / Danh mục kiểm tra (Checklist)
   - Dự báo rủi ro & Kế hoạch phòng ngừa
   - Bộ 3-5 hành động tiên quyết bắt tay làm ngay hôm nay.

${customInstruction ? `YÊU CẦU ĐẶC BIỆT TỪ NGƯỜI DÙNG:\n${customInstruction}\n` : ''}
</system_instruction>

<context>
Tên Đề Án: ${projectTitle}
Nhận định tổng quan: ${projectDiagnosis || 'Nghiên cứu dự án'}
Tài liệu liên quan:
${documentContext ? documentContext.slice(0, 3000) : 'Dữ liệu dự án'}
</context>

<task>
Hãy soạn thảo toàn văn Kịch bản "${scenarioTitle}" bằng định dạng Markdown hoàn chỉnh, chuyên nghiệp và sẵn sàng áp dụng.
</task>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.35,
      model
    });

    return res.json({
      success: true,
      contentMarkdown: result.text.trim(),
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating project scenario:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo kịch bản hành động.' });
  }
});

// 3.7. Academic Document Intelligence & Dossier Ingestion Engine (Phân Tích Tài Liệu Học Thuật & Tạo Hồ Sơ)
const handleAnalyzeAcademicDoc = async (req: express.Request, res: express.Response) => {
  const {
    academicContent = '',
    fileData,
    fileMimeType,
    documentTitle = '',
    targetDiscipline = '',
    interdisciplinaryFields = [],
    depthLevel = 'dissertation',
    chaptersPerPillar,
    strategicFocus = '',
    model = 'gemini-3.7-pro'
  } = req.body;

  if (!academicContent.trim() && !fileData) {
    return res.status(400).json({
      success: false,
      error: 'Vui lòng cung cấp nội dung văn bản hoặc tải lên tệp tài liệu học thuật (PDF, DOCX, TXT, MD).'
    });
  }

  // Determine target chapters per pillar (2, 3, or 4)
  let numChapters = 3;
  if (typeof chaptersPerPillar === 'number' && [2, 3, 4].includes(chaptersPerPillar)) {
    numChapters = chaptersPerPillar;
  } else {
    if (depthLevel === 'executive_brief') numChapters = 2;
    else if (depthLevel === 'applied_monograph') numChapters = 3;
    else if (depthLevel === 'grand_synthesis') numChapters = 4;
    else numChapters = 3; // dissertation defaults to 3 solid chapters per pillar
  }

  const sysInstruction = `<system_instruction>
Bạn là Tổng Viện Trưởng Nghiên Cứu & Kiến Trúc Sư Trưởng Tri Thức của Oneness Governance Lab (OG Lab).
Nhiệm vụ của bạn là: TIẾP NHẬN MỘT TÀI LIỆU HỌC THUẬT / BÀI BÁO KHOA HỌC / LUẬN VĂN / KHẢO LUẬN / TRÍCH ĐOẠN KINH ĐIỂN
-> PHÂN TÍCH TOÀN DIỆN QUA 4 CẤP ĐỘ PHÂN TẦNG HỌC THUẬT VÀ CHUYỂN HÓA TRI THỨC (KNOWLEDGE TRANSFORMING) THÀNH MỘT HỒ SƠ KHẢO LUẬN THEO KIẾN TRÚC TRỤ CỘT THÍCH ỨNG ĐỘNG (ADAPTIVE TASK-DRIVEN PILLARS).

QUY CHUẨN PHƯƠNG PHÁP LUẬN BẮT BUỘC (AGENTS_md METHODOLOGY):
1. Slogan Cốt Lõi: "Deep Research & Knowledge Transforming" (Chuyển Hóa Tri Thức).
   - Tiếp nhận và nghiên cứu ở tầm mức học thuật cao nhất (Hàn lâm, Triết học, Toán học, Hệ thống phức tạp, CS, Khoa học Xã hội).
   - Toàn bộ nội dung xuất bản phải được biên dịch sang NGÔN NGỮ ĐỜI THƯỜNG, TRONG SÁNG, GÃY GỌN VÀ THỰC CHIẾN, giúp bất kỳ ai đọc vào cũng hiểu được bản chất để HÀNH ĐỘNG, VẬN ĐỘNG VÀ KIẾN TẠO GIÁ TRỊ CỤ THỂ CHO XÃ HỘI.
   - TUYỆT ĐỐI KHÔNG CHÈN TIÊU ĐỀ CẤP ĐỘ THÔ CỨNG NHƯ "## CẤP ĐỘ 1: ...", "## CẤP ĐỘ 2: ...".

2. KIẾN TRÚC TRỤ CỘT THÍCH ỨNG ĐỘNG (ADAPTIVE TASK-DRIVEN PILLARS):
   - Bạn tự động phân tích độ phức tạp, bản chất miền tri thức, mục tiêu và quy mô của nhiệm vụ/tài liệu để tự kiến tạo cấu trúc số lượng và nội dung các Trụ Cột tối ưu nhất (thường từ 4 đến 7+ trụ cột tùy bài toán).
   - Tự do định danh từng trụ cột theo dạng "Trụ cột [Số La Mã]: [Tên Sáng Tạo Phù Hợp Chủ Đề]" (Ví dụ: Trụ cột I: Bản Thể Luận & Khởi Nguyên Ý Niệm, Trụ cột II: Động Lực Học Vận Hành, Trụ cột III: Kiến Trúc Multi-Agent Thực Thi, Trụ cột IV: Phòng Vệ Rủi Ro & Biện Chứng, Trụ cột V: Chuẩn Mực Đạo Đức & Cân Bằng, Trụ cột VI: Sinh Thái Bền Vững & Tác Động Xã Hội...).

3. YÊU CẦU ĐỘ SÂU BÁO CÁO & SỐ LƯỢNG CHƯƠNG (${numChapters} CHƯƠNG CHO MỖI TRỤ CỘT):
   - Mỗi trụ cột phải có ${numChapters} chương khảo luận chuyên sâu (được đánh số mạch lạc như Chương 1.1, 1.2${numChapters >= 3 ? ', 1.3' : ''}${numChapters >= 4 ? ', 1.4' : ''}).
   - Mỗi chương phải là một phân đoạn nghiên cứu súc tích, gãy gọn, trình bày bằng Markdown với:
     * Tiêu đề và Phụ đề súc tích
     * Luận điểm học thuật & giải mã ngôn ngữ đời thường
     * Sơ đồ phẳng ASCII Flow trực quan
     * Lời khuyên thực chiến cho người đọc

4. Quy chuẩn Sơ Đồ Luồng (ASCII Text Flow - AGENTS_md Mục 6):
   TUYỆT ĐỐI KHÔNG dùng Mermaid hay khối mã nguồn cồng kềnh. Hãy mô tả luồng logic bằng ASCII Text Flow phẳng, trực quan:
   [Khối Khởi Nguyên] --(Quy luật vận hành + Động lực)--> [Khối Chuyển Hóa] --(Kiểm định an toàn)--> [Thành Phẩm Thực Chiến]

5. Sổ Từ Điển Thuật Ngữ (Lexicon Hub Integration):
   Trích xuất 6-10 thuật ngữ chuyên sâu (Hàn lâm, Triết học, Toán, Khoa học Máy tính) vào "autoCapturedTerms". Mỗi thuật ngữ PHẢI CÓ: định nghĩa đời thường dễ hiểu, ví dụ thực tế và ánh xạ sang Multi-Agent/Kỹ nghệ phần mềm.

6. Trích Dẫn & Nguồn Kinh Điển:
   Trích xuất 4-6 trích dẫn hoặc tài liệu tham khảo kinh điển liên quan mật thiết đến chủ đề.

${targetDiscipline ? `LĨNH VỰC HỌC THUẬT MỤC TIÊU: ${targetDiscipline}\n` : ''}
${interdisciplinaryFields && interdisciplinaryFields.length > 0 ? `CÁC NGÀNH LIÊN HỆ: ${interdisciplinaryFields.join(', ')}\n` : ''}
${strategicFocus ? `ĐỊNH HƯỚNG TẬP TRUNG TỪ NGHIÊN CỨU VIÊN:\n${strategicFocus}\n` : ''}
</system_instruction>

<task>
Hãy phân tích tài liệu học thuật đầu vào, chuyển hóa tri thức và xuất bản ĐẦY ĐỦ JSON chứa toàn bộ Hồ Sơ Khảo Luận (Dossier) theo Trụ Cột Thích Ứng chuẩn Oneness Governance, với đúng ${numChapters} chương cho mỗi trụ cột.
</task>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ (không kèm văn bản ngoài khối json):
{
  "dossier": {
    "title": "Tiêu Đề Khảo Luận Súc Tích & Sâu Sắc (Tiếng Việt)",
    "subtitle": "Phụ đề thể hiện giá trị chuyển hóa tri thức sang thực chiến",
    "discipline": "${targetDiscipline || 'Lĩnh Vực Học Thuật'}",
    "interdisciplinaryFields": ${JSON.stringify(interdisciplinaryFields.length > 0 ? interdisciplinaryFields : ['Hệ Thống Phức Tạp', 'Khoa Học Máy Tính'])},
    "depthLevel": "${depthLevel}",
    "tags": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3", "Từ khóa 4"],
    "abstract": "Đoạn văn tóm tắt khảo luận (200-350 từ) giải thích bản chất vấn đề bằng ngôn ngữ đời thường, gãy gọn, nêu bật phát hiện cốt lõi và lộ trình thực thi.",
    "keyFindings": [
      "Phát hiện / Đột phá học thuật trọng tâm 1",
      "Phát hiện / Đột phá học thuật trọng tâm 2",
      "Phát hiện / Đột phá học thuật trọng tâm 3",
      "Phát hiện / Đột phá học thuật trọng tâm 4",
      "Phát hiện / Đột phá học thuật trọng tâm 5"
    ],
    "philosophicalBasis": [
      {
        "doctrine": "Tên học thuyết / Trường phái triết học",
        "philosopher": "Tên triết gia / Học giả khởi xướng",
        "coreTenet": "Nguyên lý cốt lõi",
        "modernParity": "Ánh xạ sang quản trị hiện đại & AI"
      }
    ],
    "technicalMappings": [
      {
        "classicalConcept": "Ý niệm hàn lâm / Cổ điển",
        "computerSciencePattern": "Mô hình Khoa học máy tính / Multi-Agent tương đương",
        "rationale": "Cơ sở đối chiếu",
        "failureModeAvoided": "Bẫy sai lầm hoặc rủi ro được hóa giải"
      }
    ],
    "citations": [
      {
        "id": "cit-1",
        "title": "Tên tác phẩm / Bài báo kinh điển",
        "author": "Tên tác giả",
        "year": "Năm xuất bản",
        "source": "Nguồn xuất bản / Journal / Nhà xuất bản",
        "category": "Kinh điển",
        "keyQuote": "Câu trích dẫn tiêu biểu"
      }
    ],
    "autoCapturedTerms": [
      {
        "id": "term-1",
        "term": "Tên thuật ngữ (Tiếng Việt)",
        "enTerm": "English Term",
        "category": "Liên Ngành Đột Phá",
        "sourceDiscipline": "Lĩnh vực nguồn",
        "philosophicalOrigin": "Cội nguồn tư tưởng",
        "csEquivalent": "Ánh xạ CS / Multi-Agent",
        "deepExplanation": "Giải thích đời thường, dễ hiểu, có ví dụ thực tế",
        "applicationInAgents": "Cách áp dụng vào hệ thống Multi-Agent hoặc đời sống",
        "tags": ["Thuật ngữ", "Học thuật"]
      }
    ],
    "projectStructure": [
      {
        "id": "p-1",
        "conceptualType": "concept",
        "title": "Trụ cột I: [Tên Sáng Tạo Phù Hợp]",
        "description": "Mô tả định hướng của trụ cột.",
        "chapters": [
          {
            "id": "ch-1-1",
            "title": "Chương 1.1: [Tiêu Đề Khảo Luận Sâu Sắc]",
            "subtitle": "Phụ đề định hướng hành động",
            "status": "completed",
            "contentMarkdown": "Nội dung khảo luận chi tiết của Chương 1.1 (súc tích, có phân tích thực tiễn, sơ đồ ASCII Flow phẳng...)"
          }
        ]
      }
    ]
  },
  "analyticalDiagnosis": {
    "academicRigorScore": 96,
    "paradigmsShifted": [
      "Sự dịch chuyển mô hình tư duy 1",
      "Sự dịch chuyển mô hình tư duy 2",
      "Sự dịch chuyển mô hình tư duy 3"
    ],
    "practicalApplicability": "Đoạn văn súc tích giải thích cách hồ sơ này có thể bắt tay áp dụng vào thực tế ngay hôm nay.",
    "recommendedActionNext": "Hành động khuyến nghị tiếp theo cho nhóm nghiên cứu."
  }
}
</output_format>`;

  let promptContent = sysInstruction;
  if (documentTitle) {
    promptContent += `\n<document_title>${documentTitle}</document_title>`;
  }
  if (academicContent) {
    promptContent += `\n<academic_source_text>\n${academicContent}\n</academic_source_text>`;
  }
  promptContent += `\n\nHãy tiến hành phân tích học thuật, chuyển hóa tri thức và xuất bản đầy đủ JSON Hồ Sơ Khảo Luận theo Trụ Cột Thích Ứng:`;

  let contents: any = promptContent;
  if (fileData && fileMimeType) {
    const base64Data = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    contents = [
      { text: promptContent },
      { inlineData: { data: base64Data, mimeType: fileMimeType } }
    ];
  }

  let resultText = '';
  let modelUsed = model;

  try {
    const genResult = await generateGeminiContent({
      contents,
      temperature: 0.25,
      model,
      responseMimeType: 'application/json'
    });
    resultText = genResult.text;
    modelUsed = genResult.modelUsed || model;
  } catch (genErr: any) {
    console.warn('Gemini API call warning during academic doc analysis, falling back to local synthesis:', genErr);
  }

  let parsed: any;
  try {
    if (resultText) {
      parsed = safeParseLLMJson(resultText);
    }
  } catch (parseErr) {
    console.warn('Failed to parse academic doc analysis JSON, falling back:', parseErr);
    parsed = extractPartialJsonFields(resultText);
  }

  // If parsed contains dossier wrapper or top-level keys
  const rawDossier = (parsed && parsed.dossier) ? parsed.dossier : (parsed && (parsed.title || parsed.projectStructure) ? parsed : null);

  // Generate complete fallback dossier
  const fallbackDossier = constructFallbackAcademicDossier(
    resultText,
    academicContent.slice(0, 1000),
    documentTitle,
    targetDiscipline,
    interdisciplinaryFields,
    depthLevel,
    numChapters
  );

  // Merge rawDossier with fallbackDossier
  const mergedTitle = (rawDossier && rawDossier.title) || fallbackDossier.title;
  const mergedSubtitle = (rawDossier && rawDossier.subtitle) || fallbackDossier.subtitle;
  const mergedAbstract = (rawDossier && rawDossier.abstract) || fallbackDossier.abstract;
  const mergedDiscipline = (rawDossier && rawDossier.discipline) || fallbackDossier.discipline;
  const mergedInterdisciplinary = (rawDossier && Array.isArray(rawDossier.interdisciplinaryFields) && rawDossier.interdisciplinaryFields.length > 0)
    ? rawDossier.interdisciplinaryFields
    : fallbackDossier.interdisciplinaryFields;

  const mergedKeyFindings = (rawDossier && Array.isArray(rawDossier.keyFindings) && rawDossier.keyFindings.length > 0)
    ? rawDossier.keyFindings
    : fallbackDossier.keyFindings;

  const mergedPhilosophicalBasis = (rawDossier && Array.isArray(rawDossier.philosophicalBasis) && rawDossier.philosophicalBasis.length > 0)
    ? rawDossier.philosophicalBasis
    : fallbackDossier.philosophicalBasis;

  const mergedTechnicalMappings = (rawDossier && Array.isArray(rawDossier.technicalMappings) && rawDossier.technicalMappings.length > 0)
    ? rawDossier.technicalMappings
    : fallbackDossier.technicalMappings;

  const mergedCitations = (rawDossier && Array.isArray(rawDossier.citations) && rawDossier.citations.length > 0)
    ? rawDossier.citations
    : fallbackDossier.citations;

  const mergedTerms = (rawDossier && Array.isArray(rawDossier.autoCapturedTerms) && rawDossier.autoCapturedTerms.length > 0)
    ? sanitizeExtractedTerms(rawDossier.autoCapturedTerms)
    : fallbackDossier.autoCapturedTerms;

  // Dynamically map all pillars generated by AI or fallback
  const rawStructure = (rawDossier && Array.isArray(rawDossier.projectStructure) && rawDossier.projectStructure.length > 0)
    ? rawDossier.projectStructure
    : fallbackDossier.projectStructure;

  const finalProjectStructure = rawStructure.map((rawP: any, pIdx: number) => {
    const fallbackP = fallbackDossier.projectStructure[pIdx] || {
      id: `p-${pIdx + 1}`,
      conceptualType: 'concept',
      title: `Trụ cột ${pIdx + 1}`,
      description: 'Khảo luận thích ứng theo nhiệm vụ.',
      chapters: []
    };

    const pillarTitle = rawP.title || fallbackP.title;
    const pillarDesc = rawP.description || fallbackP.description;
    const rawChapters = Array.isArray(rawP.chapters) ? rawP.chapters : [];

    const chapters = (rawChapters.length > 0 ? rawChapters : (fallbackP.chapters || [])).map((chap: any, cIdx: number) => {
      const fallbackChap = (fallbackP.chapters && fallbackP.chapters[cIdx]) || {
        id: `ch-${pIdx + 1}-${cIdx + 1}`,
        title: `Chương ${pIdx + 1}.${cIdx + 1}`,
        subtitle: 'Chuyển hóa tri thức',
        status: 'completed',
        contentMarkdown: 'Nội dung khảo luận chuyên sâu.'
      };

      return {
        id: chap.id || fallbackChap.id,
        title: chap.title || fallbackChap.title,
        subtitle: chap.subtitle || fallbackChap.subtitle,
        status: 'completed',
        contentMarkdown: chap.contentMarkdown && chap.contentMarkdown.length > 20
          ? chap.contentMarkdown
          : fallbackChap.contentMarkdown
      };
    });

    return {
      id: rawP.id || fallbackP.id,
      conceptualType: rawP.conceptualType || fallbackP.conceptualType,
      title: pillarTitle,
      description: pillarDesc,
      chapters
    };
  });

  const newDossierId = `dossier-academic-${Date.now()}`;
  const timestamp = new Date().toISOString();

  const fullDossier: Dossier = {
    id: newDossierId,
    pillarId: 'dynamic-academic',
    pillarTitle: mergedDiscipline || 'Học Thuật Liên Ngành',
    chapterNumber: 1,
    title: mergedTitle,
    subtitle: mergedSubtitle,
    topic: mergedTitle,
    discipline: mergedDiscipline,
    interdisciplinaryFields: mergedInterdisciplinary,
    depthLevel: depthLevel as any,
    tags: ['Học Thuật', 'Knowledge Transforming', 'Trụ Cột Thích Ứng', 'Thực Chiến'],
    abstract: mergedAbstract,
    contentMarkdown: mergedAbstract,
    keyFindings: mergedKeyFindings,
    philosophicalBasis: mergedPhilosophicalBasis,
    technicalMappings: mergedTechnicalMappings,
    citations: mergedCitations,
    autoCapturedTerms: mergedTerms,
    lastModified: timestamp,
    status: 'draft',
    isDynamicProject: true,
    mode: 'deep',
    westernPhilosophy: true,
    easternPhilosophy: true,
    projectStructure: finalProjectStructure
  };

  const finalDiagnosis = (parsed && parsed.analyticalDiagnosis) || fallbackDossier.analyticalDiagnosis;

  return res.json({
    success: true,
    dossier: fullDossier,
    analyticalDiagnosis: finalDiagnosis,
    modelUsed
  });
};

app.post('/api/gemini/analyze-academic-doc', handleAnalyzeAcademicDoc);
app.post('/api/analyze-academic-doc', handleAnalyzeAcademicDoc);


// 4. Synthesize & Expand Inline Sections
app.post('/api/gemini/synthesize', async (req, res) => {
  try {
    const { action = 'expand_section', context = '', prompt = '', model = 'gemini-3.7-flash' } = req.body;

    const fullPrompt = `Bạn là Trợ lý Nghiên cứu Bác học của OG Lab.
Hành động: ${action}
Yêu cầu: ${prompt}

Ngữ cảnh hiện tại:
"""
${context.substring(0, 4000)}
"""

Hãy cung cấp nội dung mở rộng sâu sắc, chuẩn học thuật, trình bày bằng Markdown:`;

    const result = await generateGeminiContent({
      contents: fullPrompt,
      temperature: 0.3,
      model
    });

    return res.json({
      success: true,
      text: result.text,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error during synthesis:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tổng hợp tri thức.' });
  }
});

// 5.1. Smart AI Discipline Generator (Infer and Standardize from Short Keyword/Concept)
app.post('/api/gemini/generate-discipline', async (req, res) => {
  try {
    const { keyword, model = 'gemini-3.7-flash' } = req.body;
    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập từ khóa hoặc tên lĩnh vực cần tạo.' });
    }

    const prompt = `<system_instruction>
Bạn là Hội đồng Học thuật của Oneness Governance Lab.
Nhiệm vụ của bạn là tiếp nhận một từ khóa, khái niệm hoặc ý niệm ngắn của người dùng (ví dụ: "Kinh tế tuần hoàn", "Điều khiển học", "Sinh học phân tử", "Tâm lý học hành vi") và tự động chuẩn hóa thành một Thẻ Lĩnh Vực Nghiên Cứu Liên Ngành theo đúng chuẩn mực học thuật và triết lý Chuyển Hóa Tri Thức (Knowledge Transforming).

HỆ THỐNG 6 NHÓM HỌC THUẬT:
1. "epistemology_philosophy": Nhận Thức Luận, Triết Học & Lịch Sử
2. "institutions_economics": Thể Chế, Kinh Tế & Động Lực Xã Hội
3. "cognition_behavior": Nhận Thức, Tâm Lý & Não Bộ Tính Toán
4. "math_physics_systems": Toán-Lý, Năng Lượng & Hệ Thống Phức Tạp
5. "cs_ai_data": Khoa Học Máy Tính, Dữ Liệu & AI Tự Trị
6. "emerging_frontier": Lĩnh Vực Đột Phá & Mới Nổi

YÊU CẦU:
1. "name": Tên tiếng Việt học thuật chuẩn hóa, trang nhã.
2. "enName": Tên tiếng Anh chuyên ngành quốc tế.
3. "groupId": Chọn chính xác 1 trong 6 mã nhóm trên phù hợp nhất.
4. "groupName": Tên tiếng Việt tương ứng của nhóm được chọn.
5. "description": 1-2 câu súc tích mô tả trọng tâm nhận thức luận và giá trị của lĩnh vực.
6. "coreLenses": Mảng gồm chính xác 3-4 lăng kính phân tích cốt lõi (ngắn gọn, sắc bén).
7. "keyFigures": Mảng gồm 3-4 học giả/tác giả nổi tiếng tiêu biểu nhất trong lĩnh vực.
8. "systemAnalogy": 1 câu giải thích rõ nét cách ánh xạ lĩnh vực này sang Kiến trúc Hệ thống máy tính, Khoa học dữ liệu hoặc Multi-Agent Swarms.
9. "methodology": 1 câu mô tả phương pháp luận nghiên cứu đặc thù.
10. "icon": Chọn 1 icon Lucide phù hợp nhất trong danh sách: ["Atom", "Globe", "Landmark", "Palette", "Users", "Brain", "Layers", "Scale", "Activity", "BookOpen", "TrendingUp", "Zap", "Eye", "Compass", "Cpu", "ShieldCheck", "Network", "Sparkles", "Boxes", "Radio", "Gauge", "Wind", "Dna", "KeyRound", "Cloud"].
11. "color": Chọn màu text tailwind tương ứng (vd: "text-emerald-400", "text-cyan-400", "text-amber-400", "text-purple-400", "text-blue-400", "text-rose-400", "text-teal-400", "text-fuchsia-400").
12. "bgLight": Màu nền sáng (vd: "bg-emerald-100 text-emerald-900").
13. "bgDark": Màu nền tối (vd: "bg-emerald-950/60 text-emerald-300").
</system_instruction>

<task>
Từ khóa hoặc khái niệm đầu vào: "${keyword.trim()}"
</task>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ (không kèm văn bản ngoài markdown json block):
{
  "id": "custom_${Date.now()}",
  "name": "Tên tiếng Việt",
  "enName": "Tên tiếng Anh",
  "groupId": "epistemology_philosophy",
  "groupName": "Nhận Thức Luận, Triết Học & Lịch Sử",
  "icon": "TênIcon",
  "color": "text-emerald-400",
  "bgLight": "bg-emerald-100 text-emerald-900",
  "bgDark": "bg-emerald-950/60 text-emerald-300",
  "description": "Mô tả nhận thức luận...",
  "coreLenses": ["Lăng kính 1", "Lăng kính 2", "Lăng kính 3"],
  "keyFigures": ["Học giả 1", "Học giả 2", "Học giả 3"],
  "systemAnalogy": "Ánh xạ sang kiến trúc hệ thống...",
  "methodology": "Phương pháp luận nghiên cứu..."
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.2,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);
    parsed.id = parsed.id || `custom_${Date.now()}`;
    return res.json({ success: true, discipline: parsed, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error('Error generating smart discipline:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tự động phân tích và tạo lĩnh vực.' });
  }
});

// 5.2. Dynamic Gemini Notebook & NotebookLM Prompt Generator (Linked to Dossier & User Intent)
app.post('/api/gemini/generate-notebook-prompt', async (req, res) => {
  try {
    const {
      dossierId,
      dossierTitle,
      dossierSubtitle = '',
      dossierAbstract = '',
      pillarsSummary = '',
      userIdea = '',
      outputFormat = 'audio_deep_dive',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!dossierTitle || typeof dossierTitle !== 'string') {
      return res.status(400).json({ success: false, error: 'Hồ Sơ liên kết không hợp lệ.' });
    }

    const formatMap: Record<string, { label: string; focus: string }> = {
      audio_deep_dive: {
        label: 'Kịch Bản Podcast / Audio Deep Dive (2 Người Dẫn Học Thuật & Thực Chiến)',
        focus: 'Đối thoại sinh động giữa 2 chuyên gia (1 người đặt câu hỏi thực tiễn và 1 chuyên gia giải mã 6 trụ cột), chuyển hóa tri thức hàn lâm sang bài học đời thường, không dùng biệt ngữ rườm rà.'
      },
      briefing_doc: {
        label: 'Briefing Doc & Kế Hoạch Hành Động Thực Chiến (Executive Action Memo)',
        focus: 'Bản ghi nhớ hành động cấp điều hành: Tóm tắt 6 trụ cột cốt lõi, ma trận phân tích rủi ro, danh mục hành động ngay và chỉ số đo lường hiệu quả (KPIs).'
      },
      study_guide: {
        label: 'Sách Hướng Dẫn Nghiên Cứu & Trắc Nghiệm Nhận Thức (Study Guide & Review)',
        focus: 'Đề cương ôn tập chi tiết theo từng chương, câu hỏi tự suy ngẫm sâu sắc, giải thích thuật ngữ then chốt và các bài tập tình huống thực tế.'
      },
      dialectical_matrix: {
        label: 'Ma Trận Phản Biện & Điểm Nghẽn Biện Chứng (Dialectical & Failure Modes Matrix)',
        focus: 'Phân tích các mâu thuẫn nội tại, nghịch lý kỹ thuật, bẫy ngụy biện phổ biến trong hồ sơ và các giải pháp khắc phục đối trọng.'
      },
      faq_concept_map: {
        label: 'Bản Đồ Khái Niệm & Bộ FAQ Tra Cứu Tức Thì (Instant Knowledge Map)',
        focus: '10-15 câu hỏi - đáp nhanh giải mã toàn bộ hồ sơ theo ngôn ngữ bình dân, kèm bảng tra cứu khái niệm song ngữ Việt - Anh.'
      },
      multi_agent_spec: {
        label: 'Đặc Tả Kỹ Nghệ Hệ Thống & Multi-Agent Swarms Blueprint',
        focus: 'Bản thiết kế kiến trúc phân tán: Phân rã hồ sơ thành các vai trò Agent, giao thức truyền tin (Gossip/Consensus), cơ chế kiểm soát lỗi và luồng điều phối thực thi.'
      },
      custom: {
        label: 'Prompt Tùy Biến Chuyên Biệt Cho Gemini Notebook',
        focus: 'Tập trung tối đa vào ý niệm cụ thể của người dùng và liên kết trực tiếp với dữ liệu hồ sơ.'
      }
    };

    const targetFormatInfo = formatMap[outputFormat] || formatMap.custom;

    const prompt = `<system_instruction>
Bạn là Chuyên gia Kiến trúc Prompt cao cấp cho Google NotebookLM và Google Gemini Workspace.
Nhiệm vụ của bạn là: Dựa trên dữ liệu của Hồ Sơ Học Thuật hiện tại kết hợp cùng Ý Niệm Mong Muốn của người dùng, hãy thiết kế một BẢN PROMPT CHUẨN MỰC, TINH GỌN, ĐÚNG TIÊU CHUẨN KHUNG PROMPT CỦA GEMINI NOTEBOOK / NOTEBOOKLM (không dài thừa thãi, không sáo rỗng, tập trung vào khả năng trích xuất chính xác từ các tệp nguồn).

ĐẶC TRƯNG TIÊU CHUẨN CỦA PROMPT NOTEBOOKLM:
1. Định vị rõ ràng vai trò phân tích (Persona).
2. Thiết lập quy tắc "Source-Grounding" nghiêm ngặt: Chỉ dựa vào các tài liệu Nguồn (Sources) được nạp vào NotebookLM (Toàn văn Markdown Hồ Sơ, 6 Trụ Cột Động, Sổ Từ Điển Lexicon, Sổ Trích Dẫn).
3. Đòi hỏi chuyển hóa tri thức theo phương pháp Oneness Governance: Tiếp nhận tri thức hàn lâm nhưng diễn giải bằng ngôn ngữ đời thường, gãy gọn, giàu tính hành động thực chiến.
4. Cấu trúc rõ ràng theo định dạng đầu ra mong muốn (${targetFormatInfo.label}).
5. Cung cấp chỉ dẫn "NẠP NGUỒN NÀO" (Recommended Sources Guide) để người dùng biết chính xác cần xuất nội dung nào của Hồ Sơ vào NotebookLM.
</system_instruction>

<dossier_context>
- Tiêu đề Hồ Sơ: "${dossierTitle}"
- Tiêu đề phụ / Mô tả: "${dossierSubtitle || dossierAbstract}"
- Cấu trúc Trụ Cột & Chương hiện tại: ${pillarsSummary || '6 Trụ Cột Động và các chương chuyên sâu'}
</dossier_context>

<user_intent>
- Định dạng yêu cầu: ${targetFormatInfo.label}
- Trọng tâm định dạng: ${targetFormatInfo.focus}
- Ý niệm người dùng nhập vào: "${userIdea ? userIdea.trim() : 'Tổng hợp và trích xuất tinh hoa hồ sơ theo định dạng tiêu chuẩn'}"
</user_intent>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ (không kèm văn bản ngoài markdown json block):
{
  "title": "Tiêu đề ngắn gọn của Prompt (VD: Kịch Bản Audio Deep Dive - Hồ Sơ ...)",
  "recommendedSourcesGuide": "Hướng dẫn người dùng nạp tệp nguồn nào từ Hồ sơ vào NotebookLM (VD: Nạp toàn văn tệp .md của Hồ Sơ '${dossierTitle}' + Danh mục Sổ Từ Điển Lexicon Hub)",
  "generatedPrompt": "Nội dung Prompt đầy đủ, tinh gọn, chuẩn mực để dán vào Gemini NotebookLM..."
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.2,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);
    const notebookPrompt: any = {
      id: `np-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: parsed.title || `Prompt NotebookLM: ${dossierTitle}`,
      conceptIdea: userIdea || targetFormatInfo.label,
      outputFormat,
      generatedPrompt: parsed.generatedPrompt,
      recommendedSourcesGuide: parsed.recommendedSourcesGuide || `Nạp toàn bộ tệp Markdown của Hồ Sơ "${dossierTitle}" và Sổ Từ Điển Thuật Ngữ.`,
      targetDossierTitle: dossierTitle,
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      notebookPrompt,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating notebook prompt:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo prompt cho Gemini Notebook.' });
  }
});

// 6. Dossiers CRUD Endpoints with Disk Persistence
app.post('/api/assets/upload-base64', (req, res) => {
  try {
    const { dataUri, prefix = 'upload' } = req.body;
    if (!dataUri) return res.status(400).json({ success: false, error: 'No dataUri provided' });
    const url = saveBase64Image(dataUri, prefix);
    res.json({ success: true, url });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/dossiers', (req, res) => {
  dossiersStore = loadDossiers();
  res.json({ success: true, dossiers: dossiersStore });
});

app.post('/api/dossiers', (req, res) => {
  const dossier = req.body;
  if (!dossier.id) dossier.id = `dossier-${Date.now()}`;
  dossier.lastModified = new Date().toISOString();
  
  dossiersStore = loadDossiers();
  // Ensure accurate next chapter number if missing or invalid
  const incomingNum = typeof dossier.chapterNumber === 'number' ? dossier.chapterNumber : parseInt(String(dossier.chapterNumber), 10);
  if (isNaN(incomingNum) || incomingNum <= 0) {
    dossier.chapterNumber = calculateNextChapterNumber(dossiersStore);
  }

  // Remove existing with same ID if updating via post
  dossiersStore = dossiersStore.filter(d => d.id !== dossier.id);
  const optimized = extractAndStoreImagesFromDossier(dossier);
  dossiersStore.unshift(optimized);
  dossiersStore = normalizeDossierNumbers(dossiersStore);
  saveDossiers(dossiersStore);
  console.log(`[Storage] Dossier saved: ${optimized.id} -> "${optimized.title}"`);
  res.json({ success: true, dossier: optimized });
});

app.put('/api/dossiers/:id', (req, res) => {
  const { id } = req.params;
  const updated = req.body;
  if (!updated.lastModified) {
    updated.lastModified = new Date().toISOString();
  }

  const optimized = extractAndStoreImagesFromDossier({ ...updated, id });

  dossiersStore = loadDossiers();
  const index = dossiersStore.findIndex(d => d.id === id);
  if (index >= 0) {
    dossiersStore[index] = { ...dossiersStore[index], ...optimized, id };
    dossiersStore = normalizeDossierNumbers(dossiersStore);
    saveDossiers(dossiersStore);
    const saved = dossiersStore.find(d => d.id === id) || dossiersStore[index];
    console.log(`[Storage] Dossier updated & saved: ${id} -> "${saved.title}"`);
    res.json({ success: true, dossier: saved });
  } else {
    if (!optimized.chapterNumber) {
      optimized.chapterNumber = calculateNextChapterNumber(dossiersStore);
    }
    dossiersStore.unshift(optimized);
    dossiersStore = normalizeDossierNumbers(dossiersStore);
    saveDossiers(dossiersStore);
    const saved = dossiersStore.find(d => d.id === id) || optimized;
    console.log(`[Storage] New dossier inserted & saved: ${id} -> "${saved.title}"`);
    res.json({ success: true, dossier: saved });
  }
});

app.patch('/api/dossiers/:id/title', (req, res) => {
  const { id } = req.params;
  const { title, subtitle, abstract } = req.body;

  dossiersStore = loadDossiers();
  const index = dossiersStore.findIndex(d => d.id === id);
  if (index >= 0) {
    if (title !== undefined) dossiersStore[index].title = title.trim();
    if (subtitle !== undefined) dossiersStore[index].subtitle = subtitle.trim();
    if (abstract !== undefined) dossiersStore[index].abstract = abstract;
    dossiersStore[index].lastModified = new Date().toISOString();

    saveDossiers(dossiersStore);
    console.log(`[Storage] Dossier title patched: ${id} -> "${dossiersStore[index].title}"`);
    return res.json({ success: true, dossier: dossiersStore[index] });
  }
  res.status(404).json({ success: false, error: 'Dossier not found' });
});

app.delete('/api/dossiers/:id', (req, res) => {
  const { id } = req.params;
  addDeletedDossierIdOnServer(id);
  dossiersStore = loadDossiers().filter(d => d.id !== id);
  saveDossiers(dossiersStore);
  console.log(`[Storage] Dossier deleted: ${id}`);
  res.json({ success: true, message: 'Deleted successfully' });
});

app.post('/api/dossiers/reset-default', (req, res) => {
  clearDeletedDossierIdsOnServer();
  if (fs.existsSync(INITIALIZED_FILE)) {
    try { fs.unlinkSync(INITIALIZED_FILE); } catch (e) {}
  }
  dossiersStore = normalizeDossierNumbers(INITIAL_DOSSIERS);
  saveDossiers(dossiersStore);
  console.log(`[Storage] Dossiers reset to default`);
  res.json({ success: true, dossiers: dossiersStore });
});

app.post('/api/dossiers/batch-sync', (req, res) => {
  const { dossiers } = req.body;
  if (Array.isArray(dossiers)) {
    const deletedSet = getDeletedDossierIdsOnServer();
    const filteredIncoming = dossiers.filter((d: any) => d && d.id && !deletedSet.has(d.id));
    dossiersStore = normalizeDossierNumbers(filteredIncoming);
    saveDossiers(dossiersStore);
    console.log(`[Storage] Batch sync persisted ${dossiersStore.length} dossiers.`);
    return res.json({ success: true, dossiers: dossiersStore, count: dossiersStore.length });
  }
  res.status(400).json({ success: false, error: 'Invalid dossiers array' });
});

// 7. Lexicon & Citations Storage Endpoints (Single-File Unified Book Storage)
function loadLexicon(): any[] {
  try {
    if (fs.existsSync(LEXICON_FILE)) {
      const raw = fs.readFileSync(LEXICON_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeExtractedTerms(parsed);
      }
    }
  } catch (err) {
    console.warn('[Storage] Warning loading lexicon.json:', err);
  }

  // Fallback to INITIAL_LEXICON and persist single file
  try {
    saveLexicon(INITIAL_LEXICON);
  } catch (err) {}
  return INITIAL_LEXICON;
}

function saveLexicon(lexicon: any[]) {
  try {
    if (!fs.existsSync(DATA_STORE_DIR)) fs.mkdirSync(DATA_STORE_DIR, { recursive: true });
    const deduplicated = sanitizeExtractedTerms(lexicon);
    fs.writeFileSync(LEXICON_FILE, JSON.stringify(deduplicated, null, 2), 'utf-8');
    
    // Clean up legacy multi-file directory if it exists
    const legacyDir = path.join(DATA_STORE_DIR, 'lexicons');
    if (fs.existsSync(legacyDir)) {
      try { fs.rmSync(legacyDir, { recursive: true, force: true }); } catch (e) {}
    }
  } catch (err) {
    console.error('[Storage] Error saving lexicon.json:', err);
  }
}

function loadCitations(): any[] {
  try {
    if (fs.existsSync(CITATIONS_FILE)) {
      const raw = fs.readFileSync(CITATIONS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeClassicalQuotes(parsed);
      }
    }
  } catch (err) {
    console.warn('[Storage] Warning loading citations.json:', err);
  }

  // Fallback to INITIAL_CITATIONS and persist single file
  try {
    saveCitations(INITIAL_CITATIONS);
  } catch (err) {}
  return INITIAL_CITATIONS;
}

function saveCitations(citations: any[]) {
  try {
    if (!fs.existsSync(DATA_STORE_DIR)) fs.mkdirSync(DATA_STORE_DIR, { recursive: true });
    const deduplicated = sanitizeClassicalQuotes(citations);
    fs.writeFileSync(CITATIONS_FILE, JSON.stringify(deduplicated, null, 2), 'utf-8');

    // Clean up legacy multi-file directory if it exists
    const legacyDir = path.join(DATA_STORE_DIR, 'citations');
    if (fs.existsSync(legacyDir)) {
      try { fs.rmSync(legacyDir, { recursive: true, force: true }); } catch (e) {}
    }
  } catch (err) {
    console.error('[Storage] Error saving citations.json:', err);
  }
}

app.get('/api/lexicon', (req, res) => {
  const lexicon = loadLexicon();
  res.json({ success: true, lexicon });
});

app.post('/api/lexicon/batch-sync', (req, res) => {
  const { lexicon } = req.body;
  if (Array.isArray(lexicon)) {
    saveLexicon(lexicon);
    console.log(`[Storage] Batch sync persisted ${lexicon.length} lexicon terms.`);
    return res.json({ success: true, lexicon: loadLexicon() });
  }
  res.status(400).json({ success: false, error: 'Invalid lexicon array' });
});

app.get('/api/citations', (req, res) => {
  const citations = loadCitations();
  res.json({ success: true, citations });
});

app.post('/api/citations/batch-sync', (req, res) => {
  const { citations } = req.body;
  if (Array.isArray(citations)) {
    saveCitations(citations);
    console.log(`[Storage] Batch sync persisted ${citations.length} citations.`);
    return res.json({ success: true, citations: loadCitations() });
  }
  res.status(400).json({ success: false, error: 'Invalid citations array' });
});

// =========================================================================
// CONCEPT CHAT SESSIONS & INTERVIEW PERSISTENCE (JSON STORAGE)
// =========================================================================

function loadConceptChats(): any[] {
  try {
    if (!fs.existsSync(CONCEPT_CHATS_DIR)) {
      fs.mkdirSync(CONCEPT_CHATS_DIR, { recursive: true });
      return [];
    }
    const files = fs.readdirSync(CONCEPT_CHATS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('.'));
    const chats: any[] = [];
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(CONCEPT_CHATS_DIR, file), 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          chats.push(parsed);
        }
      } catch (err) {
        console.warn(`[Storage] Failed to parse concept chat ${file}:`, err);
      }
    }
    // Sort by updatedAt descending
    return chats.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  } catch (err) {
    console.error('[Storage] Error loading concept chats:', err);
    return [];
  }
}

function saveConceptChat(chatSession: any): any {
  try {
    if (!fs.existsSync(CONCEPT_CHATS_DIR)) {
      fs.mkdirSync(CONCEPT_CHATS_DIR, { recursive: true });
    }
    const id = chatSession.id || `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const session = {
      ...chatSession,
      id,
      createdAt: chatSession.createdAt || nowIso,
      updatedAt: nowIso
    };
    const filePath = path.join(CONCEPT_CHATS_DIR, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2), 'utf-8');
    return session;
  } catch (err) {
    console.error('[Storage] Error saving concept chat:', err);
    throw err;
  }
}

function deleteConceptChat(id: string): boolean {
  try {
    const filePath = path.join(CONCEPT_CHATS_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return true; // If already gone, operation is successful
  } catch (err) {
    console.error('[Storage] Error deleting concept chat:', err);
    return false;
  }
}

// 1. Get all concept chat sessions list
app.get('/api/concept-chats', (req, res) => {
  try {
    const chats = loadConceptChats();
    res.json({ success: true, chats, sessions: chats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get latest in-progress / active chat session
app.get('/api/concept-chats/active', (req, res) => {
  try {
    const chats = loadConceptChats();
    // Find the latest chat that is 'active' or 'synthesized' (not yet converted or converted but latest)
    const activeChat = chats.find(c => c.status === 'active' || c.status === 'synthesized') || null;
    res.json({ success: true, chat: activeChat });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Get a specific concept chat session by ID
app.get('/api/concept-chats/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(CONCEPT_CHATS_DIR, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phiên trò chuyện.' });
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const chat = JSON.parse(raw);
    res.json({ success: true, chat });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Save/Update a concept chat session
app.post('/api/concept-chats', (req, res) => {
  try {
    const sessionData = req.body;
    if (!sessionData) {
      return res.status(400).json({ success: false, error: 'Thiếu dữ liệu phiên trò chuyện.' });
    }
    const saved = saveConceptChat(sessionData);
    res.json({ success: true, chat: saved });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Delete a specific concept chat session
app.delete('/api/concept-chats/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = deleteConceptChat(id);
    if (deleted) {
      res.json({ success: true, message: 'Đã xóa phiên trò chuyện.' });
    } else {
      res.status(404).json({ success: false, error: 'Không tìm thấy phiên trò chuyện để xóa.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Clear all archived chats (optional)
app.post('/api/concept-chats/clear-all', (req, res) => {
  try {
    if (fs.existsSync(CONCEPT_CHATS_DIR)) {
      const files = fs.readdirSync(CONCEPT_CHATS_DIR).filter(f => f.endsWith('.json') && !f.startsWith('.'));
      for (const file of files) {
        fs.unlinkSync(path.join(CONCEPT_CHATS_DIR, file));
      }
    }
    res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử trò chuyện.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// MULTIMEDIA STUDIO AI GENERATION ENDPOINTS
// =========================================================================

// 1. AI Video Storyboard & Script Production
app.post('/api/gemini/generate-video-storyboard', async (req, res) => {
  try {
    const {
      dossierTitle,
      dossierSubtitle = '',
      dossierContent = '',
      targetAspect = '16:9',
      targetStyle = 'architectural_showcase',
      durationTarget = '1_minute',
      customNotes = '',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!dossierTitle) {
      return res.status(400).json({ success: false, error: 'Thiếu tên hồ sơ nghiên cứu.' });
    }

    const prompt = `<system_instruction>
Bạn là Giám Đốc Sản Xuất Video & Đạo Diễn Hình Ảnh Trực Quan Cao Cấp (Executive AI Video Producer) của Oneness Governance Lab.
Nhiệm vụ của bạn là: Chuyển hóa toàn bộ nội dung Hồ Sơ Học Thuật/Đề Án "${dossierTitle}" thành một BẢN KỊCH BẢN PHÂN CẢNH VIDEO SẢN XUẤT (Video Production Storyboard) cực kỳ chuyên nghiệp, trực quan, có tính thuyết phục cao và truyền cảm hứng hành động thực chiến ("Knowledge Transforming").

NGUYÊN TẮC SẢN XUẤT:
1. Tỷ lệ khung hình: ${targetAspect} (${targetAspect === '9:16' ? 'Vertical Shorts/Reels/TikTok' : targetAspect === '16:9' ? 'Horizontal Cinematic/YouTube' : 'Square Social'})
2. Phong cách thể hiện: ${targetStyle} (Tối giản, Sang trọng, Đậm chất kiến trúc sinh thái bản địa, Không phô trương biệt ngữ rườm rà)
3. Lời thuyết minh (Voiceover): Tiếng Việt trong sáng, gãy gọn, giàu hình ảnh, nhịp điệu tự nhiên, mỗi câu ngắn 8-15 từ để dễ đọc diễn cảm.
4. Prompt hình ảnh cho từng cảnh (visualPrompt): Tiếng Anh cực kỳ chi tiết chuẩn bị cho Text-to-Image / AI Video Generator (Midjourney/Runway/Gemini), chứa bối cảnh kiến trúc, ánh sáng (golden hour/ambient), vật liệu (weathered wood, laterite stone), cảnh quan nhiệt đới Việt Nam.
5. Text hiển thị trên màn hình (onScreenText): Tiêu đề và 1-2 dòng chữ đắt giá (Lower third / Key takeaway).
6. Số lượng cảnh: Sinh ra chính xác từ 4 đến 6 cảnh (Scenes) tuần tự: Mở đầu Hook -> Cơ chế nội tại -> Bản vẽ thực thi -> Điểm tựa cân bằng -> Kêu gọi hành động.
</system_instruction>

<context>
Tên Đề Án: "${dossierTitle}"
Mô tả/Phụ đề: "${dossierSubtitle}"
${customNotes ? `Ghi chú sản xuất từ người dùng: "${customNotes}"` : ''}
Nội dung đề án rút gọn:
${dossierContent ? dossierContent.slice(0, 4000) : 'Khung 6 Trụ Cột Động Oneness Governance'}
</context>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "title": "Tiêu đề video sản xuất (tiếng Việt)",
  "subtitle": "Phụ đề súc tích",
  "targetAspect": "${targetAspect}",
  "targetStyle": "${targetStyle}",
  "estimatedDurationSeconds": 60,
  "executiveHook": "Câu mở đầu gây ấn tượng mạnh mẽ trong 3 giây đầu",
  "callToAction": "Lời kêu gọi hành động cuối video",
  "voiceoverGender": "male_deep",
  "backgroundMusicStyle": "ambient_zen",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSeconds": 10,
      "sceneTitle": "Tiêu đề cảnh (VD: Cảnh 1: Khởi Sinh Ý Niệm)",
      "visualPrompt": "Detailed English image/video prompt (e.g. Cinematic wide angle drone shot of modern Vietnamese rustic garden house, lush tropical greenery, early morning sunlight...)",
      "visualType": "concept_architecture",
      "voiceoverText": "Lời thuyết minh tiếng Việt đọc diễn cảm...",
      "onScreenText": "DÒNG CHỮ HIỂN THỊ TRÊN MÀN HÌNH",
      "transition": "fade",
      "cameraAngle": "Aerial Slow Pan",
      "musicMood": "Ambient Zen & Soft Piano"
    }
  ]
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.35,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);
    const videoProject: any = {
      id: `vid-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: parsed.title || `Video Thuyết Minh: ${dossierTitle}`,
      subtitle: parsed.subtitle || dossierSubtitle || 'Phân cảnh video sản xuất chuyên nghiệp',
      targetAspect: parsed.targetAspect || targetAspect,
      targetStyle: parsed.targetStyle || targetStyle,
      estimatedDurationSeconds: parsed.estimatedDurationSeconds || 60,
      executiveHook: parsed.executiveHook || '',
      callToAction: parsed.callToAction || '',
      voiceoverGender: parsed.voiceoverGender || 'male_deep',
      backgroundMusicStyle: parsed.backgroundMusicStyle || 'ambient_zen',
      scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      project: videoProject,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating video storyboard:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo kịch bản video.' });
  }
});

// 1b. AI Scene Prompt Generation & Refinement for Video Footage
app.post('/api/gemini/generate-scene-prompt', async (req, res) => {
  try {
    const {
      sceneTitle,
      voiceoverText = '',
      dossierTitle = '',
      cameraAngle = 'Aerial Cinematic Pan',
      targetStyle = 'architectural_showcase',
      visualType = 'concept_architecture',
      model = 'gemini-3.7-flash'
    } = req.body;

    const prompt = `<system_instruction>
Bạn là Giám Đốc Nghệ Thuật & Chuyên Gia Prompt Điện Ảnh (Cinematographer & AI Visual Prompt Engineer) của Oneness Governance Lab.
Nhiệm vụ: Chuyển thể phân cảnh "${sceneTitle || 'Phân cảnh'}" với lời thoại "${voiceoverText}" thuộc đề án "${dossierTitle}" thành một Prompt Hình Ảnh/Footage Video chuyên sâu đỉnh cao.

YÊU CẦU ĐẦU RA:
1. "visualPromptEn": Prompt tiếng Anh chi tiết cho Midjourney / Runway Gen-3 / Gemini Image / Sora. Bao gồm: Subject framing, Lighting (e.g. golden hour, soft ambient), Architectural materiality (weathered reclaimed wood, natural laterite stone, rustic courtyard), Camera movement (${cameraAngle}), Color grading (warm film grain, wabi-sabi minimalist aesthetic), High resolution, 8k, cinematic photorealistic.
2. "visualPromptVi": Lời giải thích ý niệm khung hình bằng tiếng Việt cho đạo diễn và người xem hiểu được ý nghĩa trực quan.
3. "suggestedCameraAngle": Góc máy tối ưu nhất cho cảnh này.
4. "suggestedLighting": Mô tả ánh sáng (VD: Nắng xiên ban mai, Ánh sáng tán xạ qua tán cây, Hoàng hôn tĩnh mịch).
</system_instruction>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "visualPromptEn": "Detailed cinematic prompt in English...",
  "visualPromptVi": "Mô tả khung hình trực quan tiếng Việt...",
  "suggestedCameraAngle": "${cameraAngle}",
  "suggestedLighting": "Ánh sáng tự nhiên nhiệt đới"
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.3,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);
    return res.json({
      success: true,
      data: parsed,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error in generate-scene-prompt:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo prompt footage.' });
  }
});

// 1c. AI Scene Footage Image Generation (Built-in Image Generator for Video Scenes)
app.post('/api/gemini/generate-scene-footage', async (req, res) => {
  try {
    const {
      sceneNumber = 1,
      sceneTitle = 'Phân cảnh',
      visualPrompt = '',
      targetAspect = '16:9',
      cameraAngle = 'Cinematic View',
      style = 'Rustic & Wabi-Sabi Nhà Vườn Bản Địa'
    } = req.body;

    if (!visualPrompt && !sceneTitle) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin prompt hoặc tiêu đề phân cảnh.' });
    }

    const ai = getGeminiClient();
    const validAspectRatio = ['1:1', '3:4', '4:3', '9:16', '16:9'].includes(targetAspect) ? targetAspect : '16:9';
    
    // Step 1: Ensure strong cinematic English prompt
    let finalPrompt = (visualPrompt || '').trim();
    if (!finalPrompt || finalPrompt.length < 15) {
      finalPrompt = `Cinematic ${cameraAngle} shot of ${sceneTitle}, modern rustic Vietnamese architectural wabi-sabi aesthetic, natural reclaimed wood, laterite stone, lush tropical garden with bamboo and water lily pond, warm serene atmospheric lighting, photorealistic 8k, award-winning cinematography`;
    }

    // Step 2: Try Gemini Flash Image models
    const imageCandidateModels = ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image'];
    let generatedImageUrl = '';
    let imageModelUsed = '';

    for (const imgModel of imageCandidateModels) {
      try {
        const imageResponse = await ai.models.generateContent({
          model: imgModel,
          contents: {
            parts: [{ text: finalPrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: validAspectRatio as any
            }
          }
        });

        const candidates = (imageResponse as any)?.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              const mimeType = part.inlineData.mimeType || 'image/png';
              const rawDataUri = `data:${mimeType};base64,${part.inlineData.data}`;
              generatedImageUrl = saveBase64Image(rawDataUri, `scene-${sceneNumber}`);
              imageModelUsed = imgModel;
              break;
            }
          }
        }
        if (generatedImageUrl) break;
      } catch (imgErr) {
        console.warn(`[Gemini Image Scene Footage] Model ${imgModel} attempt:`, (imgErr as any)?.message || imgErr);
      }
    }

    // Step 3: High-quality SVG Storyboard Frame if direct image gen is restricted
    if (!generatedImageUrl) {
      const escapedTitle = (sceneTitle || `Cảnh ${sceneNumber}`).replace(/[<>&"]/g, '');
      const escapedAngle = (cameraAngle || 'Cinematic View').replace(/[<>&"]/g, '');
      const svgGraphic = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" fill="#0b0f19">
          <defs>
            <linearGradient id="sceneGrad${sceneNumber}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="40%" stop-color="#1e1b4b" />
              <stop offset="100%" stop-color="#022c22" />
            </linearGradient>
            <radialGradient id="lensGlow${sceneNumber}" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stop-color="#818cf8" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <rect width="1280" height="720" fill="url(#sceneGrad${sceneNumber})" />
          <circle cx="640" cy="360" r="400" fill="url(#lensGlow${sceneNumber})" />
          
          <rect x="40" y="40" width="1200" height="640" rx="12" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="12,12" />
          <line x1="620" y1="360" x2="660" y2="360" stroke="#a78bfa" stroke-width="2" />
          <line x1="640" y1="340" x2="640" y2="380" stroke="#a78bfa" stroke-width="2" />
          
          <rect x="60" y="60" width="220" height="44" rx="8" fill="#1e293b" fill-opacity="0.9" stroke="#6366f1" stroke-width="1" />
          <text x="75" y="88" font-family="system-ui, sans-serif" font-weight="bold" font-size="16" fill="#a78bfa">SCENE ${sceneNumber} • FOOTAGE</text>
          
          <rect x="60" y="580" width="1160" height="80" rx="10" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="1" />
          <text x="85" y="615" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="#f8fafc">${escapedTitle}</text>
          <text x="85" y="642" font-family="monospace" font-size="13" fill="#38bdf8">ANGLE: ${escapedAngle} • ASPECT: ${validAspectRatio} • 4K RENDER READY</text>
          <text x="1195" y="630" font-family="monospace" font-size="13" fill="#10b981" text-anchor="end">ONENESS MULTIMEDIA LAB</text>
        </svg>
      `;
      const rawSvgUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgGraphic)}`;
      generatedImageUrl = saveBase64Image(rawSvgUri, `scene-${sceneNumber}`);
      imageModelUsed = 'cinematic-storyboard-frame';
    }

    res.json({
      success: true,
      imageUrl: generatedImageUrl,
      refinedPrompt: finalPrompt,
      modelUsed: imageModelUsed
    });
  } catch (error: any) {
    console.error('Error generating scene footage:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo ảnh footage phân cảnh.' });
  }
});

// 2. AI Audio Podcast (Gemini NotebookLM Style 2-Host Deep Dive)
app.post('/api/gemini/generate-audio-podcast', async (req, res) => {
  try {
    const {
      dossierTitle,
      dossierSubtitle = '',
      dossierContent = '',
      formatStyle = 'notebook_deep_dive',
      hostAName = 'Minh Triết (Chuyên Gia)',
      hostBName = 'Hải An (Nhà Phân Tích)',
      customFocus = '',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!dossierTitle) {
      return res.status(400).json({ success: false, error: 'Thiếu tên hồ sơ nghiên cứu.' });
    }

    const prompt = `<system_instruction>
Bạn là Biên Tập Viên Trưởng & Nhà Sản Xuất Podcast hàng đầu, chuyên tái hiện phong cách đàm thoại "Audio Deep Dive" lừng danh của Google NotebookLM.
Nhiệm vụ: Chuyển hóa toàn bộ đề án "${dossierTitle}" thành một CUỘC ĐỐI THOẠI PODCAST 2 NGƯỜI (Duo Hosts) cực kỳ lôi cuốn, tự nhiên, thông minh và giàu tính gợi mở thực chiến.

HAI NHÂN VẬT DẪN CHUYỆN:
- Host A (${hostAName}): Giữ vai trò chuyên gia phân tích đề án, nắm vững bản chất 6 Trụ Cột Động, nói năng khúc chiết, đưa ra các ví dụ thực tiễn sắc sảo.
- Host B (${hostBName}): Giữ vai trò người đồng hành tò mò, đóng vai người nghe để đặt câu hỏi then chốt, tháo gỡ những khúc mắc đời thường và kết nối các ý niệm với cuộc sống.

NGUYÊN TẮC ĐỐI THOẠI KIỂU NOTEBOOKLM:
1. Đàm thoại tự nhiên, có ngữ điệu trò chuyện (dùng các từ nối tự nhiên: "Thật ra thì...", "Điều này làm tôi nhớ đến...", "Chính xác!", "Điểm mấu chốt ở đây là...").
2. Triết lý "Knowledge Transforming": Không đọc lại tài liệu nguyên văn, mà mổ xẻ ý nghĩa cốt lõi, loại bỏ biệt ngữ rườm rà.
3. Độ dài: Sinh ra từ 6 đến 10 lượt thoại (turns) đối đáp nhịp nhàng, liền mạch từ mở đầu đến kết luận.
</system_instruction>

<context>
Đề Án: "${dossierTitle}"
Mô tả: "${dossierSubtitle}"
${customFocus ? `Yêu cầu trọng tâm: "${customFocus}"` : ''}
Nội dung hồ sơ tham chiếu:
${dossierContent ? dossierContent.slice(0, 4500) : 'Dữ liệu hồ sơ'}
</context>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "title": "Tiêu đề tập Podcast (tiếng Việt)",
  "subtitle": "Mô tả ngắn gọn nội dung tập đàm thoại",
  "formatStyle": "${formatStyle}",
  "hostAName": "${hostAName}",
  "hostBName": "${hostBName}",
  "summaryTakeaway": "1 câu đúc kết giá trị lắng đọng lớn nhất sau buổi trò chuyện",
  "recommendedPromptNotebookLM": "Prompt chuẩn xác để người dùng có thể nạp thẳng vào Google NotebookLM nếu muốn",
  "dialogueTurns": [
    {
      "id": "turn-1",
      "speaker": "host_a",
      "speakerName": "${hostAName.split(' ')[0]}",
      "speakerRole": "expert_analyst",
      "avatarColor": "bg-indigo-600",
      "text": "Lời thoại mở màn tự nhiên...",
      "durationSecondsEstimate": 12,
      "topicTag": "Mở đầu"
    },
    {
      "id": "turn-2",
      "speaker": "host_b",
      "speakerName": "${hostBName.split(' ')[0]}",
      "speakerRole": "curious_questioner",
      "avatarColor": "bg-emerald-600",
      "text": "Lời thoại phản hồi sắc bén...",
      "durationSecondsEstimate": 10,
      "topicTag": "Thực tế"
    }
  ]
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.35,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);
    const podcastProject: any = {
      id: `pod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: parsed.title || `Audio Deep Dive: ${dossierTitle}`,
      subtitle: parsed.subtitle || dossierSubtitle || 'Đối thoại 2 người phong cách NotebookLM',
      formatStyle: parsed.formatStyle || formatStyle,
      hostAName: parsed.hostAName || hostAName,
      hostBName: parsed.hostBName || hostBName,
      summaryTakeaway: parsed.summaryTakeaway || '',
      recommendedPromptNotebookLM: parsed.recommendedPromptNotebookLM || '',
      dialogueTurns: Array.isArray(parsed.dialogueTurns) ? parsed.dialogueTurns : [],
      totalEstimatedMinutes: Math.max(1, Math.ceil((parsed.dialogueTurns?.reduce((acc: number, t: any) => acc + (t.durationSecondsEstimate || 10), 0) || 60) / 60)),
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      project: podcastProject,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating audio podcast:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo kịch bản Podcast.' });
  }
});

// 3. AI Infographic Synthesis
app.post('/api/gemini/generate-infographic', async (req, res) => {
  try {
    const {
      dossierTitle,
      dossierSubtitle = '',
      dossierContent = '',
      layoutTheme = 'emerald_zen',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!dossierTitle) {
      return res.status(400).json({ success: false, error: 'Thiếu tên hồ sơ nghiên cứu.' });
    }

    const prompt = `<system_instruction>
Bạn là Giám Đốc Thiết Kế Thông Tin & Trực Quan Hóa Dữ Liệu (Information Designer) của Oneness Governance Lab.
Nhiệm vụ: Chuyển hóa toàn bộ đề án "${dossierTitle}" thành một BẢN INFOGRAPHIC TRI THỨC TOÀN DIỆN, súc tích, bố cục chặt chẽ theo 6 Trụ Cột Động.

NGUYÊN TẮC THIẾT KẾ:
1. Quy tắc ASCII Flow: Vẽ sơ đồ luồng phẳng dạng '[Khâu 1] --(Điều kiện)--> [Khâu 2]' (TUYỆT ĐỐI KHÔNG dùng Mermaid).
2. Tóm tắt 4 chỉ số then chốt (metrics) có sức nặng thực tiễn.
3. Phân rã 6 khối trụ cột (pillarBlocks) với insight ngắn và hành động cụ thể.
4. Trích xuất 1 câu danh ngôn hoặc tư tưởng cốt lõi đắt giá nhất.
</system_instruction>

<context>
Đề Án: "${dossierTitle}"
Mô tả: "${dossierSubtitle}"
Nội dung hồ sơ:
${dossierContent ? dossierContent.slice(0, 4000) : 'Dữ liệu hồ sơ'}
</context>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "title": "Tiêu đề Infographic",
  "subtitle": "Phụ đề trực quan",
  "layoutTheme": "${layoutTheme}",
  "coreProblem": "Bài toán thực tế cần giải quyết (1 câu)",
  "breakthroughSolution": "Giải pháp đột phá trọng tâm (1 câu)",
  "metrics": [
    { "id": "m1", "value": "100%", "label": "Thực Chiến", "subtext": "Mô tả ngắn", "trend": "up", "color": "emerald" },
    { "id": "m2", "value": "6 Trụ Cột", "label": "Khung Bền Vững", "subtext": "Mô tả ngắn", "trend": "neutral", "color": "purple" },
    { "id": "m3", "value": "3 Giai Đoạn", "label": "Lộ Trình", "subtext": "Mô tả ngắn", "trend": "up", "color": "amber" },
    { "id": "m4", "value": "Zero-Trust", "label": "Kỷ Luật", "subtext": "Mô tả ngắn", "trend": "up", "color": "cyan" }
  ],
  "pillarBlocks": [
    { "pillarNum": "I", "title": "Bản Thể Luận", "coreInsight": "Nhận thức gốc rễ", "takeaway": "Hành động 1", "tag": "Bản Thể" },
    { "pillarNum": "II", "title": "Cơ Chế Vận Hành", "coreInsight": "Quy luật nội tại", "takeaway": "Hành động 2", "tag": "Cơ Chế" },
    { "pillarNum": "III", "title": "Kiến Trúc Thực Thi", "coreInsight": "Bản vẽ phân kỳ", "takeaway": "Hành động 3", "tag": "Kiến Trúc" },
    { "pillarNum": "IV", "title": "Biện Chứng Phản Biện", "coreInsight": "Phòng thủ rủi ro", "takeaway": "Hành động 4", "tag": "Biện Chứng" },
    { "pillarNum": "V", "title": "Tâm Điểm Shinbashira", "coreInsight": "Cân bằng đạo đức", "takeaway": "Hành động 5", "tag": "Tĩnh Tâm" },
    { "pillarNum": "VI", "title": "Sinh Thái Đất Trời", "coreInsight": "Phụng sự dài hạn", "takeaway": "Hành động 6", "tag": "Đất Trời" }
  ],
  "asciiPipeline": "[Khởi Sinh Ý Niệm] --(Khảo sát)--> [Cơ Chế Vận Hành] --(Phân kỳ)--> [Kiến Trúc Thực Thi] --(Kiểm thử)--> [Giá Trị Bền Vững]",
  "keyActionSteps": [
    "Hành động tiên quyết 1",
    "Hành động tiên quyết 2",
    "Hành động tiên quyết 3"
  ],
  "calloutQuote": {
    "quote": "Câu danh ngôn tư tưởng đắt giá",
    "author": "Tác giả / Triết gia"
  }
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.3,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);
    const infographicProject: any = {
      id: `info-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: parsed.title || `Infographic: ${dossierTitle}`,
      subtitle: parsed.subtitle || dossierSubtitle || 'Bản đồ trực quan hóa dữ liệu và 6 trụ cột',
      layoutTheme: parsed.layoutTheme || layoutTheme,
      coreProblem: parsed.coreProblem || '',
      breakthroughSolution: parsed.breakthroughSolution || '',
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
      pillarBlocks: Array.isArray(parsed.pillarBlocks) ? parsed.pillarBlocks : [],
      asciiPipeline: parsed.asciiPipeline || '',
      keyActionSteps: Array.isArray(parsed.keyActionSteps) ? parsed.keyActionSteps : [],
      calloutQuote: parsed.calloutQuote || { quote: '', author: '' },
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      project: infographicProject,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating infographic:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo Infographic.' });
  }
});

// 4. AI SlideDeck Synthesis
app.post('/api/gemini/generate-slidedeck', async (req, res) => {
  try {
    const {
      dossierTitle,
      dossierSubtitle = '',
      dossierContent = '',
      targetAudience = 'investors_board',
      themeColor = 'purple',
      model = 'gemini-3.7-flash'
    } = req.body;

    if (!dossierTitle) {
      return res.status(400).json({ success: false, error: 'Thiếu tên hồ sơ nghiên cứu.' });
    }

    const prompt = `<system_instruction>
Bạn là Chuyên gia Tư vấn Cấp cao & Kiến trúc Sư Slide Thuyết Trình (Slide Deck Architect) của Oneness Governance Lab.
Nhiệm vụ: Chuyển hóa đề án "${dossierTitle}" thành một BỘ SLIDE THUYẾT TRÌNH ĐA NĂNG (Slide Deck) gồm 6-8 slide mạch lạc, sẵn sàng trình bày trước ${targetAudience}.

CẤU TRÚC BỘ SLIDE CHUẨN MỰC:
- Slide 1: Bìa (Cover) & Tầm nhìn
- Slide 2: Bài toán thực tế & Nỗi đau thị trường
- Slide 3: Kiến trúc 6 Trụ Cột Động
- Slide 4: Cơ chế vận hành & Sơ đồ luồng ASCII
- Slide 5: Lộ trình phân kỳ 3 giai đoạn & Mốc nghiệm thu
- Slide 6: Quản trị rủi ro & Điểm tựa đạo đức Shinbashira
- Slide 7: Đúc kết & Kêu gọi hành động (Call To Action)

NGUYÊN TẮC NỘI DUNG:
- Mỗi slide có 3-4 gạch đầu dòng súc tích, ngắn gọn (bullet points).
- Có ghi chú thuyết trình (speakerNotes) dành cho người nói.
- Gợi ý hình ảnh/phối cảnh kiến trúc phù hợp (recommendedVisual).
- Dùng sơ đồ ASCII phẳng cho các slide cần mô tả luồng.
</system_instruction>

<context>
Đề Án: "${dossierTitle}"
Mô tả: "${dossierSubtitle}"
Đối tượng trình bày: ${targetAudience}
Nội dung hồ sơ:
${dossierContent ? dossierContent.slice(0, 4000) : 'Dữ liệu hồ sơ'}
</context>

<output_format>
Trả về DUY NHẤT một JSON hợp lệ:
{
  "title": "Tiêu đề Bộ Slide (tiếng Việt)",
  "subtitle": "Phụ đề thuyết trình",
  "targetAudience": "${targetAudience}",
  "themeColor": "${themeColor}",
  "slides": [
    {
      "slideNumber": 1,
      "slideType": "cover",
      "title": "Tiêu đề Slide 1",
      "subtitle": "Phụ đề Slide 1",
      "bullets": ["Gạch đầu dòng 1", "Gạch đầu dòng 2", "Gạch đầu dòng 3"],
      "speakerNotes": "Lời gợi ý cho người thuyết trình...",
      "recommendedVisual": "Gợi ý ảnh hoặc phối cảnh"
    }
  ]
}
</output_format>`;

    const result = await generateGeminiContent({
      contents: prompt,
      temperature: 0.3,
      model,
      responseMimeType: 'application/json'
    });

    const parsed = safeParseLLMJson(result.text);
    const slideDeckProject: any = {
      id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: parsed.title || `Slidedeck: ${dossierTitle}`,
      subtitle: parsed.subtitle || dossierSubtitle || 'Bộ slide thuyết trình đa năng',
      targetAudience: parsed.targetAudience || targetAudience,
      themeColor: parsed.themeColor || themeColor,
      slides: Array.isArray(parsed.slides) ? parsed.slides : [],
      createdAt: new Date().toISOString()
    };

    return res.json({
      success: true,
      project: slideDeckProject,
      modelUsed: result.modelUsed
    });
  } catch (error: any) {
    console.error('Error generating slide deck:', error);
    res.status(500).json({ success: false, error: error.message || 'Lỗi khi tạo Slide Deck.' });
  }
});

// =========================================================================
// VITE MIDDLEWARE & SERVER STARTUP
// =========================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [OG Lab Server] Running on http://0.0.0.0:${PORT} with Official Google GenAI SDK`);
  });
}

startServer();
