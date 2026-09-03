import { CitationItem, ClassicalQuote, LexiconTerm, Dossier, DynamicPillar, Chapter } from '../types';

/**
 * Normalizes a quote string for strict comparison and deduplication:
 * - Trims
 * - Strips leading/trailing punctuation and quotation marks (", ', “, ”, «, », etc.)
 * - Strips markdown italics/bold formatting (*, _, **)
 * - Collapses multiple whitespaces
 * - Converts to lowercase
 */
export function normalizeQuoteText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/^["'“”«»‘`*_\s—–-]+|["'“”«»‘`*_\s—–-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes an author string for comparison
 */
export function normalizeAuthorText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a canonical deduplication key for a citation or quote.
 * Two quotes with identical core text (or identical author + similar core text) produce the same key.
 */
export function getCitationDeduplicationKey(item: {
  keyQuote?: string;
  quote?: string;
  title?: string;
  author?: string;
}): string {
  const quoteText = normalizeQuoteText(item.keyQuote || item.quote || item.title || '');
  if (!quoteText) return '';
  return quoteText;
}

/**
 * Normalizes a lexicon term name for deduplication
 */
export function normalizeTermText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  // Extract core term before any slashes or parens if present, while also keeping full clean string
  const clean = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return clean;
}

/**
 * Generates a canonical deduplication key for a lexicon term
 */
export function getLexiconDeduplicationKey(item: { term?: string; enTerm?: string }): string {
  const vnTerm = normalizeTermText(item.term || '');
  if (vnTerm) return vnTerm;
  const en = normalizeTermText(item.enTerm || '');
  return en;
}

/**
 * Deduplicates an array of CitationItems.
 * If a duplicate is found, merges metadata (prefers richer information) and combines dossierIds.
 */
export function deduplicateCitations(citations: CitationItem[]): CitationItem[] {
  if (!Array.isArray(citations)) return [];
  const map = new Map<string, CitationItem>();

  for (const item of citations) {
    if (!item) continue;
    const key = getCitationDeduplicationKey(item);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      // Ensure stable clean ID
      const cleanId = item.id && !item.id.startsWith('q-') && !item.id.startsWith('quote-')
        ? item.id
        : `cit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      map.set(key, {
        ...item,
        id: cleanId,
        dossierIds: Array.isArray(item.dossierIds) ? [...item.dossierIds] : []
      });
    } else {
      // Merge richer fields into existing
      const mergedDossierIds = Array.from(
        new Set([
          ...(existing.dossierIds || []),
          ...(item.dossierIds || [])
        ])
      );

      map.set(key, {
        ...existing,
        // Prefer more descriptive fields
        author: existing.author && existing.author !== 'Khuyết danh' && existing.author !== 'Tác giả' ? existing.author : (item.author || existing.author),
        title: existing.title && existing.title !== 'Kinh điển' ? existing.title : (item.title || existing.title),
        source: existing.source && existing.source !== 'Kinh điển' ? existing.source : (item.source || existing.source),
        year: existing.year && existing.year !== 'Cổ điển' ? existing.year : (item.year || existing.year),
        doiOrUrl: existing.doiOrUrl || item.doiOrUrl,
        keyQuote: (existing.keyQuote && existing.keyQuote.length >= (item.keyQuote || '').length) ? existing.keyQuote : (item.keyQuote || existing.keyQuote),
        dossierIds: mergedDossierIds
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Deduplicates an array of ClassicalQuotes.
 * Retains richer interpretation, translation, and metadata.
 */
export function deduplicateQuotes(quotes: ClassicalQuote[]): ClassicalQuote[] {
  if (!Array.isArray(quotes)) return [];
  const map = new Map<string, ClassicalQuote>();

  for (const q of quotes) {
    if (!q || !q.quote) continue;
    const key = normalizeQuoteText(q.quote);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...q });
    } else {
      map.set(key, {
        ...existing,
        author: existing.author || q.author,
        work: existing.work || q.work,
        eraOrYear: existing.eraOrYear || q.eraOrYear,
        interpretation: (existing.interpretation && existing.interpretation.length >= (q.interpretation || '').length) ? existing.interpretation : (q.interpretation || existing.interpretation),
        translationVi: existing.translationVi || q.translationVi,
        discipline: existing.discipline || q.discipline,
        language: existing.language || q.language
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Deduplicates an array of LexiconTerms.
 * Merges tags and keeps richer definitions.
 */
export function deduplicateLexicon(lexicon: LexiconTerm[]): LexiconTerm[] {
  if (!Array.isArray(lexicon)) return [];
  const map = new Map<string, LexiconTerm>();

  for (const term of lexicon) {
    if (!term || !term.term) continue;
    const key = getLexiconDeduplicationKey(term);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      const cleanId = term.id && !term.id.startsWith('term-')
        ? term.id
        : `lex-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      map.set(key, {
        ...term,
        id: cleanId,
        tags: Array.isArray(term.tags) ? [...term.tags] : []
      });
    } else {
      const mergedTags = Array.from(
        new Set([
          ...(existing.tags || []),
          ...(term.tags || [])
        ])
      );

      map.set(key, {
        ...existing,
        enTerm: existing.enTerm || term.enTerm,
        category: existing.category || term.category,
        philosophicalOrigin: existing.philosophicalOrigin || term.philosophicalOrigin,
        csEquivalent: existing.csEquivalent || term.csEquivalent,
        deepExplanation: (existing.deepExplanation && existing.deepExplanation.length >= (term.deepExplanation || '').length) ? existing.deepExplanation : (term.deepExplanation || existing.deepExplanation),
        applicationInAgents: (existing.applicationInAgents && existing.applicationInAgents.length >= (term.applicationInAgents || '').length) ? existing.applicationInAgents : (term.applicationInAgents || existing.applicationInAgents),
        tags: mergedTags
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Traverses a Dossier and removes all internal quote and lexicon duplicates
 */
export function deduplicateDossier(dossier: Dossier): Dossier {
  if (!dossier) return dossier;

  const classicalQuotes = Array.isArray(dossier.classicalQuotes)
    ? deduplicateQuotes(dossier.classicalQuotes)
    : undefined;

  const citations = Array.isArray(dossier.citations)
    ? deduplicateCitations(dossier.citations)
    : undefined;

  const autoCapturedTerms = Array.isArray(dossier.autoCapturedTerms)
    ? deduplicateLexicon(dossier.autoCapturedTerms)
    : undefined;

  let projectStructure: DynamicPillar[] | undefined = undefined;
  if (Array.isArray(dossier.projectStructure)) {
    projectStructure = dossier.projectStructure.map(pillar => {
      const chapters: Chapter[] = Array.isArray(pillar.chapters)
        ? pillar.chapters.map(ch => ({
            ...ch,
            quotes: Array.isArray(ch.quotes) ? deduplicateQuotes(ch.quotes) : [],
            extractedTerms: Array.isArray(ch.extractedTerms) ? deduplicateLexicon(ch.extractedTerms) : []
          }))
        : [];
      return {
        ...pillar,
        chapters
      };
    });
  }

  const result: any = {
    ...dossier
  };

  if (classicalQuotes !== undefined) result.classicalQuotes = classicalQuotes;
  if (citations !== undefined) result.citations = citations;
  if (autoCapturedTerms !== undefined) result.autoCapturedTerms = autoCapturedTerms;
  if (projectStructure !== undefined) result.projectStructure = projectStructure;

  // Clean up any remaining undefined fields to appease Firestore
  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });

  return result as Dossier;
}
