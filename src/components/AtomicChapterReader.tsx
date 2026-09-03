import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Brain,
  Loader2,
  FileDown,
  Edit3,
  Save,
  X,
  BookOpen,
  RefreshCw,
  Lock,
  ShieldAlert,
  Camera,
  FileText,
  Monitor,
  Plus,
  Building2,
  Image
} from 'lucide-react';
import { Dossier, DynamicPillar, Chapter, LexiconTerm, ClassicalQuote, CitationItem } from '../types';
import { AtomicContentUnit, decomposeChapterToAtomic, recomposeAtomicToMarkdown, updateAtomicUnitInSections, updateSectionTitleInSections, updateSubsectionTitleInSections, insertAtomicUnitInSections, deleteAtomicUnitInSections, moveAtomicUnitInSections, addSectionToSections } from '../utils/atomicContentParser';
import { formatChapterTitle } from '../utils/pillarParser';
import { deduplicateQuotes, deduplicateLexicon, deduplicateDossier } from '../utils/deduplication';
import { AtomicSectionCard } from './AtomicContentCard';
import { AddContentCardModal } from './AddContentCardModal';
import { safeFetchAIJson } from '../utils/ai-client';
import { useAIProgress } from '../context/AIProgressContext';
import { usePermission } from '../contexts/PermissionContext';
import { ExportReportImageModal } from './ExportReportImageModal';
import { ReportPresentationViewer } from './ReportPresentationViewer';

interface AtomicChapterReaderProps {
  dossier: Dossier;
  activePillarId?: string | null;
  activeChapterId?: string | null;
  onUpdateDossier: (updatedDossier: Dossier) => Promise<void> | void;
  onAddLexiconTerm?: (term: LexiconTerm) => void;
  onAddCitation?: (citation: CitationItem) => void;
  onOpenPresentation?: (dossierId: string) => void;
  theme: 'dark' | 'light';
}

// Visual Identity & Color Schemes for 6 Dynamic Pillars
export function getPillarThemeInfo(pillarTitle: string, index: number, theme: 'dark' | 'light' = 'dark') {
  const title = (pillarTitle || '').toLowerCase();
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const roman = romanNumerals[index] || `0${index + 1}`;
  const isDark = theme === 'dark';

  if (title.includes('bản thể') || title.includes('i:') || index === 0) {
    return {
      roman,
      badge: `TRỤ CỘT ${roman} • BẢN THỂ VẬN HÀNH`,
      sub: 'Ý niệm nguyên thủy & Định hình bản chất thực tại',
      gradient: isDark ? 'from-purple-900/20 to-indigo-950/20' : 'from-purple-50 to-indigo-50/50',
      border: isDark ? 'border-purple-500/30' : 'border-purple-200',
      accent: isDark ? 'text-purple-300' : 'text-purple-900',
      badgeClass: isDark ? 'bg-purple-900/40 border-purple-500/30 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-900',
      bgGlow: 'shadow-purple-950/20'
    };
  }
  if (title.includes('cơ chế') || title.includes('ii:') || index === 1) {
    return {
      roman,
      badge: `TRỤ CỘT ${roman} • CƠ CHẾ VẬN HÀNH`,
      sub: 'Quy luật động lực học & Cấu trúc cơ học nội tại',
      gradient: isDark ? 'from-blue-900/20 to-cyan-950/20' : 'from-cyan-50 to-blue-50/50',
      border: isDark ? 'border-cyan-500/30' : 'border-cyan-200',
      accent: isDark ? 'text-cyan-300' : 'text-cyan-900',
      badgeClass: isDark ? 'bg-cyan-900/40 border-cyan-500/30 text-cyan-300' : 'bg-cyan-100 border-cyan-300 text-cyan-900',
      bgGlow: 'shadow-cyan-950/20'
    };
  }
  if (title.includes('kiến trúc') || title.includes('iii:') || index === 2) {
    return {
      roman,
      badge: `TRỤ CỘT ${roman} • KIẾN TRÚC THỰC THI`,
      sub: 'Thiết kế hệ thống & Ứng dụng giải quyết bài toán nhân sinh',
      gradient: isDark ? 'from-emerald-900/20 to-green-950/20' : 'from-emerald-50 to-green-50/50',
      border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
      accent: isDark ? 'text-emerald-300' : 'text-emerald-900',
      badgeClass: isDark ? 'bg-emerald-900/40 border-emerald-500/30 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-900',
      bgGlow: 'shadow-emerald-950/20'
    };
  }
  if (title.includes('biện chứng') || title.includes('iv:') || index === 3) {
    return {
      roman,
      badge: `TRỤ CỘT ${roman} • BIỆN CHỨNG PHẢN BIỆN`,
      sub: 'Mâu thuẫn, Nghịch lý & Chế độ lỗi (Failure Modes)',
      gradient: isDark ? 'from-rose-900/20 to-red-950/20' : 'from-rose-50 to-red-50/50',
      border: isDark ? 'border-rose-500/30' : 'border-rose-200',
      accent: isDark ? 'text-rose-300' : 'text-rose-900',
      badgeClass: isDark ? 'bg-rose-900/40 border-rose-500/30 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-900',
      bgGlow: 'shadow-rose-950/20'
    };
  }
  if (title.includes('tĩnh tâm') || title.includes('v:') || index === 4) {
    return {
      roman,
      badge: `TRỤ CỘT ${roman} • TĨNH TÂM (SHINBASHIRA)`,
      sub: 'Trục cân bằng đạo đức & Nguyên lý khắc kỷ tự phục hồi',
      gradient: isDark ? 'from-amber-900/20 to-orange-950/20' : 'from-amber-50 to-orange-50/50',
      border: isDark ? 'border-amber-500/30' : 'border-amber-200',
      accent: isDark ? 'text-amber-300' : 'text-amber-900',
      badgeClass: isDark ? 'bg-amber-900/40 border-amber-500/30 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-900',
      bgGlow: 'shadow-amber-950/20'
    };
  }
  return {
    roman,
    badge: `TRỤ CỘT ${roman} • ĐẤT TRỜI (VÔ VI)`,
    sub: 'Hòa hợp hệ sinh thái & Mạng lưới đa tác tử tự nhiên',
    gradient: isDark ? 'from-teal-900/20 to-emerald-950/20' : 'from-teal-50 to-emerald-50/50',
    border: isDark ? 'border-teal-500/30' : 'border-teal-200',
    accent: isDark ? 'text-teal-300' : 'text-teal-900',
    badgeClass: isDark ? 'bg-teal-900/40 border-teal-500/30 text-teal-300' : 'bg-teal-100 border-teal-300 text-teal-900',
    bgGlow: 'shadow-teal-950/20'
  };
}

