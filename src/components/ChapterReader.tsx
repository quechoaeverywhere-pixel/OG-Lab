import React, { useMemo } from 'react';
import { Dossier, LexiconTerm, ClassicalQuote, CitationItem } from '../types';
import { AtomicChapterReader } from './AtomicChapterReader';
import { ensureDossierPillarStructure } from '../utils/pillarParser';
import { BookOpen } from 'lucide-react';

interface ChapterReaderProps {
  dossier: Dossier;
  activePillarId?: string | null;
  activeChapterId?: string | null;
  selectedChapterId?: string | null;
  onSelectChapter?: (chapterId: string) => void;
  onUpdateDossier: (updatedDossier: Dossier) => Promise<void> | void;
  onAddLexiconTerm?: (term: LexiconTerm) => void;
  onAddQuote?: (quote: ClassicalQuote) => void;
  onOpenQuickResearch?: (topic: string) => void;
  onSelectLexiconTerm?: (term: string) => void;
  onOpenPresentation?: (dossierId: string) => void;
  lexicon?: LexiconTerm[];
  theme: 'dark' | 'light';
}

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  dossier,
  activePillarId,
  activeChapterId,
  selectedChapterId,
  onUpdateDossier,
  onAddLexiconTerm,
  onAddQuote,
  onOpenPresentation,
  theme
}) => {
  const currentTargetChapterId = activeChapterId || selectedChapterId;

  // Ensure structured 6 dynamic pillars exist
  const structuredDossier = useMemo(() => {
    return ensureDossierPillarStructure(dossier);
  }, [dossier]);

  if (!structuredDossier || !structuredDossier.projectStructure || structuredDossier.projectStructure.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-3">
          <BookOpen className="w-10 h-10 text-purple-400 mx-auto opacity-50" />
          <h3 className="text-base font-bold text-slate-200">Chọn một hồ sơ nghiên cứu</h3>
          <p className="text-xs text-slate-400">
            Vui lòng chọn một hồ sơ từ thanh bên trái để khám phá đầy đủ 6 Trụ cột động.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col h-full overflow-hidden items-center">
      {/* 100% Focused Atomic Dossier Multi-Pillar View */}
      <AtomicChapterReader
        dossier={structuredDossier}
        activePillarId={activePillarId}
        activeChapterId={currentTargetChapterId}
        onUpdateDossier={onUpdateDossier}
        onAddLexiconTerm={onAddLexiconTerm}
        onAddCitation={(cit: CitationItem) => {
          if (onAddQuote) {
            onAddQuote({
              id: cit.id,
              quote: cit.keyQuote || cit.title,
              author: cit.author,
              work: cit.source || cit.title,
              interpretation: cit.title,
              discipline: cit.category || 'HọcThuật'
            });
          }
        }}
        onOpenPresentation={onOpenPresentation}
        theme={theme}
      />
    </div>
  );
};
