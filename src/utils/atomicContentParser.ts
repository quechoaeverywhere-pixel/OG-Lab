import { DynamicPillar, Chapter, Dossier, LexiconTerm, ClassicalQuote, BlueprintDiagramData, AtomicUnitType, ConceptRenderData } from '../types';
import { normalizeMarkdownTables } from './markdownSanitizer';

export type { AtomicUnitType, ConceptRenderData };

export interface AtomicContentUnit {
  id: string;
  type: AtomicUnitType;
  level?: number; // for headings or hierarchy
  title?: string;
  content: string;
  rawMarkdown?: string;
  author?: string;
  work?: string;
  eraOrYear?: string;
  language?: string;
  translationVi?: string;
  interpretation?: string;
  bulletIndex?: number;
  highlightedTerms?: string[];
  keyTakeaway?: string;
  blueprintData?: BlueprintDiagramData;
  conceptRenderData?: ConceptRenderData;
  metadata?: Record<string, any>;
}

export interface AtomicSubsection {
  id: string;
  title: string;
  subNumber: string; // e.g. "1.1", "2.3"
  units: AtomicContentUnit[];
}

export interface AtomicSection {
  id: string;
  title: string;
  secNumber: string; // e.g. "I", "II", "1", "2"
  tierCategory: string;
  subsections: AtomicSubsection[];
  units: AtomicContentUnit[]; // Direct units under section
}

export interface AtomicChapterDecomposition {
  chapterId: string;
  chapterTitle: string;
  pillarId: string;
  pillarTitle: string;
  pillarRoman: string;
  status: 'pending' | 'generating' | 'completed';
  totalWords: number;
  readingMinutes: number;
  sections: AtomicSection[];
  terms: LexiconTerm[];
  quotes: ClassicalQuote[];
}

/**
 * Categorize a section title into an academic/philosophical category
 */
export function getSectionTierCategory(title: string): { name: string; color: string; badge: string } {
  const lower = title.toLowerCase();
  if (lower.includes('bản thể') || lower.includes('khởi nguyên') || lower.includes('ý niệm') || lower.includes('triết học')) {
    return { name: 'Bản Thể Luận & Khởi Nguyên', color: 'purple', badge: 'BẢN THỂ' };
  }
  if (lower.includes('cơ chế') || lower.includes('động lực') || lower.includes('quy luật') || lower.includes('toán học')) {
    return { name: 'Động Lực Học & Cơ Chế', color: 'cyan', badge: 'CƠ CHẾ' };
  }
  if (lower.includes('kỹ nghệ') || lower.includes('mã nguồn') || lower.includes('kiến trúc') || lower.includes('hệ phân tán') || lower.includes('code')) {
    return { name: 'Kiến Trúc & Mã Nguồn Phân Tán', color: 'emerald', badge: 'KIẾN TRÚC' };
  }
  if (lower.includes('phản biện') || lower.includes('mâu thuẫn') || lower.includes('nghịch lý') || lower.includes('failure') || lower.includes('rủi ro')) {
    return { name: 'Biện Chứng & Chế Độ Lỗi (Failure Modes)', color: 'rose', badge: 'BIỆN CHỨNG' };
  }
  if (lower.includes('tĩnh tâm') || lower.includes('khắc kỷ') || lower.includes('shinbashira') || lower.includes('cân bằng') || lower.includes('đạo đức')) {
    return { name: 'Tĩnh Tâm Khắc Kỷ (Shinbashira)', color: 'amber', badge: 'TĨNH TÂM' };
  }
  if (lower.includes('đất trời') || lower.includes('vô vi') || lower.includes('tự nhiên') || lower.includes('sinh thái') || lower.includes('kết luận')) {
    return { name: 'Đất Trời & Hòa Hợp Sinh Thái', color: 'teal', badge: 'ĐẤT TRỜI' };
  }
  return { name: 'Khảo Luận Chuyên Đề', color: 'indigo', badge: 'CHUYÊN ĐỀ' };
}

