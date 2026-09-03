import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  BookOpen,
  Mic,
  FileSpreadsheet,
  HelpCircle,
  Scale,
  Bot,
  RefreshCw,
  Trash2,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  CheckCircle2,
  Lightbulb,
  FileText
} from 'lucide-react';
import { Dossier, DossierNotebookPrompt, GeminiSettings, LexiconTerm, CitationItem } from '../types';
import { formatDossierToNotebookLMMarkdown, downloadMarkdownFile } from '../utils/markdownExporter';
import { safeFetchAIJson } from '../utils/ai-client';
import { ensureDossierPillarStructure } from '../utils/pillarParser';
import { logTokenUsage } from '../utils/tokenLogger';

interface DynamicNotebookStudioProps {
  dossiers: Dossier[];
  selectedDossierId: string;
  onSelectDossier: (id: string) => void;
  onSaveDossier: (dossier: Dossier) => Promise<void>;
  lexicon: LexiconTerm[];
  citations: CitationItem[];
  geminiSettings: GeminiSettings;
  theme: 'dark' | 'light';
}

interface FormatPreset {
  id: 'audio_deep_dive' | 'briefing_doc' | 'study_guide' | 'dialectical_matrix' | 'faq_concept_map' | 'multi_agent_spec' | 'custom';
  title: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  desc: string;
  defaultIdea: string;
}

const PRESET_FORMATS: FormatPreset[] = [
  {
    id: 'audio_deep_dive',
    title: 'Audio Deep Dive / Podcast',
    badge: 'PODCAST 2 NGƯỜI DẪN',
    icon: Mic,
    color: 'from-amber-500 to-orange-600',
    desc: 'Kịch bản đối thoại 2 chuyên gia: giải mã bản chất 6 trụ cột sang bài học đời thường thực chiến, không dùng biệt ngữ sáo rỗng.',
    defaultIdea: 'Tạo kịch bản podcast đối thoại phân tích sâu giữa 2 chuyên gia (1 người phản biện thực tiễn và 1 chuyên gia giải mã 6 trụ cột), rút ra các bài học hành động đời thường.'
  },
  {
    id: 'briefing_doc',
    title: 'Briefing Doc & Hành Động',
    badge: 'EXECUTIVE ACTION MEMO',
    icon: FileSpreadsheet,
    color: 'from-blue-500 to-cyan-600',
    desc: 'Bản ghi nhớ cấp điều hành: Tóm tắt 6 trụ cột, ma trận rủi ro, danh mục hành động ngay và các chỉ số đo lường hiệu quả.',
    defaultIdea: 'Tạo Bản ghi nhớ hành động thực chiến cấp điều hành: Tóm tắt các quyết sách then chốt theo 6 trụ cột và danh mục hành động cụ thể cần làm ngay.'
  },
  {
    id: 'study_guide',
    title: 'Sách Hướng Dẫn & Quiz',
    badge: 'STUDY GUIDE & REVIEW',
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    desc: 'Đề cương nghiên cứu chuyên sâu theo từng chương, bộ câu hỏi tự vấn nhận thức, thuật ngữ then chốt và bài tập tình huống.',
    defaultIdea: 'Tạo Cẩm nang nghiên cứu chuyên sâu: Tóm tắt từng chương, giải nghĩa thuật ngữ cốt lõi và bộ câu hỏi trắc nghiệm tự vấn nhận thức theo phương pháp Oneness Governance.'
  },
  {
    id: 'dialectical_matrix',
    title: 'Ma Trận Phản Biện & Rủi Ro',
    badge: 'DIALECTICAL CRITIQUE',
    icon: Scale,
    color: 'from-rose-500 to-pink-600',
    desc: 'Phân tích các mâu thuẫn nội tại, nghịch lý kỹ thuật, bẫy ngụy biện phổ biến trong hồ sơ và giải pháp khắc phục đối trọng.',
    defaultIdea: 'Phân tích ma trận phản biện biện chứng: Vạch trần các nghịch lý, điểm nghẽn kỹ thuật và các bẫy ngụy biện trong hồ sơ kèm giải pháp khắc phục.'
  },
  {
    id: 'faq_concept_map',
    title: 'Bản Đồ Khái Niệm & FAQ',
    badge: 'INSTANT FAQ MAP',
    icon: HelpCircle,
    color: 'from-purple-500 to-indigo-600',
    desc: 'Bộ 10-15 câu hỏi đáp nhanh giải mã toàn bộ hồ sơ bằng ngôn ngữ bình dân, kèm bảng tra cứu khái niệm song ngữ Việt - Anh.',
    defaultIdea: 'Tạo Bộ 10-15 câu hỏi - đáp nhanh giải thích toàn bộ hồ sơ bằng ngôn ngữ đời thường, kèm bảng đối chiếu khái niệm song ngữ Việt - Anh.'
  },
  {
    id: 'multi_agent_spec',
    title: 'Đặc Tả Kỹ Nghệ Multi-Agent',
    badge: 'SYSTEMS BLUEPRINT',
    icon: Bot,
    color: 'from-fuchsia-500 to-purple-600',
    desc: 'Bản thiết kế kiến trúc phân tán: Phân rã hồ sơ thành vai trò Agent, giao thức truyền tin (Gossip/Consensus) và luồng điều phối.',
    defaultIdea: 'Thiết kế bản đặc tả kỹ nghệ hệ thống phân tán Multi-Agent: Phân rã bài toán trong hồ sơ thành các Agent chuyên biệt với cơ chế đồng thuận và xử lý lỗi.'
  }
];

