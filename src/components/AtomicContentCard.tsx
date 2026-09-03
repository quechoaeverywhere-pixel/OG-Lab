import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Quote,
  Code,
  Edit3,
  X,
  Save,
  Languages,
  Sparkles,
  Lightbulb,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  BookOpen,
  Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { normalizeMarkdownTables } from '../utils/markdownSanitizer';
import { AtomicContentUnit, AtomicSection, AtomicSubsection, detectLanguage } from '../utils/atomicContentParser';
import { BlueprintDiagramData } from '../types';
import { AtomicTableCard } from './AtomicTableCard';
import { AtomicBlueprintCard } from './AtomicBlueprintCard';
import { AtomicConceptRenderCard } from './AtomicConceptRenderCard';
import { safeFetchAIJson } from '../utils/ai-client';
import { AutoScrollText } from './AutoScrollText';
import { AtomicAIReviser } from './AtomicAIReviser';
import { usePermission } from '../contexts/PermissionContext';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface AtomicCardProps {
  unit: AtomicContentUnit;
  theme: 'dark' | 'light';
  contextInfo?: string;
  onUpdateUnit?: (unitId: string, newContentOrUnit: string | Partial<AtomicContentUnit>) => void;
}

// 1. Atomic Paragraph Card (Đoạn văn liền mạch - Không viền, không màu nền phụ)
export const AtomicParagraphCard: React.FC<AtomicCardProps> = ({
  unit,
  theme,
  contextInfo,
  onUpdateUnit
}) => {
  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(unit.content);

  useEffect(() => {
    setDraft(unit.content);
  }, [unit.content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(unit.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    requirePermission('compose_article', () => {
      setIsEditing(true);
    }, {
      title: 'Khóa Chỉnh Sửa Đoạn Văn',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa nội dung đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa nội dung bài viết.'
    });
  };

  const handleSave = () => {
    requirePermission('compose_article', () => {
      if (onUpdateUnit) {
        onUpdateUnit(unit.id, draft);
      }
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setDraft(unit.content);
    setIsEditing(false);
  };

  return (
    <div id={unit.id} className="group relative transition-all duration-150 py-1">
      {/* Action Controls - Kín đáo xuất hiện khi hover, không làm gián đoạn đọc */}
      <div className={`absolute right-0 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1.5 py-0.5 rounded-lg border shadow-xs z-10 select-none ${
        theme === 'dark' ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white border-slate-300'
      }`}>
        {onUpdateUnit && !isEditing && (
          <button
            onClick={handleStartEdit}
            className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] ${
              !canEditContent
                ? 'hover:bg-amber-500/20 text-amber-400'
                : theme === 'dark' ? 'hover:bg-purple-500/20 text-slate-400 hover:text-purple-300' : 'hover:bg-purple-50 text-slate-500 hover:text-purple-700'
            }`}
            title={!canEditContent ? 'Tính năng sửa đoạn văn đang bị khóa (Bấm để xem quyền)' : 'Chỉnh sửa đoạn văn'}
          >
            {!canEditContent ? <Lock className="w-3 h-3 text-amber-400" /> : <Edit3 className="w-3 h-3 text-purple-400" />}
            <span>Sửa</span>
          </button>
        )}
        {!isEditing && (
          <button
            onClick={handleCopy}
            className={`p-1 rounded transition-colors cursor-pointer ${
              theme === 'dark' ? 'hover:bg-purple-500/20 text-slate-400 hover:text-purple-300' : 'hover:bg-purple-50 text-slate-500 hover:text-purple-700'
            }`}
            title="Sao chép"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Inline Direct Editor */}
      {isEditing ? (
        <div className={`space-y-2 my-2 p-3 rounded-xl border ${
          theme === 'dark' ? 'bg-slate-900/90 border-purple-500/50' : 'bg-slate-50 border-purple-300 shadow-xs'
        }`}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={Math.max(3, Math.ceil(draft.length / 80))}
            className={`w-full p-2.5 rounded-lg font-sans text-sm outline-none focus:ring-1 focus:ring-purple-500 border ${
              theme === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
            }`}
            autoFocus
          />
          <AtomicAIReviser
            draft={draft}
            setDraft={setDraft}
            unitType="Đoạn văn"
            theme={theme}
            contextInfo={contextInfo}
            onTransformToBlueprint={(bpData, bpMarkdown) => {
              if (onUpdateUnit) {
                onUpdateUnit(unit.id, {
                  type: 'blueprint_diagram',
                  content: bpMarkdown,
                  blueprintData: bpData,
                  rawMarkdown: bpMarkdown
                });
                setIsEditing(false);
              } else {
                setDraft(bpMarkdown);
              }
            }}
          />
          <div className="flex items-center justify-end gap-2 text-xs font-mono mt-1">
            <button
              onClick={handleCancel}
              className={`px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer ${
                theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              <X className="w-3 h-3" />
              <span>Hủy</span>
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Save className="w-3 h-3" />
              <span>Lưu</span>
            </button>
          </div>
        </div>
      ) : (
        /* Paragraph Body Text - Liền mạch, phẳng, không đóng hộp */
        <div
          className={`text-sm md:text-[15.5px] leading-relaxed font-sans ${
            theme === 'dark' ? 'text-slate-200' : 'text-slate-800 font-normal'
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              table: ({ node, ...props }) => (
                <div className={`w-full my-4 overflow-x-auto rounded-2xl border shadow-xs ${
                  theme === 'dark' ? 'bg-[#0e111a]/80 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="min-w-[580px] p-1">
                    <table className="w-full text-left border-collapse" {...props} />
                  </div>
                </div>
              ),
              thead: ({ node, ...props }) => (
                <thead
                  className={`border-b ${
                    theme === 'dark' ? 'bg-slate-900/90 border-slate-800 text-indigo-300' : 'bg-slate-50 border-slate-200 text-indigo-950'
                  }`}
                  {...props}
                />
              ),
              th: ({ node, ...props }) => (
                <th className="py-3 px-4 md:px-5 font-semibold text-xs md:text-sm tracking-wide font-sans" {...props} />
              ),
              tbody: ({ node, ...props }) => (
                <tbody className={`divide-y text-xs md:text-[14.5px] leading-relaxed ${
                  theme === 'dark' ? 'divide-slate-800/60' : 'divide-slate-100'
                }`} {...props} />
              ),
              tr: ({ node, ...props }) => (
                <tr className={theme === 'dark' ? 'hover:bg-slate-900/50 transition-colors' : 'hover:bg-slate-50 transition-colors'} {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className={`py-3.5 px-4 md:px-5 align-top font-sans ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`} {...props} />
              ),
            }}
          >
            {normalizeMarkdownTables(unit.content || '')}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

// 2. Atomic Bullet Point Card (Điểm nhấn không đánh số - Liền mạch, tối giản)
export const AtomicBulletCard: React.FC<AtomicCardProps> = ({
  unit,
  theme,
  contextInfo,
  onUpdateUnit
}) => {
  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(unit.content);

  useEffect(() => {
    setDraft(unit.content);
  }, [unit.content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(unit.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    requirePermission('compose_article', () => {
      setIsEditing(true);
    }, {
      title: 'Khóa Chỉnh Sửa Điểm Nhấn',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa nội dung đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa điểm nhấn.'
    });
  };

  const handleSave = () => {
    requirePermission('compose_article', () => {
      if (onUpdateUnit) {
        onUpdateUnit(unit.id, draft);
      }
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setDraft(unit.content);
    setIsEditing(false);
  };

  return (
    <div id={unit.id} className="group relative transition-all duration-150 py-1.5 flex items-start gap-3">
      {/* Bullet Indicator - Dấu chấm điểm nhấn tối giản, không đánh số */}
      <span className="shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-cyan-400 dark:bg-cyan-400 select-none shadow-sm shadow-cyan-400/50" />

      {/* Bullet Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className={`space-y-2 p-2.5 rounded-xl border ${
            theme === 'dark' ? 'bg-slate-900/90 border-cyan-500/50' : 'bg-slate-50 border-cyan-300 shadow-xs'
          }`}>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={2}
              className={`w-full p-2 rounded-lg font-sans text-xs outline-none focus:ring-1 focus:ring-cyan-500 border ${
                theme === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
              }`}
              autoFocus
            />
            <AtomicAIReviser
              draft={draft}
              setDraft={setDraft}
              unitType="Danh sách"
              theme={theme}
              contextInfo={contextInfo}
              onTransformToBlueprint={(bpData, bpMarkdown) => {
                if (onUpdateUnit) {
                  onUpdateUnit(unit.id, {
                    type: 'blueprint_diagram',
                    content: bpMarkdown,
                    blueprintData: bpData,
                    rawMarkdown: bpMarkdown
                  });
                  setIsEditing(false);
                } else {
                  setDraft(bpMarkdown);
                }
              }}
            />
            <div className="flex items-center justify-end gap-2 text-xs font-mono mt-1">
              <button
                onClick={handleCancel}
                className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <X className="w-3 h-3" />
                <span>Hủy</span>
              </button>
              <button
                onClick={handleSave}
                className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Save className="w-3 h-3" />
                <span>Lưu</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`text-sm md:text-[15px] leading-relaxed font-sans ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800 font-normal'
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>{normalizeMarkdownTables(unit.content || '')}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Action Controls - Kín đáo xuất hiện khi hover */}
      <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-lg border select-none ${
        theme === 'dark' ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white border-slate-300 shadow-xs'
      }`}>
        {onUpdateUnit && !isEditing && (
          <button
            onClick={handleStartEdit}
            className={`px-1.5 py-0.5 rounded transition-all cursor-pointer flex items-center gap-1 text-[10px] ${
              !canEditContent
                ? 'hover:bg-amber-500/20 text-amber-400'
                : theme === 'dark' ? 'hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300' : 'hover:bg-cyan-50 text-slate-500 hover:text-cyan-700'
            }`}
            title={!canEditContent ? 'Tính năng sửa đang bị khóa (Bấm để xem quyền)' : 'Chỉnh sửa điểm nhấn'}
          >
            {!canEditContent ? <Lock className="w-3 h-3 text-amber-400" /> : <Edit3 className="w-3 h-3 text-cyan-400" />}
            <span>Sửa</span>
          </button>
        )}
        {!isEditing && (
          <button
            onClick={handleCopy}
            className={`p-0.5 rounded transition-all cursor-pointer ${
              theme === 'dark' ? 'hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300' : 'hover:bg-cyan-50 text-slate-500 hover:text-cyan-700'
            }`}
            title="Sao chép"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  );
};

// 3. Atomic Classical Quote Card (Trích dẫn tư tưởng kinh điển - Đặt đúng ngữ cảnh, chuyển ngữ & kiến giải thực chiến)
export const AtomicQuoteCard: React.FC<AtomicCardProps> = ({
  unit,
  theme,
  contextInfo,
  onUpdateUnit
}) => {
  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(unit.content);
  const [draftAuthor, setDraftAuthor] = useState(unit.author || '');
  const [draftWork, setDraftWork] = useState(unit.work || '');
  const [draftEra, setDraftEra] = useState(unit.eraOrYear || '');
  const [draftTranslation, setDraftTranslation] = useState(unit.translationVi || '');
  const [draftInterpretation, setDraftInterpretation] = useState(unit.interpretation || '');

  const [isTranslating, setIsTranslating] = useState(false);
  const [viewMode, setViewMode] = useState<'bilingual' | 'vi' | 'original'>('bilingual');
  const [showInterpretation, setShowInterpretation] = useState(true);

  const lang = unit.language || detectLanguage(unit.content);
  const isForeign = lang === 'en' || lang === 'other';

  useEffect(() => {
    setDraftContent(unit.content);
    setDraftAuthor(unit.author || '');
    setDraftWork(unit.work || '');
    setDraftEra(unit.eraOrYear || '');
    setDraftTranslation(unit.translationVi || '');
    setDraftInterpretation(unit.interpretation || '');
  }, [unit]);

  const handleCopy = async () => {
    let copyText = `"${unit.content}"`;
    if (unit.author || unit.work) {
      const parts = [unit.author, unit.work ? `*${unit.work}*` : '', unit.eraOrYear ? `(${unit.eraOrYear})` : ''].filter(Boolean);
      copyText += ` — ${parts.join(', ')}`;
    }
    if (unit.translationVi) {
      copyText += `\n*Bản dịch*: "${unit.translationVi}"`;
    }
    if (unit.interpretation) {
      copyText += `\n*Ý nghĩa thực chiến*: ${unit.interpretation}`;
    }
    await navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTranslateQuoteAI = async () => {
    if (isTranslating) return;
    requirePermission('ai_research', async () => {
      setIsTranslating(true);
      try {
        const res = await safeFetchAIJson('/api/gemini/translate-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote: unit.content,
            author: unit.author,
            work: unit.work,
            context: 'Khảo luận nghiên cứu hệ thống OG Agentic Intelligence'
          })
        });

        if (res.ok && res.data) {
          const updatedFields: Partial<AtomicContentUnit> = {
            translationVi: res.data.translationVi || unit.content,
            interpretation: res.data.interpretation || unit.interpretation,
            author: unit.author || res.data.author,
            work: unit.work || res.data.work
          };
          if (onUpdateUnit) {
            onUpdateUnit(unit.id, updatedFields);
          }
        }
      } catch (err) {
        console.error('Lỗi khi dịch trích dẫn:', err);
      } finally {
        setIsTranslating(false);
      }
    }, {
      title: 'Khóa Dịch Trích Dẫn AI',
      message: 'Vui lòng đăng nhập với tài khoản hợp lệ để sử dụng tính năng Dịch Trích Dẫn bằng AI.'
    });
  };

  const handleStartEdit = () => {
    requirePermission('compose_article', () => {
      setIsEditing(true);
    }, {
      title: 'Khóa Chỉnh Sửa Trích Dẫn',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa nội dung đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa trích dẫn.'
    });
  };

  const handleSave = () => {
    requirePermission('compose_article', () => {
      if (onUpdateUnit) {
        onUpdateUnit(unit.id, {
          content: draftContent,
          author: draftAuthor || undefined,
          work: draftWork || undefined,
          eraOrYear: draftEra || undefined,
          translationVi: draftTranslation || undefined,
          interpretation: draftInterpretation || undefined,
          language: detectLanguage(draftContent)
        });
      }
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setDraftContent(unit.content);
    setDraftAuthor(unit.author || '');
    setDraftWork(unit.work || '');
    setDraftEra(unit.eraOrYear || '');
    setDraftTranslation(unit.translationVi || '');
    setDraftInterpretation(unit.interpretation || '');
    setIsEditing(false);
  };

  const hasTranslation = !!unit.translationVi && unit.translationVi.trim().length > 0;
  const hasInterpretation = !!unit.interpretation && unit.interpretation.trim().length > 0;

  return (
    <div
      id={unit.id}
      className={`group relative my-4 rounded-2xl border transition-all duration-200 overflow-hidden ${
        theme === 'dark'
          ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/50 shadow-xs'
          : 'bg-amber-50/50 border-amber-200/90 hover:border-amber-300 shadow-xs'
      }`}
    >
      {/* Header Bar: Badge, Attribution & Actions */}
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 border-b text-[11px] font-mono select-none ${
          theme === 'dark'
            ? 'bg-amber-950/40 border-amber-500/20 text-amber-300'
            : 'bg-amber-100/50 border-amber-200/60 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[10px]">
            <Quote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Trích Dẫn Tư Tưởng</span>
          </div>

          {isForeign && (
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${
                theme === 'dark'
                  ? 'bg-amber-900/60 text-amber-200 border-amber-700/50'
                  : 'bg-amber-200/70 text-amber-900 border-amber-300'
              }`}
            >
              {lang.toUpperCase()}
            </span>
          )}

          {(unit.author || unit.work) && (
            <AutoScrollText
              className={`max-w-[200px] xs:max-w-[280px] sm:max-w-[360px] md:max-w-[480px] font-sans text-[11px] ${
                theme === 'dark' ? 'text-amber-200/90' : 'text-amber-900'
              }`}
              title={`${unit.author || 'Khuyết danh'}${unit.work ? `, ${unit.work}` : ''}${unit.eraOrYear ? ` (${unit.eraOrYear})` : ''}`}
            >
              — <span className="font-semibold">{unit.author || 'Khuyết danh'}</span>
              {unit.work && <span className="italic">, {unit.work}</span>}
              {unit.eraOrYear && <span className="text-[10px] opacity-75 font-mono"> ({unit.eraOrYear})</span>}
            </AutoScrollText>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Translation View Toggle (if foreign & has translation) */}
          {isForeign && hasTranslation && (
            <div className={`flex items-center rounded-lg p-0.5 border text-[10px] font-sans ${
              theme === 'dark' ? 'bg-slate-900/80 border-amber-500/30' : 'bg-white border-amber-200'
            }`}>
              <button
                onClick={() => setViewMode('bilingual')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'bilingual'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Song ngữ
              </button>
              <button
                onClick={() => setViewMode('vi')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'vi'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Bản dịch
              </button>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'original'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                Nguyên tác
              </button>
            </div>
          )}

          {/* AI Translate Button (if foreign & translation missing or re-translating) */}
          {isForeign && (
            <button
              onClick={handleTranslateQuoteAI}
              disabled={isTranslating}
              className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 text-[10px] font-sans font-medium transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border-amber-600/40'
                  : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
              }`}
              title="Dịch nghĩa & kiến giải thực chiến bằng AI"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  <span>Đang dịch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{hasTranslation ? 'Dịch lại' : 'Dịch nghĩa AI'}</span>
                </>
              )}
            </button>
          )}

          {onUpdateUnit && !isEditing && (
            <button
              onClick={handleStartEdit}
              className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[10px] ${
                !canEditContent
                  ? 'hover:bg-amber-500/20 text-amber-400'
                  : theme === 'dark' ? 'hover:bg-amber-500/20 text-slate-400 hover:text-amber-300' : 'hover:bg-amber-200/50 text-slate-600 hover:text-amber-900'
              }`}
              title={!canEditContent ? 'Tính năng sửa đang bị khóa (Bấm để xem quyền)' : 'Chỉnh sửa trích dẫn'}
            >
              {!canEditContent ? <Lock className="w-3 h-3 text-amber-400" /> : <Edit3 className="w-3 h-3 text-amber-500" />}
              <span className="hidden sm:inline">Sửa</span>
            </button>
          )}

          {!isEditing && (
            <button
              onClick={handleCopy}
              className={`p-1 rounded-md transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-amber-500/20 text-slate-400 hover:text-amber-300' : 'hover:bg-amber-200/50 text-slate-600 hover:text-amber-900'
              }`}
              title="Sao chép toàn bộ trích dẫn"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Card Content */}
      <div className="p-3.5 md:p-4 space-y-3">
        {isEditing ? (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[10px] font-mono text-amber-500 uppercase font-bold mb-1">
                Nội dung câu trích dẫn nguyên tác
              </label>
              <textarea
                value={draftContent}
                onChange={e => setDraftContent(e.target.value)}
                rows={3}
                className={`w-full p-2.5 rounded-lg font-serif text-sm outline-none focus:ring-1 focus:ring-amber-500 border ${
                  theme === 'dark' ? 'bg-slate-950 text-amber-100 border-slate-700' : 'bg-white text-amber-950 border-slate-300'
                }`}
                placeholder="Nhập câu trích dẫn..."
                autoFocus
              />
              <AtomicAIReviser draft={draftContent} setDraft={setDraftContent} unitType="Trích dẫn" theme={theme} contextInfo={contextInfo} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-amber-500 uppercase font-bold mb-0.5">
                  Tác giả
                </label>
                <input
                  type="text"
                  value={draftAuthor}
                  onChange={e => setDraftAuthor(e.target.value)}
                  className={`w-full p-1.5 rounded-md text-xs font-sans outline-none focus:ring-1 focus:ring-amber-500 border ${
                    theme === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                  placeholder="Ví dụ: Carl Jung, Lão Tử..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-amber-500 uppercase font-bold mb-0.5">
                  Tác phẩm / Nguồn
                </label>
                <input
                  type="text"
                  value={draftWork}
                  onChange={e => setDraftWork(e.target.value)}
                  className={`w-full p-1.5 rounded-md text-xs font-sans outline-none focus:ring-1 focus:ring-amber-500 border ${
                    theme === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                  placeholder="Ví dụ: Đạo Đức Kinh..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-amber-500 uppercase font-bold mb-0.5">
                  Thời kỳ / Năm
                </label>
                <input
                  type="text"
                  value={draftEra}
                  onChange={e => setDraftEra(e.target.value)}
                  className={`w-full p-1.5 rounded-md text-xs font-sans outline-none focus:ring-1 focus:ring-amber-500 border ${
                    theme === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-300'
                  }`}
                  placeholder="Ví dụ: Thế kỷ VI TCN, 1944..."
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-amber-500 uppercase font-bold mb-1">
                Bản dịch Tiếng Việt (nếu là trích dẫn ngoại ngữ)
              </label>
              <textarea
                value={draftTranslation}
                onChange={e => setDraftTranslation(e.target.value)}
                rows={2}
                className={`w-full p-2 rounded-lg font-sans text-xs outline-none focus:ring-1 focus:ring-amber-500 border ${
                  theme === 'dark' ? 'bg-slate-950 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-300'
                }`}
                placeholder="Bản dịch tiếng Việt uyển chuyển, chuẩn xác..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-amber-500 uppercase font-bold mb-1">
                Ý nghĩa thực chiến & Ứng dụng bài viết
              </label>
              <textarea
                value={draftInterpretation}
                onChange={e => setDraftInterpretation(e.target.value)}
                rows={2}
                className={`w-full p-2 rounded-lg font-sans text-xs outline-none focus:ring-1 focus:ring-amber-500 border ${
                  theme === 'dark' ? 'bg-slate-950 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-300'
                }`}
                placeholder="Phân tích bối cảnh và bài học ứng dụng thực tế..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 text-xs font-mono pt-1">
              <button
                onClick={handleCancel}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                <X className="w-3 h-3" />
                <span>Hủy</span>
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Save className="w-3 h-3" />
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* View Mode: Original or Bilingual Original Section */}
            {(viewMode === 'bilingual' || viewMode === 'original' || !hasTranslation) && (
              <div className="relative pl-3.5 border-l-2 border-amber-500/70">
                <blockquote
                  className={`italic font-serif text-sm md:text-[15.5px] leading-relaxed ${
                    theme === 'dark' ? 'text-amber-100' : 'text-amber-950 font-normal'
                  }`}
                >
                  “{unit.content}”
                </blockquote>
                {isForeign && hasTranslation && viewMode === 'bilingual' && (
                  <span className="text-[10px] font-mono text-amber-500/80 uppercase font-semibold mt-0.5 block">
                    [Nguyên tác {lang.toUpperCase()}]
                  </span>
                )}
              </div>
            )}

            {/* View Mode: Translation Section */}
            {isForeign && hasTranslation && (viewMode === 'bilingual' || viewMode === 'vi') && (
              <div className={`p-2.5 rounded-xl border ${
                theme === 'dark' ? 'bg-slate-900/80 border-amber-500/20' : 'bg-white/80 border-amber-200/80'
              }`}>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase mb-1">
                  <Languages className="w-3 h-3" />
                  <span>Bản dịch Tiếng Việt:</span>
                </div>
                <p className={`text-xs md:text-sm font-sans leading-relaxed ${
                  theme === 'dark' ? 'text-slate-200 font-medium' : 'text-slate-800 font-medium'
                }`}>
                  “{unit.translationVi}”
                </p>
              </div>
            )}

            {/* Contextual Meaning & Practical Application */}
            {hasInterpretation && (
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-amber-950/30 border-amber-500/30'
                    : 'bg-amber-100/40 border-amber-200/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowInterpretation(prev => !prev)}
                  className="w-full flex items-center justify-between gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Ý nghĩa thực chiến & Bài học vận dụng:</span>
                  </div>
                  {showInterpretation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showInterpretation && (
                  <p className={`mt-1.5 text-xs font-sans leading-relaxed ${
                    theme === 'dark' ? 'text-amber-200/90' : 'text-amber-900'
                  }`}>
                    {unit.interpretation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 4. Atomic Code Card (Mã nguồn gọn gàng, liền mạch)
export const AtomicCodeCard: React.FC<AtomicCardProps> = ({
  unit,
  theme,
  contextInfo,
  onUpdateUnit
}) => {
  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(unit.content);

  useEffect(() => {
    setDraft(unit.content);
  }, [unit.content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(unit.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    requirePermission('compose_article', () => {
      setIsEditing(true);
    }, {
      title: 'Khóa Chỉnh Sửa Mã Thực Thi',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa nội dung đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong mục Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa mã nguồn.'
    });
  };

  const handleSave = () => {
    requirePermission('compose_article', () => {
      if (onUpdateUnit) {
        onUpdateUnit(unit.id, draft);
      }
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setDraft(unit.content);
    setIsEditing(false);
  };

  return (
    <div id={unit.id} className={`group relative rounded-xl overflow-hidden border my-3 ${
      theme === 'dark' ? 'border-slate-800 bg-slate-950/80' : 'border-slate-300 bg-slate-900 shadow-xs'
    }`}>
      <div className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] font-mono select-none ${
        theme === 'dark' ? 'bg-slate-900/80 border-slate-800/80 text-slate-400' : 'bg-slate-950 border-slate-800 text-slate-300'
      }`}>
        <span className="text-emerald-400 font-semibold">{unit.language || 'typescript'}</span>
        <div className="flex items-center gap-1.5">
          {onUpdateUnit && !isEditing && (
            <button
              onClick={handleStartEdit}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors cursor-pointer flex items-center gap-1 ${
                !canEditContent
                  ? 'hover:bg-amber-500/20 text-amber-400'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={!canEditContent ? 'Tính năng sửa đang bị khóa (Bấm để xem quyền)' : 'Chỉnh sửa mã'}
            >
              {!canEditContent ? <Lock className="w-3 h-3 text-amber-400" /> : <Edit3 className="w-3 h-3 text-emerald-400" />}
              <span>Sửa</span>
            </button>
          )}
          {!isEditing && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 text-[10px] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="p-3 space-y-2">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={Math.max(4, draft.split('\n').length + 1)}
            className="w-full p-3 rounded-lg font-mono text-xs bg-slate-900 text-emerald-300 border border-emerald-500/50 outline-none focus:ring-1 focus:ring-emerald-500"
            autoFocus
          />
          <AtomicAIReviser
            draft={draft}
            setDraft={setDraft}
            unitType="Mã nguồn"
            theme={theme}
            contextInfo={contextInfo}
            onTransformToBlueprint={(bpData, bpMarkdown) => {
              if (onUpdateUnit) {
                onUpdateUnit(unit.id, {
                  type: 'blueprint_diagram',
                  content: bpMarkdown,
                  blueprintData: bpData,
                  rawMarkdown: bpMarkdown
                });
                setIsEditing(false);
              } else {
                setDraft(bpMarkdown);
              }
            }}
          />
          <div className="flex items-center justify-end gap-2 text-xs font-mono mt-1">
            <button
              onClick={handleCancel}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Hủy</span>
            </button>
            <button
              onClick={handleSave}
              className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Save className="w-3 h-3" />
              <span>Lưu</span>
            </button>
          </div>
        </div>
      ) : (
        <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-300/90 leading-relaxed">
          <code>{unit.content}</code>
        </pre>
      )}
    </div>
  );
};

// 5. Atomic Subsection Card (Tiểu mục H3 - Phẳng, không khung viền bao quanh, không badge cồng kềnh)
export const AtomicSubsectionCard: React.FC<{
  subsection: AtomicSubsection;
  theme: 'dark' | 'light';
  contextInfo?: string;
  onUpdateUnit?: (unitId: string, newContentOrUnit: string | Partial<AtomicContentUnit>) => void;
  onUpdateSubsectionTitle?: (subsectionId: string, newTitle: string) => void;
  onDeleteUnit?: (unitId: string) => void;
  onMoveUnit?: (unitId: string, direction: 'up' | 'down') => void;
  onRequestAddCard?: (targetLocation: {
    targetUnitId?: string;
    position?: 'before' | 'after';
    targetSectionId?: string;
    targetSubsectionId?: string;
  }) => void;
}> = ({
  subsection,
  theme,
  contextInfo,
  onUpdateUnit,
  onUpdateSubsectionTitle,
  onDeleteUnit,
  onMoveUnit,
  onRequestAddCard
}) => {
  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(subsection.title);

  useEffect(() => {
    setTitleDraft(subsection.title);
  }, [subsection.title]);

  const handleStartEditTitle = () => {
    requirePermission('compose_article', () => {
      setIsEditingTitle(true);
    }, {
      title: 'Khóa Chỉnh Sửa Tiêu Đề Tiểu Mục',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa tiêu đề đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa tiêu đề tiểu mục.'
    });
  };

  const handleSaveTitle = () => {
    requirePermission('compose_article', () => {
      if (onUpdateSubsectionTitle) {
        onUpdateSubsectionTitle(subsection.id, titleDraft);
      }
      setIsEditingTitle(false);
    });
  };

  return (
    <div id={subsection.id} className="space-y-3 pt-3">
      {/* Subsection Title - Hiển thị tự nhiên, không đóng hộp */}
      <div className={`group flex items-center justify-between pb-1 border-b ${
        theme === 'dark' ? 'border-slate-800/40' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                className={`flex-1 px-2 py-1 text-sm rounded outline-none border ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-purple-200 border-purple-500'
                    : 'bg-white text-purple-950 border-purple-400 shadow-xs'
                }`}
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 rounded bg-emerald-600 text-white cursor-pointer shadow-xs"
                title="Lưu tiêu đề"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setTitleDraft(subsection.title);
                  setIsEditingTitle(false);
                }}
                className={`p-1 rounded cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}
                title="Hủy"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h4 className={`font-bold text-sm md:text-base ${
              theme === 'dark' ? 'text-purple-300' : 'text-purple-900 font-semibold'
            }`}>
              {subsection.title}
            </h4>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onRequestAddCard && canEditContent && (
            <button
              onClick={() => onRequestAddCard({ targetSubsectionId: subsection.id })}
              className={`p-1 rounded cursor-pointer text-xs flex items-center gap-1 font-medium transition-colors ${
                theme === 'dark' ? 'hover:bg-purple-900/30 text-purple-400' : 'hover:bg-purple-100 text-purple-700'
              }`}
              title="Thêm thẻ vào tiểu mục này"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Thêm thẻ</span>
            </button>
          )}

          {onUpdateSubsectionTitle && !isEditingTitle && (
            <button
              onClick={handleStartEditTitle}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer text-xs flex items-center gap-1 ${
                !canEditContent
                  ? 'hover:bg-amber-500/20 text-amber-400'
                  : theme === 'dark'
                  ? 'hover:bg-purple-500/20 text-slate-400 hover:text-purple-300'
                  : 'hover:bg-purple-100 text-slate-500 hover:text-purple-700'
              }`}
              title={!canEditContent ? 'Tính năng sửa đang bị khóa (Bấm để xem quyền)' : 'Sửa tiêu đề tiểu mục'}
            >
              {!canEditContent ? <Lock className="w-3 h-3 text-amber-400" /> : <Edit3 className="w-3 h-3 text-purple-500" />}
            </button>
          )}
        </div>
      </div>

      {/* Child Units - Liền mạch, phẳng hoàn toàn */}
      <div className="space-y-2.5">
        {subsection.units.map((unit, uIdx) => {
          const unitKey = unit.id ? `${unit.id}-${uIdx}` : `u-${uIdx}`;
          let renderedCard = null;

          if (unit.type === 'concept_render') {
            renderedCard = (
              <AtomicConceptRenderCard
                key={unitKey}
                unit={unit}
                theme={theme}
                contextInfo={contextInfo}
                onUpdateUnit={onUpdateUnit}
                onDeleteUnit={onDeleteUnit}
                onMoveUnit={onMoveUnit}
                canEditContent={canEditContent}
              />
            );
          } else if (unit.type === 'bullet') {
            renderedCard = (
              <AtomicBulletCard
                key={unitKey}
                unit={unit}
                theme={theme}
                contextInfo={contextInfo}
                onUpdateUnit={onUpdateUnit}
              />
            );
          } else if (unit.type === 'quote') {
            renderedCard = (
              <AtomicQuoteCard
                key={unitKey}
                unit={unit}
                theme={theme}
                contextInfo={contextInfo}
                onUpdateUnit={onUpdateUnit}
              />
            );
          } else if (unit.type === 'code') {
            renderedCard = (
              <AtomicCodeCard
                key={unitKey}
                unit={unit}
                theme={theme}
                contextInfo={contextInfo}
                onUpdateUnit={onUpdateUnit}
              />
            );
          } else if (unit.type === 'blueprint_diagram') {
            renderedCard = (
              <AtomicBlueprintCard
                key={unitKey}
                unit={unit}
                theme={theme}
                contextInfo={contextInfo}
                onUpdateUnit={onUpdateUnit}
              />
            );
          } else if (unit.type === 'table') {
            renderedCard = (
              <AtomicTableCard
                key={unitKey}
                unit={unit}
                theme={theme}
                contextInfo={contextInfo}
                onUpdateUnit={onUpdateUnit}
              />
            );
          } else {
            renderedCard = (
              <AtomicParagraphCard
                key={unitKey}
                unit={unit}
                theme={theme}
                contextInfo={contextInfo}
                onUpdateUnit={onUpdateUnit}
              />
            );
          }

          return (
            <div key={unitKey} className="group/unit relative">
              {renderedCard}
              {onRequestAddCard && canEditContent && (
                <div className="opacity-0 group-hover/unit:opacity-100 transition-opacity flex items-center justify-center my-1.5">
                  <button
                    onClick={() => onRequestAddCard({ targetUnitId: unit.id, position: 'after' })}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 border cursor-pointer transition-all shadow-xs ${
                      theme === 'dark'
                        ? 'bg-slate-900 border-purple-500/40 text-purple-300 hover:bg-purple-900/40'
                        : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-50'
                    }`}
                    title="Chèn thêm thẻ mới tại vị trí này"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm thẻ tại đây</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 6. Atomic Section View (Hiển thị Mục H2 phẳng, liền mạch bên trong Thẻ Trụ Cột - Không viền riêng, không tag 'Mục I')
export const AtomicSectionCard: React.FC<{
  section: AtomicSection;
  theme: 'dark' | 'light';
  contextInfo?: string;
  onUpdateUnit?: (unitId: string, newContentOrUnit: string | Partial<AtomicContentUnit>) => void;
  onUpdateSectionTitle?: (sectionId: string, newTitle: string) => void;
  onUpdateSubsectionTitle?: (subsectionId: string, newTitle: string) => void;
  onDeleteUnit?: (unitId: string) => void;
  onMoveUnit?: (unitId: string, direction: 'up' | 'down') => void;
  onRequestAddCard?: (targetLocation: { targetUnitId?: string; position?: 'before' | 'after'; targetSectionId?: string; targetSubsectionId?: string }) => void;
}> = ({
  section,
  theme,
  contextInfo,
  onUpdateUnit,
  onUpdateSectionTitle,
  onUpdateSubsectionTitle,
  onDeleteUnit,
  onMoveUnit,
  onRequestAddCard
}) => {
  const { requirePermission, isContentEditLocked, isOwner, canEditContent } = usePermission();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);

  useEffect(() => {
    setTitleDraft(section.title);
  }, [section.title]);

  const handleStartEditTitle = () => {
    requirePermission('compose_article', () => {
      setIsEditingTitle(true);
    }, {
      title: 'Khóa Chỉnh Sửa Tiêu Đề Mục H2',
      message: isContentEditLocked && !isOwner
        ? 'Tính năng sửa tiêu đề đang bị khóa toàn hệ thống. Chỉ tài khoản Owner (quechoa.everywhere@gmail.com) mới có quyền mở khóa trong Cài Đặt.'
        : 'Vui lòng đăng nhập với tài khoản Owner/Tác Giả để chỉnh sửa tiêu đề mục.'
    });
  };

  const handleSaveTitle = () => {
    requirePermission('compose_article', () => {
      if (onUpdateSectionTitle) {
        onUpdateSectionTitle(section.id, titleDraft);
      }
      setIsEditingTitle(false);
    });
  };

  return (
    <div id={section.id} className="space-y-4 pt-4 first:pt-0">
      {/* Section Header - Phẳng, thanh lịch, không badge 'MỤC I' */}
      <div className={`group flex items-center justify-between pb-2 border-b ${
        theme === 'dark' ? 'border-slate-800/40' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                className={`flex-1 px-2.5 py-1 text-sm md:text-base font-bold rounded outline-none border ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-slate-100 border-purple-500'
                    : 'bg-white text-slate-900 border-purple-400 shadow-xs'
                }`}
                autoFocus
              />
              <button
                onClick={handleSaveTitle}
                className="p-1.5 rounded bg-emerald-600 text-white cursor-pointer shadow-xs"
                title="Lưu tiêu đề"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setTitleDraft(section.title);
                  setIsEditingTitle(false);
                }}
                className={`p-1.5 rounded cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}
                title="Hủy"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className={`font-bold text-base md:text-lg tracking-tight truncate ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {section.title}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onRequestAddCard && canEditContent && (
            <button
              onClick={() => onRequestAddCard({ targetSectionId: section.id })}
              className={`p-1.5 rounded cursor-pointer text-xs flex items-center gap-1 font-semibold transition-colors ${
                theme === 'dark' ? 'hover:bg-purple-900/30 text-purple-400' : 'hover:bg-purple-100 text-purple-700'
              }`}
              title="Thêm thẻ nội dung vào mục này"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Thêm Thẻ</span>
            </button>
          )}

          {onUpdateSectionTitle && !isEditingTitle && (
            <button
              onClick={handleStartEditTitle}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded cursor-pointer text-xs flex items-center gap-1 ${
                !canEditContent
                  ? 'hover:bg-amber-500/20 text-amber-400'
                  : theme === 'dark'
                  ? 'hover:bg-purple-500/20 text-slate-400 hover:text-purple-300'
                  : 'hover:bg-purple-100 text-slate-500 hover:text-purple-700'
              }`}
              title={!canEditContent ? 'Tính năng sửa đang bị khóa (Bấm để xem quyền)' : 'Sửa tiêu đề mục'}
            >
              {!canEditContent ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Edit3 className="w-3.5 h-3.5 text-purple-500" />}
            </button>
          )}
        </div>
      </div>

      {/* Direct Units under Section - Hoàn toàn phẳng & liền mạch */}
      {section.units.length > 0 && (
        <div className="space-y-2.5">
          {section.units.map((unit, uIdx) => {
            const unitKey = unit.id ? `${unit.id}-${uIdx}` : `u-${uIdx}`;
            let renderedCard = null;

            if (unit.type === 'concept_render') {
              renderedCard = (
                <AtomicConceptRenderCard
                  key={unitKey}
                  unit={unit}
                  theme={theme}
                  contextInfo={contextInfo}
                  onUpdateUnit={onUpdateUnit}
                  onDeleteUnit={onDeleteUnit}
                  onMoveUnit={onMoveUnit}
                  canEditContent={canEditContent}
                />
              );
            } else if (unit.type === 'bullet') {
              renderedCard = (
                <AtomicBulletCard
                  key={unitKey}
                  unit={unit}
                  theme={theme}
                  contextInfo={contextInfo}
                  onUpdateUnit={onUpdateUnit}
                />
              );
            } else if (unit.type === 'quote') {
              renderedCard = (
                <AtomicQuoteCard
                  key={unitKey}
                  unit={unit}
                  theme={theme}
                  contextInfo={contextInfo}
                  onUpdateUnit={onUpdateUnit}
                />
              );
            } else if (unit.type === 'code') {
              renderedCard = (
                <AtomicCodeCard
                  key={unitKey}
                  unit={unit}
                  theme={theme}
                  contextInfo={contextInfo}
                  onUpdateUnit={onUpdateUnit}
                />
              );
            } else if (unit.type === 'blueprint_diagram') {
              renderedCard = (
                <AtomicBlueprintCard
                  key={unitKey}
                  unit={unit}
                  theme={theme}
                  contextInfo={contextInfo}
                  onUpdateUnit={onUpdateUnit}
                />
              );
            } else if (unit.type === 'table') {
              renderedCard = (
                <AtomicTableCard
                  key={unitKey}
                  unit={unit}
                  theme={theme}
                  contextInfo={contextInfo}
                  onUpdateUnit={onUpdateUnit}
                />
              );
            } else {
              renderedCard = (
                <AtomicParagraphCard
                  key={unitKey}
                  unit={unit}
                  theme={theme}
                  contextInfo={contextInfo}
                  onUpdateUnit={onUpdateUnit}
                />
              );
            }

            return (
              <div key={unitKey} className="group/unit relative">
                {renderedCard}
                {onRequestAddCard && canEditContent && (
                  <div className="opacity-0 group-hover/unit:opacity-100 transition-opacity flex items-center justify-center my-1.5">
                    <button
                      onClick={() => onRequestAddCard({ targetUnitId: unit.id, position: 'after' })}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 border cursor-pointer transition-all shadow-xs ${
                        theme === 'dark'
                          ? 'bg-slate-900 border-purple-500/40 text-purple-300 hover:bg-purple-900/40'
                          : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-50'
                      }`}
                      title="Chèn thêm thẻ mới tại vị trí này"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Thêm thẻ tại đây</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Subsections under Section - Phẳng & liền mạch */}
      {section.subsections.length > 0 && (
        <div className="space-y-4">
          {section.subsections.map((sub, sIdx) => (
            <AtomicSubsectionCard
              key={sub.id ? `${sub.id}-${sIdx}` : `sub-${sIdx}`}
              subsection={sub}
              theme={theme}
              contextInfo={contextInfo}
              onUpdateUnit={onUpdateUnit}
              onUpdateSubsectionTitle={onUpdateSubsectionTitle}
              onDeleteUnit={onDeleteUnit}
              onMoveUnit={onMoveUnit}
              onRequestAddCard={onRequestAddCard}
            />
          ))}
        </div>
      )}
    </div>
  );
};