/**
 * Detect language of quote: English, Vietnamese, or other
 */
export function detectLanguage(text: string): 'en' | 'vi' | 'other' {
  if (!text || !text.trim()) return 'vi';
  const hasVietnameseDiacritics = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);
  if (hasVietnameseDiacritics) return 'vi';

  const englishWords = /\b(the|is|are|was|were|in|on|at|to|for|of|and|with|that|this|from|by|as|an|be|not|we|you|they|it|all|can|will|should|must|have|has|had|do|does|did|into|about|when|more|then|them|these|some|could|other|than|then|now|only)\b/i;
  if (englishWords.test(text)) return 'en';

  return 'other';
}

/**
 * Parses consecutive blockquote lines (starting with >) into a rich AtomicQuoteUnit
 */
export function parseQuoteBlockLines(
  quoteLines: string[],
  baseIdPrefix: string,
  unitCount: number
): AtomicContentUnit {
  let mainQuote = '';
  let author = '';
  let work = '';
  let eraOrYear = '';
  let translationVi = '';
  let interpretation = '';

  const cleanLines = quoteLines.map(l => l.replace(/^>\s*/, '').trim()).filter(Boolean);

  for (const line of cleanLines) {
    // Check for translation (*Bản dịch*: ... or Bản dịch: ...)
    const transMatch = line.match(/^(\*Bản dịch\*|\*Dịch\*|Bản dịch|Dịch nghĩa|Bản dịch tiếng Việt)[:：]\s*["“]?(.*?)["”]?[.]?$/i);
    if (transMatch) {
      translationVi = transMatch[2].trim();
      continue;
    }

    // Check for interpretation (*Ý nghĩa thực chiến*: ... or *Phân tích*: ...)
    const interpMatch = line.match(/^(\*Ý nghĩa thực chiến\*|\*Ý nghĩa\*|\*Phân tích\*|\*Lời bình\*|Ý nghĩa thực chiến|Phân tích bối cảnh)[:：]\s*(.*?)$/i);
    if (interpMatch) {
      interpretation = interpMatch[2].trim();
      continue;
    }

    // Check for author / attribution line (— Author, *Work* (Year))
    const attribMatch = line.match(/^[—–-]\s*(.*?)$/);
    if (attribMatch) {
      const fullAttrib = attribMatch[1];
      const yearMatch = fullAttrib.match(/\(([^)]+)\)/);
      if (yearMatch) {
        eraOrYear = yearMatch[1].trim();
      }
      const withoutYear = fullAttrib.replace(/\([^)]+\)/, '').trim();

      const workItalicMatch = withoutYear.match(/\*([^*]+)\*/);
      if (workItalicMatch) {
        work = workItalicMatch[1].trim();
        author = withoutYear.replace(/\*[^*]+\*/, '').replace(/,\s*$/, '').trim();
      } else if (withoutYear.includes(',')) {
        const parts = withoutYear.split(',');
        author = parts[0].trim();
        work = parts.slice(1).join(',').trim();
      } else {
        author = withoutYear;
      }
      continue;
    }

    // In-line attribution format: "Quote..." — Author, *Work*
    const inlineAttribMatch = line.match(/^["“]?(.*?)["”]?[,\s]+[—–-]\s*(.*?)$/);
    if (inlineAttribMatch && !mainQuote) {
      mainQuote = inlineAttribMatch[1].replace(/^["“]|["”]$/g, '').trim();
      const fullAttrib = inlineAttribMatch[2];
      const yearMatch = fullAttrib.match(/\(([^)]+)\)/);
      if (yearMatch) eraOrYear = yearMatch[1].trim();
      const withoutYear = fullAttrib.replace(/\([^)]+\)/, '').trim();
      const workItalicMatch = withoutYear.match(/\*([^*]+)\*/);
      if (workItalicMatch) {
        work = workItalicMatch[1].trim();
        author = withoutYear.replace(/\*[^*]+\*/, '').replace(/,\s*$/, '').trim();
      } else if (withoutYear.includes(',')) {
        const parts = withoutYear.split(',');
        author = parts[0].trim();
        work = parts.slice(1).join(',').trim();
      } else {
        author = withoutYear;
      }
      continue;
    }

    // Regular line in quote body
    const cleaned = line.replace(/^["“]|["”]$/g, '').trim();
    if (!mainQuote) {
      mainQuote = cleaned;
    } else {
      mainQuote += ' ' + cleaned;
    }
  }

  const detectedLang = detectLanguage(mainQuote);

  return {
    id: `${baseIdPrefix}-quote-${unitCount}`,
    type: 'quote',
    content: mainQuote || cleanLines.join(' '),
    rawMarkdown: quoteLines.join('\n'),
    author: author || undefined,
    work: work || undefined,
    eraOrYear: eraOrYear || undefined,
    translationVi: translationVi || undefined,
    interpretation: interpretation || undefined,
    language: detectedLang
  };
}