// Sub-component: Individual Chapter Card inside a Pillar
const SingleChapterCard: React.FC<{
  chapter: Chapter;
  chapterIndex: number;
  pillarIndex: number;
  pillar: DynamicPillar;
  dossier: Dossier;
  theme: 'dark' | 'light';
  onUpdateChapter: (updatedChapter: Chapter) => void;
  onAddLexiconTerm?: (term: LexiconTerm) => void;
  onAddCitation?: (citation: CitationItem) => void;
}> = ({
  chapter,
  chapterIndex,
  pillarIndex,
  pillar,
  dossier,
  theme,
  onUpdateChapter,
  onAddLexiconTerm,
  onAddCitation
}) => {
  const { requirePermission, canEditContent } = usePermission();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [addCardTargetLocation, setAddCardTargetLocation] = useState<{
    targetUnitId?: string;
    position?: 'before' | 'after';
    targetSectionId?: string;
    targetSubsectionId?: string;
  }>({});
  const { startProgress, updateStage, signalHighDemand, finishProgress } = useAIProgress();

  // Normalized display title (always Chương P.C: Title)
  const displayTitle = useMemo(() => {
    return formatChapterTitle(pillarIndex, chapterIndex, chapter.title);
  }, [pillarIndex, chapterIndex, chapter.title]);

  const hasContent = !!chapter.contentMarkdown && chapter.contentMarkdown.trim().length > 30;

  // Decompose chapter content into seamless atomic units
  const atomicData = useMemo(() => {
    return decomposeChapterToAtomic(chapter, pillar, dossier);
  }, [chapter, pillar, dossier]);

  // In-place unit updates
  const handleUpdateUnit = (unitId: string, newContentOrUnit: string | Partial<AtomicContentUnit>) => {
    requirePermission('compose_article', () => {
      const updatedSections = updateAtomicUnitInSections(atomicData.sections, unitId, newContentOrUnit);
      const newMarkdown = recomposeAtomicToMarkdown(updatedSections);
      onUpdateChapter({
        ...chapter,
        title: displayTitle,
        contentMarkdown: newMarkdown,
        status: 'completed'
      });
    });
  };

  const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
    requirePermission('compose_article', () => {
      const updatedSections = updateSectionTitleInSections(atomicData.sections, sectionId, newTitle);
      const newMarkdown = recomposeAtomicToMarkdown(updatedSections);
      onUpdateChapter({
        ...chapter,
        title: displayTitle,
        contentMarkdown: newMarkdown,
        status: 'completed'
      });
    });
  };

  const handleUpdateSubsectionTitle = (subsectionId: string, newTitle: string) => {
    requirePermission('compose_article', () => {
      const updatedSections = updateSubsectionTitleInSections(atomicData.sections, subsectionId, newTitle);
      const newMarkdown = recomposeAtomicToMarkdown(updatedSections);
      onUpdateChapter({
        ...chapter,
        title: displayTitle,
        contentMarkdown: newMarkdown,
        status: 'completed'
      });
    });
  };

  const handleDeleteUnit = (unitId: string) => {
    requirePermission('compose_article', () => {
      const updatedSections = deleteAtomicUnitInSections(atomicData.sections, unitId);
      const newMarkdown = recomposeAtomicToMarkdown(updatedSections);
      onUpdateChapter({
        ...chapter,
        title: displayTitle,
        contentMarkdown: newMarkdown,
        status: 'completed'
      });
    });
  };

  const handleMoveUnit = (unitId: string, direction: 'up' | 'down') => {
    requirePermission('compose_article', () => {
      const updatedSections = moveAtomicUnitInSections(atomicData.sections, unitId, direction);
      const newMarkdown = recomposeAtomicToMarkdown(updatedSections);
      onUpdateChapter({
        ...chapter,
        title: displayTitle,
        contentMarkdown: newMarkdown,
        status: 'completed'
      });
    });
  };

  const handleRequestAddCard = (targetLocation: {
    targetUnitId?: string;
    position?: 'before' | 'after';
    targetSectionId?: string;
    targetSubsectionId?: string;
  }) => {
    requirePermission('compose_article', () => {
      setAddCardTargetLocation(targetLocation);
      setIsAddCardModalOpen(true);
    });
  };

  const handleInsertNewUnit = (newUnit: AtomicContentUnit) => {
    requirePermission('compose_article', () => {
      const updatedSections = insertAtomicUnitInSections(atomicData.sections, addCardTargetLocation, newUnit);
      const newMarkdown = recomposeAtomicToMarkdown(updatedSections);
      onUpdateChapter({
        ...chapter,
        title: displayTitle,
        contentMarkdown: newMarkdown,
        status: 'completed'
      });
      setIsAddCardModalOpen(false);
    });
  };

  const handleCopyChapter = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const fullText = `# ${displayTitle}\n\n${chapter.contentMarkdown || ''}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateChapterAI = () => {
    requirePermission('ai_research', async () => {
      setIsGenerating(true);
      startProgress(`Đang biên soạn: ${displayTitle}`);
      updateStage('researching', `Biên soạn ${displayTitle}`, 'Đang khai thác 4 Cấp độ Phân tầng & 6 Trụ cột Động...');

      try {
        const fetchResult = await safeFetchAIJson('/api/gemini/generate-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectTitle: dossier.title,
            pillarTitle: pillar.title,
            chapterTitle: displayTitle,
            mode: 'deep',
            depthLevel: dossier.depthLevel || 'dissertation',
            selectedDisciplines: dossier.interdisciplinaryFields || ['Khoa Học Máy Tính', 'Trí Tuệ Nhân Tạo', 'Hệ Thống Phức Tạp', 'Kinh Tế'],
            model: 'gemini-3.7-flash'
          })
        });

        if (!fetchResult.ok || !fetchResult.data) {
          throw new Error(fetchResult.error || 'Lỗi khi biên soạn chương.');
        }

        const data = fetchResult.data;
        if (!data.success || !data.contentMarkdown) {
          throw new Error(data.error || 'Lỗi khi biên soạn chương.');
        }

        if (data.highDemand) {
          signalHighDemand(data.modelUsed);
        }

        const newTerms = data.extractedTerms || [];
        const newQuotes = data.quotes || [];

        if (onAddLexiconTerm) {
          newTerms.forEach((term: LexiconTerm) => onAddLexiconTerm(term));
        }
        if (onAddCitation) {
          newQuotes.forEach((q: ClassicalQuote) => {
            onAddCitation({
              id: `cit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: q.work || `${q.author} - Trích dẫn kinh điển`,
              author: q.author,
              year: q.eraOrYear || 'Cổ điển',
              source: q.work || 'Khảo luận OG Lab',
              category: 'Kinh điển',
              keyQuote: q.quote,
              dossierIds: [dossier.id]
            });
          });
        }

        const updatedChapterObj: Chapter = {
          ...chapter,
          id: chapter.id || `ch-${pillarIndex + 1}-${chapterIndex + 1}`,
          title: displayTitle,
          contentMarkdown: data.contentMarkdown,
          status: 'completed',
          extractedTerms: deduplicateLexicon(newTerms),
          quotes: deduplicateQuotes(newQuotes)
        };

        onUpdateChapter(updatedChapterObj);
        setIsExpanded(true);
        finishProgress(`Đã hoàn tất biên soạn: ${displayTitle}`);
      } catch (err: any) {
        console.error('Failed to generate chapter:', err);
        alert(`Lỗi: ${err.message}`);
      } finally {
        setIsGenerating(false);
      }
    });
  };

  return (
    <div
      id={`chapter-card-${chapter.id}`}
      className={`rounded-2xl p-4 md:p-5 border transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          : 'bg-white border-slate-200 hover:border-purple-200 shadow-xs'
      }`}
    >
      {/* Chapter Top Bar */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center justify-between gap-3 cursor-pointer select-none pb-2"
      >
        <div className="space-y-1 flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold tracking-wider uppercase border ${
                theme === 'dark' ? 'bg-slate-800 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-800 border-purple-200'
              }`}
            >
              CHƯƠNG {pillarIndex + 1}.{chapterIndex + 1}
            </span>
            <span className={`text-[11px] font-mono ${hasContent ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}`}>
              {hasContent ? `✓ Đã hoàn thành (${atomicData.readingMinutes} phút đọc)` : '⏳ Chưa biên soạn'}
            </span>
            {hasContent && (
              <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                • {atomicData.totalWords.toLocaleString()} từ
              </span>
            )}
          </div>

          <h3 className={`text-base md:text-lg font-bold font-sans tracking-tight leading-snug ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>
            {displayTitle}
          </h3>

          {chapter.subtitle && (
            <p className={`text-xs font-sans italic ${theme === 'dark' ? 'text-purple-300/80' : 'text-purple-700'}`}>
              {chapter.subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          {hasContent && (
            <button
              onClick={handleCopyChapter}
              className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-slate-900 hover:bg-purple-600/30 text-slate-300 border-slate-800'
                  : 'bg-white hover:bg-purple-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
              title="Sao chép chương này"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          )}

          {hasContent && !isGenerating && (
            <button
              onClick={handleGenerateChapterAI}
              className={`p-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-slate-900 hover:bg-purple-600/30 text-purple-300 border-purple-500/20'
                  : 'bg-white hover:bg-purple-50 text-purple-700 border-purple-200 shadow-xs'
              }`}
              title="Biên soạn lại chương này bằng AI"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isExpanded ? 'Thu gọn chương' : 'Mở rộng chương'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Chapter Body */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/40 dark:border-slate-800/40 border-slate-200/80">
          {!hasContent && !isGenerating && (
            <div className={`p-5 text-center rounded-xl border border-dashed space-y-2.5 ${
              theme === 'dark' ? 'border-purple-500/30 bg-purple-950/10' : 'border-purple-200 bg-purple-50/40'
            }`}>
              <Brain className="w-6 h-6 text-purple-400 mx-auto animate-pulse" />
              <div className="space-y-0.5 max-w-md mx-auto">
                <h4 className={`text-xs md:text-sm font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                  Chương này chưa có nội dung nghiên cứu chi tiết.
                </h4>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Nhấn nút bên dưới để Gemini AI nghiên cứu 4 cấp độ phân tầng học thuật và chuyển hóa sang ngôn ngữ đời thường thực chiến.
                </p>
              </div>
              <button
                onClick={handleGenerateChapterAI}
                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Biên Soạn Chương Này Bằng AI</span>
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="p-6 text-center rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
              <Loader2 className="w-6 h-6 text-purple-400 mx-auto animate-spin" />
              <p className="text-xs font-mono text-purple-300">
                Đang nghiên cứu và biên soạn 4 cấp độ học thuật cho {displayTitle}...
              </p>
            </div>
          )}

          {hasContent && atomicData.sections.length > 0 && (
            <div className="space-y-4 pt-1">
              {atomicData.sections.map(section => {
                const contextInfo = `Hồ sơ: ${dossier.title} | Trụ cột: ${pillar.title} | Chương: ${chapter.title}`;
                return (
                  <AtomicSectionCard
                    key={section.id}
                    section={section}
                    theme={theme}
                    contextInfo={contextInfo}
                    onUpdateUnit={handleUpdateUnit}
                    onUpdateSectionTitle={handleUpdateSectionTitle}
                    onUpdateSubsectionTitle={handleUpdateSubsectionTitle}
                    onDeleteUnit={handleDeleteUnit}
                    onMoveUnit={handleMoveUnit}
                    onRequestAddCard={handleRequestAddCard}
                  />
                );
              })}

              {/* Bottom Add Card Toolbar for the Chapter */}
              {canEditContent && (
                <div className="pt-3 flex flex-wrap items-center justify-center gap-2 border-t border-dashed border-slate-800/40 dark:border-slate-800/40 border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleRequestAddCard({})}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 border cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-purple-950/30 hover:bg-purple-900/50 border-purple-500/30 text-purple-300'
                        : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900 shadow-xs'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Thêm Thẻ Nội Dung Tự Do</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestAddCard({})}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white cursor-pointer transition-all shadow-xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-200" />
                    <span>Kiến Trúc Sư AI & Phối Cảnh Ý Niệm</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Add Content Card Modal */}
          <AddContentCardModal
            isOpen={isAddCardModalOpen}
            onClose={() => setIsAddCardModalOpen(false)}
            onInsertUnit={handleInsertNewUnit}
            theme={theme}
            chapterContext={{
              dossierTitle: dossier.title,
              pillarTitle: pillar.title,
              chapterTitle: displayTitle
            }}
          />
        </div>
      )}
    </div>
  );
};

// Sub-component: Single Pillar Card (Displays Pillar Header & Chapters List)
const SinglePillarCard: React.FC<{
  dossier: Dossier;
  pillar: DynamicPillar;
  pillarIndex: number;
  isActive: boolean;
  theme: 'dark' | 'light';
  onUpdatePillarChapters: (pillarId: string, updatedChapters: Chapter[]) => void;
  onAddLexiconTerm?: (term: LexiconTerm) => void;
  onAddCitation?: (citation: CitationItem) => void;
}> = ({
  dossier,
  pillar,
  pillarIndex,
  isActive,
  theme,
  onUpdatePillarChapters,
  onAddLexiconTerm,
  onAddCitation
}) => {
  const { requirePermission } = usePermission();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const { startProgress, updateStage, signalHighDemand, notifyChapterSuccess, finishProgress } = useAIProgress();

  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  const pillarTheme = useMemo(() => {
    return getPillarThemeInfo(pillar.title, pillarIndex, theme);
  }, [pillar.title, pillarIndex, theme]);

  // Ensure chapters are populated and properly formatted
  const safeChapters = useMemo(() => {
    if (pillar.chapters && pillar.chapters.length > 0) {
      return pillar.chapters.map((ch, idx) => ({
        ...ch,
        title: formatChapterTitle(pillarIndex, idx, ch.title)
      }));
    }
    return [
      {
        id: `ch-${pillarIndex + 1}-1`,
        title: formatChapterTitle(pillarIndex, 0, ''),
        contentMarkdown: '',
        status: 'pending' as const
      },
      {
        id: `ch-${pillarIndex + 1}-2`,
        title: formatChapterTitle(pillarIndex, 1, ''),
        contentMarkdown: '',
        status: 'pending' as const
      }
    ];
  }, [pillar.chapters, pillarIndex]);

  // Aggregate stats across chapters
  const stats = useMemo(() => {
    let words = 0;
    let completedCount = 0;
    safeChapters.forEach(c => {
      if (c.contentMarkdown) {
        words += c.contentMarkdown.split(/\s+/).filter(Boolean).length;
      }
      if (c.status === 'completed' || (c.contentMarkdown && c.contentMarkdown.length > 50)) {
        completedCount++;
      }
    });
    const minutes = Math.max(1, Math.ceil(words / 200));
    return { words, minutes, completedCount, totalCount: safeChapters.length };
  }, [safeChapters]);

  const handleUpdateSingleChapter = (updatedChapter: Chapter) => {
    const nextChapters = safeChapters.map(c => c.id === updatedChapter.id ? updatedChapter : c);
    onUpdatePillarChapters(pillar.id, nextChapters);
  };

  // Copy Pillar Content as Markdown
  const handleCopyPillar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `# ${pillarTheme.badge}: ${pillar.title}\n\n`;
    if (pillar.description) text += `> ${pillar.description}\n\n`;
    safeChapters.forEach(c => {
      if (c.contentMarkdown) {
        text += `## ${c.title}\n\n${c.contentMarkdown}\n\n---\n\n`;
      }
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Batch generate all pending chapters in this pillar sequentially
  const handleBatchGeneratePillar = async () => {
    requirePermission('ai_research', async () => {
      setIsBatchGenerating(true);
      setIsExpanded(true);
      const updatedList = [...safeChapters];
      startProgress(`Đang biên soạn Trụ Cột: ${pillar.title}`);

      try {
        for (let i = 0; i < updatedList.length; i++) {
          const chap = updatedList[i];
          const displayTitle = formatChapterTitle(pillarIndex, i, chap.title);
          setBatchProgress(`Đang biên soạn ${i + 1}/${updatedList.length}: "${displayTitle}"...`);
          updateStage('researching', `Biên soạn (${i + 1}/${updatedList.length}): ${displayTitle}`, `Đang xử lý phân tầng ${pillar.title}...`);

          const fetchResult = await safeFetchAIJson('/api/gemini/generate-chapter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectTitle: dossier.title,
              pillarTitle: pillar.title,
              chapterTitle: displayTitle,
              mode: 'deep',
              depthLevel: dossier.depthLevel || 'dissertation',
              selectedDisciplines: dossier.interdisciplinaryFields || ['Khoa Học Máy Tính', 'Trí Tuệ Nhân Tạo', 'Hệ Thống Phức Tạp', 'Kinh Tế'],
              model: 'gemini-3.7-flash'
            })
          });

          if (fetchResult.ok && fetchResult.data && fetchResult.data.success && fetchResult.data.contentMarkdown) {
            const data = fetchResult.data;
            if (data.highDemand) {
              signalHighDemand(data.modelUsed);
            }

            const newTerms = data.extractedTerms || [];
            const newQuotes = data.quotes || [];

            if (onAddLexiconTerm) {
              newTerms.forEach((term: LexiconTerm) => onAddLexiconTerm(term));
            }
            if (onAddCitation) {
              newQuotes.forEach((q: ClassicalQuote) => {
                onAddCitation({
                  id: `cit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  title: q.work || `${q.author} - Trích dẫn kinh điển`,
                  author: q.author,
                  year: q.eraOrYear || 'Cổ điển',
                  source: q.work || 'Khảo luận OG Lab',
                  category: 'Kinh điển',
                  keyQuote: q.quote,
                  dossierIds: [dossier.id]
                });
              });
            }

            updatedList[i] = {
              ...chap,
              title: displayTitle,
              contentMarkdown: data.contentMarkdown,
              status: 'completed',
              extractedTerms: deduplicateLexicon(newTerms),
              quotes: deduplicateQuotes(newQuotes)
            };
            onUpdatePillarChapters(pillar.id, [...updatedList]);

            // Immediately chime and notify that this chapter has completed
            notifyChapterSuccess(displayTitle, i + 1, updatedList.length);
          }
        }
        finishProgress(`Đã hoàn tất toàn bộ Trụ cột: ${pillar.title}!`);
      } catch (err: any) {
        console.error('Error in batch pillar generation:', err);
        alert(`Lỗi khi biên soạn trụ cột: ${err.message}`);
      } finally {
        setIsBatchGenerating(false);
        setBatchProgress('');
      }
    }, {
      title: 'Khóa Tác Vụ Nghiên Cứu Sâu AI',
      message: 'Tác vụ biên soạn AI tự động hàng loạt yêu cầu quyền Tác Giả (Author) hoặc Quản Trị Viên (Admin).'
    });
  };

  return (
    <article
      id={`pillar-card-${pillar.id}`}
      className={`rounded-3xl p-5 md:p-7 border transition-all duration-300 ${
        isExpanded ? 'space-y-6' : 'space-y-0'
      } ${
        isActive
          ? theme === 'dark'
            ? 'bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#0b0a14] border-purple-500/50 shadow-2xl shadow-purple-950/30'
            : 'bg-gradient-to-b from-white via-slate-50 to-purple-50/20 border-purple-300 shadow-xl'
          : theme === 'dark'
          ? 'bg-slate-950/70 border-slate-800/80 hover:border-purple-500/30 shadow-xl shadow-black/20 text-slate-100'
          : 'bg-white border-slate-200 hover:border-purple-200 shadow-md text-slate-900'
      }`}
    >
      {/* 1. Pillar Header Bar */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className={`flex flex-wrap items-start justify-between gap-3 cursor-pointer select-none ${
          isExpanded ? 'pb-4 border-b border-slate-800/60 dark:border-slate-800/60 border-slate-200' : ''
        }`}
      >
        <div className="space-y-1.5 flex-1 min-w-0 pr-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] md:text-xs font-bold tracking-wider uppercase border ${pillarTheme.badgeClass}`}
            >
              {pillarTheme.badge}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
              <Clock className="w-3 h-3" />
              <span>{stats.minutes} phút đọc</span>
              <span>•</span>
              <span>{stats.words.toLocaleString()} từ</span>
              <span>•</span>
              <span className={stats.completedCount === stats.totalCount ? 'text-emerald-500 font-bold' : 'text-purple-400'}>
                {stats.completedCount}/{stats.totalCount} chương hoàn thành
              </span>
            </span>
          </div>

          <h2 className={`text-lg md:text-xl font-display-title font-extrabold tracking-tight leading-snug ${
            theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
          }`}>
            {pillar.title}
          </h2>

          <p className={`text-xs md:text-sm font-sans leading-relaxed ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {pillar.description || pillarTheme.sub}
          </p>
        </div>

        {/* 2 Nút Mở Rộng & Thu Gọn */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
          {stats.words > 0 && (
            <button
              onClick={handleCopyPillar}
              className={`p-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
                theme === 'dark'
                  ? 'bg-slate-900/80 hover:bg-purple-600/30 text-slate-300 hover:text-purple-200 border-slate-800'
                  : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 border-slate-300 shadow-xs'
              }`}
              title="Sao chép nội dung Trụ Cột"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          )}

          {/* Cụm 2 nút tối giản: [Nút Mở Rộng] & [Nút Thu Gọn] */}
          <div className={`flex items-center gap-0.5 p-0.5 rounded-xl border shadow-inner ${
            theme === 'dark'
              ? 'bg-slate-900/90 border-slate-800'
              : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                isExpanded
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/50'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Mở rộng"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className={`p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                !isExpanded
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/50'
                  : theme === 'dark'
                  ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Thu gọn"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Khi mở rộng: Hiển thị danh sách các chương của Trụ Cột */}
      {isExpanded && (
        <div className="space-y-4 pt-1">
          {/* Pillar Batch Generation Bar */}
          {stats.completedCount < stats.totalCount && (
            <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-purple-950/20 border-purple-500/30' : 'bg-purple-50 border-purple-200'
            }`}>
              <div className="space-y-0.5">
                <div className={`text-xs font-bold font-sans ${theme === 'dark' ? 'text-purple-200' : 'text-purple-900'}`}>
                  Biên soạn toàn bộ {stats.totalCount} chương của {pillarTheme.badge}
                </div>
                <div className={`text-[11px] font-sans ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                  Gemini AI sẽ tuần tự nghiên cứu và hoàn thiện từng chương theo phương pháp luận Chuyển Hóa Tri Thức.
                </div>
              </div>

              <button
                type="button"
                disabled={isBatchGenerating}
                onClick={handleBatchGeneratePillar}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                {isBatchGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>{isBatchGenerating ? 'Đang Xử Lý...' : `Biên Soạn Toàn Bộ Trụ Cột (${stats.totalCount} Chương)`}</span>
              </button>
            </div>
          )}

          {isBatchGenerating && batchProgress && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs font-mono text-purple-300 flex items-center gap-2 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-purple-400" />
              <span>{batchProgress}</span>
            </div>
          )}

          {/* List of Chapters inside this Pillar */}
          <div className="space-y-4">
            {safeChapters.map((chap, cIdx) => (
              <SingleChapterCard
                key={chap.id || `p${pillarIndex}-c${cIdx}`}
                chapter={chap}
                chapterIndex={cIdx}
                pillarIndex={pillarIndex}
                pillar={pillar}
                dossier={dossier}
                theme={theme}
                onUpdateChapter={handleUpdateSingleChapter}
                onAddLexiconTerm={onAddLexiconTerm}
                onAddCitation={onAddCitation}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export const AtomicChapterReader: React.FC<AtomicChapterReaderProps> = ({
  dossier,
  activePillarId,
  activeChapterId,
  onUpdateDossier,
  onAddLexiconTerm,
  onAddCitation,
  onOpenPresentation,
  theme
}) => {
  const [copiedFull, setCopiedFull] = useState(false);
  const [isImageExportModalOpen, setIsImageExportModalOpen] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  // Dossier Header Editable States
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(dossier.title || '');

  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [subtitleDraft, setSubtitleDraft] = useState(dossier.subtitle || '');

  const [isEditingAbstract, setIsEditingAbstract] = useState(false);
  const [abstractDraft, setAbstractDraft] = useState(dossier.abstract || '');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setTitleDraft(dossier.title || '');
    setSubtitleDraft(dossier.subtitle || '');
    setAbstractDraft(dossier.abstract || '');
  }, [dossier.id, dossier.title, dossier.subtitle, dossier.abstract]);

  const showSaveNotice = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();

  const handleStartEditTitle = () => {
    requirePermission('compose_article', () => {
      setIsEditingTitle(true);
    }, {
      title: 'Khóa Chỉnh Sửa Tiêu Đề Hồ Sơ',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa tiêu đề đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa tiêu đề hồ sơ.'
    });
  };

  const handleStartEditSubtitle = () => {
    requirePermission('compose_article', () => {
      setIsEditingSubtitle(true);
    }, {
      title: 'Khóa Chỉnh Sửa Tiêu Đề Phụ',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa tiêu đề phụ đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa tiêu đề phụ.'
    });
  };

  const handleStartEditAbstract = () => {
    requirePermission('compose_article', () => {
      setIsEditingAbstract(true);
    }, {
      title: 'Khóa Chỉnh Sửa Tóm Tắt (Abstract)',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa tóm tắt đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa tóm tắt nghiên cứu.'
    });
  };

  const handleSaveTitle = async () => {
    requirePermission('compose_article', async () => {
      if (!titleDraft.trim()) return;
      const newTitle = titleDraft.trim();
      setIsEditingTitle(false);

      let updatedMarkdown = dossier.contentMarkdown || '';
      if (updatedMarkdown.startsWith('# ')) {
        const firstLineEnd = updatedMarkdown.indexOf('\n');
        if (firstLineEnd !== -1) {
          updatedMarkdown = `# ${newTitle}` + updatedMarkdown.substring(firstLineEnd);
        } else {
          updatedMarkdown = `# ${newTitle}`;
        }
      }

      const updated: Dossier = {
        ...dossier,
        title: newTitle,
        contentMarkdown: updatedMarkdown,
        lastModified: new Date().toISOString()
      };
      await onUpdateDossier(updated);
      showSaveNotice('Đã lưu tiêu đề hồ sơ!');
    });
  };

  const handleSaveSubtitle = async () => {
    requirePermission('compose_article', async () => {
      const newSub = subtitleDraft.trim();
      setIsEditingSubtitle(false);
      const updated: Dossier = {
        ...dossier,
        subtitle: newSub,
        lastModified: new Date().toISOString()
      };
      await onUpdateDossier(updated);
      showSaveNotice('Đã lưu tiêu đề phụ hồ sơ!');
    });
  };

  const handleSaveAbstract = async () => {
    requirePermission('compose_article', async () => {
      const newAbs = abstractDraft.trim();
      setIsEditingAbstract(false);
      const updated: Dossier = {
        ...dossier,
        abstract: newAbs,
        lastModified: new Date().toISOString()
      };
      await onUpdateDossier(updated);
      showSaveNotice('Đã lưu tóm tắt Abstract!');
    });
  };

  const [isFixingAbstract, setIsFixingAbstract] = useState(false);

  const isAbstractDuplicatedWithSubtitle = useMemo(() => {
    if (!dossier.abstract || !dossier.subtitle) return false;
    const absClean = dossier.abstract.trim().toLowerCase().replace(/\s+/g, ' ');
    const subClean = dossier.subtitle.trim().toLowerCase().replace(/\s+/g, ' ');
    return absClean === subClean || (absClean.length > 15 && subClean.length > 15 && (absClean.includes(subClean) || subClean.includes(absClean)));
  }, [dossier.abstract, dossier.subtitle]);

  const handleAutoFixAbstract = async () => {
    requirePermission('compose_article', async () => {
      setIsFixingAbstract(true);
      try {
        const res = await safeFetchAIJson('/api/gemini/fix-abstract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dossierId: dossier.id,
            title: dossier.title,
            subtitle: dossier.subtitle,
            currentAbstract: dossier.abstract,
            projectStructure: dossier.projectStructure
          })
        });

        let newAbstract = '';
        if (res.ok && res.data?.success && res.data?.abstract) {
          newAbstract = res.data.abstract;
        } else {
          const pillarsList = (dossier.projectStructure || []).map((p, idx) => `Trụ cột ${idx + 1}: ${p.title}`).join(', ');
          newAbstract = `Khảo luận "${dossier.title}" đi sâu phân tích bài toán bối cảnh cốt lõi và phương pháp luận vận hành thực chiến. Công trình được hệ thống hóa mạch lạc qua 6 Trụ cột Động (${pillarsList || 'Bản thể, Cơ chế, Kiến trúc, Biện chứng, Tĩnh tâm và Đất trời'}), giúp chuyển hóa tri thức lý thuyết thành bộ giải pháp khả thi, gãy gọn và ứng dụng được ngay vào thực tế công việc.`;
        }

        setAbstractDraft(newAbstract);
        const updated: Dossier = {
          ...dossier,
          abstract: newAbstract,
          lastModified: new Date().toISOString()
        };
        await onUpdateDossier(updated);
        setIsEditingAbstract(false);
        showSaveNotice('Đã tự động tổng hợp & tạo Abstract mới độc lập bằng AI!');
      } catch (err) {
        console.error('Error fixing abstract:', err);
      } finally {
        setIsFixingAbstract(false);
      }
    }, {
      title: 'Khóa Tự Động Sửa Abstract',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa tóm tắt đang bị khóa toàn hệ thống. Chỉ tài khoản Owner mới có quyền mở khóa.'
        : 'Vui lòng đăng nhập tài khoản có quyền để tự động sửa Abstract.'
    });
  };

  const pillars = useMemo(() => {
    return dossier.projectStructure || [];
  }, [dossier.projectStructure]);

  const totals = useMemo(() => {
    let totalWords = 0;
    pillars.forEach(p => {
      p.chapters?.forEach(c => {
        if (c.contentMarkdown) {
          totalWords += c.contentMarkdown.split(/\s+/).filter(Boolean).length;
        }
      });
    });
    const minutes = Math.max(1, Math.ceil(totalWords / 180));
    return { totalWords, minutes };
  }, [pillars]);

  // Smooth scroll to active pillar or chapter when changed from Sidebar
  useEffect(() => {
    if (activePillarId) {
      const el = document.getElementById(`pillar-card-${activePillarId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activePillarId, activeChapterId]);

  // Handle updating chapters for a specific pillar
  const handleUpdatePillarChapters = async (pillarId: string, updatedChapters: Chapter[]) => {
    const updatedPillars = pillars.map(p => {
      if (p.id === pillarId) {
        return { ...p, chapters: updatedChapters };
      }
      return p;
    });

    const updatedDossier: Dossier = {
      ...dossier,
      projectStructure: updatedPillars,
      lastModified: new Date().toISOString()
    };

    await onUpdateDossier(updatedDossier);
  };

  // Copy Entire Dossier Markdown (NotebookLM format)
  const handleCopyFullDossier = async () => {
    let markdown = `# ${dossier.title}\n\n`;
    if (dossier.subtitle) markdown += `> ${dossier.subtitle}\n\n`;
    if (dossier.abstract) markdown += `## TÓM TẮT KHẢO LUẬN\n${dossier.abstract}\n\n`;

    pillars.forEach((p, idx) => {
      const pTheme = getPillarThemeInfo(p.title, idx);
      markdown += `\n---\n\n# ${pTheme.badge}: ${p.title}\n\n`;
      p.chapters?.forEach((c, cIdx) => {
        const cTitle = formatChapterTitle(idx, cIdx, c.title);
        if (c.contentMarkdown) {
          markdown += `## ${cTitle}\n\n${c.contentMarkdown}\n\n`;
        }
      });
    });

    await navigator.clipboard.writeText(markdown);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2500);
  };

  // Export full Dossier Markdown file
  const handleDownloadNotebookLMMarkdown = () => {
    let markdown = `# ${dossier.title}\n\n`;
    if (dossier.subtitle) markdown += `> ${dossier.subtitle}\n\n`;
    if (dossier.abstract) markdown += `## TÓM TẮT KHẢO LUẬN (ABSTRACT)\n${dossier.abstract}\n\n`;

    pillars.forEach((p, idx) => {
      const pTheme = getPillarThemeInfo(p.title, idx);
      markdown += `\n---\n\n# ${pTheme.badge}: ${p.title}\n\n`;
      p.chapters?.forEach((c, cIdx) => {
        const cTitle = formatChapterTitle(idx, cIdx, c.title);
        if (c.contentMarkdown) {
          markdown += `## ${cTitle}\n\n${c.contentMarkdown}\n\n`;
        }
      });
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dossier.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notebooklm_dossier.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id={`dossier-full-view-${dossier.id}`}
      className="flex-1 w-full overflow-y-auto px-4 md:px-8 lg:px-10 py-6 max-w-5xl xl:max-w-6xl mx-auto space-y-8 select-text"
    >
      {/* 1. THẺ TIÊU ĐỀ HỒ SƠ & MIÊU TẢ TỔNG QUAN */}
      <header
        id={`dossier-header-card-${dossier.id}`}
        className={`rounded-3xl p-6 md:p-8 border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-[#0b0a14] border-purple-500/30 shadow-2xl shadow-purple-950/20'
            : 'bg-gradient-to-b from-white via-slate-50 to-purple-50/30 border-purple-200 shadow-md'
        }`}
      >
        <div className="space-y-4">
          {/* Top Dossier Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold tracking-wider uppercase text-[10px] shadow-xs">
                HỒ SƠ #{String(dossier.chapterNumber || 1).padStart(2, '0')} • CHUYÊN SÂU
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{totals.minutes} phút đọc toàn bộ</span>
              </span>
              <span>•</span>
              <span>{totals.totalWords.toLocaleString()} từ (6 Trụ cột)</span>
            </div>
          </div>

          {/* Instant Save Success Notification */}
          {saveSuccessMsg && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* System Lock Badge Notification if Active */}
          {isContentEditLocked && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono border bg-amber-500/10 border-amber-500/30 text-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isOwner
                  ? 'Khóa biên soạn toàn hệ thống đang BẬT. (Bạn là Owner nên được phép sửa).'
                  : 'Khóa biên soạn toàn hệ thống: Chỉ xem. Mở khóa trong Cài đặt bởi Owner.'}
              </span>
            </div>
          )}

          {/* Dossier Main Title (with Inline Edit) */}
          <div className="group/title relative">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitleDraft(dossier.title || '');
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  placeholder="Nhập tiêu đề hồ sơ..."
                  className={`flex-1 text-xl md:text-2xl font-display-title font-extrabold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    theme === 'dark'
                      ? 'bg-black/50 border-purple-500/50 text-slate-100'
                      : 'bg-white border-purple-300 text-slate-900 shadow-xs'
                  }`}
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors shadow-xs"
                  title="Lưu tiêu đề"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTitleDraft(dossier.title || '');
                    setIsEditingTitle(false);
                  }}
                  className={`p-2 rounded-xl cursor-pointer transition-colors ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                  title="Hủy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-3xl font-display-title font-extrabold text-slate-100 dark:text-slate-100 text-slate-900 tracking-tight leading-snug">
                  {dossier.title}
                </h1>
                <button
                  onClick={handleStartEditTitle}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    !canEditContent
                      ? 'opacity-80 hover:opacity-100 text-amber-400 hover:bg-amber-500/20'
                      : 'opacity-70 hover:opacity-100 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200'
                  }`}
                  title={!canEditContent ? 'Tính năng sửa tiêu đề đang bị khóa (Bấm để xem quyền)' : 'Sửa tiêu đề hồ sơ'}
                >
                  {!canEditContent ? <Lock className="w-4 h-4 text-amber-400" /> : <Edit3 className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Dossier Subtitle (with Inline Edit) */}
          <div className="group/subtitle relative">
            {isEditingSubtitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subtitleDraft}
                  onChange={e => setSubtitleDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveSubtitle();
                    if (e.key === 'Escape') {
                      setSubtitleDraft(dossier.subtitle || '');
                      setIsEditingSubtitle(false);
                    }
                  }}
                  placeholder="Nhập tiêu đề phụ hồ sơ..."
                  autoFocus
                  className={`flex-1 text-sm md:text-base font-sans px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    theme === 'dark'
                      ? 'bg-black/50 border-purple-500/50 text-purple-200'
                      : 'bg-white border-purple-300 text-purple-900 shadow-xs'
                  }`}
                />
                <button
                  onClick={handleSaveSubtitle}
                  className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors shadow-xs"
                  title="Lưu tiêu đề phụ"
                >
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setSubtitleDraft(dossier.subtitle || '');
                    setIsEditingSubtitle(false);
                  }}
                  className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                  title="Hủy"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm md:text-base font-sans font-medium leading-relaxed ${
                  theme === 'dark' ? 'text-purple-300/90' : 'text-purple-900'
                }`}>
                  {dossier.subtitle || <span className="italic text-slate-500 text-xs">Chưa có tiêu đề phụ (bấm nút sửa để thêm)</span>}
                </p>
                <button
                  onClick={handleStartEditSubtitle}
                  className={`p-1 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                    !canEditContent
                      ? 'opacity-80 hover:opacity-100 text-amber-400 hover:bg-amber-500/20'
                      : 'opacity-70 hover:opacity-100 text-purple-300 hover:bg-purple-500/20'
                  }`}
                  title={!canEditContent ? 'Tính năng sửa tiêu đề phụ đang bị khóa' : 'Sửa tiêu đề phụ'}
                >
                  {!canEditContent ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Edit3 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Abstract / Miêu tả nghiên cứu (with Inline Edit & AI Auto-Fix) */}
          <div className={`p-4 sm:p-5 rounded-2xl border text-xs md:text-sm font-sans leading-relaxed transition-all ${
            theme === 'dark'
              ? 'bg-black/30 border-slate-800/80 text-slate-300'
              : 'bg-purple-50/40 border-purple-200 text-slate-800 shadow-xs'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-800'
                }`}>
                  // TÓM TẮT KHẢO LUẬN (ABSTRACT)
                </div>
                {isAbstractDuplicatedWithSubtitle && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Trùng với Tiêu đề phụ</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoFixAbstract}
                  disabled={isFixingAbstract}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs shadow-purple-600/30 active:scale-95 disabled:opacity-50"
                  title="AI tự động phân tích 6 Trụ cột và tổng hợp đoạn Abstract độc lập, không bị trùng lặp với Tiêu đề phụ"
                >
                  {isFixingAbstract ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                      <span>ĐANG TỔNG HỢP AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>TỰ ĐỘNG SỬA ABSTRACT (AI)</span>
                    </>
                  )}
                </button>

                {!isEditingAbstract && (
                  <button
                    onClick={handleStartEditAbstract}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer border ${
                      !canEditContent
                        ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : theme === 'dark'
                        ? 'bg-purple-900/30 hover:bg-purple-800/50 text-purple-300 border-purple-500/20'
                        : 'bg-white hover:bg-purple-100 text-purple-800 border-purple-300 shadow-xs'
                    }`}
                    title={!canEditContent ? 'Tính năng sửa tóm tắt đang bị khóa' : 'Sửa tóm tắt Abstract thủ công'}
                  >
                    {!canEditContent ? <Lock className="w-3 h-3 text-amber-400" /> : <Edit3 className="w-3 h-3" />}
                    <span>Sửa Thủ Công</span>
                  </button>
                )}
              </div>
            </div>

            {/* Warning banner if duplicated */}
            {isAbstractDuplicatedWithSubtitle && !isEditingAbstract && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Nội dung Tóm tắt khảo luận đang bị trùng lặp hoàn toàn với Tiêu đề phụ!</span>
                </div>
                <button
                  onClick={handleAutoFixAbstract}
                  disabled={isFixingAbstract}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Sửa Ngay Bằng AI</span>
                </button>
              </div>
            )}

            {isEditingAbstract ? (
              <div className="space-y-2 mt-2">
                <textarea
                  value={abstractDraft}
                  onChange={e => setAbstractDraft(e.target.value)}
                  rows={4}
                  placeholder="Nhập nội dung tóm tắt nghiên cứu (Abstract)..."
                  autoFocus
                  className={`w-full text-xs md:text-sm font-sans p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed ${
                    theme === 'dark'
                      ? 'bg-black/50 border-purple-500/50 text-slate-200'
                      : 'bg-white border-purple-300 text-slate-900 shadow-xs'
                  }`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleAutoFixAbstract}
                    disabled={isFixingAbstract}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isFixingAbstract ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                    <span>AI Tạo Dự Thảo Abstract Mới</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAbstractDraft(dossier.abstract || '');
                        setIsEditingAbstract(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer ${
                        theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Hủy</span>
                    </button>
                    <button
                      onClick={handleSaveAbstract}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Abstract</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {dossier.abstract ? (
                  dossier.abstract
                ) : (
                  <span className="italic text-slate-500 text-xs">Chưa có tóm tắt nghiên cứu (Abstract). Bấm "TỰ ĐỘNG SỬA ABSTRACT (AI)" để tạo ngay.</span>
                )}
              </div>
            )}
          </div>

          {/* Tags & Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {dossier.tags?.map((t, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
                    theme === 'dark'
                      ? 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                      : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}
                >
                  #{t}
                </span>
              ))}
              {dossier.interdisciplinaryFields?.slice(0, 4).map((f, idx) => (
                <span
                  key={`f-${idx}`}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
                    theme === 'dark'
                      ? 'bg-purple-900/30 text-purple-300 border-purple-500/20'
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                  }`}
                >
                  ◆ {f}
                </span>
              ))}
            </div>

            {/* Quick Export & Presentation Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  if (onOpenPresentation) {
                    onOpenPresentation(dossier.id);
                  } else {
                    setIsPresentationOpen(true);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-purple-600/20"
                title="Mở Chế Độ Trình Chiếu Báo Cáo Độc Bản (Toàn màn hình / Vuốt ngang/dọc / Chia sẻ Link)"
              >
                <Monitor className="w-3.5 h-3.5 text-amber-300" />
                <span>Trình Chiếu Báo Cáo</span>
              </button>

              <button
                onClick={() => setIsImageExportModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 border-purple-500/30'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
                }`}
                title="Xuất file PDF A4 toàn bộ báo cáo hoặc bộ Thẻ Ảnh độc bản (loại bỏ mọi nút tính năng)"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Xuất PDF / PNG</span>
              </button>

              <button
                onClick={handleCopyFullDossier}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                }`}
                title="Sao chép toàn bộ 6 Trụ cột định dạng Markdown"
              >
                {copiedFull ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 font-bold">Đã chép toàn bộ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-500" />
                    <span>Chép Toàn Bộ Hồ Sơ</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadNotebookLMMarkdown}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                title="Xuất file Markdown tương thích Google NotebookLM"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Xuất NotebookLM</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. 6 THẺ TRỤ CỘT ĐỘNG (MẶC ĐỊNH LUÔN THU GỌN - NGƯỜI DÙNG BẤM NÚT MỞ RỘNG ĐỂ ĐỌC VÀ SOẠN TỪNG CHƯƠNG) */}
      <div className="space-y-6">
        {pillars.map((pillar, pIdx) => (
          <SinglePillarCard
            key={pillar.id}
            dossier={dossier}
            pillar={pillar}
            pillarIndex={pIdx}
            isActive={pillar.id === activePillarId}
            theme={theme}
            onUpdatePillarChapters={handleUpdatePillarChapters}
            onAddLexiconTerm={onAddLexiconTerm}
            onAddCitation={onAddCitation}
          />
        ))}
      </div>

      {/* EXPORT REPORT IMAGE MODAL */}
      <ExportReportImageModal
        isOpen={isImageExportModalOpen}
        onClose={() => setIsImageExportModalOpen(false)}
        dossier={dossier}
        initialChapterId={activeChapterId}
        theme={theme}
      />

      {/* FULLSCREEN PRESENTATION VIEWER */}
      {isPresentationOpen && (
        <ReportPresentationViewer
          dossier={dossier}
          initialChapterId={activeChapterId}
          theme={theme}
          onClose={() => setIsPresentationOpen(false)}
        />
      )}
    </div>
  );
};
