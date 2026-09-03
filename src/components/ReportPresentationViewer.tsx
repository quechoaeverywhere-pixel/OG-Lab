import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Maximize2, Minimize2, Share2, Check, 
  Sun, Moon, FileText, Sparkles, Compass, Zap, Code, ShieldAlert, Quote, 
  Globe, Clock, Layers, Monitor, Smartphone, ArrowLeft
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Dossier, DynamicPillar, Chapter } from '../types';
import { ensureDossierPillarStructure, formatChapterTitle } from '../utils/pillarParser';
import { getPillarThemeInfo } from './AtomicChapterReader';
import { normalizeMarkdownTables } from '../utils/markdownSanitizer';

interface ReportPresentationViewerProps {
  dossier: Dossier;
  initialChapterId?: string | null;
  onClose?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme?: () => void;
  isStandalonePage?: boolean;
}

export interface PresentationSlide {
  id: string;
  type: 'cover' | 'pillar_intro' | 'chapter_section';
  pillarTitle?: string;
  pillarIndex?: number;
  chapterTitle?: string;
  chapterIndex?: number;
  sectionTitle?: string;
  tierNumber?: string;
  tierName?: string;
  icon?: any;
  color?: string;
  contentMarkdown?: string;
  globalIndex: number;
}

export const ReportPresentationViewer: React.FC<ReportPresentationViewerProps> = ({
  dossier,
  initialChapterId,
  onClose,
  theme: initialTheme,
  onToggleTheme,
  isStandalonePage = false
}) => {
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(initialTheme);
  const [viewMode, setViewMode] = useState<'slide' | 'scroll'>('slide');
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const touchStartXRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const structuredDossier = useMemo(() => ensureDossierPillarStructure(dossier), [dossier]);
  const pillars = structuredDossier.projectStructure || [];

  // Compute stats
  const stats = useMemo(() => {
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

  // Decompose Dossier into flat presentation slides
  const slides = useMemo<PresentationSlide[]>(() => {
    const list: PresentationSlide[] = [];
    let globalIndex = 0;

    // Slide 0: COVER SLIDE
    list.push({
      id: 'slide-cover',
      type: 'cover',
      globalIndex: globalIndex++
    });

    pillars.forEach((pillar, pIdx) => {
      pillar.chapters?.forEach((chapter, cIdx) => {
        const md = chapter.contentMarkdown || '';
        const rawSections = md.split(/^##\s+/m).filter(Boolean);

        if (rawSections.length === 0) {
          list.push({
            id: `slide-ch-${chapter.id}-0`,
            type: 'chapter_section',
            pillarTitle: pillar.title,
            pillarIndex: pIdx,
            chapterTitle: chapter.title,
            chapterIndex: cIdx,
            sectionTitle: 'Nội Dung Khảo Luận',
            tierNumber: 'TẦNG I',
            tierName: 'Bản Thể Luận',
            icon: Compass,
            color: 'text-purple-400',
            contentMarkdown: md,
            globalIndex: globalIndex++
          });
        } else {
          rawSections.forEach((secBlock, secIdx) => {
            const firstLineEnd = secBlock.indexOf('\n');
            let secTitle = 'Tổng Quan Khảo Luận';
            let secContent = secBlock;

            if (firstLineEnd !== -1) {
              secTitle = secBlock.substring(0, firstLineEnd).trim();
              secContent = secBlock.substring(firstLineEnd + 1).trim();
            } else {
              secTitle = secBlock.trim();
              secContent = '';
            }

            const { tierName, tierNumber, icon, color } = parseSectionMetadata(secTitle, secIdx + 1);

            // Decompose sub-sections if secContent contains ### subheadings
            const subBlocks = secContent ? secContent.split(/^###\s+/m) : [];

            if (subBlocks.length > 1) {
              const introContent = subBlocks[0].trim();
              if (introContent) {
                list.push({
                  id: `slide-ch-${chapter.id}-${secIdx}-0`,
                  type: 'chapter_section',
                  pillarTitle: pillar.title,
                  pillarIndex: pIdx,
                  chapterTitle: chapter.title,
                  chapterIndex: cIdx,
                  sectionTitle: secTitle,
                  tierNumber,
                  tierName,
                  icon,
                  color,
                  contentMarkdown: introContent,
                  globalIndex: globalIndex++
                });
              }

              for (let subIdx = 1; subIdx < subBlocks.length; subIdx++) {
                const subBlock = subBlocks[subIdx];
                const subFirstLineEnd = subBlock.indexOf('\n');
                let subTitle = '';
                let subContent = subBlock;

                if (subFirstLineEnd !== -1) {
                  subTitle = subBlock.substring(0, subFirstLineEnd).trim();
                  subContent = subBlock.substring(subFirstLineEnd + 1).trim();
                } else {
                  subTitle = subBlock.trim();
                  subContent = '';
                }

                list.push({
                  id: `slide-ch-${chapter.id}-${secIdx}-${subIdx}`,
                  type: 'chapter_section',
                  pillarTitle: pillar.title,
                  pillarIndex: pIdx,
                  chapterTitle: chapter.title,
                  chapterIndex: cIdx,
                  sectionTitle: subTitle ? `${secTitle} • ${subTitle}` : secTitle,
                  tierNumber,
                  tierName,
                  icon,
                  color,
                  contentMarkdown: subContent,
                  globalIndex: globalIndex++
                });
              }
            } else {
              list.push({
                id: `slide-ch-${chapter.id}-${secIdx}`,
                type: 'chapter_section',
                pillarTitle: pillar.title,
                pillarIndex: pIdx,
                chapterTitle: chapter.title,
                chapterIndex: cIdx,
                sectionTitle: secTitle,
                tierNumber,
                tierName,
                icon,
                color,
                contentMarkdown: secContent,
                globalIndex: globalIndex++
              });
            }
          });
        }
      });
    });

    return list;
  }, [pillars]);

  // Find initial slide index if initialChapterId provided
  useEffect(() => {
    if (initialChapterId) {
      const idx = slides.findIndex(s => s.id.includes(`slide-ch-${initialChapterId}`));
      if (idx >= 0) setCurrentSlideIndex(idx);
    }
  }, [initialChapterId, slides]);

  // Controls auto-fade timer
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentSlideIndex(slides.length - 1);
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, isFullscreen, onClose]);

  // Touch Swipe Handler
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe left -> Next slide
        setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));
      } else {
        // Swipe right -> Prev slide
        setCurrentSlideIndex(prev => Math.max(0, prev - 1));
      }
    }
    touchStartXRef.current = null;
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  // Copy shareable presentation link
  const handleCopyShareLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('present', dossier.id);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col select-none transition-colors duration-300 overflow-hidden ${
        currentTheme === 'dark' ? 'bg-[#070a12] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* FLOATING TOP CONTROL BAR (HOVER / MOBILE ACCESS) */}
      <div className={`absolute top-0 left-0 right-0 z-50 p-3 md:p-4 flex items-center justify-between transition-opacity duration-300 bg-gradient-to-b ${
        currentTheme === 'dark' ? 'from-black/80 via-black/40 to-transparent text-white' : 'from-white/90 via-white/50 to-transparent text-slate-900'
      } ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        {/* Left: Back / Title */}
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer backdrop-blur-md"
              title="Thoát chế độ trình chiếu"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-purple-400 uppercase font-bold tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>ONENESS GOVERNANCE • CHẾ ĐỘ TRÌNH CHIẾU ĐỘC BẢN</span>
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-bold font-serif-reading truncate max-w-xs sm:max-w-md md:max-w-lg">
                {dossier.title}
              </h1>
              {viewMode === 'slide' && (
                <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-[11px] font-bold shrink-0">
                  {currentSlideIndex + 1} / {slides.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Mode Switcher: Slide vs Scroll Stream */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-md">
            <button
              onClick={() => setViewMode('slide')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'slide' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Dạng Slide</span>
            </button>
            <button
              onClick={() => setViewMode('scroll')}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'scroll' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Cuộn Đọc</span>
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => {
              const next = currentTheme === 'dark' ? 'light' : 'dark';
              setCurrentTheme(next);
              if (onToggleTheme) onToggleTheme();
            }}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer backdrop-blur-md"
            title="Đổi màu nền tối / sáng"
          >
            {currentTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-600" />}
          </button>

          {/* Share Link Button */}
          <button
            onClick={handleCopyShareLink}
            className={`px-3 py-1.5 rounded-2xl font-bold flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md shadow-md ${
              copiedLink
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200'
            }`}
            title="Sao chép link chia sẻ trình chiếu trực tiếp"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4 text-purple-300" />}
            <span className="hidden sm:inline">{copiedLink ? 'ĐÃ SAO CHÉP LINK!' : 'CHIA SẺ LINK'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer backdrop-blur-md"
            title="Chế độ Toàn Màn Hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: SLIDE BY SLIDE PRESENTATION */}
      {viewMode === 'slide' ? (
        <div className="flex-1 flex flex-col items-center justify-center relative pt-16 sm:pt-20 pb-8 px-4 sm:px-12 md:px-16 overflow-y-auto w-full">
          {/* Progress Bar Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800/50 z-10">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-purple-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
            />
          </div>

          {/* ACTIVE SLIDE FRAME */}
          <div className="w-full max-w-4xl my-auto">
            <RenderSingleSlideContent
              slide={currentSlide}
              dossier={dossier}
              stats={stats}
              currentTheme={currentTheme}
            />
          </div>

          {/* NAVIGATION ARROWS (DESKTOP & TOUCH) */}
          <button
            onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
            disabled={currentSlideIndex === 0}
            className={`fixed left-2 md:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 md:p-4 rounded-full border transition-all cursor-pointer z-40 backdrop-blur-md ${
              currentSlideIndex === 0
                ? 'opacity-20 pointer-events-none border-slate-700 bg-slate-900/30 text-slate-500'
                : 'bg-purple-950/60 hover:bg-purple-600 border-purple-500/40 text-purple-200 shadow-xl hover:scale-110'
            }`}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>

          <button
            onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className={`fixed right-2 md:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3.5 md:p-4 rounded-full border transition-all cursor-pointer z-40 backdrop-blur-md ${
              currentSlideIndex === slides.length - 1
                ? 'opacity-20 pointer-events-none border-slate-700 bg-slate-900/30 text-slate-500'
                : 'bg-purple-950/60 hover:bg-purple-600 border-purple-500/40 text-purple-200 shadow-xl hover:scale-110'
            }`}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          </button>
        </div>
      ) : (
        /* VIEW MODE 2: CONTINUOUS SCROLL STREAM (PURE REPORT FRAME FOR MOBILE & PC) */
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 flex flex-col items-center space-y-8 pt-20">
          {slides.map((s) => (
            <div key={s.id} className="w-full max-w-4xl">
              <RenderSingleSlideContent
                slide={s}
                dossier={dossier}
                stats={stats}
                currentTheme={currentTheme}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// HELPER: PARSE SECTION METADATA
function parseSectionMetadata(title: string, index: number) {
  const lower = title.toLowerCase();
  let tierName = 'Bản Thể Luận';
  let icon = Compass;
  let color = 'text-purple-400';

  if (lower.includes('cơ chế') || lower.includes('động lực') || lower.includes('toán học')) {
    tierName = 'Động Lực Học Cơ Chế';
    icon = Zap;
    color = 'text-cyan-400';
  } else if (lower.includes('kỹ nghệ') || lower.includes('mã nguồn') || lower.includes('kiến trúc') || lower.includes('hệ phân tán')) {
    tierName = 'Ánh Xạ Kỹ Nghệ & Code';
    icon = Code;
    color = 'text-emerald-400';
  } else if (lower.includes('phản biện') || lower.includes('nghịch lý') || lower.includes('rủi ro') || lower.includes('failure')) {
    tierName = 'Phản Biện Biện Chứng';
    icon = ShieldAlert;
    color = 'text-rose-400';
  } else if (lower.includes('trích dẫn') || lower.includes('kinh điển') || lower.includes('tác giả')) {
    tierName = 'Khảo Cứu Trích Dẫn';
    icon = Quote;
    color = 'text-amber-400';
  } else if (lower.includes('kết luận') || lower.includes('đất trời') || lower.includes('tiến hoá') || lower.includes('tĩnh tâm')) {
    tierName = 'Minh Triết Đất Trời';
    icon = Globe;
    color = 'text-teal-400';
  }

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return {
    tierName,
    tierNumber: `TẦNG ${roman[index - 1] || index}`,
    icon,
    color
  };
}

// SUBCOMPONENT: RENDER SINGLE SLIDE FRAME
interface RenderSingleSlideContentProps {
  slide: PresentationSlide;
  dossier: Dossier;
  stats: { totalWords: number; minutes: number };
  currentTheme: 'dark' | 'light';
}

const RenderSingleSlideContent: React.FC<RenderSingleSlideContentProps> = ({
  slide,
  dossier,
  stats,
  currentTheme
}) => {
  if (slide.type === 'cover') {
    return (
      <div className={`p-6 sm:p-10 md:p-12 rounded-3xl border flex flex-col justify-between max-h-[calc(100vh-110px)] shadow-2xl transition-all overflow-hidden ${
        currentTheme === 'dark'
          ? 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-950 border-purple-500/30 text-slate-100'
          : 'bg-gradient-to-br from-purple-50 via-white to-slate-50 border-purple-200 text-slate-900'
      }`}>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2 my-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-xs font-bold uppercase tracking-widest shadow-md">
              HỒ SƠ #{String(dossier.chapterNumber || 1).padStart(2, '0')} • TRÌNH CHIẾU KHẢO LUẬN
            </span>
            <div className={`flex items-center gap-2 font-mono text-xs ${currentTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>{stats.minutes} phút đọc toàn văn</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold font-serif-reading leading-tight ${
              currentTheme === 'dark' ? 'text-purple-100' : 'text-purple-950'
            }`}>
              {dossier.title}
            </h1>
            {dossier.subtitle && (
              <p className={`text-base sm:text-lg font-sans leading-relaxed ${
                currentTheme === 'dark' ? 'text-purple-300/90' : 'text-purple-800'
              }`}>
                {dossier.subtitle}
              </p>
            )}
          </div>

          {dossier.abstract && (
            <div className={`p-5 rounded-2xl border text-xs sm:text-sm font-sans leading-relaxed ${
              currentTheme === 'dark'
                ? 'bg-slate-900/90 border-purple-500/20 text-slate-300'
                : 'bg-white border-purple-100 text-slate-700 shadow-sm'
            }`}>
              <div className="font-mono font-bold text-[10px] uppercase tracking-widest text-purple-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>TÓM TẮT KHẢO LUẬN (ABSTRACT)</span>
              </div>
              {dossier.abstract}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className={`shrink-0 pt-4 border-t flex flex-wrap items-center justify-between gap-4 font-mono text-xs ${
          currentTheme === 'dark' ? 'border-purple-500/20 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-bold text-purple-400">ONENESS GOVERNANCE LAB</span>
          </div>
          <div className="text-[11px] opacity-80">
            {stats.totalWords.toLocaleString()} TỪ (6 TRỤ CỘT ĐỘNG)
          </div>
        </div>
      </div>
    );
  }

  // CHAPTER SECTION SLIDE
  const SlideIcon = slide.icon || Compass;
  const pillarTheme = slide.pillarTitle ? getPillarThemeInfo(slide.pillarTitle, slide.pillarIndex || 0, currentTheme) : null;
  const chapterTitleFormatted = slide.chapterTitle
    ? formatChapterTitle(slide.pillarIndex || 0, slide.chapterIndex || 0, slide.chapterTitle)
    : '';

  return (
    <div className={`p-5 sm:p-8 md:p-10 rounded-3xl border flex flex-col justify-between max-h-[calc(100vh-110px)] shadow-2xl transition-all overflow-hidden ${
      currentTheme === 'dark'
        ? 'bg-slate-900/80 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* FIXED HEADER */}
      <div className="shrink-0 space-y-3 pb-3 border-b border-purple-500/20">
        {/* Pillar Header Badge if applicable */}
        {slide.pillarTitle && pillarTheme && (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`px-2.5 py-0.5 rounded font-bold uppercase tracking-wider border ${pillarTheme.badgeClass}`}>
              {pillarTheme.badge}
            </span>
            <span className="font-bold opacity-80 truncate">{slide.pillarTitle}</span>
          </div>
        )}

        {/* Chapter Title & Section Badge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between font-mono text-xs gap-2">
            <span className="text-purple-400 font-bold truncate">
              {chapterTitleFormatted}
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold text-[10px] shrink-0">
              {slide.tierNumber} • {slide.tierName}
            </span>
          </div>
          <h2 className={`text-lg sm:text-2xl font-bold font-serif-reading leading-tight ${
            currentTheme === 'dark' ? 'text-purple-200' : 'text-slate-900'
          }`}>
            {slide.sectionTitle}
          </h2>
        </div>
      </div>

      {/* FLEXIBLE INNER SCROLLABLE BODY */}
      <div className={`flex-1 min-h-0 overflow-y-auto my-3 pr-2 prose max-w-none text-xs sm:text-sm md:text-base leading-relaxed font-sans space-y-3 ${
        currentTheme === 'dark' ? 'prose-invert prose-purple text-slate-200' : 'prose-slate text-slate-800'
      }`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            table: ({ node, ...props }) => (
              <div className={`w-full my-3 overflow-x-auto rounded-2xl border shadow-sm ${
                currentTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="min-w-[480px] p-2">
                  <table className="w-full text-left border-collapse table-auto" {...props} />
                </div>
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className={`border-b ${
                currentTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-purple-300' : 'bg-slate-100 border-slate-200 text-purple-950 font-bold'
              }`} {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="py-2 px-3 font-bold text-xs tracking-wide border-r last:border-r-0 border-slate-700/50" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="py-2 px-3 align-top font-sans text-xs border-r last:border-r-0 border-slate-700/50" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className={`pl-4 border-l-3 my-2 italic font-serif text-xs sm:text-sm ${
                currentTheme === 'dark' ? 'border-purple-500 text-purple-200/90 bg-purple-950/20 p-3 rounded-r-xl' : 'border-purple-600 text-purple-950 bg-purple-50 p-3 rounded-r-xl'
              }`} {...props} />
            ),
            code: ({ node, inline, ...props }: any) => (
              inline ? (
                <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                  currentTheme === 'dark' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-100 text-cyan-900 border border-slate-200'
                }`} {...props} />
              ) : (
                <code className={`block p-4 rounded-2xl text-xs font-mono overflow-x-auto my-3 ${
                  currentTheme === 'dark' ? 'bg-slate-950 text-cyan-200 border border-slate-800' : 'bg-slate-900 text-cyan-100'
                }`} {...props} />
              )
            )
          }}
        >
          {normalizeMarkdownTables(slide.contentMarkdown || '')}
        </ReactMarkdown>
      </div>

      {/* FIXED FOOTER */}
      <div className={`shrink-0 pt-3 border-t flex items-center justify-between text-[10px] font-mono ${
        currentTheme === 'dark' ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        <div className="flex items-center gap-1.5">
          <SlideIcon className={`w-3.5 h-3.5 ${slide.color || 'text-purple-400'}`} />
          <span className="font-bold">OG INTELLIGENCE LAB</span>
          <span>•</span>
          <span>SLIDE {slide.globalIndex + 1}</span>
        </div>
        <div>https://oneness-governance.org</div>
      </div>
    </div>
  );
};