/**
 * Parses a markdown block into individual atomic units (paragraphs, bullets, quotes, code blocks).
 */
export function parseBlockToAtomicUnits(markdownText: string, baseIdPrefix: string): AtomicContentUnit[] {
  if (!markdownText || !markdownText.trim()) return [];

  const normalizedInput = normalizeMarkdownTables(markdownText);
  const units: AtomicContentUnit[] = [];
  const lines = normalizedInput.split('\n');
  let currentParagraphLines: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let unitCount = 1;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join('\n').trim();
      if (text) {
        units.push({
          id: `${baseIdPrefix}-p-${unitCount++}`,
          type: 'paragraph',
          content: text,
          rawMarkdown: text
        });
      }
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown Table detection (| ... |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph();
      const tableLines: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
        i++;
        tableLines.push(lines[i]);
      }
      const tableMarkdown = tableLines.join('\n');
      units.push({
        id: `${baseIdPrefix}-table-${unitCount++}`,
        type: 'table',
        content: tableMarkdown,
        rawMarkdown: tableMarkdown
      });
      continue;
    }

    // Code block & Blueprint detection
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        flushParagraph();
        inCodeBlock = true;
        codeLang = trimmed.replace(/^```/, '').trim() || 'typescript';
        codeLines = [];
      } else {
        inCodeBlock = false;
        const codeContent = codeLines.join('\n');
        const isBlueprintLang = ['blueprint', 'blueprint-diagram', 'architecture', 'system-blueprint'].includes(codeLang.toLowerCase());

        let blueprintParsed: BlueprintDiagramData | null = null;
        if (isBlueprintLang) {
          try {
            blueprintParsed = JSON.parse(codeContent);
          } catch {
            // Attempt cleanup if wrapped
            const clean = codeContent.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            try {
              blueprintParsed = JSON.parse(clean);
            } catch {}
          }
        } else if (codeContent.includes('"nodes"') && codeContent.includes('"connections"') && (codeContent.trim().startsWith('{') || codeContent.trim().startsWith('['))) {
          try {
            const maybeParsed = JSON.parse(codeContent);
            if (maybeParsed && (Array.isArray(maybeParsed.nodes) || maybeParsed.title)) {
              blueprintParsed = maybeParsed;
            }
          } catch {}
        }

        if (blueprintParsed || isBlueprintLang) {
          units.push({
            id: `${baseIdPrefix}-blueprint-${unitCount++}`,
            type: 'blueprint_diagram',
            content: codeContent,
            blueprintData: blueprintParsed || undefined,
            rawMarkdown: `\`\`\`blueprint\n${codeContent}\n\`\`\``
          });
        } else if (['concept-render', 'concept_render', 'architectural-render', 'architecture-render'].includes(codeLang.toLowerCase())) {
          let renderParsed: ConceptRenderData | null = null;
          try {
            renderParsed = JSON.parse(codeContent);
          } catch {}
          units.push({
            id: `${baseIdPrefix}-render-${unitCount++}`,
            type: 'concept_render',
            content: renderParsed?.prompt || codeContent,
            conceptRenderData: renderParsed || undefined,
            rawMarkdown: `\`\`\`concept-render\n${codeContent}\n\`\`\``
          });
        } else {
          units.push({
            id: `${baseIdPrefix}-code-${unitCount++}`,
            type: 'code',
            content: codeContent,
            language: codeLang,
            rawMarkdown: `\`\`\`${codeLang}\n${codeContent}\n\`\`\``
          });
        }
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Consecutive Blockquote lines (> quote, > — author, > *Bản dịch*: ...)
    if (trimmed.startsWith('>')) {
      flushParagraph();
      const quoteLines: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++;
        quoteLines.push(lines[i]);
      }
      const quoteUnit = parseQuoteBlockLines(quoteLines, baseIdPrefix, unitCount++);
      units.push(quoteUnit);
      continue;
    }

    // Bullet points (- or * or numbered list 1.)
    const bulletMatch = trimmed.match(/^([-*]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      const bulletContent = bulletMatch[2];
      units.push({
        id: `${baseIdPrefix}-bullet-${unitCount++}`,
        type: 'bullet',
        content: bulletContent,
        rawMarkdown: line,
        bulletIndex: unitCount
      });
      continue;
    }

    // Empty line separates paragraphs
    if (trimmed === '') {
      flushParagraph();
      continue;
    }

    // Regular line accumulated into current paragraph
    currentParagraphLines.push(line);
  }

  flushParagraph();
  return units;
}

