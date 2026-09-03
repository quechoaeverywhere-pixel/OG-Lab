import React, { useState, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  Camera, X, Download, FileText, Sparkles, Check, Loader2, 
  Layers, BookOpen, Clock, ShieldCheck, Palette, Globe, Zap, Code, Compass, ShieldAlert, Quote, Sliders
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Dossier, DynamicPillar, Chapter } from '../types';
import { formatChapterTitle, ensureDossierPillarStructure } from '../utils/pillarParser';
import { getPillarThemeInfo } from './AtomicChapterReader';
import { normalizeMarkdownTables } from '../utils/markdownSanitizer';

interface ExportReportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossier: Dossier;
  initialChapterId?: string | null;
  theme: 'dark' | 'light';
}

interface ParsedSection {
  id: string;
  tierNumber: string;
  tierName: string;
  title: string;
  icon: any;
  color: string;
  borderColor: string;
  content: string;
}

interface FlatChapterItem {
  pillar: DynamicPillar;
  pillarIndex: number;
  chapter: Chapter;
  chapterIndex: number;
  isFirstInPillar: boolean;
  isFirstOverall: boolean;
  globalIndex: number;
}

export const ExportReportImageModal: React.FC<ExportReportImageModalProps> = ({
  isOpen,
  onClose,
  dossier,
  initialChapterId,
  theme: initialTheme
}) => {
  const structuredDossier = useMemo(() => ensureDossierPillarStructure(dossier), [dossier]);
  const pillars = structuredDossier.projectStructure || [];

  // Flat list of all chapters with pillar info & first flags
  const allChapterItems = useMemo<FlatChapterItem[]>(() => {
    const list: FlatChapterItem[] = [];
    let globalIndex = 0;

    pillars.forEach((p, pIdx) => {
      p.chapters?.forEach((c, cIdx) => {
        list.push({
          pillar: p,
          pillarIndex: pIdx,
          chapter: c,
          chapterIndex: cIdx,
          isFirstInPillar: cIdx === 0,
          isFirstOverall: globalIndex === 0,
          globalIndex
        });
        globalIndex++;
      });
    });
    return list;
  }, [pillars]);

  // Selected Chapter State for preview
  const [selectedChapterId, setSelectedChapterId] = useState<string>(() => {
    if (initialChapterId) return initialChapterId;
    return allChapterItems[0]?.chapter.id || '';
  });

  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [exportTheme, setExportTheme] = useState<'dark' | 'light'>(initialTheme);
  const [fitMode, setFitMode] = useState<'auto' | 'compact' | 'normal'>('auto');
  const [customPillarHeaderToggle, setCustomPillarHeaderToggle] = useState<'smart' | 'always' | 'never'>('smart');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgressMsg, setCaptureProgressMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Compute total stats
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

  // Helper to parse chapter text into structured sections
  const parseChapterContent = (markdown?: string): ParsedSection[] => {
    if (!markdown) return [];
    const lines = markdown.split('\n');
    const sections: ParsedSection[] = [];
    let currentTitle = 'Khởi Nguyên & Đặt Vấn Đề';
    let currentContent: string[] = [];
    let secIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        if (currentContent.length > 0) {
          sections.push(buildParsedSection(secIndex, currentTitle, currentContent.join('\n')));
          secIndex++;
          currentContent = [];
        }
        currentTitle = line.replace(/^##\s+/, '').trim();
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.push(buildParsedSection(secIndex, currentTitle, currentContent.join('\n')));
    }

    return sections;
  };

  function buildParsedSection(index: number, title: string, content: string): ParsedSection {
    const lower = title.toLowerCase();
    let tierName = 'Bản Thể Luận';
    let icon = Compass;
    let color = 'text-purple-400';
    let borderColor = 'border-purple-500/30';

    if (lower.includes('cơ chế') || lower.includes('động lực') || lower.includes('toán học')) {
      tierName = 'Động Lực Học Cơ Chế';
      icon = Zap;
      color = 'text-cyan-400';
      borderColor = 'border-cyan-500/30';
    } else if (lower.includes('kỹ nghệ') || lower.includes('mã nguồn') || lower.includes('kiến trúc') || lower.includes('hệ phân tán')) {
      tierName = 'Ánh Xạ Kỹ Nghệ & Code';
      icon = Code;
      color = 'text-emerald-400';
      borderColor = 'border-emerald-500/30';
    } else if (lower.includes('phản biện') || lower.includes('nghịch lý') || lower.includes('rủi ro') || lower.includes('failure')) {
      tierName = 'Phản Biện Biện Chứng';
      icon = ShieldAlert;
      color = 'text-rose-400';
      borderColor = 'border-rose-500/30';
    } else if (lower.includes('trích dẫn') || lower.includes('kinh điển') || lower.includes('tác giả')) {
      tierName = 'Khảo Cứu Trích Dẫn';
      icon = Quote;
      color = 'text-amber-400';
      borderColor = 'border-amber-500/30';
    } else if (lower.includes('kết luận') || lower.includes('đất trời') || lower.includes('tiến hoá') || lower.includes('tĩnh tâm')) {
      tierName = 'Minh Triết Đất Trời';
      icon = Globe;
      color = 'text-teal-400';
      borderColor = 'border-teal-500/30';
    }

    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return {
      id: `sec-${index}`,
      tierNumber: `TẦNG ${romanNumerals[index - 1] || index}`,
      tierName,
      title,
      icon,
      color,
      borderColor,
      content
    };
  }

  // Generate PDF file with standard A4 pagination
  const handleExportPDF = async () => {
    if (allChapterItems.length === 0) return;
    setIsCapturing(true);
    setCaptureProgressMsg('Đang khởi tạo bản vẽ A4 PDF...');

    try {
      // Create jsPDF instance in A4 portrait (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < allChapterItems.length; i++) {
        const item = allChapterItems[i];
        setCaptureProgressMsg(`Đang render A4 Trang ${i + 1}/${allChapterItems.length}: Chương ${item.pillarIndex + 1}.${item.chapterIndex + 1}...`);

        const element = document.getElementById(`export-chapter-card-${item.globalIndex}`);
        if (!element) continue;

        // Render high-res PNG canvas
        const dataUrl = await toPng(element, {
          quality: 0.95,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: exportTheme === 'dark' ? '#070a12' : '#ffffff'
        });

        // Get element aspect height ratio
        const imgProps = pdf.getImageProperties(dataUrl);
        const imgHeightInMM = (imgProps.height * pdfWidth) / imgProps.width;

        if (i > 0) {
          pdf.addPage();
        }

        if (imgHeightInMM <= pdfHeight) {
          // Fits directly on 1 A4 page
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, imgHeightInMM);
        } else {
          // If height exceeds 1 page slightly, split or scale nicely into A4 pages
          let position = 0;
          let heightLeft = imgHeightInMM;

          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInMM);
          heightLeft -= pdfHeight;

          while (heightLeft > 5) {
            position = heightLeft - imgHeightInMM;
            pdf.addPage();
            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInMM);
            heightLeft -= pdfHeight;
          }
        }

        await new Promise(r => setTimeout(r, 60));
      }

      const safeTitle = dossier.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const pdfFileName = `${safeTitle}_BaoCao_Chuon_A4.pdf`;
      pdf.save(pdfFileName);

      setSuccessNotice(`Đã xuất thành công file PDF A4: ${pdfFileName}`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Lỗi xuất file PDF:', err);
      alert('Không thể xuất PDF. Vui lòng thử lại!');
    } finally {
      setIsCapturing(false);
    }
  };

  // Download single PNG for selected chapter
  const handleDownloadSinglePNG = async () => {
    const selectedItem = allChapterItems.find(it => it.chapter.id === selectedChapterId);
    if (!selectedItem) return;

    setIsCapturing(true);
    setCaptureProgressMsg('Đang render thẻ ảnh PNG 2x Retina...');

    try {
      const element = document.getElementById(`export-chapter-card-${selectedItem.globalIndex}`);
      if (!element) throw new Error('Element not found');

      const safeTitle = dossier.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeTitle}_chuong_${selectedItem.pillarIndex + 1}_${selectedItem.chapterIndex + 1}.png`;

      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: exportTheme === 'dark' ? '#070a12' : '#ffffff'
      });

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      setSuccessNotice(`Đã tải về thẻ ảnh: ${fileName}`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Lỗi xuất thẻ ảnh:', err);
      alert('Không thể xuất thẻ ảnh. Vui lòng thử lại!');
    } finally {
      setIsCapturing(false);
    }
  };

  // Download all PNG images sequentially
  const handleDownloadAllPNGs = async () => {
    if (allChapterItems.length === 0) return;
    setIsCapturing(true);

    try {
      for (let i = 0; i < allChapterItems.length; i++) {
        const item = allChapterItems[i];
        setCaptureProgressMsg(`Đang xuất thẻ ảnh PNG [${i + 1}/${allChapterItems.length}]: Chương ${item.pillarIndex + 1}.${item.chapterIndex + 1}...`);

        const element = document.getElementById(`export-chapter-card-${item.globalIndex}`);
        if (!element) continue;

        const safeTitle = dossier.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeTitle}_chuong_${item.pillarIndex + 1}_${item.chapterIndex + 1}.png`;

        const dataUrl = await toPng(element, {
          quality: 0.98,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: exportTheme === 'dark' ? '#070a12' : '#ffffff'
        });

        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();

        await new Promise(r => setTimeout(r, 200));
      }

      setSuccessNotice(`Đã xuất trọn bộ ${allChapterItems.length} thẻ ảnh PNG sắc nét!`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Lỗi xuất bộ thẻ ảnh:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  if (!isOpen) return null;

  // Active selected chapter for modal live preview tab
  const activePreviewItem = allChapterItems.find(item => item.chapter.id === selectedChapterId) || allChapterItems[0];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className={`w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        initialTheme === 'dark' ? 'bg-slate-900 border-purple-500/30 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-purple-500/20 flex flex-wrap items-center justify-between gap-3 bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-300">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold font-tech text-purple-200 uppercase tracking-wide flex items-center gap-2">
                <span>XUẤT BÁO CÁO A4 PDF & BỘ THẺ ẢNH ĐỘC BẢN</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">STANDALONE READ-FRAME</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Tự động xóa sạch nút bấm/banner sửa đổi. Bìa Hồ sơ & Abstract chỉ nằm ở trang đầu. Tiêu đề Trụ cột nằm ở chương đầu mỗi trụ cột.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Control Toolbar */}
        <div className="px-6 py-3 border-b border-purple-500/10 flex flex-wrap items-center justify-between gap-3 bg-slate-950/30 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4">
            {/* Format Picker */}
            <div className="flex items-center gap-1.5 p-0.5 rounded-xl border border-purple-500/30 bg-slate-800">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  exportFormat === 'pdf' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>File PDF A4 Chuẩn (Toàn bộ)</span>
              </button>
              <button
                onClick={() => setExportFormat('png')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  exportFormat === 'png' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-cyan-300" />
                <span>Thẻ Ảnh PNG</span>
              </button>
            </div>

            {/* Select Chapter for PNG Preview */}
            {exportFormat === 'png' && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold">XEM THẺ:</span>
                <select
                  value={selectedChapterId}
                  onChange={e => setSelectedChapterId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-sans outline-none focus:border-purple-500 cursor-pointer max-w-xs truncate"
                >
                  {allChapterItems.map((item) => (
                    <option key={item.chapter.id} value={item.chapter.id}>
                      Chương {item.pillarIndex + 1}.{item.chapterIndex + 1}: {item.chapter.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">MÀU SẮC:</span>
              <div className="flex items-center gap-1 p-0.5 rounded-xl border border-slate-700 bg-slate-800">
                <button
                  onClick={() => setExportTheme('dark')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    exportTheme === 'dark' ? 'bg-slate-900 text-purple-300 border border-purple-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Giao Diện Tối
                </button>
                <button
                  onClick={() => setExportTheme('light')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    exportTheme === 'light' ? 'bg-white text-purple-950 border border-slate-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Giao Diện Sáng
                </button>
              </div>
            </div>

            {/* Scale / Fit Mode */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">CÂN ĐỐI A4:</span>
              <select
                value={fitMode}
                onChange={e => setFitMode(e.target.value as any)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 outline-none cursor-pointer"
              >
                <option value="auto">Tự động vừa A4 (Auto-Scale)</option>
                <option value="compact">Thu nhỏ (Compact - Nội dung dài)</option>
                <option value="normal">Kích thước chuẩn (Normal)</option>
              </select>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="flex items-center gap-2">
            {exportFormat === 'pdf' ? (
              <button
                onClick={handleExportPDF}
                disabled={isCapturing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
              >
                {isCapturing ? <Loader2 className="w-4 h-4 animate-spin text-amber-200" /> : <Download className="w-4 h-4 text-amber-300" />}
                <span>TẢI FILE PDF A4 ({allChapterItems.length} CHƯƠNG)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadSinglePNG}
                  disabled={isCapturing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                >
                  {isCapturing ? <Loader2 className="w-4 h-4 animate-spin text-amber-300" /> : <Download className="w-4 h-4" />}
                  <span>TẢI THẺ CHƯƠNG NÀY</span>
                </button>

                <button
                  onClick={handleDownloadAllPNGs}
                  disabled={isCapturing}
                  className="px-4 py-2 rounded-xl border border-purple-500/40 hover:bg-purple-500/10 text-purple-300 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>TẢI BỘ PNG ({allChapterItems.length} CHƯƠNG)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status notice */}
        {successNotice && (
          <div className="px-6 py-2 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {isCapturing && (
          <div className="px-6 py-2 bg-purple-950/80 border-b border-purple-500/40 text-purple-300 text-xs font-mono flex items-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-300" />
            <span>{captureProgressMsg}</span>
          </div>
        )}

        {/* Live Interactive Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/70 flex flex-col items-center">
          <div className="mb-3 text-xs font-mono text-slate-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>BẢN XEM TRƯỚC TRANG A4 BÁO CÁO KHI XUẤT (TỰ ĐỘNG CÂN ĐỐI TỶ LỆ)</span>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="w-full flex justify-center pb-12">
            <ChapterExportCard
              item={activePreviewItem}
              dossier={dossier}
              totals={totals}
              exportTheme={exportTheme}
              fitMode={fitMode}
              parseChapterContent={parseChapterContent}
              isOffscreen={false}
              customPillarHeaderToggle={customPillarHeaderToggle}
            />
          </div>
        </div>
      </div>

      {/* HIDDEN OFF-SCREEN CONTAINER FOR BATCH PDF/PNG RENDERING */}
      <div 
        id="export-all-chapters-offscreen" 
        style={{ position: 'absolute', top: '-99999px', left: '-99999px', width: '840px' }}
      >
        {allChapterItems.map((item) => (
          <ChapterExportCard
            key={`export-card-${item.globalIndex}`}
            item={item}
            dossier={dossier}
            totals={totals}
            exportTheme={exportTheme}
            fitMode={fitMode}
            parseChapterContent={parseChapterContent}
            isOffscreen={true}
            customPillarHeaderToggle={customPillarHeaderToggle}
          />
        ))}
      </div>
    </div>
  );
};

// COMPONENT: INDIVIDUAL CHAPTER EXPORT CARD
interface ChapterExportCardProps {
  item: FlatChapterItem;
  dossier: Dossier;
  totals: { totalWords: number; minutes: number };
  exportTheme: 'dark' | 'light';
  fitMode: 'auto' | 'compact' | 'normal';
  parseChapterContent: (md?: string) => ParsedSection[];
  isOffscreen: boolean;
  customPillarHeaderToggle: 'smart' | 'always' | 'never';
}

const ChapterExportCard: React.FC<ChapterExportCardProps> = ({
  item,
  dossier,
  totals,
  exportTheme,
  fitMode,
  parseChapterContent,
  isOffscreen,
  customPillarHeaderToggle
}) => {
  const sections = parseChapterContent(item.chapter.contentMarkdown);
  const pillarTheme = getPillarThemeInfo(item.pillar.title, item.pillarIndex, exportTheme);
  const chapterTitleFormatted = formatChapterTitle(item.pillarIndex, item.chapterIndex, item.chapter.title);

  // Inclusion rules requested by user:
  // 1. Dossier Cover & Abstract: ONLY on Page 1 (isFirstOverall)
  // 2. Pillar Header: ONLY on the first chapter of that Pillar (isFirstInPillar)
  const shouldRenderDossierCover = item.isFirstOverall;
  
  let shouldRenderPillarHeader = item.isFirstInPillar;
  if (customPillarHeaderToggle === 'always') shouldRenderPillarHeader = true;
  if (customPillarHeaderToggle === 'never') shouldRenderPillarHeader = false;

  // Fit sizing classes
  const spacingClass = fitMode === 'compact' ? 'space-y-4 p-6' : 'space-y-6 p-8';
  const fontSizeClass = fitMode === 'compact' ? 'text-xs' : 'text-xs md:text-sm';

  return (
    <div
      id={`export-chapter-card-${item.globalIndex}`}
      style={{ width: '820px', minWidth: '820px', minHeight: '1120px' }}
      className={`rounded-3xl border select-none transition-colors my-4 ${spacingClass} ${
        exportTheme === 'dark'
          ? 'bg-[#070a12] border-purple-500/30 text-slate-100 shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* 1. DOSSIER COVER HEADER (ONLY RENDERED ON PAGE 1 / CHAPTER 1.1) */}
      {shouldRenderDossierCover && (
        <header
          className={`rounded-2xl p-6 border space-y-4 ${
            exportTheme === 'dark'
              ? 'bg-gradient-to-b from-purple-950/40 via-slate-900/60 to-slate-950/80 border-purple-500/30'
              : 'bg-gradient-to-b from-purple-50 via-slate-50 to-white border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold uppercase tracking-wider text-[10px]">
              HỒ SƠ #{String(dossier.chapterNumber || 1).padStart(2, '0')} • KHẢO LUẬN CHUYÊN SÂU
            </span>
            <div className={`flex items-center gap-2 text-[10px] ${exportTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>{totals.minutes} phút đọc toàn bộ</span>
              <span>•</span>
              <span>{totals.totalWords.toLocaleString()} từ (6 Trụ cột)</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className={`text-2xl font-extrabold font-serif-reading leading-tight ${
              exportTheme === 'dark' ? 'text-purple-100' : 'text-purple-950'
            }`}>
              {dossier.title}
            </h1>
            {dossier.subtitle && (
              <p className={`text-sm font-sans leading-relaxed ${
                exportTheme === 'dark' ? 'text-purple-300/80' : 'text-purple-800'
              }`}>
                {dossier.subtitle}
              </p>
            )}
          </div>

          {dossier.abstract && (
            <div className={`p-4 rounded-xl border text-xs font-sans leading-relaxed ${
              exportTheme === 'dark'
                ? 'bg-slate-900/80 border-purple-500/20 text-slate-300'
                : 'bg-white border-purple-100 text-slate-700'
            }`}>
              <div className="font-mono font-bold text-[10px] uppercase tracking-wider text-purple-400 mb-1">
                TÓM TẮT KHẢO LUẬN (ABSTRACT)
              </div>
              {dossier.abstract}
            </div>
          )}
        </header>
      )}

      {/* 2. PILLAR HEADER BANNER (ONLY ON FIRST CHAPTER OF EACH PILLAR) */}
      {shouldRenderPillarHeader && pillarTheme && (
        <div
          className={`p-5 rounded-2xl border space-y-1.5 ${
            exportTheme === 'dark'
              ? `bg-slate-900/80 ${pillarTheme.border}`
              : `bg-purple-50/60 border-purple-200`
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider border ${pillarTheme.badgeClass}`}>
              {pillarTheme.badge}
            </span>
          </div>
          <h2 className={`text-xl font-bold font-serif-reading ${
            exportTheme === 'dark' ? 'text-purple-200' : 'text-purple-950'
          }`}>
            {item.pillar.title}
          </h2>
          <p className={`text-xs font-sans ${exportTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {item.pillar.description || pillarTheme.sub}
          </p>
        </div>
      )}

      {/* 3. CHAPTER TITLE BANNER */}
      <div className="border-b border-purple-500/20 pb-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
            exportTheme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
          }`}>
            TRANG {item.globalIndex + 1} / A4 BÁO CÁO CHUYÊN SÂU
          </span>
          <span className="font-mono text-[10px] opacity-60">
            Chương {item.pillarIndex + 1}.{item.chapterIndex + 1}
          </span>
        </div>
        <h3 className={`text-2xl font-bold font-serif-reading leading-tight ${
          exportTheme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}>
          {chapterTitleFormatted}
        </h3>
      </div>

      {/* 4. HIERARCHICAL STRUCTURED SECTIONS */}
      <div className={fitMode === 'compact' ? 'space-y-4' : 'space-y-6'}>
        {sections.map((sec) => {
          const SectionIcon = sec.icon;

          return (
            <div
              key={sec.id}
              className={`p-5 rounded-2xl border space-y-3 ${
                exportTheme === 'dark'
                  ? 'bg-slate-900/60 border-slate-800'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 border-b border-purple-500/10 pb-2.5">
                <div className={`p-1.5 rounded-xl border shrink-0 ${
                  exportTheme === 'dark'
                    ? `bg-purple-500/10 ${sec.color} border-purple-500/20`
                    : 'bg-purple-100 text-purple-800 border-purple-200'
                }`}>
                  <SectionIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      exportTheme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-200 text-purple-900'
                    }`}>
                      {sec.tierNumber}
                    </span>
                    <span className={exportTheme === 'dark' ? 'opacity-60 text-slate-400' : 'text-slate-600'}>
                      {sec.tierName}
                    </span>
                  </div>
                  <h4 className={`text-base font-bold font-serif-reading mt-0.5 ${
                    exportTheme === 'dark' ? 'text-purple-200' : 'text-slate-900'
                  }`}>
                    {sec.title}
                  </h4>
                </div>
              </div>

              {/* Section Body */}
              <div className={`prose max-w-none ${fontSizeClass} leading-relaxed font-sans space-y-3 ${
                exportTheme === 'dark' ? 'prose-invert prose-purple text-slate-200' : 'prose-slate text-slate-800'
              }`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{
                    table: ({ node, ...props }) => (
                      <div className={`w-full my-3 overflow-x-auto rounded-xl border shadow-xs ${
                        exportTheme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <div className="min-w-[480px] p-1">
                          <table className="w-full text-left border-collapse table-auto" {...props} />
                        </div>
                      </div>
                    ),
                    thead: ({ node, ...props }) => (
                      <thead
                        className={`border-b ${
                          exportTheme === 'dark'
                            ? 'bg-slate-900 border-slate-800 text-purple-300'
                            : 'bg-slate-100 border-slate-200 text-purple-950 font-bold'
                        }`}
                        {...props}
                      />
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        className={`py-2 px-3 font-bold text-xs tracking-wide font-sans border-r last:border-r-0 ${
                          exportTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                        }`}
                        {...props}
                      />
                    ),
                    tbody: ({ node, ...props }) => (
                      <tbody
                        className={`divide-y text-xs leading-relaxed ${
                          exportTheme === 'dark' ? 'divide-slate-800/80' : 'divide-slate-200'
                        }`}
                        {...props}
                      />
                    ),
                    tr: ({ node, ...props }) => (
                      <tr
                        className={`transition-colors ${
                          exportTheme === 'dark' ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50'
                        }`}
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        className={`py-2 px-3 align-top font-sans border-r last:border-r-0 ${
                          exportTheme === 'dark' ? 'border-slate-800/80 text-slate-300' : 'border-slate-200 text-slate-800'
                        }`}
                        {...props}
                      />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className={`pl-3 border-l-2 my-2 italic font-serif text-xs ${
                          exportTheme === 'dark' ? 'border-purple-500 text-purple-200/90 bg-purple-950/20 p-2.5 rounded-r-xl' : 'border-purple-600 text-purple-950 bg-purple-50 p-2.5 rounded-r-xl'
                        }`}
                        {...props}
                      />
                    ),
                    code: ({ node, inline, ...props }: any) => (
                      inline ? (
                        <code className={`px-1 py-0.5 rounded text-[11px] font-mono ${
                          exportTheme === 'dark' ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-slate-100 text-cyan-900 border border-slate-200'
                        }`} {...props} />
                      ) : (
                        <code className={`block p-3 rounded-xl text-xs font-mono overflow-x-auto my-2 ${
                          exportTheme === 'dark' ? 'bg-slate-950 text-cyan-200 border border-slate-800' : 'bg-slate-900 text-cyan-100 border border-slate-800'
                        }`} {...props} />
                      )
                    )
                  }}
                >
                  {normalizeMarkdownTables(sec.content || '')}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. WATERMARK FOOTER */}
      <footer className={`pt-4 border-t flex items-center justify-between text-[10px] font-mono ${
        exportTheme === 'dark' ? 'border-purple-500/20 text-slate-400' : 'border-slate-200 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span className="font-bold text-purple-400">ONENESS GOVERNANCE LAB</span>
          <span>•</span>
          <span>DEEP RESEARCH & KNOWLEDGE TRANSFORMING</span>
        </div>
        <div className="opacity-75">
          https://oneness-governance.org
        </div>
      </footer>
    </div>
  );
};