const QUICK_IDEA_SUGGESTIONS = [
  '🎙️ Podcast đối thoại 2 học giả về bản chất và bài học thực chiến',
  '📑 Bản ghi nhớ hành động tóm tắt 6 trụ cột & danh mục việc cần làm ngay',
  '⚖️ Phản biện các điểm nghẽn kỹ thuật và bẫy ngụy biện trong hồ sơ',
  '📚 Đề cương nghiên cứu chuyên sâu kèm bộ câu hỏi tự vấn nhận thức',
  '🧭 Bản đồ khái niệm & bộ 12 câu hỏi đáp nhanh tra cứu tức thì',
  '🤖 Đặc tả kiến trúc hệ thống Multi-Agent phân tán bám sát hồ sơ'
];

export const DynamicNotebookStudio: React.FC<DynamicNotebookStudioProps> = ({
  dossiers,
  selectedDossierId,
  onSelectDossier,
  onSaveDossier,
  lexicon,
  citations,
  geminiSettings,
  theme
}) => {
  const currentDossier = dossiers.find(d => d.id === selectedDossierId) || dossiers[0];
  const structuredDossier = currentDossier ? ensureDossierPillarStructure(currentDossier) : null;
  const pillarsList = structuredDossier?.projectStructure || [];

  // Local State
  const [selectedFormat, setSelectedFormat] = useState<FormatPreset['id']>('audio_deep_dive');
  const [userIdea, setUserIdea] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<DossierNotebookPrompt | null>(null);

  // Copy states
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedSources, setCopiedSources] = useState(false);
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);

  // Total chapters across pillars
  const totalChapters = pillarsList.reduce((acc, p) => acc + (p.chapters?.length || 0), 0);
  const dossierPrompts: DossierNotebookPrompt[] = currentDossier?.notebookPrompts || [];

  // Generate Prompt Handler
  const handleGeneratePrompt = async (customFormat?: FormatPreset['id'], customIdeaText?: string) => {
    if (!currentDossier) return;
    
    const formatToUse = customFormat || selectedFormat;
    const ideaToUse = customIdeaText !== undefined ? customIdeaText : userIdea;

    setIsGenerating(true);
    setGenerateError('');

    try {
      // Build summary of pillars and chapters for grounding
      const pillarsSummary = pillarsList.map((p, pIdx) => {
        const chaps = (p.chapters || []).map(c => `   + ${c.title}`).join('\n');
        return `Trụ cột ${pIdx + 1}: ${p.title} (${p.chapters?.length || 0} chương)\n${chaps}`;
      }).join('\n\n');

      const payload = {
        dossierId: currentDossier.id,
        dossierTitle: currentDossier.title,
        dossierSubtitle: currentDossier.subtitle || currentDossier.abstract,
        dossierAbstract: currentDossier.abstract,
        pillarsSummary,
        userIdea: ideaToUse.trim(),
        outputFormat: formatToUse,
        model: geminiSettings.model || 'gemini-2.5-flash'
      };

      const res = await safeFetchAIJson('/api/gemini/generate-notebook-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok && res.data && res.data.success && res.data.notebookPrompt) {
        const newPrompt: DossierNotebookPrompt = res.data.notebookPrompt;
        setActivePrompt(newPrompt);
        
        await logTokenUsage('Sinh Prompt NotebookLM', newPrompt.generatedPrompt.length);

        // Persist prompt into Dossier's notebookPrompts array
        const existingPrompts = currentDossier.notebookPrompts || [];
        const updatedPrompts = [newPrompt, ...existingPrompts.filter(p => p.id !== newPrompt.id)];
        
        const updatedDossier: Dossier = {
          ...currentDossier,
          notebookPrompts: updatedPrompts,
          lastModified: new Date().toISOString()
        };

        await onSaveDossier(updatedDossier);
      } else {
        setGenerateError(res.data?.error || 'Không thể tạo prompt. Vui lòng thử lại.');
      }
    } catch (err: any) {
      console.error('Error generating notebook prompt:', err);
      setGenerateError(err.message || 'Lỗi kết nối khi kiến tạo prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick Preset Click
  const handleSelectPreset = (preset: FormatPreset) => {
    setSelectedFormat(preset.id);
    if (!userIdea.trim()) {
      setUserIdea(preset.defaultIdea);
    }
  };

  // Copy Prompt to Clipboard
  const handleCopyPromptText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Copy Master Dossier Sources Markdown to Clipboard
  const handleCopyDossierSources = async () => {
    if (!currentDossier) return;
    const md = formatDossierToNotebookLMMarkdown(currentDossier);
    await navigator.clipboard.writeText(md);
    setCopiedSources(true);
    setTimeout(() => setCopiedSources(false), 2000);
  };

  // Download Markdown Source File
  const handleDownloadSourceFile = () => {
    if (!currentDossier) return;
    const md = formatDossierToNotebookLMMarkdown(currentDossier);
    const filename = `OG_NotebookLM_Source_${currentDossier.id}_Ch${currentDossier.chapterNumber}`;
    downloadMarkdownFile(md, filename);
  };

  // Delete Prompt from Dossier
  const handleDeletePrompt = async (promptId: string) => {
    if (!currentDossier) return;
    const updatedPrompts = (currentDossier.notebookPrompts || []).filter(p => p.id !== promptId);
    const updatedDossier: Dossier = {
      ...currentDossier,
      notebookPrompts: updatedPrompts,
      lastModified: new Date().toISOString()
    };
    await onSaveDossier(updatedDossier);
    if (activePrompt?.id === promptId) {
      setActivePrompt(updatedPrompts[0] || null);
    }
  };

  if (!currentDossier) {
    return (
      <div className="p-8 text-center text-slate-400">
        Chưa có Hồ Sơ nào được chọn. Vui lòng chọn hoặc tạo Hồ Sơ trước.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP BAR: DOSSIER SELECTOR & ACTIVE CONTEXT */}
      <div className={`p-5 rounded-3xl border transition-all ${
        theme === 'dark'
          ? 'bg-slate-900/70 border-purple-500/30'
          : 'bg-gradient-to-r from-purple-50 via-indigo-50 to-fuchsia-50 border-purple-200 shadow-xs'
      }`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase bg-purple-600 text-white shadow-xs">
                HỒ SƠ LIÊN KẾT
              </span>
              <span className={`text-xs font-mono truncate ${theme === 'dark' ? 'text-purple-300' : 'text-purple-800'}`}>
                Chương #{currentDossier.chapterNumber} • {currentDossier.discipline}
              </span>
            </div>

            <h3 className={`text-lg font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {currentDossier.title}
            </h3>

            <p className={`text-xs line-clamp-2 font-sans ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              {currentDossier.subtitle || currentDossier.abstract}
            </p>
          </div>

          {/* Dossier Quick Switch Dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 md:max-w-xs w-full sm:w-auto">
            <label className={`text-xs font-mono font-bold whitespace-nowrap ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Chuyển Hồ Sơ:
            </label>
            <select
              value={selectedDossierId}
              onChange={e => onSelectDossier(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-mono outline-none cursor-pointer border w-full sm:w-48 md:w-64 truncate ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-purple-500'
                  : 'bg-white border-purple-200 text-slate-900 focus:border-purple-500 shadow-xs'
              }`}
            >
              {dossiers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Context Pill Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-purple-500/20 text-xs font-mono">
          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
            theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-white/80 border-purple-200 text-purple-900'
          }`}>
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>{pillarsList.length} Trụ Cột Động</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
            theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-white/80 border-purple-200 text-purple-900'
          }`}>
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>{totalChapters} Chương Khảo Luận</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
            theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-white/80 border-purple-200 text-purple-900'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{dossierPrompts.length} Prompt Đã Lưu</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleCopyDossierSources}
              className={`px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-all ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-xs'
              }`}
              title="Sao chép toàn bộ nội dung Markdown hồ sơ để nạp làm Source trong NotebookLM"
            >
              {copiedSources ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-purple-500" />}
              <span>{copiedSources ? 'ĐÃ SAO CHÉP NGUỒN' : 'SAO CHÉP NGUỒN MD'}</span>
            </button>

            <button
              onClick={handleDownloadSourceFile}
              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-all shadow-xs"
              title="Tải tệp .md của hồ sơ này về máy"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. PRESET ACTION BUTTONS FOR GEMINI / NOTEBOOKLM CORE FORMATS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
            <span>1. CHỌN ĐỊNH DẠNG NỘI DUNG NOTEBOOKLM CẦN KIẾN TẠO:</span>
          </label>
          <span className={`text-[11px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Bấm chọn để áp dụng mẫu định dạng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_FORMATS.map(preset => {
            const Icon = preset.icon;
            const isSelected = selectedFormat === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? theme === 'dark'
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-950/50'
                      : 'bg-purple-50 border-purple-600 shadow-md ring-2 ring-purple-500/20'
                    : theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40'
                      : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <span className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse block" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl text-white bg-gradient-to-br ${preset.color} shadow-xs`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold font-tech uppercase ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {preset.title}
                      </h4>
                      <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {preset.badge}
                      </span>
                    </div>
                  </div>

                  <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {preset.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. DYNAMIC CONCEPT IDEA INPUT & 1-TOUCH GENERATION */}
      <div className={`p-5 rounded-3xl border space-y-4 ${
        theme === 'dark' ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>2. NHẬP Ý NIỆM HOẶC YÊU CẦU MONG MUỐN (TÙY BIẾN THEO HỒ SƠ):</span>
            </label>
            <span className={`text-[11px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Hệ thống sẽ kết hợp ý niệm này + Dữ liệu Hồ Sơ để tạo Prompt chuẩn
            </span>
          </div>

          <textarea
            rows={3}
            value={userIdea}
            onChange={e => setUserIdea(e.target.value)}
            placeholder="Nhập ý niệm hoặc mục tiêu nghiên cứu (VD: 'Tạo kịch bản podcast đối thoại phản biện giữa 2 chuyên gia về bẫy tập trung hóa và cơ chế phân quyền trong hồ sơ này')..."
            className={`w-full p-3.5 rounded-2xl text-xs font-sans leading-relaxed outline-none border transition-all ${
              theme === 'dark'
                ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-purple-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-purple-500'
            }`}
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-1.5">
          <div className={`text-[10.5px] font-mono font-bold uppercase ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            GỢI Ý Ý NIỆM 1-CHẠM:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_IDEA_SUGGESTIONS.map((sugg, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setUserIdea(sugg)}
                className={`text-[11px] font-mono px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-purple-500/60 hover:text-purple-300'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-900'
                }`}
              >
                {sugg}
              </button>
            ))}
          </div>
        </div>

        {generateError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
            {generateError}
          </div>
        )}

        {/* 1-TOUCH GENERATE BUTTON */}
        <button
          disabled={isGenerating}
          onClick={() => handleGeneratePrompt()}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-tech uppercase tracking-widest text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] transition-all"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>ĐANG PHÂN TÍCH Ý NIỆM & THIẾT KẾ PROMPT NOTEBOOKLM...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-white" />
              <span>⚡ PHÂN TÍCH Ý NIỆM & TẠO PROMPT CHUẨN NOTEBOOKLM (1 CHẠM)</span>
            </>
          )}
        </button>
      </div>

      {/* 4. ACTIVE GENERATED PROMPT PREVIEW & ACTION SUITE */}
      {activePrompt && (
        <div className={`p-5 rounded-3xl border space-y-4 animate-in fade-in slide-in-from-top-2 ${
          theme === 'dark'
            ? 'bg-purple-950/20 border-purple-500/40 shadow-xl'
            : 'bg-purple-50/70 border-purple-300 shadow-md'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-purple-500/20">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <h4 className={`text-sm font-bold font-sans ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {activePrompt.title}
                </h4>
              </div>
              <p className={`text-xs font-mono ${theme === 'dark' ? 'text-purple-300' : 'text-purple-800'}`}>
                Ý niệm: "{activePrompt.conceptIdea}"
              </p>
            </div>

            {/* Quick Action Button Group */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopyPromptText(activePrompt.generatedPrompt)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-tech uppercase tracking-wider cursor-pointer shadow-md shadow-purple-600/30 transition-all"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP PROMPT'}</span>
              </button>

              <button
                onClick={handleCopyDossierSources}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                }`}
                title="Sao chép toàn văn Markdown để dán vào Sources của NotebookLM"
              >
                {copiedSources ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileText className="w-3.5 h-3.5 text-purple-500" />}
                <span>{copiedSources ? 'ĐÃ COPY NGUỒN' : 'COPY NGUỒN MD'}</span>
              </button>
            </div>
          </div>

          {/* Source Feeding Guide Callout */}
          <div className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs ${
            theme === 'dark'
              ? 'bg-slate-950/80 border-slate-800 text-slate-300'
              : 'bg-white border-purple-200 text-slate-800'
          }`}>
            <Info className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-purple-600 dark:text-purple-400 uppercase font-mono tracking-wider block text-[10.5px]">
                HƯỚNG DẪN NẠP NGUỒN VÀO NOTEBOOKLM:
              </span>
              <p className="leading-relaxed font-sans">
                {activePrompt.recommendedSourcesGuide}
              </p>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
                💡 <strong>Quy trình 3 bước:</strong> (1) Sao chép hoặc tải Nguồn Markdown của Hồ Sơ này ➔ (2) Thêm vào mục Sources của Google NotebookLM ➔ (3) Dán Prompt này vào khung Chat của NotebookLM.
              </div>
            </div>
          </div>

          {/* Standard Prompt Display */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={`text-[10.5px] font-mono font-bold uppercase ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                NỘI DUNG PROMPT CHUẨN GEMINI NOTEBOOK / NOTEBOOKLM:
              </span>
              <button
                onClick={() => handleGeneratePrompt(activePrompt.outputFormat, activePrompt.conceptIdea)}
                disabled={isGenerating}
                className="text-[11px] font-mono text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Tái tạo Prompt này</span>
              </button>
            </div>

            <pre className={`p-4 rounded-2xl text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border ${
              theme === 'dark'
                ? 'bg-black/60 text-slate-200 border-slate-800'
                : 'bg-white text-slate-900 border-slate-300 shadow-inner'
            }`}>
              {activePrompt.generatedPrompt}
            </pre>
          </div>
        </div>
      )}

      {/* 5. PERSISTENT PROMPTS HISTORY LINKED TO THIS DOSSIER */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className={`text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            <Layers className="w-4 h-4 text-purple-500" />
            <span>KHO PROMPT ĐÃ KIẾN TẠO CỦA HỒ SƠ NÀY ({dossierPrompts.length})</span>
          </h4>
          <span className={`text-[11px] font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Lưu trữ gắn liền vĩnh viễn với hồ sơ
          </span>
        </div>

        {dossierPrompts.length === 0 ? (
          <div className={`p-6 rounded-2xl border text-center space-y-2 ${
            theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <Sparkles className="w-6 h-6 mx-auto text-purple-500/60" />
            <p className="text-xs font-sans">
              Chưa có Prompt nào được tạo riêng cho Hồ Sơ này. Hãy chọn một định dạng bên trên và bấm "Tạo Prompt Chuẩn NotebookLM".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dossierPrompts.map(prompt => (
              <div
                key={prompt.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  activePrompt?.id === prompt.id
                    ? theme === 'dark'
                      ? 'bg-purple-950/30 border-purple-500'
                      : 'bg-purple-50 border-purple-400 shadow-xs'
                    : theme === 'dark'
                      ? 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40'
                      : 'bg-white border-slate-200 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {prompt.title}
                      </h5>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        theme === 'dark' ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {prompt.outputFormat}
                      </span>
                    </div>
                    <p className={`text-xs font-sans ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Ý niệm: "{prompt.conceptIdea}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await handleCopyPromptText(prompt.generatedPrompt);
                        setCopiedHistoryId(prompt.id);
                        setTimeout(() => setCopiedHistoryId(null), 2000);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer border ${
                        theme === 'dark'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                      }`}
                    >
                      {copiedHistoryId === prompt.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHistoryId === prompt.id ? 'ĐÃ COPY' : 'COPY'}</span>
                    </button>

                    <button
                      onClick={() => setActivePrompt(prompt)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold font-tech uppercase cursor-pointer"
                    >
                      Mở Xem
                    </button>

                    <button
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="p-1.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                      title="Xóa Prompt này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className={`text-[11px] font-mono p-2.5 rounded-xl truncate ${
                  theme === 'dark' ? 'bg-black/40 text-slate-300' : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {prompt.generatedPrompt.slice(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