/**
 * Unwraps markdown from accidental JSON envelopes or code fences and normalizes tables
 */
export function extractCleanMarkdown(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();

  // If raw is wrapped in ```json { ... } ``` or raw JSON
  if (text.startsWith('```json') || (text.startsWith('{') && text.includes('"contentMarkdown"'))) {
    const unquoted = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/, '').trim();
    try {
      const parsed = JSON.parse(unquoted);
      if (parsed && typeof parsed.contentMarkdown === 'string') {
        text = parsed.contentMarkdown;
      }
    } catch {
      // Regex extraction fallback for "contentMarkdown": "..."
      const match = text.match(/"contentMarkdown"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
      if (match) {
        try {
          text = JSON.parse(`"${match[1]}"`);
        } catch {
          text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }
    }
  }

  return normalizeMarkdownTables(text);
}

/**
 * Decomposes an entire Chapter's markdown into an Atomic Structure:
 * Chapter -> Sections (## ) -> Subsections (### ) -> Atomic Units (Paragraphs, Bullets, Quotes, Code).
 */
export function decomposeChapterToAtomic(
  chapter: Chapter,
  pillar: DynamicPillar,
  dossier: Dossier
): AtomicChapterDecomposition {
  const raw = extractCleanMarkdown(chapter.contentMarkdown || '');
  const lines = raw.split('\n');
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  const sections: AtomicSection[] = [];
  let currentSection: AtomicSection | null = null;
  let currentSubsection: AtomicSubsection | null = null;
  let accumulatedMarkdown: string[] = [];
  let secIdx = 0;
  let subSecIdx = 0;

  const flushToCurrentScope = () => {
    if (accumulatedMarkdown.length === 0) return;
    const blockText = accumulatedMarkdown.join('\n').trim();
    accumulatedMarkdown = [];
    if (!blockText) return;

    const basePrefix = currentSubsection
      ? `${currentSubsection.id}`
      : currentSection
      ? `${currentSection.id}`
      : `ch-${chapter.id}`;

    const units = parseBlockToAtomicUnits(blockText, basePrefix);

    if (currentSubsection) {
      currentSubsection.units.push(...units);
    } else if (currentSection) {
      currentSection.units.push(...units);
    } else {
      // Create a default initial section if text came before first heading
      if (!currentSection) {
        secIdx++;
        currentSection = {
          id: `sec-${chapter.id}-${secIdx}`,
          title: 'Khởi Động Ý Niệm & Đặt Vấn Đề',
          secNumber: romanNumerals[secIdx - 1] || String(secIdx),
          tierCategory: 'Bản Thể Luận & Khởi Nguyên',
          subsections: [],
          units: []
        };
        sections.push(currentSection);
      }
      currentSection.units.push(...units);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Section Level (## )
    if (trimmed.startsWith('## ')) {
      flushToCurrentScope();
      currentSubsection = null;
      secIdx++;
      subSecIdx = 0;
      const title = trimmed.replace(/^##\s+/, '').trim();
      const tier = getSectionTierCategory(title);

      currentSection = {
        id: `sec-${chapter.id}-${secIdx}`,
        title,
        secNumber: romanNumerals[secIdx - 1] || String(secIdx),
        tierCategory: tier.name,
        subsections: [],
        units: []
      };
      sections.push(currentSection);
      continue;
    }

    // Subsection Level (### )
    if (trimmed.startsWith('### ')) {
      flushToCurrentScope();
      subSecIdx++;
      const title = trimmed.replace(/^###\s+/, '').trim();

      if (!currentSection) {
        secIdx++;
        currentSection = {
          id: `sec-${chapter.id}-${secIdx}`,
          title: 'Khảo Luận Chuyên Sâu',
          secNumber: romanNumerals[secIdx - 1] || String(secIdx),
          tierCategory: 'Khảo Luận Chuyên Đề',
          subsections: [],
          units: []
        };
        sections.push(currentSection);
      }

      currentSubsection = {
        id: `subsec-${chapter.id}-${secIdx}-${subSecIdx}`,
        title,
        subNumber: `${secIdx}.${subSecIdx}`,
        units: []
      };
      currentSection.subsections.push(currentSubsection);
      continue;
    }

    accumulatedMarkdown.push(line);
  }

  flushToCurrentScope();

  // If no sections were parsed, build default structured section
  if (sections.length === 0 && raw.trim()) {
    const units = parseBlockToAtomicUnits(raw, `ch-${chapter.id}-root`);
    sections.push({
      id: `sec-${chapter.id}-1`,
      title: chapter.title,
      secNumber: 'I',
      tierCategory: 'Khảo Luận Toàn Văn',
      subsections: [],
      units
    });
  }

  // Cross-link chapter.quotes with parsed quote units for enriched translation/interpretation
  if (Array.isArray(chapter.quotes) && chapter.quotes.length > 0) {
    const enrichQuoteUnit = (u: AtomicContentUnit) => {
      if (u.type === 'quote') {
        const matched = chapter.quotes?.find(q =>
          (q.quote && (u.content.includes(q.quote.slice(0, 15)) || q.quote.includes(u.content.slice(0, 15)))) ||
          (q.author && u.author && q.author.toLowerCase() === u.author.toLowerCase())
        );
        if (matched) {
          if (!u.author && matched.author) u.author = matched.author;
          if (!u.work && matched.work) u.work = matched.work;
          if (!u.eraOrYear && matched.eraOrYear) u.eraOrYear = matched.eraOrYear;
          if (!u.translationVi && matched.translationVi) u.translationVi = matched.translationVi;
          if (!u.interpretation && matched.interpretation) u.interpretation = matched.interpretation;
        }
      }
    };

    sections.forEach(sec => {
      sec.units.forEach(enrichQuoteUnit);
      sec.subsections.forEach(sub => sub.units.forEach(enrichQuoteUnit));
    });
  }

  const wordCount = raw.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));

  // Extract pillar roman numeral
  const romanMatch = pillar.title.match(/Trụ\s*cột\s*([I|V|X]+)/i);
  const pillarRoman = romanMatch ? romanMatch[1].toUpperCase() : 'I';

  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    pillarId: pillar.id,
    pillarTitle: pillar.title,
    pillarRoman,
    status: chapter.status,
    totalWords: wordCount,
    readingMinutes,
    sections,
    terms: chapter.extractedTerms || [],
    quotes: chapter.quotes || []
  };
}

/**
 * Recomposes Atomic Sections back into standard Markdown text
 */
export function recomposeAtomicToMarkdown(sections: AtomicSection[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    parts.push(`## ${section.title}\n`);

    const renderUnit = (unit: AtomicContentUnit) => {
      if (unit.type === 'bullet') {
        return `- ${unit.content}`;
      } else if (unit.type === 'quote') {
        let quoteMd = `> "${unit.content}"`;
        if (unit.author || unit.work) {
          const metaParts: string[] = [];
          if (unit.author) metaParts.push(unit.author);
          if (unit.work) metaParts.push(`*${unit.work}*`);
          if (unit.eraOrYear) metaParts.push(`(${unit.eraOrYear})`);
          quoteMd += `\n> — ${metaParts.join(', ')}`;
        }
        if (unit.translationVi) {
          quoteMd += `\n> *Bản dịch*: "${unit.translationVi}"`;
        }
        if (unit.interpretation) {
          quoteMd += `\n> *Ý nghĩa thực chiến*: ${unit.interpretation}`;
        }
        return quoteMd;
      } else if (unit.type === 'blueprint_diagram') {
        const payload = unit.blueprintData
          ? JSON.stringify(unit.blueprintData, null, 2)
          : unit.content;
        return `\`\`\`blueprint\n${payload}\n\`\`\``;
      } else if (unit.type === 'concept_render') {
        const payload = unit.conceptRenderData
          ? JSON.stringify(unit.conceptRenderData, null, 2)
          : JSON.stringify({ prompt: unit.content }, null, 2);
        return `\`\`\`concept-render\n${payload}\n\`\`\``;
      } else if (unit.type === 'code') {
        return `\`\`\`${unit.language || 'typescript'}\n${unit.content}\n\`\`\``;
      } else if (unit.type === 'table') {
        return unit.content;
      } else {
        return `${unit.content}\n`;
      }
    };

    for (const unit of section.units) {
      parts.push(renderUnit(unit));
    }

    for (const sub of section.subsections) {
      parts.push(`\n### ${sub.title}\n`);
      for (const unit of sub.units) {
        parts.push(renderUnit(unit));
      }
    }
    parts.push('\n');
  }

  return parts.join('\n').trim();
}

/**
 * Updates a specific atomic unit in sections
 */
export function updateAtomicUnitInSections(
  sections: AtomicSection[],
  unitId: string,
  newContentOrUnit: string | Partial<AtomicContentUnit>
): AtomicSection[] {
  return sections.map(sec => {
    let updatedSec = false;
    const newUnits = sec.units.map(u => {
      if (u.id === unitId) {
        updatedSec = true;
        if (typeof newContentOrUnit === 'string') {
          return { ...u, content: newContentOrUnit, rawMarkdown: newContentOrUnit };
        } else {
          return { ...u, ...newContentOrUnit };
        }
      }
      return u;
    });

    const newSubsections = sec.subsections.map(sub => {
      let updatedSub = false;
      const newSubUnits = sub.units.map(u => {
        if (u.id === unitId) {
          updatedSub = true;
          if (typeof newContentOrUnit === 'string') {
            return { ...u, content: newContentOrUnit, rawMarkdown: newContentOrUnit };
          } else {
            return { ...u, ...newContentOrUnit };
          }
        }
        return u;
      });
      if (updatedSub) {
        updatedSec = true;
        return { ...sub, units: newSubUnits };
      }
      return sub;
    });

    if (updatedSec) {
      return { ...sec, units: newUnits, subsections: newSubsections };
    }
    return sec;
  });
}

/**
 * Inserts a new atomic unit into sections at a specific position relative to target or container
 */
export function insertAtomicUnitInSections(
  sections: AtomicSection[],
  options: {
    targetUnitId?: string;
    position?: 'before' | 'after';
    targetSectionId?: string;
    targetSubsectionId?: string;
  },
  newUnit: AtomicContentUnit
): AtomicSection[] {
  const { targetUnitId, position = 'after', targetSectionId, targetSubsectionId } = options;

  // 1. If targetUnitId is given, insert before or after that unit
  if (targetUnitId) {
    let found = false;
    const newSections = sections.map(sec => {
      // Check direct units
      const unitIdx = sec.units.findIndex(u => u.id === targetUnitId);
      if (unitIdx !== -1) {
        found = true;
        const copy = [...sec.units];
        const insertIdx = position === 'before' ? unitIdx : unitIdx + 1;
        copy.splice(insertIdx, 0, newUnit);
        return { ...sec, units: copy };
      }

      // Check subsections
      const newSubs = sec.subsections.map(sub => {
        const subUnitIdx = sub.units.findIndex(u => u.id === targetUnitId);
        if (subUnitIdx !== -1) {
          found = true;
          const subCopy = [...sub.units];
          const insertIdx = position === 'before' ? subUnitIdx : subUnitIdx + 1;
          subCopy.splice(insertIdx, 0, newUnit);
          return { ...sub, units: subCopy };
        }
        return sub;
      });

      return { ...sec, subsections: newSubs };
    });

    if (found) return newSections;
  }

  // 2. If targetSubsectionId is given, append or prepend to subsection
  if (targetSubsectionId) {
    return sections.map(sec => {
      const newSubs = sec.subsections.map(sub => {
        if (sub.id === targetSubsectionId) {
          const updatedUnits = position === 'before' ? [newUnit, ...sub.units] : [...sub.units, newUnit];
          return { ...sub, units: updatedUnits };
        }
        return sub;
      });
      return { ...sec, subsections: newSubs };
    });
  }

  // 3. If targetSectionId is given, append or prepend to section's direct units
  if (targetSectionId) {
    return sections.map(sec => {
      if (sec.id === targetSectionId) {
        const updatedUnits = position === 'before' ? [newUnit, ...sec.units] : [...sec.units, newUnit];
        return { ...sec, units: updatedUnits };
      }
      return sec;
    });
  }

  // Fallback: If no target, add to the last section or create a default section
  if (sections.length === 0) {
    return [{
      id: `sec-init-1`,
      title: 'Khảo Luận Chuyên Sâu',
      secNumber: 'I',
      tierCategory: 'Bản Thể Luận & Khởi Nguyên',
      subsections: [],
      units: [newUnit]
    }];
  }

  const lastSec = sections[sections.length - 1];
  return sections.map((sec, i) => {
    if (i === sections.length - 1) {
      return { ...sec, units: [...sec.units, newUnit] };
    }
    return sec;
  });
}

/**
 * Deletes an atomic unit by ID
 */
export function deleteAtomicUnitInSections(
  sections: AtomicSection[],
  unitId: string
): AtomicSection[] {
  return sections.map(sec => {
    const filteredUnits = sec.units.filter(u => u.id !== unitId);
    const filteredSubs = sec.subsections.map(sub => ({
      ...sub,
      units: sub.units.filter(u => u.id !== unitId)
    }));
    return {
      ...sec,
      units: filteredUnits,
      subsections: filteredSubs
    };
  });
}

/**
 * Moves an atomic unit up or down in its list
 */
export function moveAtomicUnitInSections(
  sections: AtomicSection[],
  unitId: string,
  direction: 'up' | 'down'
): AtomicSection[] {
  return sections.map(sec => {
    // Check direct units
    const idx = sec.units.findIndex(u => u.id === unitId);
    if (idx !== -1) {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx >= 0 && targetIdx < sec.units.length) {
        const copy = [...sec.units];
        const temp = copy[idx];
        copy[idx] = copy[targetIdx];
        copy[targetIdx] = temp;
        return { ...sec, units: copy };
      }
      return sec;
    }

    // Check subsections
    const newSubs = sec.subsections.map(sub => {
      const sIdx = sub.units.findIndex(u => u.id === unitId);
      if (sIdx !== -1) {
        const targetIdx = direction === 'up' ? sIdx - 1 : sIdx + 1;
        if (targetIdx >= 0 && targetIdx < sub.units.length) {
          const copy = [...sub.units];
          const temp = copy[sIdx];
          copy[sIdx] = copy[targetIdx];
          copy[targetIdx] = temp;
          return { ...sub, units: copy };
        }
      }
      return sub;
    });

    return { ...sec, subsections: newSubs };
  });
}

/**
 * Adds a new Section (H2)
 */
export function addSectionToSections(
  sections: AtomicSection[],
  title: string,
  tierCategory?: string
): AtomicSection[] {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const newSecIdx = sections.length + 1;
  const newSec: AtomicSection = {
    id: `sec-${Date.now()}-${newSecIdx}`,
    title: title.trim() || `Mục ${romanNumerals[newSecIdx - 1] || newSecIdx}: Khảo Luận Mới`,
    secNumber: romanNumerals[newSecIdx - 1] || String(newSecIdx),
    tierCategory: tierCategory || 'Bản Thể Luận & Khởi Nguyên',
    subsections: [],
    units: []
  };
  return [...sections, newSec];
}

/**
 * Deletes a Section
 */
export function deleteSectionFromSections(
  sections: AtomicSection[],
  sectionId: string
): AtomicSection[] {
  return sections.filter(sec => sec.id !== sectionId);
}

/**
 * Adds a new Subsection (H3) to a Section
 */
export function addSubsectionToSection(
  sections: AtomicSection[],
  sectionId: string,
  title: string
): AtomicSection[] {
  return sections.map((sec, sIdx) => {
    if (sec.id === sectionId) {
      const subIdx = sec.subsections.length + 1;
      const newSub: AtomicSubsection = {
        id: `subsec-${Date.now()}-${sIdx + 1}-${subIdx}`,
        title: title.trim() || `Tiểu mục ${sIdx + 1}.${subIdx}: Phân tích chi tiết`,
        subNumber: `${sIdx + 1}.${subIdx}`,
        units: []
      };
      return {
        ...sec,
        subsections: [...sec.subsections, newSub]
      };
    }
    return sec;
  });
}

/**
 * Deletes a Subsection
 */
export function deleteSubsectionFromSections(
  sections: AtomicSection[],
  subsectionId: string
): AtomicSection[] {
  return sections.map(sec => ({
    ...sec,
    subsections: sec.subsections.filter(sub => sub.id !== subsectionId)
  }));
}

/**
 * Updates a section title in sections
 */
export function updateSectionTitleInSections(
  sections: AtomicSection[],
  sectionId: string,
  newTitle: string
): AtomicSection[] {
  return sections.map(sec => {
    if (sec.id === sectionId) {
      return { ...sec, title: newTitle };
    }
    return sec;
  });
}

/**
 * Updates a subsection title in sections
 */
export function updateSubsectionTitleInSections(
  sections: AtomicSection[],
  subsectionId: string,
  newTitle: string
): AtomicSection[] {
  return sections.map(sec => {
    const newSubs = sec.subsections.map(sub => {
      if (sub.id === subsectionId) {
        return { ...sub, title: newTitle };
      }
      return sub;
    });
    return { ...sec, subsections: newSubs };
  });
}

